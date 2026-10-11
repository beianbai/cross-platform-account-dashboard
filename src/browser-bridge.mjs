import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {mkdir,readFile,open,rename,unlink} from 'node:fs/promises';
import {join} from 'node:path';
import {PLATFORMS,profileURL} from './core.mjs';
const secret=()=>randomBytes(32).toString('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const extensionOrigin=o=>!o||/^chrome-extension:\/\/[a-p]{32}$/.test(o)||/^moz-extension:\/\/[a-f0-9-]{36}$/i.test(o);
export async function createBrowserBridge(root,{jobTimeout=180000}={}){
  const filename=join(root,'browser-connection.json');let saved={version:1,port:0,token:'',label:'',origin:''};
  try {saved=JSON.parse(await readFile(filename,'utf8'));if(saved.version!==1||!Number.isInteger(saved.port)||saved.port<1||saved.port>65535||!(saved.token===''||/^[a-f0-9]{64}$/.test(saved.token))||typeof saved.label!=='string'||!extensionOrigin(saved.origin))throw Error('invalid');}
  catch(e){if(e.code!=='ENOENT')throw Error('浏览器连接配置无法读取，已停止启动；账号快照未受影响。');}
  const localSessions=new Map();
  let port=0,pair=null,pending=null,lastSeen=0,closed=false,revoking=false,queue=Promise.resolve();
  const lock=fn=>{const result=queue.then(fn);queue=result.catch(()=>{});return result;};
  async function persist(next){
    await mkdir(root,{recursive:true,mode:0o700});const tmp=join(root,`.browser-connection-${secret()}.tmp`);let file;
    try{file=await open(tmp,'wx',0o600);await file.writeFile(JSON.stringify(next));await file.sync();await file.close();file=null;if(closed)throw Error('连接正在关闭');await rename(tmp,filename);if(!closed)saved=next;}
    finally{await file?.close();await unlink(tmp).catch(e=>{if(e.code!=='ENOENT')throw e;});}
  }
  async function acceptBatch(current,body,isCurrent){
    return lock(async()=>{
      if(!isCurrent())throw Object.assign(Error('任务已结束'),{status:409});
      if(!Number.isSafeInteger(body.sequence)||body.sequence<0)throw Object.assign(Error('批次序号无效'),{status:400});
      if(body.sequence===current.sequence-1)return current.ack;
      if(body.sequence!==current.sequence)throw Object.assign(Error('批次顺序不一致'),{status:409});
      if(!current.onBatch||!Array.isArray(body.raw?.works)||body.raw.works.length>100)throw Object.assign(Error('批次作品超过处理范围，请更新连接器'),{status:400});
      const ack=await current.onBatch(body.raw);
      if(!isCurrent())throw Object.assign(Error('任务已结束'),{status:409});
      current.sequence++;current.ack={ok:true,...ack};return current.ack;
    });
  }
  function cancel(message='浏览器读取已取消，旧数据保留。'){if(pending){clearTimeout(pending.timer);pending.reject(Error(message));pending=null;}}
  const server=createServer(async(req,res)=>{
    const origin=req.headers.origin||'';
    const send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})});res.end(JSON.stringify(value));};
    if(closed||revoking||req.headers.host!==`127.0.0.1:${port}`||!extensionOrigin(origin)){res.writeHead(403);res.end();return;}
    if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST','Access-Control-Allow-Headers':'Authorization,Content-Type','Access-Control-Allow-Private-Network':'true','Access-Control-Max-Age':'60'});res.end();return;}
    if(req.method!=='POST'||!['/pair','/poll','/result','/batch'].includes(req.url)){send(404,{error:'Not found'});return;}
    const token=/^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization||'')?.[1];
    const local=req.url==='/batch'&&!origin?localSessions.get(token):null;
    if(req.url==='/pair'){
      if(!pair||pair.expiresAt<Date.now()||!equal(token,pair.token)){send(401,{error:'连接码已失效，请在工作台重新生成。'});return;}
    }else if(!local&&(!saved.token||!equal(token,saved.token)||(saved.origin&&saved.origin!==origin))){send(401,{error:'连接已失效，请在工作台重新授权。'});return;}
    try{
      if(Number(req.headers['content-length']||0)>2*1024*1024){send(413,{error:'请求过大'});return;}
      const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>2*1024*1024){send(413,{error:'请求过大'});return;}chunks.push(chunk);}
      const body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
      if(req.url==='/pair'){
        await lock(async()=>{
          if(closed||revoking||pending||!pair||pair.expiresAt<Date.now()||!equal(token,pair.token)){send(409,{error:'连接码已使用或正在同步，请重新连接。'});return;}
          const label=String(body.label||'已授权浏览器').replace(/[\r\n<>]/g,'').slice(0,60);pair=null;
          revoking=true;saved={...saved,token:''};
          try{await persist({version:1,port,token:secret(),label,origin});if(closed)return;lastSeen=Date.now();send(200,{token:saved.token,label:saved.label});}finally{revoking=false;}
        });return;
      }
      if(local){
        if(body.id!==local.id){send(409,{error:'任务不匹配'});return;}
        send(200,await acceptBatch(local,body,()=>!closed&&localSessions.get(token)===local));return;
      }
      // Recheck after body awaits: a concurrent revoke must invalidate in-flight requests.
      if(closed||revoking||!equal(token,saved.token)){send(401,{error:'连接已撤销'});return;}
      lastSeen=Date.now();
      if(req.url==='/poll'){
        const job=pending&&!pending.delivered?pending.job:null;if(job){pending.delivered=true;pending.onProgress?.('浏览器已接收任务，正在打开平台并检查登录。');}
        send(200,{job});return;
      }
      if(!pending||body.id!==pending.job.id||!pending.delivered){send(409,{error:'任务已结束或不匹配'});return;}
      if(req.url==='/batch'){
        const current=pending;
        send(200,await acceptBatch(current,body,()=>!closed&&pending===current&&equal(token,saved.token)));return;
      }
      if(!['ok','needs_login','needs_attention','parse_error','network_error','connection_offline','account_mismatch','error'].includes(body.status)){send(400,{error:'无效结果'});return;}
      const current=pending;pending=null;clearTimeout(current.timer);current.resolve({status:body.status,raw:body.raw});send(200,{ok:true});
    }catch(error){if(!res.headersSent)send(error.status||400,{error:error.message||'连接请求无法处理，请重试。'});else res.end();}
  });
  server.requestTimeout=10000;server.headersTimeout=10000;server.maxHeadersCount=30;
  async function listen(requested){return new Promise((resolve,reject)=>{const fail=e=>{server.off('listening',done);reject(e);};const done=()=>{server.off('error',fail);resolve();};server.once('error',fail);server.once('listening',done);server.listen(requested,'127.0.0.1');});}
  try {try{await listen(saved.port);}catch(e){if(e.code!=='EADDRINUSE')throw e;await listen(0);}port=server.address().port;await persist({...saved,port});}
  catch(e){server.close();throw e;}
  server.on('error',()=>{cancel('本机浏览器连接中断，请重试。');});server.unref();
  return {
    status(){return {available:!closed,paired:!!saved.token,online:!!saved.token&&Date.now()-lastSeen<75000,label:saved.label,port};},
    beginPair(){if(closed||revoking||pending)throw Error('正在读取或连接已关闭，请稍后重试。');pair={token:secret(),expiresAt:Date.now()+120000};return {code:`dsh-social://127.0.0.1:${port}#${pair.token}`,expiresAt:pair.expiresAt};},
    revoke(){
      if(closed||revoking)return Promise.reject(Error('连接正在关闭或更新，请稍后重试。'));
      revoking=true;pair=null;saved={...saved,token:'',label:'',origin:''};lastSeen=0;cancel('浏览器授权已撤销，旧数据保留。');
      return lock(async()=>{try{await persist(saved);}finally{revoking=false;}});
    },
    createLocalSession(onBatch){
      if(closed)throw Error('连接服务已关闭');
      const token=secret(),id=secret(),session={id,onBatch,sequence:0,ack:null};localSessions.set(token,session);
      return {base:`http://127.0.0.1:${port}`,token,id,close(){localSessions.delete(token);}};
    },
    run({platform,url='',automatic=false,resume=false,onProgress,onBatch,collection}){
      if(!PLATFORMS.includes(platform))throw Error('不支持的平台');const canonical=profileURL(platform,url);
      if(closed||revoking||!saved.token)throw Error('请先连接你常用的浏览器。');if(pending)throw Error('已有浏览器任务正在进行');
      return new Promise((resolve,reject)=>{const job={id:secret(),platform,url:canonical,automatic:automatic===true,resume:resume===true,...(collection?{protocol:2,collection}:{})};const timer=setTimeout(()=>cancel('浏览器未及时完成读取。请确认扩展已启用、浏览器未休眠，再重试。'),jobTimeout);timer.unref?.();pending={job,resolve,reject,timer,delivered:false,onProgress,onBatch,sequence:0,ack:null};});
    },
    cancelCurrent(){cancel('本次同步已取消');},
    close(){closed=true;localSessions.clear();pair=null;saved={...saved,token:''};cancel('工作台正在退出');server.closeAllConnections();return new Promise(resolve=>server.close(resolve)).then(()=>queue);}
  };
}
