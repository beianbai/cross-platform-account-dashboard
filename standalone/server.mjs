import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual, createHash, createHmac } from 'node:crypto';
import { mkdir, open, readFile, realpath, unlink, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createAccess, privateJSON, IDLE_MS } from './access.mjs';
import { apply } from '../dsh/index.js';

const secret = () => randomBytes(32).toString('hex');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string' && /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const maxBody = 8192;
const securityHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
};
export function defaultDataRoot() {
  const base = process.platform === 'darwin' ? join(homedir(), 'Library', 'Application Support') : process.platform === 'win32' ? process.env.LOCALAPPDATA || join(homedir(), 'AppData', 'Local') : process.env.XDG_DATA_HOME || join(homedir(), '.local', 'share');
  return join(base, 'cross-platform-account-dashboard', 'standalone');
}
async function exists(path) { try { await access(path); return true; } catch (error) { if (error.code === 'ENOENT') return false; throw error; } }
function readBody(req) {
  if (Number(req.headers['content-length'] || 0) > maxBody) { req.resume(); return Promise.reject(Object.assign(Error('请求过大'), { status: 413 })); }
  return new Promise((resolveBody, reject) => {
    let size = 0, ended = false; const chunks = [];
    req.on('data', chunk => {
      if (ended) return;
      size += chunk.length;
      if (size > maxBody) { ended = true; chunks.length = 0; reject(Object.assign(Error('请求过大'), { status: 413 })); return; }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!ended) { ended = true; resolveBody(Buffer.concat(chunks)); } });
    req.on('error', error => { if (!ended) { ended = true; reject(error); } });
    req.on('aborted', () => { if (!ended) { ended = true; reject(Error('请求中断')); } });
  });
}

