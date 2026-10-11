import {PLATFORMS, PLATFORM_BY_ID, X_RESERVED_HANDLES} from './platforms.mjs';
export {PLATFORMS,LABELS} from './platforms.mjs';
export function profileURL(platform, input='') {
  if (!PLATFORMS.includes(platform)) throw Error('不支持的平台');
  if (!input.trim()) return '';
  let u; try { u=new URL(input.trim()); } catch { throw Error('请粘贴完整的 HTTPS 个人主页链接，而不是分享文案或短链接'); }
  if (u.protocol!=='https:' || u.port || u.username || u.password) throw Error('只接受平台官方 HTTPS 个人主页链接');
  const definition=PLATFORM_BY_ID[platform];
  if (!definition.hosts.includes(u.hostname) || !definition.profilePattern.test(u.pathname)) throw Error('链接与所选平台的个人主页格式不符');
  let path=u.pathname.replace(/\/$/,'');
  if(platform==='x') {path=path.toLowerCase();if(X_RESERVED_HANDLES.has(path.slice(1)))throw Error('请使用 X 账号个人主页链接');}
  return `https://${definition.hosts[0]}${path}`;
}
export function parseCount(value) {
  if(value==null)return null;
  const raw=String(value).trim().replace(/,/g,'');
  const m=raw.match(/^(\d+(?:\.\d+)?)\s*(万|亿|[kKmMwW])?\+?$/);
  if(!m)return null;
  const multiplier=({'万':1e4,'亿':1e8,k:1e3,m:1e6,w:1e4})[m[2]?.toLowerCase()]||1;
  const n=Number(m[1])*multiplier;
  return Number.isSafeInteger(Math.round(n))?{value:Math.round(n),display:String(value).trim(),approximate:!!m[2]||raw.endsWith('+')}:null;
}
export function safeMediaURL(value) {
  try {const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port?u.href:'';}catch{return '';}
}
export function safeWorkURL(platform,value) {
  try {
    const u=new URL(value);
    if(u.protocol!=='https:'||u.port||u.username||u.password)return '';
    const definition=PLATFORM_BY_ID[platform];
    if(!definition?.workHosts.includes(u.hostname)||!definition.workPattern.test(u.pathname))return '';
    if(platform==='x') {u.hostname='x.com';u.pathname=u.pathname.toLowerCase().replace(/\/$/,'');if(X_RESERVED_HANDLES.has(u.pathname.split('/')[1]))return '';}
    // Keep only the XHS content access token, never login tokens or tracking parameters.
    const token=platform==='xiaohongshu'?u.searchParams.get('xsec_token'):null;
    u.search='';u.hash='';
    if(token&&token.length<512)u.searchParams.set('xsec_token',token);
    return u.href;
  }catch{return '';}
}
const WORK_LIMIT=200;
export function normalizeSnapshot(platform,raw,expected='') {
  if(!raw||typeof raw!=='object')throw Error('平台没有返回可核验的个人主页');
  const url=profileURL(platform,raw.url);
  if(!url || (expected && url!==expected))throw Error('当前主页与绑定账号不一致，旧数据已保留');
  const name=String(raw.name||'').trim().slice(0,100);
  if(!name)throw Error('未识别到账号昵称，请先完成登录或验证');
  if(platform==='douyin'&&url.endsWith('/user/self')&&!String(raw.accountId||'').trim())throw Error('未识别到抖音号，无法安全绑定当前登录账号');
  const fans=parseCount(raw.fans),following=parseCount(raw.following);
  if(!fans && !following)throw Error('粉丝与关注数据均未识别，请检查平台登录或页面结构');
  const seen=new Set(),works=[],receivedWorks=Array.isArray(raw.works)?raw.works:[];
  for(const item of receivedWorks.slice(0,WORK_LIMIT)) {
    const link=safeWorkURL(platform,item.url);if(!link)continue;
    if(platform==='x'&&new URL(link).pathname.split('/')[1]!==new URL(url).pathname.slice(1))continue;
    const id=new URL(link).pathname;if(seen.has(id))continue;seen.add(id);
    works.push({id,url:link,title:String(item.title||'未提供标题').slice(0,300),cover:safeMediaURL(item.cover),kind:String(item.kind||'作品').slice(0,20)});
  }
  if(parseCount(raw.workCount)?.value===0&&works.length)throw Error('作品总数与作品列表冲突，拒绝保存可能混入的推荐内容');
  let coverage;
  if(platform==='bilibili'&&raw.coverage&&typeof raw.coverage==='object') {
    const kinds={video:'视频',opus:'图文',audio:'音频'};
    coverage=Object.fromEntries(Object.entries(kinds).map(([key,kind])=>{
      const item=raw.coverage[key]||{},loaded=works.filter(w=>w.kind===kind).length;
      const status=['empty','partial','unavailable'].includes(item.status)?item.status:'unavailable';
      const reason=['network_error','parse_error','needs_login','needs_attention','account_mismatch'].includes(item.reason)?item.reason:null;
      return [key,{total:parseCount(item.total),loaded,status:status==='empty'&&loaded?'partial':status,...(reason?{reason}:{})}];
    }));
  }
  const workCollection={limit:WORK_LIMIT,received:receivedWorks.length,retained:works.length,truncated:receivedWorks.length>WORK_LIMIT};
  return {workCollection,...(coverage?{coverage}:{}),platform,url,name,avatar:safeMediaURL(raw.avatar),bio:String(raw.bio||'').slice(0,500),accountId:String(raw.accountId||'').slice(0,160),fans,following,likes:platform==='x'?null:parseCount(raw.likes),workCount:parseCount(raw.workCount),works,scope:String(raw.scope||'仅当前已加载的作品，不代表全部').slice(0,250),worksStatus:raw.worksStatus==='empty'?'empty':works.length?'partial':'unavailable',syncedAt:new Date().toISOString()};
}
const METRICS=['fans','following','likes','workCount'];
const systemTimeZone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
function checkedTimeZone(value) {if(typeof value!=='string'||!value)throw Error('时区无效');new Intl.DateTimeFormat('en-US',{timeZone:value});return value;}
function defaultPlatformSettings(timeZone) {return {visible:true,schedule:{enabled:false,kind:'daily',time:'09:00',hours:6,timeZone},nextRunAt:null,pausedReason:null,lastAttemptAt:null,lastResult:null};}
export function emptyState(timeZone=systemTimeZone()) {
  checkedTimeZone(timeZone);
  return {version:2,accounts:{},archives:[],settings:{provider:'auto',timeZone,platforms:Object.fromEntries(PLATFORMS.map(id=>[id,defaultPlatformSettings(timeZone)]))}};
}
export function platformSettings(state,platform) {
  if(!PLATFORMS.includes(platform))throw Error('不支持的平台');
  return structuredClone(state.settings?.platforms?.[platform] || defaultPlatformSettings(state.settings?.timeZone || systemTimeZone()));
}
function dayOf(at,timeZone) {
  const fields=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at)).map(p=>[p.type,p.value]));
  return `${fields.year}-${fields.month}-${fields.day}`;
}
function dailyPoint(sample,timeZone) {return {date:dayOf(sample.at,timeZone),at:sample.at,timeZone,...Object.fromEntries(METRICS.map(key=>[key,structuredClone(sample[key]??null)]))};}
function mergeDaily(points,point) {
  const existing=points.find(p=>p.date===point.date&&p.timeZone===point.timeZone);
  if(existing&&Date.parse(existing.at)>Date.parse(point.at))return [...points];
  return [...points.filter(p=>p.date!==point.date||p.timeZone!==point.timeZone),point].sort((a,b)=>a.date.localeCompare(b.date)||a.at.localeCompare(b.at));
}
function object(value) {return value!==null&&typeof value==='object'&&!Array.isArray(value);}
function validAt(value) {return typeof value==='string'&&/^\d{4}-\d\d-\d\dT/.test(value)&&Number.isFinite(Date.parse(value));}
function validateMetric(value) {
  if(value==null)return;
  if(!object(value)||!Number.isSafeInteger(value.value)||value.value<0||typeof value.display!=='string'||typeof value.approximate!=='boolean')throw Error('指标数据损坏，未覆盖');
}
function validateSample(sample,daily=false) {
  if(!object(sample)||!validAt(sample.at))throw Error('历史时间损坏，未覆盖');
  for(const key of METRICS)validateMetric(sample[key]);
  if(daily) {checkedTimeZone(sample.timeZone);if(sample.date!==dayOf(sample.at,sample.timeZone))throw Error('每日历史日期异常，未覆盖');}
}
function validateAccount(platform,record,version) {
  if(!PLATFORMS.includes(platform)||!object(record)||(record.platform!=null&&record.platform!==platform)||!record.url||profileURL(platform,record.url)!==record.url||typeof record.name!=='string'||!record.name||!Array.isArray(record.works)||!Array.isArray(record.history)||!validAt(record.syncedAt))throw Error('账号记录损坏，未覆盖');
  for(const key of METRICS)validateMetric(record[key]);
  if(record.workCollection!=null){
    const c=record.workCollection;
    if(!object(c)||c.limit!==WORK_LIMIT||!Number.isSafeInteger(c.received)||c.received<0||c.retained!==record.works.length||c.retained>WORK_LIMIT||c.received<c.retained||typeof c.truncated!=='boolean'||c.truncated!==(c.received>WORK_LIMIT))throw Error('作品读取范围记录损坏，未覆盖');
  }
  if(record.coverage!=null){
    if(platform!=='bilibili'||!object(record.coverage))throw Error('作品分类记录损坏，未覆盖');
    for(const [key,item] of Object.entries(record.coverage)){
      if(!['video','opus','audio'].includes(key)||!object(item)||!Number.isInteger(item.loaded)||item.loaded<0||item.loaded>200||!['empty','partial','unavailable'].includes(item.status))throw Error('作品分类记录损坏，未覆盖');
      validateMetric(item.total);
      if(item.reason!=null&&!['network_error','parse_error','needs_login','needs_attention','account_mismatch'].includes(item.reason))throw Error('作品分类状态损坏，未覆盖');
    }
  }
  for(const sample of record.history)validateSample(sample);
  if(version===2) {
    if(!Array.isArray(record.daily))throw Error('每日历史损坏，未覆盖');
    const seen=new Set();for(const sample of record.daily){validateSample(sample,true);const key=`${sample.date}/${sample.timeZone}`;if(seen.has(key))throw Error('每日历史重复，未覆盖');seen.add(key);}
  }
}
export function validateState(value) {
  if(!object(value)||![1,2].includes(value.version)||!object(value.accounts))throw Error('本地数据格式异常，未覆盖');
  for(const [key,record] of Object.entries(value.accounts))validateAccount(key,record,value.version);
  if(value.version===1)return;
  if(!Array.isArray(value.archives)||!object(value.settings)||!object(value.settings.platforms)||!['auto','ego','browser'].includes(value.settings.provider))throw Error('本地设置格式异常，未覆盖');
  checkedTimeZone(value.settings.timeZone);
  for(const record of value.archives){validateAccount(record.platform,record,2);if(!validAt(record.archivedAt))throw Error('档案时间异常，未覆盖');}
  for(const platform of PLATFORMS){
    const settings=value.settings.platforms[platform],schedule=settings?.schedule;
    if(!object(settings)||typeof settings.visible!=='boolean'||!object(schedule)||typeof schedule.enabled!=='boolean'||!['daily','interval'].includes(schedule.kind)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time)||![1,3,6,12].includes(schedule.hours))throw Error('同步计划格式异常，未覆盖');
    checkedTimeZone(schedule.timeZone);
    for(const key of ['lastStatus','lastResult'])if(settings[key]!=null&&typeof settings[key]!=='string')throw Error('同步状态格式异常，未覆盖');
    if(settings.retryCount!=null&&(!Number.isInteger(settings.retryCount)||settings.retryCount<0||settings.retryCount>2))throw Error('重试次数异常，未覆盖');
    const recovery=settings.recovery;
    if(recovery!=null&&(!object(recovery)||!['ego','browser'].includes(recovery.provider)||!Number.isSafeInteger(recovery.spaceId)||recovery.spaceId<=0||typeof recovery.url!=='string'||profileURL(platform,recovery.url)!==recovery.url))throw Error('账号恢复入口异常，未覆盖');
    for(const key of ['nextRunAt','lastAttemptAt'])if(settings[key]!=null&&!validAt(settings[key]))throw Error('同步计划时间异常，未覆盖');
  }
}
export function migrateState(value,timeZone=systemTimeZone()) {
  validateState(value);
  if(value.version===2)return structuredClone(value);
  const state={...structuredClone(value),...emptyState(timeZone),accounts:structuredClone(value.accounts)};
  for(const [platform,account] of Object.entries(state.accounts)) {
    account.platform=platform;
    let daily=[];
    const samples=account.history.length?account.history:[{at:account.syncedAt,...Object.fromEntries(METRICS.map(key=>[key,account[key]??null]))}];
    for(const sample of samples)daily=mergeDaily(daily,dailyPoint(sample,timeZone));
    account.daily=daily;
  }
  validateState(state);return state;
}
const sameIdentity=(a,b)=>a.url===b.url&&String(a.accountId||'')===String(b.accountId||'');
export function applySnapshot(input,platform,snapshot) {
  if(!PLATFORMS.includes(platform))throw Error('不支持的平台');
  const state=input.version===1?migrateState(input):input;
  let previous=state.accounts[platform];
  if(previous?.url&&(previous.url!==snapshot.url || (previous.accountId && snapshot.accountId!==previous.accountId)))throw Error('绑定账号已改变，拒绝覆盖；请先解除绑定再添加新账号');
  const archiveIndex=previous?-1:state.archives.findIndex(account=>account.platform===platform&&sameIdentity(account,snapshot));
  if(archiveIndex>=0)previous=state.archives[archiveIndex];
  validateSample({at:snapshot.syncedAt,...Object.fromEntries(METRICS.map(key=>[key,snapshot[key]??null]))});
  const sample={at:snapshot.syncedAt,...Object.fromEntries(METRICS.map(key=>[key,structuredClone(snapshot[key]??null)]))};
  const history=[...(previous?.history||[]),sample].slice(-90);
  const daily=mergeDaily(previous?.daily||[],dailyPoint(sample,platformSettings(state,platform).schedule.timeZone));
  const account={...structuredClone(snapshot),platform,history,daily};
  validateAccount(platform,account,2);
  return {...state,archives:state.archives.filter((_,index)=>index!==archiveIndex),accounts:{...state.accounts,[platform]:account}};
}
export function unbindAccount(state,platform) {
  if(!PLATFORMS.includes(platform))throw Error('不支持的平台');
  const account=state.accounts[platform];
  const accounts={...state.accounts};delete accounts[platform];
  const settings=platformSettings(state,platform);
  return {...state,accounts,archives:account?[...state.archives,{...structuredClone(account),archivedAt:new Date().toISOString()}]:[...state.archives],settings:{...state.settings,platforms:{...state.settings.platforms,[platform]:{...settings,schedule:{...settings.schedule,enabled:false},nextRunAt:null,pausedReason:null,lastAttemptAt:null,lastResult:null,recovery:null,lastStatus:null,retryCount:0}}}};
}
