import {PLATFORM_BY_ID,X_RESERVED_HANDLES} from './platforms.mjs';
// Read-only DOM extraction. No private APIs, cookies, password fields or page state stores.
export const COLLECTION_MESSAGES={
  needs_login:'请在浏览器中登录当前平台，再继续同步。',
  needs_attention:'请在浏览器中完成验证或交回操作权，再继续同步。',
  parse_error:'未能识别账号页面，请检查主页或更新适配器。',
  network_error:'页面加载失败或超时，请稍后重试。',
  connection_offline:'浏览器连接不可用，请检查连接后重试。',
  account_mismatch:'当前账号与绑定账号不一致，已保留原有数据。'
};
export function collectionError(status){return Object.assign(Error(COLLECTION_MESSAGES[status]||COLLECTION_MESSAGES.parse_error),{status});}
// Serialized into the visible page by either browser connector. Never inspect cookies or page stores.
export function readPageGate(){
  const visible=e=>!!e&&!!e.getBoundingClientRect().width&&!!e.getBoundingClientRect().height;
  const any=s=>[...document.querySelectorAll(s)].some(visible);
  if(any('[class*="captcha"],[id*="captcha"],iframe[src*="captcha"]')||/\/account\/access(?:\/|$)/.test(typeof location==='undefined'?'':location.pathname))return 'needs_attention';
  const selectors=['.login-container','.login-panel','.bili-mini-login','.login-scan-wp','.header-login-entry','.login-btn','[data-e2e="login-title"]','[data-e2e="login-panel"]','[data-e2e="top-login-button"]','[data-testid="loginButton"]','input[autocomplete="username"]'];
  if(selectors.some(any)||/\/i\/flow\/login(?:\/|$)/.test(typeof location==='undefined'?'':location.pathname))return 'needs_login';
  if(any('[data-testid="error-detail"]')||/ERR_(?:INTERNET_DISCONNECTED|CONNECTION|NAME_NOT_RESOLVED)|无法访问此网站|This site can’t be reached/.test(document.body?.innerText||''))return 'network_error';
  return 'parse_error';
}
export async function classifyCollectionError(error,page){
  if(COLLECTION_MESSAGES[error?.status]&&error.status!=='parse_error'&&error.status!=='network_error')return error.status;
  if(error?.executionStopped||/ownership|user.{0,30}control|inactive|not.active|unassigned|take.?over|taken.over|stopped.by.user/i.test(String(error?.code||'')+' '+String(error?.message||'')))return 'needs_attention';
  if(page){try{const gate=await page.evaluate(readPageGate);if(gate&&gate!=='parse_error')return gate;}catch{}}
  if(error?.status==='network_error')return 'network_error';
  if(/ECONN|ENOTFOUND|ERR_CONNECTION|ERR_INTERNET|net::|navigation.*timeout|页面加载超时/i.test(String(error?.code||'')+' '+String(error?.message||'')))return 'network_error';
  return 'parse_error';
}
export async function collect(options){
  try{return await collectVisible(options);}catch(error){throw collectionError(await classifyCollectionError(error,options.page));}
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