/** The shared business service receives only registered, authenticated Requests. */
export async function startStandalone({ port = 43120, root = defaultDataRoot(), browserExecutable } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('端口须为 0–65535 的整数。');
  await mkdir(resolve(root), { recursive: true, mode: 0o700 });
  root = await realpath(resolve(root));
  const lockPath = join(root, '.standalone.lock');
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); } catch (error) {
    if (error.code === 'EEXIST') throw Error(`此独立数据目录已被占用。确认没有实例运行后，才可删除遗留锁文件：${lockPath}`);
    throw error;
  }
  let server, closing, origin, accessStore;
  const controlPath=join(root,'.standalone-control.json'), controlSecret=secret();
  let controlWritten=false;
  const cleanup = [], routes = new Map(), csrf = secret();
  const close = () => closing ||= (async () => {
    try {
      if (server?.listening) { const stopped = new Promise((r, j) => server.close(error => error ? j(error) : r())); server.closeAllConnections(); await stopped; }
      for (const dispose of cleanup.reverse()) await dispose();
      await accessStore?.close();
      if(controlWritten)await unlink(controlPath);
    } finally { await lock.close(); await unlink(lockPath); }
  })();
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
    accessStore = await createAccess(root);
    const cookieName = 'psw_access_' + createHash('sha256').update(root).digest('hex').slice(0, 16);
    const cookieToken = req => (req.headers.cookie || '').split(';').map(s=>s.trim().split('=')).find(([key])=>key===cookieName)?.[1];
    const cookie = token => `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(IDLE_MS/1000)}`;
    const csrfFor = session => createHmac('sha256',csrf).update(session.id).digest('hex');
    apply({ connection: { fetch: { register(route) { for (const method of route.methods) routes.set(method + ' ' + route.path, route.fetch); } } }, effect(fn) { const dispose = fn(); if (typeof dispose === 'function') cleanup.push(dispose); } }, { root, browserExecutable });
    // Deliberately explicit allowlist: data and source paths can never become static files.
    const staticFiles = new Map([
      ['/', [new URL('./index.html', import.meta.url), 'text/html; charset=utf-8']],
      ['/assets/standalone.js', [new URL('../lib/standalone.js', import.meta.url), 'text/javascript; charset=utf-8']],
    ]);
    server = createServer(async (req, res) => {
      let responseCookie;
      const send = (status, value, headers = {}) => {
        const outgoing = new Headers({ ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' });
        if(responseCookie)outgoing.set('Set-Cookie',responseCookie);
        new Headers(headers).forEach((value, key) => outgoing.set(key, value));
        res.writeHead(status, Object.fromEntries(outgoing));
        res.end(typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value));
      };
      try {
        if (req.headers.host !== new URL(origin).host || (req.headers.origin !== undefined && req.headers.origin !== origin) || ![undefined, 'same-origin', 'none'].includes(req.headers['sec-fetch-site'])) { send(403, { error: '仅允许从本机工作台访问。' }); return; }
        const path = req.url;
        if (req.method === 'GET' && staticFiles.has(path)) {
          const [filename, type] = staticFiles.get(path);
          try { send(200, await readFile(filename), { 'Content-Type': type }); } catch { send(503, { error: '界面尚未构建，请先运行 npm run build。' }); }
          return;
        }
        const accessRoutes=new Set(['GET /session','POST /auth/pair','POST /auth/code','GET /auth/sessions','POST /auth/revoke','POST /auth/control']);
        if (!accessRoutes.has(req.method+' '+path) && !routes.has(req.method+' '+path)) { send(404, { error: '未找到页面。' }); return; }
        const isControl=path==='/auth/control', isPair=path==='/auth/pair';
        if(isControl){
          if(req.headers.origin!==undefined||req.headers['sec-fetch-site']!==undefined||!equal(req.headers.authorization?.replace(/^Bearer /,''),controlSecret)){send(403,{error:'此操作仅供本机终端使用。'});return;}
        }
        const session=isControl?null:await accessStore.authenticate(cookieToken(req));
        if(session)responseCookie=cookie(cookieToken(req));
        if(!session&&!isPair&&!isControl){send(401,{error:'浏览器尚未授权、授权已过期或已撤销，请重新配对。',code:'access_required',upgraded:accessStore.upgraded});return;}
        let body;
        if(req.method==='POST'){
          if((!isControl&&req.headers.origin!==origin)||!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){send(403,{error:'请求来源无效，请从本机工作台操作。'});return;}
          if(!isPair&&!isControl&&!equal(req.headers['x-csrf-token'],csrfFor(session))){send(403,{error:'服务校验已更新，请刷新页面后重试。',code:'csrf_expired'});return;}
          body=await readBody(req);
        }
        let input;
        if(req.method==='POST'&&path.startsWith('/auth/')){
          try{input=JSON.parse(body.toString('utf8'));if(!input||typeof input!=='object'||Array.isArray(input))throw Error();}catch{send(400,{error:'请求格式无效。'});return;}
        }
        if(isPair){
          if(session){send(200,{csrf:csrfFor(session),id:session.id});return;}
          const result=await accessStore.redeem(input.code,req.headers['user-agent']);
          send(200,{csrf:csrfFor(result.session),id:result.session.id},{'Set-Cookie':cookie(result.token)});return;
        }
        if(path==='/auth/code'||isControl){send(200,{...await accessStore.issue(),url:origin});return;}
        if(path==='/auth/sessions'){send(200,{sessions:await accessStore.list(session.id),pairing:await accessStore.pairingStatus()});return;}
        if(path==='/auth/revoke'){
          if(input.confirm!==true){send(400,{error:'请确认撤销浏览器访问授权。'});return;}
          await accessStore.revoke(input.id);send(200,{ok:true,current:input.id===session.id},input.id===session.id?{'Set-Cookie':`${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`}:{});return;
        }
        if(path==='/session'){send(200,{csrf:csrfFor(session),id:session.id},{'Set-Cookie':cookie(cookieToken(req))});return;}
        const request = new Request(origin + path, { method: req.method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body } : {}) });
        const response = await routes.get(req.method + ' ' + path)(request);
        send(response.status, Buffer.from(await response.arrayBuffer()), Object.fromEntries(response.headers));
      } catch (error) { if (!res.headersSent) send(error.status || 500, { error: error.status ? error.message : '本机请求未完成，请重试。', ...(error.retryAfter?{retryAfter:error.retryAfter}:{}) }, error.retryAfter?{'Retry-After':String(error.retryAfter)}:{}); else res.end(); }
    });
    server.requestTimeout = 15000; server.headersTimeout = 10000; server.maxHeadersCount = 40;
    await new Promise((r, j) => { server.once('error', j); server.listen(port, '127.0.0.1', () => { server.off('error', j); r(); }); });
    origin = `http://127.0.0.1:${server.address().port}`;
    await privateJSON(controlPath,{version:1,url:origin,secret:controlSecret,pid:process.pid});controlWritten=true;
    const pairing=await accessStore.issue();
    return { url: origin, pairing, root, close };
  } catch (error) { await close(); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2), options = {};
    for (let n = 0; n < args.length; n++) {
      const key = args[n];
      if (key === '--help') { console.log('使用：npm start -- [--port 43120] [--root 独立数据目录] [--browser-executable 路径]'); process.exit(0); }
      if (!['--port', '--root', '--browser-executable'].includes(key) || !args[n + 1] || args[n + 1].startsWith('--')) throw Error('启动参数无效；使用 --help 查看说明。');
      options[key === '--port' ? 'port' : key === '--root' ? 'root' : 'browserExecutable'] = key === '--port' ? Number(args[++n]) : args[++n];
    }
    if (!await exists(new URL('../lib/standalone.js', import.meta.url))) throw Error('请先运行 npm run build 构建独立界面。');
    const app = await startStandalone(options);
    // Print only the short-lived code intended for the local operator.
    console.log(`跨平台账号看板已在本机启动。\n访问地址：${app.url}/\n首次访问配对码：${app.pairing.code}（5 分钟有效，仅可成功使用一次）\n重新取码：npm run auth:code -- --root "${app.root}"\n数据目录：${app.root}\n按 Ctrl+C 安全退出。`);
    const stop = async () => { try { await app.close(); process.exitCode = 0; } catch { console.error('本机服务退出未完成，请检查目录锁。'); process.exitCode = 1; } };
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
