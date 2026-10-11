import {execFile} from 'node:child_process';
import {ENV_MESSAGES} from './browser-environment.mjs';
import {collect,classifyCollectionError,COLLECTION_MESSAGES} from './collector.mjs';
const marker='PERSONAL_SOCIAL_RESULT=';
const spaceMarker='PERSONAL_SOCIAL_SPACE=';

export async function collectInTaskSpace(runtime,{platform,url='',spaceId=null,resume=false,automatic=false,collection,onBatch},collector=collect){
  let task;
  try{
    if(spaceId!==null){
      const spaces=await runtime.listTaskSpaces();
      const saved=spaces.find(space=>Number(space.spaceId??space.id)===Number(spaceId));
      if(!saved||((saved.ownership!=='agent')&&!(resume&&!automatic)))return {ok:false,spaceId,status:'needs_attention',error:COLLECTION_MESSAGES.needs_attention};
      task=await (resume&&!automatic?runtime.takeOverTaskSpace(Number(spaceId)):runtime.taskSpace(Number(spaceId)));
    }else task=await runtime.taskSpace('个人账号工作台 · '+platform+' · 只读同步');
    runtime.onSpace?.(task.spaceId);
    if(task.ownership!=='agent')return {ok:false,spaceId:task.spaceId,status:'needs_attention',error:COLLECTION_MESSAGES.needs_attention};
    const raw=await collector({task,page:task.page('p1'),platform,url,...(collection?{collection,onBatch}:{})});
    await task.finish({keep:[]});
    return {ok:true,...(onBatch?{streamed:true}:{raw}),spaceId:null};
  }catch(error){
    let status=await classifyCollectionError(error);
    if(!task&&status!=='needs_attention')status='connection_offline';
    if(task&&status!=='network_error'){try{await task.handOff();}catch{}}
    return {ok:false,spaceId:task?.spaceId??spaceId,status,error:COLLECTION_MESSAGES[status]};
  }
}

export function runBrowser({executable,platform,url='',spaceId=null,resume=false,automatic=false,collection,batchSession,onChild=()=>{},execute=execFile}){
  const options={platform,url,spaceId,resume,automatic,...(collection?{collection}:{})};
  const batchCode=batchSession?`let sequence=0;const session=${JSON.stringify({base:batchSession.base,token:batchSession.token,id:batchSession.id})};const onBatch=async raw=>{let ack;for(let attempt=0;attempt<2;attempt++){try{const response=await fetch(session.base+'/batch',{method:'POST',headers:{Authorization:'Bearer '+session.token,'Content-Type':'application/json'},body:JSON.stringify({id:session.id,sequence,raw}),signal:AbortSignal.timeout(12000)});ack=await response.json();if(!response.ok)throw Error(ack.error);break;}catch(e){if(attempt)throw Object.assign(e,{status:'connection_offline'});}}sequence++;return ack;};`:'const onBatch=undefined;';
  const code=`${batchCode}const {collectInTaskSpace}=await import(${JSON.stringify(import.meta.url)});\nconst result=await collectInTaskSpace({taskSpace,takeOverTaskSpace,listTaskSpaces,onSpace:spaceId=>console.log(${JSON.stringify(spaceMarker)}+spaceId)},{...${JSON.stringify(options)},onBatch});\nconsole.log(${JSON.stringify(marker)}+JSON.stringify(result));`;
  return new Promise(resolve=>{
    const child=execute(executable,['nodejs','-e',code],{encoding:'utf8',timeout:180000,maxBuffer:2*1024*1024,windowsHide:true},(error,stdout='',stderr='')=>{
      const line=(stdout+'\n'+stderr).split(/\r?\n/).find(x=>x.startsWith(marker));
      if(line){try{const result=JSON.parse(line.slice(marker.length));if(typeof result.ok==='boolean')return resolve(result);}catch{}}
      const browserStatus=error?.code==='ENOENT'?'missing':['EACCES','EPERM'].includes(error?.code)?'not_executable':'unavailable';
      const recoveryLine=stdout.split(/\r?\n/).find(line=>line.startsWith(spaceMarker));
      const recoveredId=Number(recoveryLine?.slice(spaceMarker.length));
      resolve({ok:false,spaceId:Number.isSafeInteger(recoveredId)&&recoveredId>0?recoveredId:spaceId,status:'connection_offline',browserStatus,error:ENV_MESSAGES[browserStatus]+' 旧数据保留。'});
    });
    child.stdin?.end();onChild(child);
  });
}
