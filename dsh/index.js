import Schema from '@deepseek-ai/schemastery';
import {randomUUID} from 'node:crypto';
import {homedir} from 'node:os';
import {join,resolve} from 'node:path';
import {readFile} from 'node:fs/promises';
import {PLATFORMS,emptyState,profileURL,normalizeSnapshot,applySnapshot,platformSettings,unbindAccount} from '../src/core.mjs';
import {PLATFORM_DEFINITIONS} from '../src/platforms.mjs';
import {loadState,saveState} from '../src/store.mjs';
import {runBrowser} from '../src/browser-runner.mjs';
import {inspectBrowser,checkBrowser,environmentResult} from '../src/browser-environment.mjs';
import {createBrowserBridge} from '../src/browser-bridge.mjs';
import {validateSchedule,nextOccurrence,duePlatforms,failureTransition} from '../src/scheduler.mjs';
const rootLifetimes=new Map();
const MESSAGES={needs_login:'登录已失效，请重新登录后继续同步。',needs_attention:'平台需要你处理登录或验证，完成后继续同步。',parse_error:'未能识别平台数据，请检查页面或更新接入。',network_error:'网络连接或页面加载失败，将按计划重试。',connection_offline:'浏览器未连接，恢复连接后继续同步。',account_mismatch:'当前账号与绑定账号不一致，旧数据已保留。'};
export const name='personal-social-local';
export const inject=['connection'];
export const Config=Schema.object({root:Schema.string().required(),browserExecutable:Schema.string().default(join(homedir(),'.local/bin/ego-browser'))});
export function apply(ctx,config) {
  if(!ctx.connection.fetch?.register)throw Error('需要受宿主认证保护的 connection.fetch.register');
  const root=resolve(config.root),previous=rootLifetimes.get(root)||Promise.resolve();let releaseRoot;
  const lifetime=new Promise(r=>{releaseRoot=r;});rootLifetimes.set(root,lifetime);
  const executable=config.browserExecutable||join(homedir(),'.local/bin/ego-browser');
  let state=emptyState(),loadError='',disposed=false,commit=Promise.resolve(),environment=null,checking=false,probeChild=null,bridge=null,bridgeError='';
  let active=null,worker=Promise.resolve(),sync={running:false,phase:'idle',error:'',lastResult:''},ticking=false;
  const queue=[],syncByPlatform={},revisions={},spaces={};
  const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
  const register=(path,method,fn)=>ctx.connection.fetch.register({path:'/api/personal-social/'+path,methods:[method],requestBody:'buffered',fetch:fn});
  const ready=previous.then(async()=>{
    if(disposed)return;
    await Promise.all([loadState(root).then(s=>{state=s;}).catch(e=>{loadError=e.message;}),inspectBrowser(executable).then(e=>{environment=e;}),createBrowserBridge(root).then(async b=>{if(disposed)await b.close();else bridge=b;}).catch(()=>{bridgeError='本机连接服务未启动，请检查连接设置；旧账号数据保留。';})]);
    for(const id of PLATFORMS){const s=platformSettings(state,id);if(s.recovery?.spaceId)spaces[id]=s.recovery;syncByPlatform[id]={running:false,platform:id,provider:s.recovery?.provider,url:s.recovery?.url,phase:s.pausedReason||(['queued','reading'].includes(s.lastStatus)?'idle':s.lastStatus)||'idle',lastResult:s.lastResult||'',error:''};}
  });
  function mutate(fn){const op=commit.then(async()=>{if(disposed)throw Error('工作台正在退出');if(loadError)throw Error(loadError);const next=fn(state);await saveState(root,next);state=next;return next;});commit=op.catch(()=>{});return op;}
  function withSettings(s,id,patch){return {...s,settings:{...s.settings,platforms:{...s.settings.platforms,[id]:{...platformSettings(s,id),...patch}}}};}
  function status(job,patch){const value={...syncByPlatform[job.platform],platform:job.platform,url:job.url,provider:job.provider,jobId:job.jobId,automatic:job.automatic,...patch};syncByPlatform[job.platform]=value;sync=value;}
  function valid(job){return !disposed&&(revisions[job.platform]||0)===job.revision&&(!job.automatic||!!state.accounts[job.platform]);}
  async function body(request,needsPlatform=false){const text=await request.text();if(text.length>8192)throw Error('请求过大');const data=JSON.parse(text||'{}');if(!data||typeof data!=='object'||Array.isArray(data))throw Error('请求无效');if(needsPlatform&&!PLATFORMS.includes(data.platform))throw Error('请选择支持的平台');return data;}
  function providerFor(input){const chosen=input||state.settings.provider;if(!['auto','browser','ego'].includes(chosen))throw Error('请选择可用的浏览器连接方式');return chosen==='auto'?(bridge?.status().paired?'browser':'ego'):chosen;}
  async function execute(job){
    if(!valid(job))return;
    status(job,{running:true,phase:'reading',error:'',lastResult:'正在同步账号'});
    try{
      await mutate(s=>withSettings(s,job.platform,{lastAttemptAt:new Date().toISOString(),lastStatus:'reading',lastResult:'正在同步账号'}));
      if(!valid(job))return;
      let result;
      if(job.provider==='browser'){
        const connection=bridge?.status();if(!connection?.paired||(job.automatic&&!connection.online))throw Object.assign(Error(MESSAGES.connection_offline),{status:'connection_offline'});
        result=await bridge.run({platform:job.platform,url:job.url,automatic:job.automatic,resume:job.resume,onProgress:message=>{if(valid(job))status(job,{lastResult:message});}});
      }else{
        environment=await checkBrowser(executable,{onChild:c=>{job.child=c;if(disposed)c.kill();}});
        if(!valid(job))return;
        if(environment.status!=='ready')throw Object.assign(Error(environment.message),{status:'connection_offline'});
        const prior=spaces[job.platform];
        result=await runBrowser({executable,platform:job.platform,url:job.url,automatic:job.automatic,spaceId:prior?.spaceId,resume:job.resume,onChild:c=>{job.child=c;if(disposed)c.kill();}});
        if(result.ok){delete spaces[job.platform];result={...result,status:'ok'};}else{const recovery=result.spaceId?{spaceId:result.spaceId,provider:job.provider,url:job.url}:null;if(recovery)spaces[job.platform]=recovery;else delete spaces[job.platform];if(valid(job))await mutate(s=>withSettings(s,job.platform,{recovery}));result.status=result.status||'needs_attention';}
      }
      if(!valid(job))return;
      if(result.status!=='ok')throw Object.assign(Error(MESSAGES[result.status]||MESSAGES.needs_attention),{status:result.status==='error'?'needs_attention':result.status});
      let snapshot;
      try{snapshot=normalizeSnapshot(job.platform,result.raw,job.url);}catch(e){throw Object.assign(e,{status:/账号|绑定|不一致/.test(e.message)?'account_mismatch':'parse_error'});}
      await mutate(s=>{
        if(!valid(job))return s;
        let next;try{next=applySnapshot(s,job.platform,snapshot);}catch(e){throw Object.assign(e,{status:'account_mismatch'});}
        const settings=platformSettings(next,job.platform);
        return withSettings(next,job.platform,{recovery:null,pausedReason:null,retryCount:0,lastStatus:'complete',lastResult:'同步完成',nextRunAt:nextOccurrence(settings.schedule)});
      });
      if(valid(job))status(job,{completedAt:new Date().toISOString(),running:false,phase:'complete',error:'',lastResult:'同步完成'});
    }catch(e){
      if(!valid(job))return;
      if(e.browserStatus)environment=environmentResult(e.browserStatus,executable);
      const phase=MESSAGES[e.status]?e.status:e.browserStatus?'connection_offline':/超时|网络|及时/.test(e.message)?'network_error':'parse_error';
      const message=MESSAGES[phase];
      try{await mutate(s=>{if(!valid(job))return s;const settings=platformSettings(s,job.platform);return withSettings(s,job.platform,{...failureTransition(phase,settings.retryCount||0,Date.now(),settings.schedule),lastStatus:phase,lastResult:message});});}
      catch{loadError='本地数据无法保存，已停止后续同步以保护已有记录。';}
      status(job,{completedAt:new Date().toISOString(),running:false,phase,error:message,lastResult:message});
    }finally{job.child=null;if(!valid(job))status(job,{running:false,phase:'idle',error:'',lastResult:'任务已取消，未覆盖账号数据'});}
  }
  function drain(){if(active||disposed||checking)return;const job=queue.shift();if(!job)return;active=job;worker=execute(job).finally(()=>{active=null;drain();});}
  function enqueue(data,automatic=false){
    const id=data.platform;if(active?.platform===id||queue.some(j=>j.platform===id))return false;
    const recovery=platformSettings(state,id).recovery;const provider=providerFor(data.resume&&recovery?.provider?recovery.provider:data.provider),bound=state.accounts[id]?.url||'',url=profileURL(id,data.url||'');
    if(bound&&url&&bound!==url)throw Error('已有绑定账号，请先解除绑定');
    if(provider==='browser'&&!bridge?.status().paired)throw Error('请先连接浏览器');
    if(provider==='ego'&&!automatic&&environment?.status==='missing')throw Error('请先连接浏览器，当前自动化连接不可用');
    const job={jobId:randomUUID(),platform:id,url:bound||url,provider,automatic,resume:data.resume===true,revision:revisions[id]||0};
    if(automatic)queue.push(job);else queue.unshift(job);
    status(job,{completedAt:null,running:true,phase:'queued',error:'',lastResult:'等待同步'});drain();return true;
  }
  async function tick(){
    if(ticking||disposed||loadError)return;ticking=true;
    try{await ready;if(disposed||loadError)return;
      for(const id of duePlatforms(state)){
        if(active?.platform===id||queue.some(j=>j.platform===id))continue;
        try{enqueue({platform:id},true);}catch{const settings=platformSettings(state,id);await mutate(s=>withSettings(s,id,{...failureTransition('connection_offline',0,Date.now(),settings.schedule),lastStatus:'connection_offline',lastResult:MESSAGES.connection_offline}));syncByPlatform[id]={running:false,platform:id,provider:settings.recovery?.provider,url:settings.recovery?.url,automatic:true,phase:'connection_offline',error:MESSAGES.connection_offline,lastResult:MESSAGES.connection_offline};}
      }
    }finally{ticking=false;}
  }
  const timer=setInterval(()=>void tick().catch(()=>{}),1000);timer.unref?.();
  register('state','GET',async()=>{await ready;return loadError?json({error:loadError},500):json({...state,platforms:PLATFORM_DEFINITIONS.map(({id,label,color,metrics})=>({id,label,color,metrics})),sync:{...sync,running:!!active||queue.length>0},syncByPlatform,environment:{...environment,checking},browserConnection:bridge?.status()||{available:false,paired:false,online:false,error:bridgeError}});});
  register('settings','POST',async request=>{
    await ready;try{
      const data=await body(request);if(disposed)throw Error('工作台正在退出');
      if(data.provider!==undefined&&!['auto','ego','browser'].includes(data.provider))throw Error('请选择有效的浏览器连接');
      if(data.platform!==undefined&&!PLATFORMS.includes(data.platform))throw Error('请选择支持的平台');
      if(!data.platform&&data.provider===undefined)throw Error('没有可保存的设置');
      if(data.visible!==undefined&&typeof data.visible!=='boolean')throw Error('显示设置无效');
      if(data.schedule!==undefined&&!data.platform)throw Error('请选择平台');
      const schedule=data.schedule?validateSchedule({...platformSettings(state,data.platform).schedule,...data.schedule}):null;
      if(schedule?.enabled&&!state.accounts[data.platform])throw Error('请先读取并绑定账号，再开启自动同步');
      if(data.provider!==undefined){if(active||queue.length)throw Error('请等待当前同步结束后更换连接');}
      if(schedule){syncByPlatform[data.platform]={...syncByPlatform[data.platform],running:false,phase:'idle',lastResult:'计划已更新'};revisions[data.platform]=(revisions[data.platform]||0)+1;for(let i=queue.length-1;i>=0;i--)if(queue[i].platform===data.platform)queue.splice(i,1);if(active?.platform===data.platform){active.child?.kill();if(active.provider==='browser')bridge?.cancelCurrent();}}
      await mutate(s=>{let next=s;if(data.provider!==undefined)next={...next,settings:{...next.settings,provider:data.provider}};if(data.platform)next=withSettings(next,data.platform,{...(data.visible!==undefined?{visible:data.visible}:{}),...(schedule?{schedule,nextRunAt:nextOccurrence(schedule),retryCount:0}: {})});return next;});
      return json({ok:true,settings:state.settings});
    }catch(e){return json({error:e.message},400);}
  });
  async function synchronize(request,login=false){await ready;if(loadError)return json({error:loadError},500);if(disposed)return json({error:'工作台正在退出'},503);try{const data=await body(request,true);if(login)data.resume=true;enqueue(data);return json({started:true},202);}catch(e){return json({error:e.message},400);}}
  register('sync','POST',request=>synchronize(request));register('login','POST',request=>synchronize(request,true));
  register('unbind','POST',async request=>{await ready;try{const data=await body(request,true);if(data.confirm!==true)throw Error('请确认解除绑定');revisions[data.platform]=(revisions[data.platform]||0)+1;for(let i=queue.length-1;i>=0;i--)if(queue[i].platform===data.platform)queue.splice(i,1);if(active?.platform===data.platform){active.child?.kill();if(active.provider==='browser')bridge?.cancelCurrent();}await mutate(s=>unbindAccount(s,data.platform));delete spaces[data.platform];syncByPlatform[data.platform]={running:false,platform:data.platform,phase:'idle',error:'',lastResult:'已解除绑定，历史已保留'};return json({ok:true});}catch(e){return json({error:e.message},400);}});
  register('environment','POST',async()=>{await ready;if(disposed)return json({error:'工作台正在退出'},503);if(active||checking)return json({error:'正在同步或检测，请稍后重试'},409);checking=true;try{environment=await checkBrowser(executable,{onChild:c=>{probeChild=c;if(disposed)c.kill();}});return json({environment});}finally{checking=false;probeChild=null;drain();}});
  register('browser/download','GET',async()=>{try{const data=await readFile(new URL('../lib/browser-connector.zip',import.meta.url));return new Response(data,{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="personal-social-browser-connector.zip"','Cache-Control':'no-store'}});}catch{return json({error:'连接器未就绪，请更新工作台'},503);}});
  register('browser/pair','POST',async()=>{await ready;if(active)return json({error:'请等待当前同步完成'},409);try{if(disposed||!bridge)throw Error(bridgeError||'连接服务不可用');return json(bridge.beginPair());}catch(e){return json({error:e.message},503);}});
  register('browser/revoke','POST',async request=>{await ready;if(active)return json({error:'请等待当前同步完成'},409);try{if(disposed||!bridge)throw Error('连接服务不可用');if((await body(request)).confirm!==true)throw Error('请确认断开浏览器');await bridge.revoke();return json({ok:true});}catch(e){return json({error:e.message},400);}});
  ctx.effect(()=>async()=>{disposed=true;clearInterval(timer);queue.length=0;active?.child?.kill();probeChild?.kill();try{await ready;await bridge?.close();await worker;await commit;}finally{releaseRoot();if(rootLifetimes.get(root)===lifetime)rootLifetimes.delete(root);}},'stop personal social scheduling and collection');
}
