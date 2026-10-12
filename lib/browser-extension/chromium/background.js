(()=>{
const metric=(key,label,description)=>({key,label,description});
const fans=metric('fans','粉丝','平台个人主页显示的粉丝数量');
const following=metric('following','关注','平台个人主页显示的关注数量');
const likes=metric('likes','获赞','平台个人主页显示的累计获赞');
const PLATFORM_DEFINITIONS = [
  {id:'xiaohongshu',label:'小红书',color:'#e54659',metrics:[fans,following,likes,metric('workCount','笔记','主页显示的笔记数量')],hosts:['www.xiaohongshu.com'],profilePattern:/^\/user\/profile\/[a-fA-F0-9]{24}\/?$/,workHosts:['www.xiaohongshu.com'],workPattern:/^\/(?:explore\/[a-f0-9]{24}|user\/profile\/[a-f0-9]{24}\/[a-f0-9]{24})\/?$/},
  {id:'douyin',label:'抖音',color:'#292731',metrics:[fans,following,likes,metric('workCount','作品','主页显示的作品总数')],hosts:['www.douyin.com'],profilePattern:/^\/user\/[A-Za-z0-9_-]{3,160}\/?$/,workHosts:['www.douyin.com'],workPattern:/^\/video\/\d+\/?$/},
  {id:'bilibili',label:'哔哩哔哩',color:'#379ac3',metrics:[fans,following,likes,metric('workCount','投稿','主页显示的投稿总数；与已加载列表范围可能不同')],hosts:['space.bilibili.com'],profilePattern:/^\/[1-9][0-9]{0,19}\/?$/,workHosts:['www.bilibili.com'],workPattern:/^\/(?:video\/BV[A-Za-z0-9]+|read\/cv\d+|opus\/\d+|audio\/au\d+)\/?$/},
  {id:'x',label:'X',color:'#252525',metrics:[fans,following,metric('workCount','帖子','主页显示的帖子数，可能包含回复与转帖；不等于已加载本人帖子数')],hosts:['x.com','twitter.com'],profilePattern:/^\/[A-Za-z0-9_]{1,15}\/?$/,workHosts:['x.com','twitter.com'],workPattern:/^\/[A-Za-z0-9_]{1,15}\/status\/\d+\/?$/}
];
const PLATFORM_BY_ID=Object.fromEntries(PLATFORM_DEFINITIONS.map(p=>[p.id,p]));
const PLATFORMS=PLATFORM_DEFINITIONS.map(p=>p.id);
const LABELS=Object.fromEntries(PLATFORM_DEFINITIONS.map(p=>[p.id,p.label]));
const X_RESERVED_HANDLES=new Set(['home','explore','search','notifications','messages','i','settings','login','logout','signup','compose','intent','share','privacy','tos','account','accounts','help','about','download','jobs','hashtag','communities','connect_people']);
function isPlatformPageURL(platform,value) {
  try {
    const u=new URL(value),path=u.pathname;
    if(u.protocol!=='https:'||u.port||u.username||u.password)return false;
    if(platform==='bilibili')return (u.hostname==='www.bilibili.com'&&path==='/')||(u.hostname==='space.bilibili.com'&&/^\/[1-9][0-9]{0,19}(?:\/upload(?:\/(?:video|opus|audio))?)?\/?$/.test(path));
    const definition=PLATFORM_BY_ID[platform];if(!definition?.hosts.includes(u.hostname))return false;
    if(platform==='xiaohongshu')return /^\/explore\/?$/.test(path)||definition.profilePattern.test(path);
    if(platform==='douyin')return /^\/user\/[A-Za-z0-9_-]+\/?$/.test(path);
    if(platform==='x')return ['/home','/i/flow/login','/account/access'].includes(path.replace(/\/$/,''))||(definition.profilePattern.test(path)&&!X_RESERVED_HANDLES.has(path.replace(/^\/|\/$/g,'').toLowerCase()));
    return false;
  }catch{return false;}
}

// All page functions are self-contained and inspect only visible official-page DOM.
function readWorkWindow({platform,category}) {
  const visible=e=>!!e&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
  const text=e=>e?.innerText?.trim()||'';
  const any=s=>[...document.querySelectorAll(s)].some(visible);
  if(any('[class*="captcha"],[id*="captcha"],iframe[src*="captcha"]'))return {gate:'needs_attention'};
  if(any('.login-container,.login-panel,.bili-mini-login,[data-e2e="login-panel"],[data-testid="loginButton"]')||/\/i\/flow\/login/.test(location.pathname))return {gate:'needs_login'};
  const roots={x:'[data-testid="primaryColumn"]',xiaohongshu:'.feeds-container',douyin:'[data-e2e="user-post-list"]',bilibili:'.upload-content .'+category};
  const root=document.querySelector(roots[platform])||(platform==='xiaohongshu'?document.querySelector('.note-item')?.parentElement:null);
  if(!root)return {works:[],identity:null,loading:true};
  let identity=location.origin+location.pathname;
  if(platform==='bilibili')identity='https://space.bilibili.com/'+location.pathname.split('/')[1];
  if(platform==='x'){const handle=text(document.querySelector('[data-testid="UserName"]')).match(/@([A-Za-z0-9_]+)/)?.[1]||location.pathname.split('/')[1];identity='https://x.com/'+(handle||'').toLowerCase();}
  const selector={x:'article[data-testid="tweet"]',xiaohongshu:'.note-item',douyin:'a[href*="/video/"]',bilibili:'a[href]'}[platform];
  const works=[],seen=new Set();
  for(const e of root.querySelectorAll(selector)){
    if(!visible(e))continue;
    if(platform==='x'&&/reposted|retweeted|转帖|转发|轉推|轉發/i.test(text(e.querySelector('[data-testid="socialContext"]'))))continue;
    const a=platform==='x'?e.querySelector('time')?.closest('a'):platform==='xiaohongshu'?e.querySelector('a[href*="/explore/"],a[href*="xsec_token"]'):e;
    let u;try{u=new URL(a?.href);}catch{continue;}
    if(u.protocol!=='https:'||u.port||u.username||u.password)continue;
    const patterns={x:/^\/([A-Za-z0-9_]+)\/status\/\d+\/?$/,douyin:/^\/video\/\d+\/?$/,xiaohongshu:/^\/(?:explore\/[a-f0-9]+|user\/profile\/[a-f0-9]+\/[a-f0-9]+)\/?$/,bilibili:{video:/^\/video\/BV[A-Za-z0-9]+\/?$/,opus:/^\/(?:opus\/\d+|read\/cv\d+)\/?$/,audio:/^\/audio\/au\d+\/?$/}[category]};
    const hosts={x:['x.com','twitter.com'],douyin:['www.douyin.com'],xiaohongshu:['www.xiaohongshu.com'],bilibili:['www.bilibili.com']};
    if(!hosts[platform].includes(u.hostname)||!patterns[platform]?.test(u.pathname))continue;
    if(platform==='x'&&u.pathname.split('/')[1].toLowerCase()!==identity.split('/').at(-1))continue;
    const url=platform==='xiaohongshu'?u.href:u.origin+u.pathname.replace(/\/$/,'');if(seen.has(url))continue;seen.add(url);
    works.push({url,title:text(e.querySelector('[data-testid="tweetText"],.title'))||a.getAttribute('title')||a.getAttribute('aria-label')||e.querySelector('img')?.alt||text(e),cover:e.querySelector('img')?.src||'',kind:platform==='bilibili'?{video:'视频',opus:'图文',audio:'音频'}[category]:platform==='x'?'帖子':platform==='xiaohongshu'?'笔记':'视频',pinned:/置顶|置頂|pinned/i.test(text(e.querySelector('[data-testid="socialContext"],.top-tag,.pin-tag,[class*="top-tag"]')))});
  }
  const ending=[...root.querySelectorAll('.empty-content,.no-more,.no-more-data,.end-message,[data-testid="emptyState"],[class*="no-more"]')].some(e=>visible(e)&&/没有更多|暂无|还没有|全部加载|到底了|no more|nothing to see|hasn.t posted/i.test(text(e)));
  const pagination=document.querySelector('.vui_pagenation,.be-pager,.pagination');
  const next= pagination&&[...pagination.querySelectorAll('button,a')].find(e=>visible(e)&&/下一页|next|›|»/i.test(text(e)||e.getAttribute('aria-label')||''));
  const disabled=next&&(next.disabled||next.getAttribute('aria-disabled')==='true'||/disabled/.test(next.className));
  const currentText=text(pagination?.querySelector('[aria-current="page"],.active,.is-active,.be-pager-item-active'));
  const current=/^\d+$/.test(currentText)?Number(currentText):null;
  const numbered=pagination?[...pagination.querySelectorAll('button,a,.be-pager-item')].filter(visible).map(e=>text(e)).filter(t=>/^\d+$/.test(t)).map(Number):[];
  const totalText=text(pagination).match(/(?:共\s*)(\d+)\s*页|(?:of|\/)\s*(\d+)\s*(?:pages?)?/i);
  const total=totalText?Number(totalText[1]||totalText[2]):null;
  const confirmedLast=!!disabled&&current!==null&&total!==null&&current===total;
  return {works,identity,end:ending||confirmedLast,next:!!next&&!disabled,loading:!works.length&&!ending&&!confirmedLast,paginationBusy:!!disabled&&!confirmedLast,pageIdentity:current,numbered};
}
function advanceWorkWindow({platform}) {
  if(platform==='bilibili'){
    const root=document.querySelector('.vui_pagenation,.be-pager,.pagination');
    const next=root&&[...root.querySelectorAll('button,a')].find(e=>e.getBoundingClientRect().width&&/下一页|next|›|»/i.test(e.innerText||e.getAttribute('aria-label')||''));
    if(!next||next.disabled||next.getAttribute('aria-disabled')==='true'||/disabled/.test(next.className))return false;
    next.click();return true;
  }
  const root=document.querySelector('[data-e2e="user-post-list"],.feeds-container,[data-testid="primaryColumn"]');
  let container=root;while(container&&container!==document.body){const style=getComputedStyle(container);if(/auto|scroll/.test(style.overflowY)&&container.scrollHeight>container.clientHeight+10){const before=container.scrollTop;container.scrollBy(0,Math.max(400,container.clientHeight*.8));return {moved:container.scrollTop!==before,bottom:container.scrollTop+container.clientHeight>=container.scrollHeight-4};}container=container.parentElement;}
  const before=window.scrollY;window.scrollBy(0,Math.max(400,window.innerHeight*.8));return {moved:window.scrollY!==before,bottom:window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-4};
}
async function traverseWorks({page,platform,collection,onBatch},metadata){
  if(typeof onBatch!=='function')throw Error('Collection requires onBatch');
  const mode=collection.mode==='incremental'?'incremental':'history';
  const deadline=Date.now()+Math.min(90000,Math.max(1,collection.budgetMs??90000));
  const categories=platform==='bilibili'?['video','opus','audio']:['posts'];
  const canonical=value=>{try{const u=new URL(value);return (platform==='x'?'https://x.com':u.origin)+u.pathname.replace(/\/$/,'').toLowerCase();}catch{return null;}};
  const saved=collection.checkpoint;
  const resume=mode==='history'&&saved?.platform===platform&&canonical(saved?.accountURL)===canonical(metadata.url)?saved:null;
  let scanned=resume?.scanned||0,window=0,pageNumber=1,category=categories[0],knownWindows=0,last='',replayTarget=null;
  const seen=new Set();
  const scanScope=platform==='x'?'累计扫描本人主页已加载帖子（可能含回复与置顶），排除他人转帖和推荐内容；主页总数不等于此列表长度。':platform==='bilibili'?'累计扫描本人视频、图文及音频投稿分类；排除收藏和推荐，各分类仅在明确末尾或精确数量证据下确认完整。':platform==='douyin'?'累计扫描本人作品标签视频；不采集喜欢、收藏、历史或私密作品标签。':'累计扫描本人主页笔记，可能含自己可见内容；不采集收藏或点赞。';
  const checkpoint=()=>replayTarget?{...replayTarget,scanned}:({version:1,platform,accountURL:metadata.url,category,page:pageNumber,window,scanned});
  const emit=async(works,status,reason)=>onBatch({...metadata,scope:scanScope,works,collectionProgress:{mode,status,reason,checkpoint:status==='complete'?null:checkpoint(),scanned}});
  const finish=async(status,reason)=>{await emit([],status,reason);if(['needs_login','needs_attention','account_mismatch'].includes(reason))throw Object.assign(Error(reason),{status:reason});return {...metadata,scope:scanScope,works:[],collectionProgress:{mode,status,reason,checkpoint:status==='complete'?null:checkpoint(),scanned}};};
  const signature=state=>(state.works||[]).filter(w=>!w.pinned).map(w=>w.url).join('|');
  let categorySeen=new Set();
  const read=async()=>{
    const state=await page.evaluate(readWorkWindow,{platform,category});
    if(platform==='bilibili'&&!invalid(state)){
      const pattern={video:/^https:\/\/www\.bilibili\.com\/video\/BV[A-Za-z0-9]+\/?$/,opus:/^https:\/\/www\.bilibili\.com\/(?:opus\/\d+|read\/cv\d+)\/?$/,audio:/^https:\/\/www\.bilibili\.com\/audio\/au\d+\/?$/}[category];
      for(const work of state.works||[])if(pattern?.test(work.url)&&(!work.kind||work.kind==={video:'视频',opus:'图文',audio:'音频'}[category]))categorySeen.add(work.url.replace(/\/$/,''));
    }
    return state;
  };
  const invalid=state=>state.gate||(state.identity&&canonical(state.identity)!==canonical(metadata.url)?'account_mismatch':null);
  // Poll the destination without issuing another action. A loading button or unchanged
  // DOM is never a confirmed page transition or a terminal condition.
  const advance=async before=>{
    let movement=await page.evaluate(advanceWorkWindow,{platform});
    if(!movement)return {paused:'no_pagination_evidence'};
    let lastScroll=Date.now();
    const transitionDeadline=Math.min(deadline,Date.now()+10000);
    while(Date.now()<transitionDeadline){
      await new Promise(r=>setTimeout(r,100));
      const state=await read(),gate=invalid(state);if(gate)return {paused:gate};
      const changed=signature(state)&&signature(state)!==signature(before);
      if(!state.loading&&(changed||state.end&&!before.end)){
        window++;pageNumber=state.pageIdentity??pageNumber+1;return {state};
      }
      // Ordinary feeds retain their DOM while scrolling through loaded cards.
      // Read after every step; only continue movement when the preceding step
      // moved and has not reached bottom, avoiding skips in virtualized feeds.
      if(platform!=='bilibili'&&movement?.moved&&!movement.bottom&&Date.now()-lastScroll>=300){
        movement=await page.evaluate(advanceWorkWindow,{platform});lastScroll=Date.now();
      }
    }
    return {paused:Date.now()>=deadline?'budget':'no_progress'};
  };
  for(let ci=resume?Math.max(0,categories.indexOf(resume.category)):0;ci<categories.length;ci++){
    category=categories[ci];categorySeen=new Set();window=0;pageNumber=1;last='';knownWindows=0;
    if(Date.now()>=deadline)return finish('paused','budget');
    if(platform==='bilibili'&&metadata.coverage?.[category]?.total==='0')continue;
    if(platform==='bilibili')await page.goto(metadata.url+'/upload/'+category);
    let state=await read();let gate=invalid(state);if(gate)return finish('paused',gate);
    const hydrationDeadline=Math.min(deadline,Date.now()+10000);
    while(state.loading&&Date.now()<hydrationDeadline){
      await new Promise(r=>setTimeout(r,100));state=await read();gate=invalid(state);if(gate)return finish('paused',gate);
    }
    if(state.loading)return finish('paused',Date.now()>=deadline?'budget':'category_not_ready');
    const replay=resume&&category===resume.category?(platform==='bilibili'?(resume.page||1)-1:resume.window||0):0;
    replayTarget=replay?resume:null;
    for(let i=0;i<replay;i++){
      if(Date.now()>=deadline)return finish('paused','budget');
      const result=await advance(state);if(result.paused)return finish('paused',result.paused);state=result.state;
    }
    replayTarget=null;
    while(Date.now()<deadline){
      gate=invalid(state);if(gate)return finish('paused',gate);
      const items=state.works||[],fingerprint=signature(state),fresh=items.filter(w=>!seen.has(w.url));
      fresh.forEach(w=>seen.add(w.url));scanned+=fresh.length;
      let allKnown=true,normalCount=0;
      for(const group of [fresh.filter(w=>w.pinned),fresh.filter(w=>!w.pinned)])for(let offset=0;offset<group.length;offset+=100){
        const chunk=group.slice(offset,offset+100),ack=await emit(chunk.map(({pinned,...w})=>w),'running','reading');
        if(!chunk[0].pinned){normalCount+=chunk.length;allKnown=allKnown&&ack?.known===true;}
      }
      if(fingerprint&&fingerprint!==last&&normalCount)knownWindows=allKnown?knownWindows+1:0;
      const totalText=metadata.coverage?.[category]?.total;
      const exactTotal=platform==='bilibili'&&typeof totalText==='string'&&/^\d+(?:,\d{3})*$/.test(totalText)?Number(totalText.replace(/,/g,'')):null;
      if(exactTotal!==null&&categorySeen.size>exactTotal)return finish('paused','category_count_mismatch');
      const countedEnd=exactTotal!==null&&categorySeen.size===exactTotal;
      const boundary=mode==='incremental'&&knownWindows>=2;
      if(boundary&&platform!=='bilibili')return finish('incremental','known_boundary');
      if(state.end||countedEnd||boundary)break;
      last=fingerprint;
      const result=await advance(state);if(result.paused)return finish('paused',result.paused);state=result.state;
    }
    if(Date.now()>=deadline)return finish('paused','budget');
  }
  return finish(mode==='history'?'complete':'incremental',mode==='history'?'visible_end':'categories_scanned');
}

// Read-only DOM extraction. No private APIs, cookies, password fields or page state stores.
const COLLECTION_MESSAGES={
  needs_login:'请在浏览器中登录当前平台，再继续同步。',
  needs_attention:'请在浏览器中完成验证或交回操作权，再继续同步。',
  parse_error:'未能识别账号页面，请检查主页或更新适配器。',
  network_error:'页面加载失败或超时，请稍后重试。',
  connection_offline:'浏览器连接不可用，请检查连接后重试。',
  account_mismatch:'当前账号与绑定账号不一致，已保留原有数据。'
};
function collectionError(status){return Object.assign(Error(COLLECTION_MESSAGES[status]||COLLECTION_MESSAGES.parse_error),{status});}
// Serialized into the visible page by either browser connector. Never inspect cookies or page stores.
function readPageGate(){
  const visible=e=>!!e&&!!e.getBoundingClientRect().width&&!!e.getBoundingClientRect().height;
  const any=s=>[...document.querySelectorAll(s)].some(visible);
  if(any('[class*="captcha"],[id*="captcha"],iframe[src*="captcha"]')||/\/account\/access(?:\/|$)/.test(typeof location==='undefined'?'':location.pathname))return 'needs_attention';
  const selectors=['.login-container','.login-panel','.bili-mini-login','.login-scan-wp','.header-login-entry','.login-btn','[data-e2e="login-title"]','[data-e2e="login-panel"]','[data-e2e="top-login-button"]','[data-testid="loginButton"]','input[autocomplete="username"]'];
  if(selectors.some(any)||/\/i\/flow\/login(?:\/|$)/.test(typeof location==='undefined'?'':location.pathname))return 'needs_login';
  if(any('[data-testid="error-detail"]')||/ERR_(?:INTERNET_DISCONNECTED|CONNECTION|NAME_NOT_RESOLVED)|无法访问此网站|This site can’t be reached/.test(document.body?.innerText||''))return 'network_error';
  return 'parse_error';
}
async function classifyCollectionError(error,page){
  if(COLLECTION_MESSAGES[error?.status]&&error.status!=='parse_error'&&error.status!=='network_error')return error.status;
  if(error?.executionStopped||/ownership|user.{0,30}control|inactive|not.active|unassigned|take.?over|taken.over|stopped.by.user/i.test(String(error?.code||'')+' '+String(error?.message||'')))return 'needs_attention';
  if(page){try{const gate=await page.evaluate(readPageGate);if(gate&&gate!=='parse_error')return gate;}catch{}}
  if(error?.status==='network_error')return 'network_error';
  if(/ECONN|ENOTFOUND|ERR_CONNECTION|ERR_INTERNET|net::|navigation.*timeout|页面加载超时/i.test(String(error?.code||'')+' '+String(error?.message||'')))return 'network_error';
  return 'parse_error';
}
async function collect(options){
  try{const started=Date.now(),raw=await collectVisible(options);return options.collection?await traverseWorks({...options,collection:{...options.collection,budgetMs:Math.max(1,Math.min(90000,options.collection.budgetMs??90000)-(Date.now()-started))}},raw):raw;}catch(error){throw collectionError(await classifyCollectionError(error,options.page));}
}
async function collectVisible({task,page,platform,url=''}) {
  if(platform==='x') {
    await page.goto(url||'https://x.com/home');
    await page.waitForFunction(()=>!!document.querySelector('a[data-testid="AppTabBar_Profile_Link"]'),undefined,{timeout:18000});
    const target=await page.evaluate(()=>document.querySelector('a[data-testid="AppTabBar_Profile_Link"]')?.href);
    const profile=value=>{try{const u=new URL(value),handle=u.pathname.replace(/^\/|\/$/g,'').toLowerCase();return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&PLATFORM_BY_ID.x.hosts.includes(u.hostname)&&PLATFORM_BY_ID.x.profilePattern.test(u.pathname)&&!X_RESERVED_HANDLES.has(handle)?'https://x.com/'+handle:'';}catch{return '';}};
    const ownURL=profile(target);
    if(!ownURL)throw collectionError('parse_error');
    if(url&&profile(url)!==ownURL)throw collectionError('account_mismatch');
    await page.goto(ownURL);
    await page.waitForFunction(()=>!!document.querySelector('[data-testid="UserName"]'),undefined,{timeout:18000});
    const raw=await page.evaluate(()=>{
      const root=document.querySelector('[data-testid="primaryColumn"]');
      if(!root)return null;
      const visible=e=>!!e&&!!e.getBoundingClientRect().width&&!!e.getBoundingClientRect().height;
      const text=e=>e?.innerText?.trim()||'';
      const profileText=text(root.querySelector('[data-testid="UserName"]'));
      const handle=profileText.match(/(?:^|\s)@([A-Za-z0-9_]{1,15})(?:\s|$)/)?.[1]?.toLowerCase();
      if(!handle)return null;
      const links=[...root.querySelectorAll('a[href]')].filter(visible);
      const count=value=>value.match(/[0-9][0-9,]*(?:\.[0-9]+)?\s*(?:万|亿|[kKmMbB])?\+?/)?.[0]?.replace(/\s+/g,'')??null;
      const metric=paths=>{const link=links.find(a=>{try{const u=new URL(a.href);return ['x.com','twitter.com'].includes(u.hostname)&&paths.some(path=>u.pathname.toLowerCase()==='/'+handle+'/'+path);}catch{return false;}});return count(text(link));};
      const heading=root.querySelector('h2');
      const headerText=text(heading?.parentElement?.parentElement);
      const total=headerText.match(/([0-9][0-9,.]*\s*(?:万|亿|[kKmMbB])?\+?)\s*(?:posts?|帖子|贴文|則貼文|条帖子|则帖子)/i)?.[1]?.replace(/\s+/g,'')??null;
      const works=[],seen=new Set();
      for(const article of root.querySelectorAll('article[data-testid="tweet"]')){
        if(!visible(article))continue;
        if(/reposted|retweeted|转帖|转发|轉推|轉發/i.test(text(article.querySelector('[data-testid="socialContext"]'))))continue;
        const anchor=article.querySelector('time')?.closest('a');
        let link;try{link=new URL(anchor?.href);}catch{continue;}
        const post=link.pathname.match(/^\/([A-Za-z0-9_]{1,15})\/status\/([0-9]+)\/?$/);
        if(link.protocol!=='https:'||link.port||link.username||link.password||!['x.com','twitter.com'].includes(link.hostname)||!post||post[1].toLowerCase()!==handle||seen.has(post[2]))continue;
        seen.add(post[2]);
        works.push({url:'https://x.com/'+handle+'/status/'+post[2],title:text(article.querySelector('[data-testid="tweetText"]'))||'帖子',cover:article.querySelector('[data-testid="tweetPhoto"] img')?.src||'',kind:'帖子'});
      }
      return {url:'https://x.com/'+handle,accountId:'@'+handle,name:profileText.split('\n')[0].trim(),avatar:root.querySelector('[data-testid^="UserAvatar-Container-"] img')?.src||'',bio:text(root.querySelector('[data-testid="UserDescription"]')),fans:metric(['verified_followers','followers']),following:metric(['following']),likes:null,workCount:total,works,worksStatus:total==='0'?'empty':works.length?'partial':'unavailable',scope:'仅当前已加载的本人帖子（可能含回复与置顶），排除他人转帖和推荐内容；主页帖子总数口径可能包含回复与转帖，不等于此列表长度。'};
    });
    if(!raw)throw collectionError('parse_error');
    if(raw.url!==ownURL)throw collectionError('account_mismatch');
    return raw;
  }
  if(platform==='xiaohongshu') {
    await page.goto(url||'https://www.xiaohongshu.com/explore');
    if(!url) {
      await page.waitForFunction(()=>!!document.querySelector('li.user a[href*="/user/profile/"]'),undefined,{timeout:18000});
      const target=await page.evaluate(()=>document.querySelector('li.user a[href*="/user/profile/"]')?.href);
      if(!/^https:\/\/www\.xiaohongshu\.com\/user\/profile\/[a-f0-9]{24}(?:\?|$)/.test(target||''))throw Error('请在小红书完成登录');
      await page.goto(target);
    }
    await page.waitForFunction(()=>!!document.querySelector('.user-name')&&document.querySelector('.user-interactions')?.innerText.includes('粉丝'),undefined,{timeout:18000});
    return await page.evaluate(()=>{
      const txt=s=>document.querySelector(s)?.innerText?.trim()||'';
      const stats=txt('.user-interactions').split(/\s+/);
      const value=label=>{const i=stats.indexOf(label);return i>0?stats[i-1]:null;};
      const visible=e=>!!e.getBoundingClientRect().width&&!!e.getBoundingClientRect().height;
      const works=[...document.querySelectorAll('.note-item')].filter(visible).map(e=>({url:e.querySelector('a[href*="/user/profile/"][href*="xsec_token"],a[href*="/explore/"]')?.href,title:e.querySelector('.title')?.innerText||e.querySelector('img')?.alt||'',cover:e.querySelector('img')?.src,kind:e.innerText.includes('仅自己可见')?'私密笔记':'笔记'}));
      return {url:location.origin+location.pathname,name:txt('.user-name'),avatar:document.querySelector('.user-image')?.src,bio:txt('.user-desc'),accountId:txt('.user-redId'),fans:value('粉丝'),following:value('关注'),likes:value('获赞与收藏'),workCount:null,works,worksStatus:works.length?'partial':'unavailable',scope:'仅个人主页当前已加载的笔记；可能含自己可见内容。不采集收藏/点赞，平台未提供笔记总数。'};
    });
  }
  if(platform==='douyin') {
    await page.goto(url||'https://www.douyin.com/user/self');
    await page.waitForFunction(()=>/粉丝\s*[0-9]/.test(document.querySelector('[data-e2e="user-info-fans"]')?.innerText||'')&&!!document.querySelector('[data-e2e="user-post-list"]'),undefined,{timeout:18000});
    return await page.evaluate(()=>{
      const root=document.querySelector('[data-e2e="user-info"]');
      const text=root.innerText;
      const metric=label=>text.match(new RegExp(label+'\\s*([0-9.,万亿kKwWmM+]+)'))?.[1]??null;
      const visible=e=>!!e.getBoundingClientRect().width&&!!e.getBoundingClientRect().height;
      const works=[...document.querySelectorAll('[data-e2e="user-post-list"] a[href*="/video/"]')].filter(visible).map(e=>({url:e.href,title:e.getAttribute('aria-label')||e.innerText||e.querySelector('img')?.alt||'',cover:e.querySelector('img')?.src,kind:'视频'}));
      const tab=[...document.querySelectorAll('[role="tab"]')].find(e=>/^作品\s*\d/.test(e.innerText));
      const count=tab?.innerText.match(/作品\s*([0-9.万亿]+)/)?.[1]??null;
      return {url:location.origin+location.pathname,name:root.querySelector('h1')?.innerText||'',avatar:root.parentElement.querySelector('img')?.src,bio:'',accountId:text.match(/抖音号：\s*([^\s]+)/)?.[1]||'',fans:metric('粉丝'),following:metric('关注'),likes:metric('获赞'),workCount:count,works,worksStatus:count==='0'?'empty':works.length?'partial':'unavailable',scope:'仅作品标签当前已加载的视频，不采集喜欢、收藏、历史或私密作品标签。'};
    });
  }
  if(platform==='bilibili') {
    // Resolve the signed-in header identity even when a bound URL was supplied.
    await page.goto('https://www.bilibili.com');
    await page.waitForFunction(()=>!!document.querySelector('.header-avatar-wrap a[href*="space.bilibili.com/"]'),undefined,{timeout:18000});
    const own=await page.evaluate(()=>document.querySelector('.header-avatar-wrap a[href*="space.bilibili.com/"]')?.href);
    const identity=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.port&&!u.username&&!u.password&&u.hostname==='space.bilibili.com'&&/^\/[1-9][0-9]{0,19}\/?$/.test(u.pathname)?u.pathname.split('/')[1]:null;}catch{return null;}};
    const id=identity(own);
    if(!id)throw collectionError('parse_error');
    if(url&&identity(url)!==id)throw collectionError('account_mismatch');
    const base='https://space.bilibili.com/'+id;
    await page.goto(base+'/upload');
    await page.waitForFunction(()=>!!document.querySelector('.nickname')&&document.querySelector('.nav-statistics')?.innerText.includes('粉丝数'),undefined,{timeout:18000});
    const raw=await page.evaluate(()=>{
      const text=document.querySelector('.nav-statistics')?.innerText||'';
      const metric=label=>text.match(new RegExp(label+'\\s*([0-9.,万亿kKwWmM+]+)'))?.[1]??null;
      const upload=[...document.querySelectorAll('a')].find(e=>/\/upload$/.test(e.pathname));
      const totals={};
      for(const item of document.querySelectorAll('.upload-sidenav .side-nav__item')){
        const kind={'视频':'video','图文':'opus','音频':'audio'}[item.querySelector('.side-nav__item__main-text')?.innerText?.trim()];
        if(kind)totals[kind]=item.querySelector('.side-nav__item__sub-text')?.innerText?.trim()??null;
      }
      return {url:location.origin+'/'+location.pathname.split('/')[1],name:document.querySelector('.nickname')?.innerText||'',avatar:document.querySelector('.upinfo-avatar img')?.src,bio:document.querySelector('input[placeholder="编辑个性签名"]')?.value||'',accountId:location.pathname.split('/')[1],fans:metric('粉丝数'),following:metric('关注数'),likes:metric('获赞数'),workCount:upload?.innerText.match(/投稿\s*([0-9.,万亿]+)/)?.[1]??null,totals};
    });
    if(raw.accountId!==id)throw collectionError('account_mismatch');
    const coverage={},works=[],labels={video:'视频',opus:'图文',audio:'音频'};
    for(const type of ['video','opus','audio']){
      const total=raw.totals[type]??null;
      coverage[type]={total,loaded:0,status:'unavailable'};
      if(total==='0'){coverage[type].status='empty';continue;}
      try{
        if(type!=='video')await page.goto(base+'/upload/'+type);
        await page.waitForFunction(()=>{
          const type=location.pathname.split('/').at(-1);
          const root=document.querySelector('.upload-content .'+type);
          return !!root&&(!!root.querySelector('.empty-content')||root.querySelectorAll('a[href]').length>0);
        },undefined,{timeout:12000});
        const section=await page.evaluate(()=>{
          const type=location.pathname.split('/').at(-1),root=document.querySelector('.upload-content .'+type);
          if(!root)return null;
          const patterns={video:/^\/video\/BV[A-Za-z0-9]+\/?$/,opus:/^\/(?:opus\/\d+|read\/cv\d+)\/?$/,audio:/^\/audio\/au\d+\/?$/};
          const seen=new Set(),works=[];
          for(const anchor of root.querySelectorAll('a[href]')){
            if(!anchor.getBoundingClientRect().width||!anchor.getBoundingClientRect().height)continue;
            let u;try{u=new URL(anchor.href);}catch{continue;}
            if(u.protocol!=='https:'||u.port||u.username||u.password||u.hostname!=='www.bilibili.com'||!patterns[type]?.test(u.pathname))continue;
            const url=u.origin+u.pathname.replace(/\/$/,'');if(seen.has(url))continue;seen.add(url);
            works.push({url,title:anchor.getAttribute('title')||anchor.querySelector('img')?.alt||anchor.innerText||'',cover:anchor.querySelector('img')?.src||'',kind:{video:'视频',opus:'图文',audio:'音频'}[type]});
          }
          return {accountId:location.pathname.split('/')[1],works};
        });
        if(!section)throw collectionError('parse_error');
        if(section.accountId!==id)throw collectionError('account_mismatch');
        works.push(...section.works);coverage[type].loaded=section.works.length;
        coverage[type].status=section.works.length?'partial':'unavailable';
      }catch(error){
        const reason=await classifyCollectionError(error,page);
        if(['needs_login','needs_attention','account_mismatch'].includes(reason))throw collectionError(reason);
        coverage[type].reason=reason;
      }
    }
    delete raw.totals;
    const summary=Object.entries(coverage).map(([type,c])=>labels[type]+(c.status==='empty'?'：0':c.status==='partial'?'：已加载'+c.loaded+'项':'：未读取'+(c.reason==='network_error'?'（加载失败）':''))).join('；');
    return {...raw,works,coverage,worksStatus:Object.values(coverage).every(c=>c.status==='empty')?'empty':works.length?'partial':'unavailable',scope:summary+'。仅本人投稿分类当前可见内容，不含收藏/推荐；投稿总数与已加载列表独立，不代表全量。'};
  }
  throw Error('不支持的平台');
}

// Shared by Chrome/Edge and Firefox; only official, explicitly supported page routes.
function isPlatformURL(platform,value){return isPlatformPageURL(platform,value);}
function validJob(job){return !!job&&/^[a-f0-9]{64}$/.test(job.id)&&PLATFORMS.includes(job.platform)&&typeof job.url==='string'&&(!job.url||isPlatformURL(job.platform,job.url))&&(job.collection===undefined||(job.protocol===2&&['history','incremental'].includes(job.collection?.mode)&&JSON.stringify(job.collection).length<8192))&&['automatic','resume'].every(key=>job[key]===undefined||typeof job[key]==='boolean');}
const readLoginGate=readPageGate;
function createPageAdapter(api,tabId,platform,{automatic=false,sleep=ms=>new Promise(r=>setTimeout(r,ms)),now=Date.now}={}){
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

})();
