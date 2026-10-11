// Pure scheduling rules. All clocks enter as arguments for deterministic recovery.
export function validateSchedule(value) {
  if(!value||typeof value!=='object'||typeof value.enabled!=='boolean'||!['daily','interval'].includes(value.kind))throw Error('请选择有效的同步计划');
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time))throw Error('请选择有效的每日时间');
  if(![1,3,6,12].includes(value.hours))throw Error('同步间隔只能为 1、3、6 或 12 小时');
  try{new Intl.DateTimeFormat('en',{timeZone:value.timeZone}).format();}catch{throw Error('计划时区无效');}
  if(typeof value.timeZone!=='string'||!value.timeZone)throw Error('请选择时区');
  return {enabled:value.enabled,kind:value.kind,time:value.time,hours:value.hours,timeZone:value.timeZone};
}
export function nextOccurrence(input,now=Date.now()) {
  const schedule=validateSchedule(input),ms=new Date(now).getTime();
  if(!Number.isFinite(ms))throw Error('计划时间无效');
  if(!schedule.enabled)return null;
  if(schedule.kind==='interval')return new Date(ms+schedule.hours*3600000).toISOString();
  const fmt=new Intl.DateTimeFormat('sv-SE',{timeZone:schedule.timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
  const parts=t=>{const o=Object.fromEntries(fmt.formatToParts(t).map(p=>[p.type,p.value]));return {date:`${o.year}-${o.month}-${o.day}`,time:`${o.hour}:${o.minute}`};};
  const today=parts(ms).date,seen=new Set();
  // Looking back covers the first occurrence of a repeated wall-clock time.
  // First valid minute >= target handles spring-forward gaps without double runs.
  for(let t=Math.floor(ms/60000)*60000-36*3600000;t<=ms+60*3600000;t+=60000){
    const p=parts(t);if(p.date<today||seen.has(p.date)||p.time<schedule.time)continue;
    seen.add(p.date);if(t>ms)return new Date(t).toISOString();
  }
  throw Error('无法计算下次同步时间');
}
export function duePlatforms(state,now=Date.now()) {
  const ms=new Date(now).getTime();return Object.keys(state.accounts).filter(id=>{const s=state.settings.platforms[id];return s?.schedule?.enabled&&!s.pausedReason&&s.nextRunAt&&Date.parse(s.nextRunAt)<=ms;});
}
export function failureTransition(status,retryCount,now,schedule){
  const ms=new Date(now).getTime();
  if(['needs_login','needs_attention','parse_error','account_mismatch'].includes(status))return {pausedReason:status,retryCount:0,nextRunAt:null};
  if(status==='network_error'&&retryCount<2)return {pausedReason:null,retryCount:retryCount+1,nextRunAt:new Date(ms+(retryCount===0?60000:300000)).toISOString()};
  return {pausedReason:null,retryCount:0,nextRunAt:status==='connection_offline'?new Date(ms+60000).toISOString():nextOccurrence(schedule,ms)};
}
