import {PLATFORMS,isPlatformPageURL} from '../src/platforms.mjs';
import {readPageGate,readLoginDiagnostics,normalizeLoginDiagnostics,collectionError} from '../src/collector.mjs';
// Shared by Chromium, Firefox and the Safari local-trial connector; only approved page routes.
export function isPlatformURL(platform,value){return isPlatformPageURL(platform,value);}
export function validJob(job){return !!job&&/^[a-f0-9]{64}$/.test(job.id)&&PLATFORMS.includes(job.platform)&&typeof job.url==='string'&&(!job.url||isPlatformURL(job.platform,job.url))&&(job.collection===undefined||(job.protocol===2&&['refresh','history','incremental'].includes(job.collection?.mode)&&JSON.stringify(job.collection).length<8192))&&['automatic','resume'].every(key=>job[key]===undefined||typeof job[key]==='boolean');}
export const readLoginGate=readPageGate;
export function createPageAdapter(api,tabId,platform,{automatic=false,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now,checkActive=async()=>{}}={}){
  function scriptFailure(error){
    const message=typeof error==='string'?error:String(error?.message||'');
    if(/frame.*(?:removed|not found)|no frame|document.*(?:unloaded|not ready)|about:blank/i.test(message))return Object.assign(collectionError('network_error'),{transient:true});
    const denied=/permission|not (?:allowed|permitted)|(?:does not|doesn't|do not|cannot|can't|missing|denied|no) (?:have )?access|access.*(?:denied|not granted)|未授权|权限/i.test(message);
    return collectionError(denied?'needs_attention':'parse_error',denied?'page_access_denied':'page_script_error');
  }
  async function evaluate(fn,arg){
    await checkActive();
    const tab=await api.tabs.get(tabId);
    await checkActive();
    if(!isPlatformURL(platform,tab.url))throw Object.assign(Error('请保持采集标签在对应平台页面'),{status:'needs_attention'});
    let results;
    try{results=await api.scripting.executeScript({target:{tabId},func:fn,...(arg===undefined?{}:{args:[arg]})});}
    catch(error){throw scriptFailure(error);}
    await checkActive();
    if(!results?.length)throw collectionError('parse_error','page_script_unavailable');
    if(results[0].error)throw scriptFailure(results[0].error);
    if(fn===readPageGate&&!['parse_error','needs_login','needs_attention','network_error'].includes(results[0].result))throw collectionError('parse_error','page_script_unavailable');
    return results[0].result;
  }
  return {
    async goto(url){
      await checkActive();
      if(!isPlatformURL(platform,url))throw Error('平台地址不受支持');
      await api.tabs.update(tabId,{url,active:!automatic});
      const target=new URL(url),path=u=>u.pathname.replace(/\/$/,'')||'/';
      const atDestination=value=>{
        if(!isPlatformURL(platform,value))return false;
        const current=new URL(value);
        if(current.origin===target.origin&&path(current)===path(target))return true;
        if(platform==='bilibili')return current.origin===target.origin&&path(current)===path(target)+'/video'&&/\/upload$/.test(path(target));
        // The platform resolves /user/self to its signed-in canonical profile.
        return platform==='douyin'&&path(target)==='/user/self'&&current.origin===target.origin&&/^\/user\/[A-Za-z0-9_-]+$/.test(path(current));
      };
      const until=now()+12000;
      while(now()<until){
        const tab=await api.tabs.get(tabId);
        const allowed=isPlatformURL(platform,tab.url),current=allowed?new URL(tab.url):null;
        const redirect=platform==='x'&&current&&['/login','/i/flow/login','/account/access'].includes(path(current));
        if(allowed){
          let gate,scripted=false;
          // Navigation may briefly have no scriptable document; keep waiting in that case.
          try{gate=await evaluate(readPageGate);scripted=true;}catch(error){if(error.status==='cancelled'||error.status==='connection_offline'||error.status==='needs_attention'||error.reason)throw error;}
          if(gate&&gate!=='parse_error')throw collectionError(gate);
          if(!scripted&&!redirect){await sleep(250);continue;}
          if(redirect)throw collectionError(path(current)==='/account/access'?'needs_attention':'needs_login');
          if(atDestination(tab.url)&&tab.status==='complete')return;
          // A page may keep loading ads/media after its document is ready.
          if(atDestination(tab.url))try{if(await evaluate(()=>!!document.body&&['interactive','complete'].includes(document.readyState)))return;}catch(error){if(error.reason)throw error;}
        }
        await sleep(250);
      }
      throw collectionError('network_error');
    },
    evaluate,
    async diagnose(){
      await checkActive();
      const tab=await api.tabs.get(tabId);
      if(!isPlatformURL(platform,tab.url))return;
      await checkActive();
      const results=await api.scripting.executeScript({target:{tabId,allFrames:true},func:readLoginDiagnostics});
      await checkActive();
      return normalizeLoginDiagnostics({version:1,frames:(results||[]).filter(r=>!r.error&&r.result).slice(0,8).map(r=>r.result)});
    },
    async waitForFunction(fn,_arg,options={}){
      const until=now()+(options.timeout||18000);
      while(now()<until){
        const gate=await evaluate(readPageGate);
        if(gate&&gate!=='parse_error')throw collectionError(gate);
        if(await evaluate(fn))return;
        await sleep(400);
      }
      throw collectionError('parse_error');
    }
  };
}
