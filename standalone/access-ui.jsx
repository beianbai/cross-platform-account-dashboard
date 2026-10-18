import React,{useState,useEffect,useRef} from 'react';
import {accessRequest} from './access-client.js';

export function AccessGate({initial,offline,onReady,onRetry}){
  const [code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[retryAt,setRetryAt]=useState(0),[now,setNow]=useState(Date.now());
  const input=useRef(null),active=useRef(false);
  const [dark,setDark]=useState(()=>{try{const mode=localStorage.getItem('psw-theme');return mode==='dark'||mode==='system'&&matchMedia('(prefers-color-scheme: dark)').matches;}catch{return false;}});
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  const waiting=Math.max(0,Math.ceil((retryAt-now)/1000));
  async function submit(event){
    event.preventDefault();if(active.current||waiting)return;
    if(!/^[A-Z2-9]{8}$/.test(code.toUpperCase().replace(/[\s-]/g,''))){setError('请输入完整的 8 位配对码，支持直接粘贴。');input.current?.focus();return;}
    active.current=true;setBusy(true);setError('');
    try{await accessRequest('/auth/pair',{code});onReady();}
    catch(e){setError(e.message||'授权未完成，请重试。');if(e.retryAfter)setRetryAt(Date.now()+e.retryAfter*1000);input.current?.focus();}
    finally{active.current=false;setBusy(false);}
  }
  return <main className="access-gate" data-theme={dark?'dark':'light'}>
    <header className="access-brand"><span className="access-mark" aria-hidden="true">◈</span><span>跨平台账号看板</span><button type="button" onClick={()=>{const next=!dark;setDark(next);try{localStorage.setItem('psw-theme',next?'dark':'light');}catch{}}} aria-label={dark?'切换为浅色':'切换为深色'}>{dark?'☀':'☾'}</button></header>
    <section className="access-card" aria-labelledby="access-title">
      <div className="access-eyebrow">本机工作台 · 访问授权</div>
      <h1 id="access-title">{offline?'暂时无法连接工作台':'让这个浏览器访问你的工作台'}</h1>
      <p className="access-intro">{offline?'请确认本机服务仍在运行，再重新连接。已有账号和历史记录不会因此丢失。':'首次访问只需配对一次。授权后，这个浏览器可以直接打开工作台，与其他已授权浏览器共享本机数据。'}</p>
      {offline?<button type="button" className="access-primary" onClick={onRetry}>重新连接</button>:<>
        {(initial?.upgraded||initial?.legacyLink)&&<p className="access-banner">访问授权已升级，旧链接不再用于登录。请获取配对码重新授权，已有业务数据保留。</p>}
        {initial?.expired&&<p className="access-banner">当前访问授权已失效，请重新配对。刚才的操作不会自动重试。</p>}
        <form onSubmit={submit}>
          <label htmlFor="access-code">配对码</label>
          <input id="access-code" ref={input} value={code} onChange={e=>{setCode(e.target.value);setError('');}} placeholder="XXXX-XXXX" autoComplete="one-time-code" autoCapitalize="characters" spellCheck={false} maxLength={24} aria-invalid={!!error} aria-describedby={error?'access-error access-help':'access-help'} disabled={busy}/>
          <p id="access-help" className="access-hint">配对码 5 分钟有效，只能成功使用一次。</p>
          {error&&<p id="access-error" className="access-error" role="alert">{error}</p>}
          <button className="access-primary" disabled={busy||waiting>0} aria-busy={busy}>{busy?'正在授权…':waiting?`请 ${waiting} 秒后重试`:'授权并进入'}</button>
        </form>
        <div className="access-guidance"><h2>在哪里获取配对码？</h2><ol><li><strong>第一次使用：</strong>在启动服务的终端窗口查看。</li><li><strong>已有浏览器登录：</strong>打开其「设置 → 访问授权」，生成新码。</li></ol>
          <details><summary>配对码过期，或没有浏览器能登录？</summary><p>在本机项目目录另开终端，运行以下命令，无须重启服务：</p><code>npm run auth:code</code><p>使用自定义数据目录时，加上相同的 <code>-- --root "数据目录"</code>。</p></details>
        </div>
      </>}
    </section>
    <footer>仅用于这台电脑上的工作台访问 · 不影响平台账号登录</footer>
  </main>;
}

export function AccessSettings(){
  const [sessions,setSessions]=useState([]),[pair,setPair]=useState(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState(null),[now,setNow]=useState(Date.now());
  const alive=useRef(true),busyRef=useRef(false),refreshRef=useRef(null),codeRef=useRef(null),generation=useRef(0),revokeButtons=useRef(new Map());
  async function refresh(){
    const stamp=generation.current;
    try{const data=await accessRequest('/auth/sessions');if(!alive.current||stamp!==generation.current)return;
      setSessions(data.sessions);setPair(old=>old&&data.pairing?.id!==old.id?{...old,invalid:true}:old);
    }catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setLoading(false);}
  }
  useEffect(()=>{alive.current=true;void refresh();const polling=setInterval(refresh,10000),clock=setInterval(()=>setNow(Date.now()),1000);return()=>{alive.current=false;clearInterval(polling);clearInterval(clock);};},[]);
  async function act(fn){if(busyRef.current)return;busyRef.current=true;setBusy(true);setError('');setNotice('');try{await fn();}catch(e){if(alive.current)setError(e.message);}finally{busyRef.current=false;if(alive.current)setBusy(false);}}
  async function issue(){await act(async()=>{generation.current++;const value=await accessRequest('/auth/code',{});if(alive.current){setPair({...value,localExpires:Date.now()+value.expiresAt-value.serverTime});setNow(Date.now());setNotice('新配对码已生成，先前未使用的配对码已失效。');}});}
  async function copy(text,isCode){
    try{await navigator.clipboard.writeText(text);setNotice(isCode?'配对码已复制。':'访问地址已复制。');setError('');}
    catch{if(isCode&&codeRef.current){codeRef.current.focus();const range=document.createRange();range.selectNodeContents(codeRef.current);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}setError('无法自动复制，请手动选中上方内容后复制。');}
  }
  async function revoke(target){await act(async()=>{generation.current++;const result=await accessRequest('/auth/revoke',{id:target.id,confirm:true});if(result.current){window.dispatchEvent(new Event('psw-access-required'));return;}setConfirm(null);setNotice('已撤销该浏览器的访问授权。');await refresh();refreshRef.current?.focus();});}
  const seconds=pair?Math.max(0,Math.ceil((pair.localExpires-now)/1000)):0,valid=pair&&!pair.invalid&&seconds>0;
  const format=value=>new Date(value).toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
  return <section className="psw-setting-block psw-setting-grid" aria-labelledby="access-settings-title"><h2 id="access-settings-title">访问授权</h2><div className="psw-setting-body access-settings">
    <p>管理哪些浏览器可以查看和操作这个工作台。多个浏览器共享本机数据，不影响用于采集的浏览器连接。</p>
    <div className="psw-actions access-actions"><button type="button" onClick={issue} disabled={busy}>{busy?'正在处理…':pair?'重新生成配对码':'授权其他浏览器'}</button><button ref={refreshRef} type="button" className="psw-quiet" onClick={()=>{setError('');void refresh();}} disabled={busy}>刷新授权列表</button></div>
    {pair&&<div className="access-pair"><span className="access-caption">在另一个浏览器打开下方地址，输入配对码</span>
      <div className="access-code-row"><code ref={codeRef} tabIndex={0} aria-label="配对码">{valid?pair.code:'配对码已失效'}</code><button type="button" disabled={!valid} onClick={()=>copy(pair.code,true)}>复制配对码</button></div>
      <p>{valid?`剩余 ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} · 仅可成功使用一次`:'配对码已使用、被替换或过期。需要时可重新生成。'}</p>
      <div className="access-address"><code>{location.origin}/</code><button type="button" className="psw-quiet" onClick={()=>copy(location.origin+'/',false)}>复制地址</button></div>
      <p>生成新码不会让已授权的浏览器退出。</p></div>}
    {error&&<p className="psw-field-error" role="alert">{error}</p>}{notice&&<p className="access-notice" role="status">{notice}</p>}
    <h3>已授权浏览器{!loading&&` · ${sessions.length}`}</h3>
    {loading?<p role="status">正在读取授权列表…</p>:sessions.map(item=><div className="access-session" key={item.id}>
      <div className="access-session-info"><strong>{item.label}{item.current&&<span className="access-current">当前浏览器</span>}</strong><span>授权于 {format(item.createdAt)} · 最近访问 {format(item.lastSeenAt)}</span></div>
      {confirm===item.id?<div className="access-confirm"><p>{item.current?'撤销后当前浏览器将退出，需要重新配对。':'撤销后，该浏览器将无法继续访问工作台。'}</p><div className="psw-actions"><button type="button" className="psw-danger" autoFocus disabled={busy} onClick={()=>revoke(item)}>确认撤销</button><button type="button" disabled={busy} onClick={()=>{setConfirm(null);requestAnimationFrame(()=>revokeButtons.current.get(item.id)?.focus());}}>取消</button></div></div>:<button type="button" ref={node=>{if(node)revokeButtons.current.set(item.id,node);else revokeButtons.current.delete(item.id);}} className="psw-quiet" disabled={busy} onClick={()=>setConfirm(item.id)}>撤销访问</button>}
    </div>)}
    <p>浏览器名称仅用于辨认；不同配置文件会分别授权。连续 90 天未使用会失效，清除 Cookie 或关闭无痕窗口后可能需要重新配对。</p>
  </div></section>;
}
