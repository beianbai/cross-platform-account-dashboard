import {randomBytes,createHash,randomUUID} from 'node:crypto';
import {readFile,open,rename,unlink,lstat} from 'node:fs/promises';
import {join} from 'node:path';

export const IDLE_MS=90*86400000, CODE_MS=5*60000;
const digest=value=>createHash('sha256').update(value).digest('hex');
const failure=(message,status=400,retryAfter)=>Object.assign(Error(message),{status,retryAfter});
export const normalizeCode=value=>typeof value==='string'?value.toUpperCase().replace(/[\s-]/g,''):'';
const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export async function privateJSON(path,value){
  try{if(!(await lstat(path)).isFile())throw Error('授权文件必须为普通文件');}catch(e){if(e.code!=='ENOENT')throw e;}
  const temporary=path+'.'+randomUUID()+'.tmp';let file;
  try{file=await open(temporary,'wx',0o600);await file.writeFile(JSON.stringify(value)+'\n');await file.sync();await file.close();file=null;await rename(temporary,path);}
  finally{await file?.close();await unlink(temporary).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}
export function browserLabel(ua=''){
  if(/Edg\//.test(ua))return 'Microsoft Edge';if(/Firefox\//.test(ua))return 'Firefox';
  if(/Chrome\//.test(ua))return 'Chrome / Chromium';
  if(/Safari\//.test(ua))return 'Safari';return '浏览器';
}
export async function createAccess(root,{now=Date.now}={}){
  const path=join(root,'standalone-session.json');let data;
  try{
    const info=await lstat(path);if(!info.isFile())throw Error('invalid');
    data=JSON.parse(await readFile(path,'utf8'));
    if(data.version===1&&/^[a-f0-9]{64}$/.test(data.secret)){
      data={version:2,upgraded:true,sessions:[]};await privateJSON(path,data);
    }
    const validDate=n=>Number.isFinite(n)&&n>=0;
    if(data.version!==2||typeof data.upgraded!=='boolean'||!Array.isArray(data.sessions)||data.sessions.length>100||data.sessions.some(s=>!s||!/^[a-f0-9]{32}$/.test(s.id)||!/^[a-f0-9]{64}$/.test(s.tokenHash)||typeof s.label!=='string'||s.label.length>80||!validDate(s.createdAt)||!validDate(s.lastSeenAt)||s.lastSeenAt<s.createdAt)||new Set(data.sessions.map(s=>s.id)).size!==data.sessions.length)throw Error('invalid');
  }catch(e){
    if(e.code!=='ENOENT')throw Error('访问授权文件无法读取；业务数据未修改。停止服务后运行 npm run auth:reset -- --confirm 恢复访问授权。');
    for(const name of ['accounts.json','browser-connection.json']){try{await lstat(join(root,name));throw Error('请选择新的独立数据目录，不能直接使用已有 DSH 账号目录。');}catch(error){if(error.code!=='ENOENT')throw error;}}
    data={version:2,upgraded:false,sessions:[]};await privateJSON(path,data);
  }
  let pending=null,queue=Promise.resolve(),failures=0,windowStart=now(),closed=false;
  const serial=fn=>{const result=queue.then(()=>{if(closed)throw failure('服务正在退出，请稍后重试。',503);return fn();});queue=result.catch(()=>{});return result;};
  const active=s=>now()-s.lastSeenAt<IDLE_MS;
  async function persist(sessions){const next={...data,sessions};await privateJSON(path,next);data=next;}
  const issue=()=>serial(()=>{
    const bytes=randomBytes(8);let code='';for(const byte of bytes)code+=alphabet[byte%alphabet.length];
    pending={id:randomUUID(),hash:digest(code),expiresAt:now()+CODE_MS};
    return {id:pending.id,code:code.slice(0,4)+'-'+code.slice(4),expiresAt:pending.expiresAt,serverTime:now()};
  });
  return {
    get upgraded(){return data.upgraded;}, issue,
    authenticate:token=>serial(async()=>{
      if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))return null;
      const session=data.sessions.find(s=>s.tokenHash===digest(token)&&active(s));if(!session)return null;
      // Persist activity at most once a minute, avoiding a write on every UI poll.
      if(now()-session.lastSeenAt>=60000){await persist(data.sessions.map(s=>s.id===session.id?{...s,lastSeenAt:now()}:s));}
      return {...data.sessions.find(s=>s.id===session.id)};
    }),
    redeem:(input,ua)=>serial(async()=>{
      if(now()-windowStart>=60000){windowStart=now();failures=0;}
      if(failures>=10)throw failure('尝试次数过多，请稍后重试。',429,Math.max(1,Math.ceil((windowStart+60000-now())/1000)));
      const code=normalizeCode(input);
      if(!/^[A-Z2-9]{8}$/.test(code)||!pending||pending.expiresAt<=now()||digest(code)!==pending.hash){failures++;throw failure('配对码无效、已过期或已使用，请获取新码。',401);}
      const sessions=data.sessions.filter(active);if(sessions.length>=100)throw failure('浏览器授权数量已满，请先撤销不再使用的授权。',409);
      const token=randomBytes(32).toString('hex');const session={id:randomBytes(16).toString('hex'),tokenHash:digest(token),label:browserLabel(ua),createdAt:now(),lastSeenAt:now()};
      await persist([...sessions,session]); // Do not consume the code if durable storage fails.
      pending=null;return {token,session};
    }),
    pairingStatus:()=>serial(()=>pending?{id:pending.id,expiresAt:pending.expiresAt}:null),
    list:current=>serial(()=>data.sessions.filter(active).map(({id,label,createdAt,lastSeenAt})=>({id,label,createdAt,lastSeenAt,current:id===current}))),
    revoke:id=>serial(async()=>{if(!/^[a-f0-9]{32}$/.test(id||''))throw failure('请选择要撤销的浏览器。');await persist(data.sessions.filter(s=>s.id!==id));}),
    close:async()=>{closed=true;await queue;pending=null;},
  };
}
