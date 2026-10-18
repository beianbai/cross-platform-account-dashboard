import {readFile,lstat,rename,unlink,chmod,open} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {defaultDataRoot} from './server.mjs';
import {privateJSON} from './access.mjs';

export async function issueLocalCode(root=defaultDataRoot()){
  const path=join(resolve(root),'.standalone-control.json');let control;
  try{if(!(await lstat(path)).isFile())throw Error();control=JSON.parse(await readFile(path,'utf8'));}
  catch{throw Error('未找到运行中的独立服务。请先启动服务；使用自定义目录时，取码命令也需传入相同的 --root。');}
  let url;try{url=new URL(control.url);}catch{throw Error('本机服务控制信息无效，请重新启动独立服务。');}
  if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.pathname!=='/'||url.search||url.hash||url.username||url.password||!/^[a-f0-9]{64}$/.test(control.secret))throw Error('本机服务控制信息无效，请重新启动独立服务。');
  let response;try{response=await fetch(new URL('/auth/control',url),{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+control.secret,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});}catch{throw Error('无法连接独立服务，请确认服务仍在运行。');}
  if(!response.ok)throw Error('未能取得配对码，请确认此目录对应的独立服务已启动并更新。');
  return response.json();
}
export async function resetLocalAccess(root,confirmed){
  if(!confirmed)throw Error('此操作会撤销所有工作台访问授权，保留业务数据。确认后运行 npm run auth:reset -- --confirm，并按需传入 --root。');
  root=resolve(root);const lock=join(root,'.standalone.lock');let stale=false;
  try{const state=JSON.parse(await readFile(lock,'utf8'));if(!Number.isSafeInteger(state.pid)||state.pid<=0)throw Error('目录锁无法核实，请先检查运行状态。');
    try{process.kill(state.pid,0);}catch(e){if(e.code==='ESRCH')stale=true;else throw e;}
    if(!stale)throw Error('请先停止此目录的独立服务，再重置访问授权。');
  }catch(e){if(e.code!=='ENOENT')throw e;}
  if(stale)throw Error('服务已停止但目录锁仍存在。确认没有实例运行后，移除数据目录中的 .standalone.lock 再重试；恢复命令不会自动删除已有锁。');
  // Own the same exclusive lock as startup for the entire recovery operation.
  let lease;
  try{lease=await open(lock,'wx',0o600);}catch(e){if(e.code==='EEXIST')throw Error('目录正被其他操作使用，请停止服务后重试。');throw e;}
  try{
    await lease.writeFile(JSON.stringify({pid:process.pid,createdAt:new Date().toISOString()}));
    const path=join(root,'standalone-session.json');
    let info;try{info=await lstat(path);}catch(e){if(e.code==='ENOENT')throw Error('未找到可恢复的独立版授权文件。');throw e;}
    if(!info.isFile())throw Error('未找到可恢复的独立版授权文件。');
    const backup=join(root,'standalone-session.recovery-'+Date.now()+'-'+randomUUID()+'.json');
    await rename(path,backup);
    try{await chmod(backup,0o600);await privateJSON(path,{version:2,upgraded:true,sessions:[]});}
    catch(e){await rename(backup,path);throw e;}
    return backup;
  }finally{await lease.close();await unlink(lock);}
}
export async function runCLI(args){
  let root=defaultDataRoot(),confirm=false,mode=args.shift();
  if(!['code','reset'].includes(mode))throw Error('使用 npm run auth:code 或 npm run auth:reset -- --confirm。');
  for(let i=0;i<args.length;i++){
    if(args[i]==='--')continue;
    if(args[i]==='--root'&&args[i+1])root=args[++i];
    else if(args[i]==='--confirm')confirm=true;
    else throw Error('参数无效；支持 --root 数据目录，重置时须传入 --confirm。');
  }
  if(mode==='reset'){await resetLocalAccess(root,confirm);return '访问授权已重置，原授权文件已保留为本机恢复副本，账号数据未修改。请启动服务并重新配对。';}
  const pair=await issueLocalCode(root);
  return `访问地址：${pair.url}/\n配对码：${pair.code}\n有效期：5 分钟，仅可成功使用一次。已有浏览器授权不受影响。`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  try{console.log(await runCLI(process.argv.slice(2)));}catch(e){console.error(e.message);process.exitCode=1;}
}
