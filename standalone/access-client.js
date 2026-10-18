const nativeFetch=window.fetch.bind(window);
let csrf='';
export async function session(){
  const r=await nativeFetch('/session',{credentials:'same-origin',cache:'no-store'});
  const data=await r.json();if(r.ok)csrf=data.csrf;
  return {ok:r.ok,status:r.status,...data};
}
export async function accessRequest(path,body){
  const r=await window.fetch(path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await r.json();if(!r.ok)throw Object.assign(Error(data.error||'操作未完成，请重试。'),{retryAfter:data.retryAfter});
  if(data.csrf)csrf=data.csrf;return data;
}
export function installAccessFetch(){
  window.fetch=async(input,options={})=>{
    const url=new URL(input instanceof Request?input.url:String(input),location.origin);
    if(url.origin!==location.origin||!['/api/personal-social/','/auth/'].some(prefix=>url.pathname.startsWith(prefix)))return nativeFetch(input,options);
    const headers=new Headers(input instanceof Request?input.headers:undefined);
    new Headers(options.headers).forEach((value,key)=>headers.set(key,value));headers.set('X-CSRF-Token',csrf);
    let response;
    try{response=await nativeFetch(input,{...options,credentials:'same-origin',headers});}
    catch(e){window.dispatchEvent(new Event('psw-service-unavailable'));throw e;}
    if(response.status===401&&url.pathname!=='/auth/pair')window.dispatchEvent(new Event('psw-access-required'));
    if(response.status===403){
      const data=await response.clone().json().catch(()=>({}));
      if(data.code==='csrf_expired'){
        try{const current=await session();if(!current.ok)window.dispatchEvent(new Event('psw-access-required'));}
        catch{window.dispatchEvent(new Event('psw-service-unavailable'));}
        // Never replay a POST after reconnecting: the user decides whether to repeat it.
      }
    }
    return response;
  };
}
