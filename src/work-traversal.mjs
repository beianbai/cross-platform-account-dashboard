// All page functions are self-contained and inspect only visible official-page DOM.
export function readWorkWindow({platform,category}) {
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
export function advanceWorkWindow({platform}) {
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
export async function traverseWorks({page,platform,collection,onBatch},metadata){
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
