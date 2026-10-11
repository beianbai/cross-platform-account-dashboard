import {collect,classifyCollectionError,collectionError,COLLECTION_MESSAGES} from '../src/collector.mjs';
import {isPlatformURL,validJob,createPageAdapter} from './adapter.mjs';
const api=globalThis.browser||globalThis.chrome;
let working=false;
function parseCode(value){const u=new URL(value.trim());if(u.protocol!=='dsh-social:'||u.hostname!=='127.0.0.1'||u.username||u.password||!/^\d+$/.test(u.port)||!/^#[a-f0-9]{64}$/.test(u.hash)||u.pathname||u.search)throw Error('请粘贴工作台生成的完整连接码');return {base:`http://127.0.0.1:${u.port}`,token:u.hash.slice(1)};}
async function request(connection,path,body){
  if(!/^http:\/\/127\.0\.0\.1:[0-9]{1,5}$/.test(connection?.base)||!(/^[a-f0-9]{64}$/).test(connection?.token||''))throw Error('请先连接本机工作台');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{const response=await fetch(connection.base+path,{method:'POST',headers:{'Authorization':'Bearer '+connection.token,'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'omit',cache:'no-store',signal:controller.signal});const result=await response.json();if(!response.ok)throw Error(result.error||'连接已失效');return result;}finally{clearTimeout(timer);}
}
async function report(status,phase='idle',platform){
  const activity={phase,message:status,updatedAt:new Date().toISOString(),...(platform?{platform}:{})};
  await api.storage.local.set({status,activity,...(['submitted','error','attention'].includes(phase)?{lastResult:activity}:{})});
}
async function pump(){
  if(working)return;working=true;
  try{
    const {connection,tabsByPlatform={}}=await api.storage.local.get(['connection','tabsByPlatform']);if(!connection){await report('此扩展尚未连接工作台。');return;}
    await report('正在检查工作台任务…','checking');
    const {job}=await request(connection,'/poll',{});if(!job){await report('已连接，暂无待处理任务。');return;}
    if(!validJob(job)){if(/^[a-f0-9]{64}$/.test(job?.id||''))await request(connection,'/result',{id:job.id,status:'error'});throw Error('工作台任务格式不受支持');}
    let page,result,tabId,preserveTab=false;
    try{
      const saved=tabsByPlatform[job.platform],retryable=saved?.retryable===true;
      tabId=typeof saved==='object'?saved.id:saved;preserveTab=!!tabId&&!retryable;
      if(tabId&&!retryable&&(job.automatic||!job.resume))throw collectionError('needs_attention');
      if(tabId){
        let tab;try{tab=await api.tabs.get(tabId);}catch{tabId=null;}
        if(tab){const allowed=isPlatformURL(job.platform,tab.url)||tab.url==='about:blank';
          if(job.automatic&&(tab.active||!allowed))throw collectionError('needs_attention');
          if(!allowed)tabId=null;
        }
      }
      if(!tabId){const tab=await api.tabs.create({url:'about:blank',active:!job.automatic});tabId=tab.id;preserveTab=false;tabsByPlatform[job.platform]=tabId;await api.storage.local.set({tabsByPlatform});}
      page=createPageAdapter(api,tabId,job.platform,{automatic:job.automatic});await report('正在读取平台；未登录时请亲自登录，不需要提供密码给工作台。','reading',job.platform);
      let sequence=0;
      const onBatch=job.protocol===2?async raw=>{
        let acknowledgement;
        for(let attempt=0;attempt<2;attempt++){
          try{acknowledgement=await request(connection,'/batch',{id:job.id,sequence,raw});break;}
          catch(error){if(attempt)throw Object.assign(error,{status:'connection_offline'});}
        }
        sequence++;
        await report(`已保存第 ${sequence} 批作品，正在继续读取…`,'reading',job.platform);
        return acknowledgement;
      }:undefined;
      const raw=await collect({page,platform:job.platform,url:job.url,...(onBatch?{collection:job.collection,onBatch}:{})});
      result={id:job.id,status:'ok',...(onBatch?{}:{raw})};
    }
    catch(error){const status=error?.status|| (page?await classifyCollectionError(error,page):'connection_offline');result={id:job.id,status};
      if(tabId){tabsByPlatform[job.platform]=status==='network_error'?{id:tabId,retryable:true}:tabId;await api.storage.local.set({tabsByPlatform});}
    }
    await request(connection,'/result',result);
    if(result.status==='ok'){if(!preserveTab){try{await api.tabs.remove(tabId);}catch{}}delete tabsByPlatform[job.platform];await api.storage.local.set({tabsByPlatform});}
    await report(result.status==='ok'?'已提交读取结果，请回工作台查看保存结果。':COLLECTION_MESSAGES[result.status]||'读取未完成，请回工作台查看详情。',result.status==='ok'?'submitted':['needs_login','needs_attention','account_mismatch'].includes(result.status)?'attention':'error',job.platform);
  }catch{await report('连接或读取未完成。请确认 Desktop 已打开；可在工作台重新生成连接码。平台登录与验证需在浏览器中完成。','error');}
  finally{working=false;}
}
api.runtime.onMessage.addListener((message,sender,sendResponse)=>{
  if(sender.id!==api.runtime.id)return false;
  (async()=>{
    if(message?.type==='pair'){
      if(working)throw Error('正在读取，请稍后再更换连接');
      const connection=parseCode(message.code);const result=await request(connection,'/pair',{label:String(message.label||'我的浏览器').slice(0,60)});
      await api.storage.local.set({connection:{base:connection.base,token:result.token,label:String(message.label||'我的浏览器').slice(0,60)},tabsByPlatform:{}});
      await report('连接成功。现在可回工作台读取账号。','idle');
      await api.alarms.create('personal-social-poll',{periodInMinutes:0.5});void pump();return {ok:true};
    }
    if(message?.type==='poll'){const busy=working;void pump();return {ok:true,accepted:true,busy};}
    if(message?.type==='disconnect'){if(working)throw Error('正在读取，请稍后断开');await api.storage.local.remove(['connection','tabsByPlatform']);await api.alarms.clear('personal-social-poll');await report('此扩展已断开。也可在工作台撤销授权。');return {ok:true};}
    throw Error('不支持的操作');
  })().then(sendResponse,async e=>{if(!working)await report(e.message,'error');sendResponse({error:e.message});});return true;
});
api.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='personal-social-poll')void pump();});
async function start(){const {connection}=await api.storage.local.get('connection');if(connection){await api.alarms.create('personal-social-poll',{periodInMinutes:0.5});void pump();}}
async function restart(){await api.storage.local.remove('tabsByPlatform');await start();}
api.runtime.onStartup.addListener(()=>void restart());api.runtime.onInstalled.addListener(()=>void restart());
