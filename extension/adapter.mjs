import {PLATFORMS,isPlatformPageURL} from '../src/platforms.mjs';
import {readPageGate,collectionError} from '../src/collector.mjs';
// Shared by Chrome/Edge and Firefox; only official, explicitly supported page routes.
export function isPlatformURL(platform,value){return isPlatformPageURL(platform,value);}
export function validJob(job){return !!job&&/^[a-f0-9]{64}$/.test(job.id)&&PLATFORMS.includes(job.platform)&&typeof job.url==='string'&&(!job.url||isPlatformURL(job.platform,job.url))&&(job.collection===undefined||(job.protocol===2&&['refresh','history','incremental'].includes(job.collection?.mode)&&JSON.stringify(job.collection).length<8192))&&['automatic','resume'].every(key=>job[key]===undefined||typeof job[key]==='boolean');}
export const readLoginGate=readPageGate;
export function createPageAdapter(api,tabId,platform,{automatic=false,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now}={}){
  async function evaluate(fn,arg){
    const tab=await api.tabs.get(tabId);
    if(!isPlatformURL(platform,tab.url))throw Object.assign(Error('请保持采集标签在对应平台页面'),{status:'needs_attention'});
    const results=await api.scripting.executeScript({target:{tabId},func:fn,...(arg===undefined?{}:{args:[arg]})});
    if(!results?.length||results[0].error)throw collectionError('parse_error');
    return results[0].result;
  }
  return {
    async goto(url){
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
        if(atDestination(tab.url)){
          if(tab.status==='complete')return;
          // A page may keep loading ads/media after its document is ready.
          try{if(await evaluate(()=>!!document.body&&['interactive','complete'].includes(document.readyState)))return;}catch{}
        }
        await sleep(250);
      }
      throw collectionError('network_error');
    },
    evaluate,
    async waitForFunction(fn,_arg,options={}){const until=now()+(options.timeout||18000);while(now()<until){if(await evaluate(fn))return;await sleep(400);}throw collectionError('parse_error');}
  };
}
