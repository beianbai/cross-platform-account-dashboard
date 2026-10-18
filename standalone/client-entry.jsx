import React,{useEffect,useState,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {session,installAccessFetch} from './access-client.js';
import {AccessGate,AccessSettings} from './access-ui.jsx';

const legacyLink=!!location.hash;
if(legacyLink)history.replaceState(null,'',location.pathname);
installAccessFetch();
let Workbench;
window.__ModuleLoader__={load(module){
  const client=module.factory(name=>{if(name==='react')return React;throw Error(`不支持的界面模块：${name}`);});
  client.apply({effect(fn){fn();},accessManagement:AccessSettings,desktopWorkbenches:{register(options,Panel){Workbench=Panel;return()=>{};}}});
}};
await import('../src/client.js');
function App(){
  const [state,setState]=useState({mode:'loading'}),checking=useRef(false),generation=useRef(0);
  async function check(){
    if(checking.current)return;checking.current=true;const current=++generation.current;
    try{const result=await session();if(current===generation.current)setState(result.ok?{mode:'ready'}:result.status===401?{mode:'gate',...result,legacyLink}:{mode:'offline'});}
    catch{if(current===generation.current)setState({mode:'offline'});}finally{checking.current=false;}
  }
  useEffect(()=>{
    void check();const lost=()=>{generation.current++;setState({mode:'gate',expired:true});};const offline=()=>{generation.current++;setState({mode:'offline'});};
    window.addEventListener('psw-access-required',lost);window.addEventListener('psw-service-unavailable',offline);
    return()=>{window.removeEventListener('psw-access-required',lost);window.removeEventListener('psw-service-unavailable',offline);};
  },[]);
  if(state.mode==='ready')return <Workbench/>;
  if(state.mode==='loading')return <main id="startup" role="status"><h1>跨平台账号看板</h1><p>正在检查本机访问授权…</p></main>;
  return <AccessGate key={state.mode} initial={state} offline={state.mode==='offline'} onReady={check} onRetry={check}/>;
}
createRoot(document.getElementById('root')).render(<App/>);
