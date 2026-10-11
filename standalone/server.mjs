import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { mkdir, open, readFile, realpath, unlink, access } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
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
async function sessionSecret(root) {
  const filename = join(root, 'standalone-session.json');
  try {
    const saved = JSON.parse(await readFile(filename, 'utf8'));
    if (saved.version !== 1 || !/^[a-f0-9]{64}$/.test(saved.secret)) throw Error('invalid');
    return saved.secret;
  } catch (error) {
    if (error.code !== 'ENOENT') throw Error('独立模式登录文件无法读取；已有数据未修改。');
    // A first standalone launch must not adopt an existing DSH data directory.
    if (await exists(join(root, 'accounts.json')) || await exists(join(root, 'browser-connection.json'))) throw Error('请选择新的独立数据目录，不能直接使用已有 DSH 账号目录。');
    const token = secret(), file = await open(filename, 'wx', 0o600);
    try { await file.writeFile(JSON.stringify({ version: 1, secret: token })); await file.sync(); } finally { await file.close(); }
    return token;
  }
}
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
  let server, closing, origin, bootstrap = secret();
  const cleanup = [], routes = new Map(), csrf = secret();
  const close = () => closing ||= (async () => {
    try {
      if (server?.listening) { const stopped = new Promise((r, j) => server.close(error => error ? j(error) : r())); server.closeAllConnections(); await stopped; }
      for (const dispose of cleanup.reverse()) await dispose();
    } finally { await lock.close(); await unlink(lockPath); }
  })();
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() }));
    const session = await sessionSecret(root);
    const cookieName = 'psw_session_' + createHash('sha256').update(root).digest('hex').slice(0, 16);
    const authenticated = req => (req.headers.cookie || '').split(';').some(part => { const [key, value] = part.trim().split('='); return key === cookieName && equal(value, session); });
    apply({ connection: { fetch: { register(route) { for (const method of route.methods) routes.set(method + ' ' + route.path, route.fetch); } } }, effect(fn) { const dispose = fn(); if (typeof dispose === 'function') cleanup.push(dispose); } }, { root, browserExecutable });
    // Deliberately explicit allowlist: data and source paths can never become static files.
    const staticFiles = new Map([
      ['/', [new URL('./index.html', import.meta.url), 'text/html; charset=utf-8']],
      ['/assets/standalone.js', [new URL('../lib/standalone.js', import.meta.url), 'text/javascript; charset=utf-8']],
    ]);
    server = createServer(async (req, res) => {
      const send = (status, value, headers = {}) => {
        const outgoing = new Headers({ ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8' });
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
        if (path !== '/session' && !routes.has(req.method + ' ' + path)) { send(404, { error: '未找到页面。' }); return; }
        if (!['GET', 'POST'].includes(req.method)) { send(405, { error: '请求方法不可用。' }); return; }
        const isBootstrap = path === '/session' && req.method === 'POST';
        if (!isBootstrap && !authenticated(req)) { send(401, { error: '请使用启动时显示的本机链接打开工作台。' }); return; }
        let body;
        if (req.method === 'POST') {
          if (req.headers.origin !== origin || !/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '') || (!isBootstrap && !equal(req.headers['x-csrf-token'], csrf))) { send(403, { error: '请求来源或校验信息无效，请刷新工作台。' }); return; }
          body = await readBody(req);
        }
        if (isBootstrap) {
          let data; try { data = JSON.parse(body.toString('utf8')); } catch { send(400, { error: '请求无效。' }); return; }
          if (!data || !equal(data.token, bootstrap)) { send(401, { error: '本机登录链接已失效，请使用当前启动链接。' }); return; }
          bootstrap = null;
          send(200, { csrf }, { 'Set-Cookie': `${cookieName}=${session}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000` });
          return;
        }
        if (path === '/session') { send(200, { csrf }); return; }
        const request = new Request(origin + path, { method: req.method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body } : {}) });
        const response = await routes.get(req.method + ' ' + path)(request);
        send(response.status, Buffer.from(await response.arrayBuffer()), Object.fromEntries(response.headers));
      } catch (error) { if (!res.headersSent) send(error.status === 413 ? 413 : 500, { error: error.status === 413 ? '请求过大。' : '本机请求未完成，请重试。' }); else res.end(); }
    });
    server.requestTimeout = 15000; server.headersTimeout = 10000; server.maxHeadersCount = 40;
    await new Promise((r, j) => { server.once('error', j); server.listen(port, '127.0.0.1', () => { server.off('error', j); r(); }); });
    origin = `http://127.0.0.1:${server.address().port}`;
    return { url: origin, bootstrapURL: `${origin}/#${bootstrap}`, root, close };
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
    // The only credential printed is this intentional, one-use local handoff link.
    console.log(`跨平台账号看板已在本机启动。\n打开此链接：${app.bootstrapURL}\n数据目录：${app.root}\n按 Ctrl+C 安全退出。`);
    const stop = async () => { try { await app.close(); process.exitCode = 0; } catch { console.error('本机服务退出未完成，请检查目录锁。'); process.exitCode = 1; } };
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
