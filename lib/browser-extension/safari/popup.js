const api=globalThis.browser||globalThis.chrome;
const el=id=>document.getElementById(id);
const status=el('status');
let state={},reconnecting=false,pendingAction=null,awaitingPoll=false,lastResult=null;
let theme='light',savingTheme=false;
function applyTheme(value){
 theme=value==='dark'?'dark':'light';document.documentElement.dataset.theme=theme;
 const label=theme==='dark'?'切换到浅色模式':'切换到深色模式';
 el('theme-toggle').setAttribute('aria-label',label);el('theme-toggle').setAttribute('title',label);
}
const phaseNames={idle:'等待任务',checking:'检查中',reading:'正在读取',submitted:'已提交',success:'读取完成',error:'未完成',attention:'需处理'};
const phaseTones={idle:'neutral',checking:'pending',reading:'pending',submitted:'neutral',success:'success',error:'error',attention:'attention'};
const buttonLabels={pair:'授权连接本机看板',poll:'检查待执行任务',disconnect:'断开连接'};
const pendingLabels={pair:'正在连接…',poll:'正在检查…',disconnect:'正在断开…'};
function notify(message,tone='neutral'){
 status.textContent=message;status.dataset.tone=tone;status.hidden=!message;
 status.setAttribute('role',tone==='error'?'alert':'status');status.setAttribute('aria-live',tone==='error'?'assertive':'polite');
}
function legacyActivity(message=''){
 const phase=/未完成|失败|失效|错误/.test(message)?'error':/正在读取/.test(message)?'reading':/请.*登录|验证|需.*处理/.test(message)?'attention':/读取完成/.test(message)?'success':'idle';
 return {phase,message};
}
function activity(){return state.activity&&phaseNames[state.activity.phase]?state.activity:legacyActivity(state.status);}
function render(){
 const paired=Boolean(state.connection),current=activity();
 el('connected-panel').hidden=!paired;el('pair-panel').hidden=paired&&!reconnecting;el('cancel-pair').hidden=!paired;
 el('reconnect').setAttribute('aria-expanded',String(reconnecting));
 el('connection-state').textContent=paired?'已授权':'未连接';el('connection-state').dataset.tone=paired?'success':'neutral';
 el('connection-title').textContent=paired?(state.connection.label||'我的浏览器'):'连接浏览器';
 el('connection-detail').textContent=paired?'读取时会检查各平台的登录状态。':'使用已登录账号，执行手动读取与自动同步。';
 el('task-state').textContent=phaseNames[current.phase];el('task-state').dataset.tone=phaseTones[current.phase];
 el('task-detail').textContent=current.phase==='idle'?'等待看板中的手动读取或自动同步任务。':current.message||phaseNames[current.phase];
 if(state.lastResult)lastResult=state.lastResult;
 else if(['submitted','success','error','attention'].includes(current.phase))lastResult=current;
 el('result-text').textContent=lastResult?.message||'暂无读取记录';
 const timestamp=lastResult?.updatedAt,date=timestamp?new Date(timestamp):null,validTime=date&&!Number.isNaN(date.getTime());
 el('result-time').hidden=!validTime;
 el('result-time').textContent=validTime?date.toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
 if(validTime)el('result-time').setAttribute('datetime',date.toISOString());
 for(const button of document.querySelectorAll('button'))button.disabled=button.id==='theme-toggle'?savingTheme:Boolean(pendingAction);
 for(const [id,label]of Object.entries(buttonLabels)){
  el(id).setAttribute('aria-busy',String(pendingAction===id));
  el(id==='poll'?'poll-label':id).textContent=pendingAction===id?pendingLabels[id]:label;
 }
}
async function refresh(){state=await api.storage.local.get(['connection','status','activity','lastResult','popupTheme']);applyTheme(state.popupTheme);render();}
function codeError(message){el('code-error').textContent=message;if(message){el('code').setAttribute('aria-invalid','true');el('code').focus();}else el('code').removeAttribute('aria-invalid');}
async function send(message){
 if(pendingAction)return;
 let nextFocus=null;
 pendingAction=message.type;awaitingPoll=message.type==='poll';
 notify({pair:'正在连接本机看板…',poll:'正在检查待执行任务…',disconnect:'正在断开连接…'}[message.type],'pending');render();
 try{
  const result=await api.runtime.sendMessage(message);
  if(result?.error)throw Error(result.error);
  if(!result?.ok&&!result?.accepted)throw Error('未收到浏览器的确认，请重试。');
  await refresh();
  if(message.type==='pair'){
   if(!state.connection)throw Error('连接尚未保存，请重试。');
   reconnecting=false;el('code').value='';notify('连接成功。可回到看板读取账号或设置自动同步。','success');nextFocus='poll';
  }else if(message.type==='disconnect'){
   if(state.connection)throw Error('连接仍然存在，请重试。');
   reconnecting=false;lastResult=null;notify('此浏览器已断开。也可在看板中撤销授权。');nextFocus='code';
  }else if(awaitingPoll){notify(result.busy?'已有任务正在执行，完成后将在这里显示结果。':'已请求检查，正在等待浏览器任务状态…','pending');}
 }catch(error){awaitingPoll=false;notify(error?.message||'操作未完成，请重试。','error');}
 finally{pendingAction=null;render();if(nextFocus)el(nextFocus).focus();}
}
el('pair-form').addEventListener('submit',event=>{
 event.preventDefault();const code=el('code').value.trim();
 if(!code){codeError('请粘贴看板生成的连接码。');return;}
 try{const url=new URL(code);if(url.protocol!=='dsh-social:'||url.hostname!=='127.0.0.1'||url.username||url.password||!/^\d+$/.test(url.port)||!/^#[a-f0-9]{64}$/.test(url.hash)||url.pathname||url.search)throw Error();}
 catch{codeError('连接码格式不正确，请从看板重新复制完整内容。');return;}
 codeError('');return send({type:'pair',code,label:el('label').value.trim()||'我的浏览器'});
});
el('code').addEventListener('input',()=>codeError(''));
el('poll').addEventListener('click',()=>send({type:'poll'}));
el('disconnect').addEventListener('click',()=>send({type:'disconnect'}));
el('reconnect').addEventListener('click',()=>{reconnecting=true;render();el('code').focus();});
el('cancel-pair').addEventListener('click',()=>{reconnecting=false;codeError('');render();el('reconnect').focus();});
el('theme-toggle').addEventListener('click',async()=>{
 if(savingTheme)return;
 const previous=theme;applyTheme(theme==='light'?'dark':'light');savingTheme=true;render();
 try{await api.storage.local.set({popupTheme:theme});}
 catch{applyTheme(previous);notify('主题偏好未能保存，请重试。','error');}
 finally{savingTheme=false;render();}
});
api.storage.onChanged.addListener((changes,area)=>{
 if(area!=='local')return;
 if('popupTheme' in changes)applyTheme(changes.popupTheme.newValue);
 for(const key of ['connection','status','activity','lastResult'])if(key in changes)state[key]=changes[key].newValue;
 render();
 if(awaitingPoll&&(changes.activity||(!state.activity&&changes.status))){
  const current=activity();
  notify(current.phase==='idle'?'检查完成，当前没有待执行任务。':current.message,phaseTones[current.phase]);
  if(!['checking','reading'].includes(current.phase))awaitingPoll=false;
 }
});
applyTheme('light');
void refresh().catch(error=>notify(error?.message||'无法读取连接状态，请重新打开扩展。','error'));
