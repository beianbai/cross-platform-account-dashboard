import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readPageGate,collect,readLoginDiagnostics,normalizeLoginDiagnostics} from '../src/collector.mjs';
import {createPageAdapter,isPlatformURL} from '../extension/adapter.mjs';

// Model visible DOM elements, including inherited visibility, without reading input values.
function element(tag='div',text='',{attrs={},classes=[],style={},parentElement=null,width=100,height=20}={}){
 return {tagName:tag.toUpperCase(),innerText:text,attrs,classes,style,parentElement,hidden:!!attrs.hidden,
  getBoundingClientRect:()=>({width:style.display==='none'?0:width,height:style.display==='none'?0:height}),
  getAttribute:key=>attrs[key]??null,
  closest(selector){for(let n=this;n;n=n.parentElement)if(matches(n,selector))return n;return null;},
  querySelector:()=>null,querySelectorAll:()=>[]};
}
function matches(node,selector){return selector.split(',').some(part=>{
 const s=part.trim();const split=s.indexOf(' ');if(split>=0){if(!matches(node,s.slice(split+1)))return false;for(let parent=node.parentElement;parent;parent=parent.parentElement)if(matches(parent,s.slice(0,split)))return true;return false;}
 const unqualified=s.replace(/\[[^\]]+\]/g,'');
 const tag=unqualified.match(/^[a-z][\w-]*/i)?.[0];if(tag&&node.tagName!==tag.toUpperCase())return false;
 for(const [,name] of unqualified.matchAll(/\.([\w-]+)/g))if(!node.classes.includes(name))return false;
 for(const [,key,op,value] of s.matchAll(/\[([\w-]+)(?:(\*=|=)"([^"]*)")?\]/g)){
  const got=key==='class'?node.classes.join(' '):node.attrs[key];
  if(got===undefined||(op==='='&&got!==value)||(op==='*='&&!String(got).includes(value)))return false;
 }
 return true;
 });}
function documentFor(nodes=[],body=''){
 return {body:element('body',body),readyState:'complete',querySelectorAll:s=>nodes.filter(n=>matches(n,s)),querySelector(s){return this.querySelectorAll(s)[0]??null;}};
}
function runGate({nodes=[],url='https://www.douyin.com/user/self',body=''}={}){
 const document=documentFor(nodes,body);
 return vm.runInNewContext('('+readPageGate.toString()+')()',{document,URL,location:new URL(url),getComputedStyle:n=>({display:'block',visibility:'visible',opacity:'1',...n.style})});
}
const loginModal=(options={})=>element('div','登录后即可观看喜欢、收藏的视频\n扫码登录\n验证码登录\n密码登录',{attrs:{role:'dialog'},...options});
const visibleCaptcha=()=>element('div','请完成验证',{classes:['captcha']});
function classlessModal(parentElement=null){
 const panel=element('div','登录后即可观看喜欢、收藏的视频\n扫码登录\n验证码登录\n密码登录',{style:{position:'fixed',zIndex:'1000'},width:480,height:600,parentElement});
 const labels=['扫码登录','验证码登录','密码登录'].map(text=>element('span',text,{parentElement:panel}));
 panel.querySelectorAll=s=>labels.filter(n=>matches(n,s));return [panel,...labels];
}


test('visible Douyin login modal is a login gate even without platform class names',()=>{
 assert.equal(runGate({nodes:[loginModal()]}),'needs_login');
});
test('visible alternative login methods identify the observed Douyin modal without a dialog role',()=>{
 assert.equal(runGate({nodes:classlessModal()}),'needs_login');
});
test('hidden login markup and ordinary page text do not claim a signed-out session',()=>{
 for(const node of [loginModal({style:{visibility:'hidden'}}),loginModal({style:{display:'none'}}),loginModal({parentElement:element('div','',{style:{visibility:'hidden'}})})])assert.equal(runGate({nodes:[node]}),'parse_error');
 assert.equal(runGate({body:'这篇帖子介绍扫码登录、验证码登录和密码登录。',nodes:[element('article','用户讨论登录功能'),element('button','登录',{classes:['login-btn']})]}),'parse_error');
});
test('captcha has priority over a visible login dialog and hidden captcha is ignored',()=>{
 assert.equal(runGate({nodes:[loginModal(),visibleCaptcha()]}),'needs_attention');
 assert.equal(runGate({nodes:[loginModal(),element('div','',{classes:['captcha'],style:{visibility:'hidden'}})]}),'needs_login');
});
test('signed-in profile does not become a login failure because of a generic login button',()=>{
 assert.equal(runGate({url:'https://x.com/me',nodes:[element('a','个人资料',{attrs:{'data-testid':'AppTabBar_Profile_Link',href:'https://x.com/me'}}),element('button','登录',{classes:['login-btn']})]}),'parse_error');
});
test('X login routes are exact and independent of localized page text',()=>{
 for(const url of ['https://x.com/login?lang=zh-cn','https://twitter.com/i/flow/login?lang=ja']){
  assert.equal(isPlatformURL('x',url),true);assert.equal(runGate({url,body:'アカウントにログイン'}),'needs_login');
 }
 for(const url of ['https://x.com/login/extra','https://x.com/login-lookalike','https://x.com.evil.test/login','https://x.com:8443/login'])assert.equal(isPlatformURL('x',url),false);
 assert.equal(runGate({url:'https://www.douyin.com/user/self',body:'ERR_INTERNET_DISCONNECTED'}),'network_error');
});
function adapterFixture({platform='douyin',nodesAt=()=>[],redirect='',readyAt=0,status='complete',body='',scriptError=null}={}){
 let clock=0,url='about:blank',injections=0;
 const api={tabs:{update:async(_id,change)=>{url=redirect||change.url;},get:async()=>({url,status})},scripting:{executeScript:async({func,args=[]})=>{
  injections++;const failure=typeof scriptError==='function'?scriptError(clock,injections):scriptError;if(failure)throw failure;const document=documentFor(nodesAt(clock,injections),body);document.readyState=clock>=readyAt?'complete':'loading';
  return [{result:vm.runInNewContext('('+func.toString()+')(...args)',{document,location:new URL(url),URL,args,getComputedStyle:n=>({display:'block',visibility:'visible',opacity:'1',...n.style})})}];
 }}};
 return {page:createPageAdapter(api,42,platform,{now:()=>clock,sleep:async ms=>{clock+=ms;}}),elapsed:()=>clock};
}
test('real extension adapter stops navigation on visible login while resources still load',async()=>{
 const f=adapterFixture({nodesAt:()=>[loginModal()],readyAt:30000,status:'loading'});
 await assert.rejects(f.page.goto('https://www.douyin.com/user/self'),e=>e.status==='needs_login');assert(f.elapsed()<1000);
});
test('real extension adapter stops X navigation at a known localized login redirect',async()=>{
 for(const redirect of ['https://x.com/login?lang=zh-cn','https://x.com/i/flow/login?lang=ja']){
  const f=adapterFixture({platform:'x',redirect,body:'登录 X'});
  await assert.rejects(f.page.goto('https://x.com/home'),e=>e.status==='needs_login');assert(f.elapsed()<1000);
 }
});
test('real extension wait stops when a login modal appears after polling starts',async()=>{
 const f=adapterFixture({nodesAt:ms=>ms>=800?[loginModal()]:[]});await f.page.goto('https://www.douyin.com/user/self');
 await assert.rejects(f.page.waitForFunction(()=>!!document.querySelector('[data-e2e="user-info-fans"]'),undefined,{timeout:18000}),e=>e.status==='needs_login');
 assert(f.elapsed()>=800&&f.elapsed()<2000);
});
test('wait checks captcha before accepting otherwise ready profile data',async()=>{
 const f=adapterFixture({nodesAt:ms=>ms>=400?[visibleCaptcha(),element('div','粉丝 3',{attrs:{'data-e2e':'user-info-fans'}})]:[]});await f.page.goto('https://www.douyin.com/user/self');
 await assert.rejects(f.page.waitForFunction(()=>!!document.querySelector('[data-e2e="user-info-fans"]')),e=>e.status==='needs_attention');assert(f.elapsed()<1000);
});
test('normal unknown document still times out as parse_error and incomplete navigation is network_error',async()=>{
 const f=adapterFixture({body:'登录技术文章'});await f.page.goto('https://www.douyin.com/user/self');
 await assert.rejects(f.page.waitForFunction(()=>false,undefined,{timeout:1200}),e=>e.status==='parse_error');assert.equal(f.elapsed(),1200);
 const loading=adapterFixture({status:'loading',readyAt:30000});await assert.rejects(loading.page.goto('https://www.douyin.com/user/self'),e=>e.status==='network_error');assert.equal(loading.elapsed(),12000);
});
test('shared collector checks a newly appeared gate before extracting ready profile data',async()=>{
 let extraction=false,waited=false;
 const page={goto:async()=>{},waitForFunction:async()=>{waited=true;},evaluate:async fn=>{
  if(fn===readPageGate)return waited?'needs_login':'parse_error';
  extraction=true;return {accountId:'invalid',url:'https://www.douyin.com/user/self'};
 }};
 await assert.rejects(collect({page,platform:'douyin'}),e=>e.status==='needs_login');assert.equal(extraction,false);
});

test('collect returns needs_login promptly through the real adapter for both reported signed-out pages',async()=>{
 for(const options of [{platform:'douyin',nodesAt:()=>[loginModal()]},{platform:'x',redirect:'https://x.com/login?lang=zh-cn'}]){
  const f=adapterFixture(options);await assert.rejects(collect({page:f.page,platform:options.platform}),e=>e.status==='needs_login');assert(f.elapsed()<1000);
 }
});
test('real adapter keeps captcha priority at an X login redirect',async()=>{
 const f=adapterFixture({platform:'x',redirect:'https://x.com/i/flow/login',nodesAt:()=>[visibleCaptcha()]});
 await assert.rejects(collect({page:f.page,platform:'x'}),e=>e.status==='needs_attention');assert(f.elapsed()<1000);
});
test('signed-in Douyin still extracts identity and totals with hidden login markup and a generic login button',async()=>{
 const root=element('div','粉丝 3 关注 4 获赞 8 抖音号：fixture-user',{attrs:{'data-e2e':'user-info'},parentElement:element('div')});
 root.querySelector=s=>s==='h1'?element('h1','模拟作者'):null;
 const nodes=[root,element('div','粉丝 3',{attrs:{'data-e2e':'user-info-fans'}}),element('div','',{attrs:{'data-e2e':'user-post-list'}}),element('button','作品 0',{attrs:{role:'tab','aria-selected':'true'}}),element('button','登录',{classes:['login-btn']}),loginModal({style:{visibility:'hidden'}}),element('div','扫码登录',{classes:['login-panel'],style:{visibility:'hidden'}})];
 const f=adapterFixture({nodesAt:()=>nodes});const raw=await collect({page:f.page,platform:'douyin',collection:{mode:'refresh'},onBatch:async()=>({known:false})});
 assert.equal(raw.accountId,'fixture-user');assert.equal(raw.name,'模拟作者');assert.equal(raw.fans,'3');assert.equal(raw.workCount,'0');assert.equal(raw.worksStatus,'empty');assert.equal(f.elapsed(),0);
});
test('hidden generic login panels remain ignored even when they retain layout dimensions',()=>{
 for(const options of [{style:{visibility:'hidden'}},{style:{opacity:'0'}},{parentElement:element('div','',{attrs:{hidden:true}})}])assert.equal(runGate({nodes:[element('div','扫码登录',{classes:['login-panel'],...options})]}),'parse_error');
});
test('real adapter distinguishes a visible page network error from logged-out or unknown data',async()=>{
 const f=adapterFixture({platform:'x',body:'ERR_INTERNET_DISCONNECTED'});
 await assert.rejects(collect({page:f.page,platform:'x'}),e=>e.status==='network_error');assert(f.elapsed()<1000);
});


test('ordinary login-method labels in signed-in X posts do not require login',()=>{
 const profile=element('a','个人资料',{attrs:{'data-testid':'AppTabBar_Profile_Link'}});
 const article=element('article','扫码登录 密码登录');
 const labels=['扫码登录','密码登录'].map(text=>element('span',text,{parentElement:article}));
 assert.equal(runGate({url:'https://x.com/me',nodes:[profile,article,...labels]}),'parse_error');
});
test('classless Douyin modal requires a shared overlay, not unrelated login-method text',()=>{
 assert.equal(runGate({nodes:['扫码登录','密码登录'].map(t=>element('span',t))}),'parse_error');
});
test('Douyin article, post and comment content cannot impersonate a classless login overlay',()=>{
 for(const content of [element('article'),element('div','',{attrs:{'data-e2e':'user-post-list'}}),element('div','',{attrs:{'data-e2e':'comment-item'}})])assert.equal(runGate({nodes:[content,...classlessModal(content)]}),'parse_error');
});


test('signed-out Xiaohongshu and Bilibili retain visible explicit login CTA detection',()=>{
 for(const url of ['https://www.xiaohongshu.com/explore','https://www.bilibili.com/']){
  assert.equal(runGate({url,nodes:[element('button','登录',{classes:['login-btn']})]}),'needs_login');
  assert.equal(runGate({url,nodes:[element('button','查看登录教程',{classes:['login-btn']})]}),'parse_error');
 }
});
test('authenticated Bilibili header suppresses generic login CTA, placeholder header does not',()=>{
 const header=element('div','',{classes:['header-avatar-wrap']});
 for(const [href,expected]of [['https://space.bilibili.com/123','parse_error'],['https://space.bilibili.com/','needs_login']]){
  const profile=element('a','',{attrs:{href},parentElement:header});
  assert.equal(runGate({url:'https://www.bilibili.com/',nodes:[header,profile,element('button','登录',{classes:['login-btn']})]}),expected);
 }
});
test('allowed Xiaohongshu redirect is checked for login before navigation timeout',async()=>{
 const f=adapterFixture({platform:'xiaohongshu',redirect:'https://www.xiaohongshu.com/explore',nodesAt:()=>[element('div','扫码登录',{classes:['login-panel']})]});
 await assert.rejects(f.page.goto('https://www.xiaohongshu.com/user/profile/'+'a'.repeat(24)),e=>e.status==='needs_login');assert(f.elapsed()<1000);
});
test('denied page scripting is reported separately from page data or login on all four platforms',async()=>{
 for(const platform of ['xiaohongshu','douyin','bilibili','x']){
  const f=adapterFixture({platform,scriptError:Error('The extension does not have access to the specified tab.')});
  await assert.rejects(collect({page:f.page,platform}),e=>e.status==='needs_attention'&&e.reason==='page_access_denied');assert(f.elapsed()<1000);
 }
});
test('unknown script rejection retains a safe reason instead of silently hiding the execution failure',async()=>{
 const f=adapterFixture({scriptError:Error('fixture script failure with private details')});
 await assert.rejects(collect({page:f.page,platform:'douyin'}),e=>e.status==='parse_error'&&e.reason==='page_script_error'&&!e.message.includes('private details'));assert(f.elapsed()<1000);
});


test('navigation retries a temporarily unloaded document before reading its login gate',async()=>{
 const f=adapterFixture({status:'complete',scriptError:(_ms,n)=>n<=2?Error('The document was unloaded'):null,nodesAt:()=>[loginModal()]});
 await assert.rejects(f.page.goto('https://www.douyin.com/user/self'),e=>e.status==='needs_login');assert(f.elapsed()>=500&&f.elapsed()<2000);
});

test('Safari-style injection error results preserve permission failure instead of becoming a parse error',async()=>{
 const api={tabs:{get:async()=>({url:'https://www.bilibili.com/',status:'complete'}),update:async()=>{}},scripting:{executeScript:async()=>[{error:{message:'The extension does not have access to the specified tab.'}}]}};
 const page=createPageAdapter(api,1,'bilibili');await assert.rejects(collect({page,platform:'bilibili'}),e=>e.status==='needs_attention'&&e.reason==='page_access_denied');
});
test('a missing gate result is reported as script unavailable, not platform data parsing',async()=>{
 const api={tabs:{get:async()=>({url:'https://www.bilibili.com/',status:'complete'}),update:async()=>{}},scripting:{executeScript:async()=>[{}]}};
 const page=createPageAdapter(api,1,'bilibili');await assert.rejects(collect({page,platform:'bilibili'}),e=>e.status==='parse_error'&&e.reason==='page_script_unavailable');
});


test('ARIA-hidden alone does not hide painted login UI from the collector',()=>{
 const background=element('div','',{attrs:{'aria-hidden':'true'}});
 assert.equal(runGate({nodes:[loginModal({parentElement:background})]}),'needs_login');
});
test('Douyin compact static login form is recognized inside a large page overlay',()=>{
 const overlay=element('div','页面内容'.repeat(600),{style:{position:'fixed'}});
 const panel=element('div','登录后即可观看喜欢、收藏的视频\n扫码登录\n验证码登录\n密码登录\n登录即代表同意 用户协议 和 隐私政策',{parentElement:overlay});
 const labels=['扫码登录','验证码登录','密码登录'].map(t=>element('span',t,{parentElement:panel}));
 const phone=element('input','',{attrs:{placeholder:'请输入手机号'},parentElement:panel});
 panel.querySelectorAll=s=>[...labels,phone].filter(n=>matches(n,s));
 assert.equal(runGate({nodes:[overlay,panel,...labels,phone]}),'needs_login');
});
test('X public signed-out profile recognizes explicit login links outside post content',()=>{
 for(const href of ['/login','/i/flow/login','https://x.com/i/flow/login?lang=zh-cn']){
  const link=element('a','登录',{attrs:{href}});assert.equal(runGate({url:'https://x.com/fixture',nodes:[link]}),'needs_login');
 }
});
test('X login links in posts and login buttons on a verified signed-in profile are not gates',()=>{
 const article=element('article','一篇登录教程'),postLink=element('a','登录',{attrs:{href:'/login'},parentElement:article});
 assert.equal(runGate({url:'https://x.com/fixture',nodes:[article,postLink]}),'parse_error');
 const profile=element('a','个人资料',{attrs:{href:'https://x.com/fixture','data-testid':'AppTabBar_Profile_Link'}});
 assert.equal(runGate({url:'https://x.com/fixture',nodes:[profile,element('a','登录',{attrs:{href:'/login'}})]}),'parse_error');
});


test('X screenshot guest-profile wall requires login without navigating away from the public profile',()=>{
 const panel=element('div','查看 模拟作者 的完整个人资料\n继续前往 X');
 const action=element('button','继续前往 X',{parentElement:panel});
 assert.equal(runGate({url:'https://x.com/fixture',nodes:[panel,action]}),'needs_login');
});
test('X guest-wall words in a post, hidden wall or authenticated profile do not interrupt collection',()=>{
 const article=element('article','一篇教程');
 const panel=element('div','查看 模拟作者 的完整个人资料\n继续前往 X',{parentElement:article});
 const action=element('button','继续前往 X',{parentElement:panel});
 assert.equal(runGate({url:'https://x.com/fixture',nodes:[article,panel,action]}),'parse_error');
 const hidden=element('div','查看 模拟作者 的完整个人资料\n继续前往 X',{style:{display:'none'}});
 assert.equal(runGate({url:'https://x.com/fixture',nodes:[hidden,element('button','继续前往 X',{parentElement:hidden})]}),'parse_error');
 const profile=element('a','个人资料',{attrs:{href:'https://x.com/fixture','data-testid':'AppTabBar_Profile_Link'}});
 const visible=element('div','查看 模拟作者 的完整个人资料\n继续前往 X');
 assert.equal(runGate({url:'https://x.com/fixture',nodes:[profile,visible,element('button','继续前往 X',{parentElement:visible})]}),'parse_error');
});
test('new X login surfaces keep captcha priority and reject external login links',()=>{
 const panel=element('div','查看 模拟作者 的完整个人资料\n继续前往 X');
 assert.equal(runGate({url:'https://x.com/fixture',nodes:[panel,element('button','继续前往 X',{parentElement:panel}),visibleCaptcha()]}),'needs_attention');
 for(const attrs of [{href:'https://evil.test/login'},{href:'/login'}]){
  const link=element('a','登录',{attrs,...(attrs.href==='/login'?{style:{display:'none'}}:{})});
  assert.equal(runGate({url:'https://x.com/fixture',nodes:[link]}),'parse_error');
 }
});

test('extension collector stops promptly on both supplied screenshot login surfaces',async()=>{
 for(const platform of ['douyin','x']){
  let nodes;
  if(platform==='douyin'){
   const outer=element('div','页面内容'.repeat(600),{style:{position:'fixed'}});
   const panel=element('div','登录后即可观看喜欢、收藏的视频\n扫码登录\n验证码登录\n密码登录',{parentElement:outer});
   const children=[...['扫码登录','验证码登录','密码登录'].map(t=>element('span',t,{parentElement:panel})),element('input','',{attrs:{placeholder:'请输入手机号'},parentElement:panel})];
   panel.querySelectorAll=s=>children.filter(n=>matches(n,s));nodes=[outer,panel,...children];
  }else{
   const panel=element('div','查看 模拟作者 的完整个人资料\n继续前往 X');nodes=[panel,element('button','继续前往 X',{parentElement:panel})];
  }
  const f=adapterFixture({platform,nodesAt:()=>nodes});
  await assert.rejects(collect({page:f.page,platform,url:platform==='x'?'https://x.com/fixture':''}),e=>e.status==='needs_login');
  assert(f.elapsed()<1000,'login surface should stop before the data timeout');
 }
});


test('login diagnostics export only bounded counts and flags, never page or input content',()=>{
 const panel=loginModal(),input=element('input','',{attrs:{type:'tel',placeholder:'手机号'}});
 Object.defineProperty(input,'value',{get(){throw Error('must never read input value');}});
 const nodes=[panel,input,element('iframe'),element('span','验证码 登录')];
 const document=documentFor(nodes,'登录后即可观看喜欢、收藏的视频\n扫码登录\n验证码登录\n密码登录\nPRIVATE-ACCOUNT');
 const raw=vm.runInNewContext('('+readLoginDiagnostics.toString()+')()',{document,getComputedStyle:n=>({display:'block',visibility:'visible',opacity:'1',...n.style})});
 const diagnostics=normalizeLoginDiagnostics({version:1,frames:[{...raw,secret:'PRIVATE-ACCOUNT'}],url:'PRIVATE-URL'});
 assert.equal(diagnostics.frames[0].titlePresent,true);
 assert.equal(diagnostics.frames[0].visibleLoginInputs,1);
 assert.equal(diagnostics.frames[0].iframes,1);
 assert.equal(diagnostics.frames[0].methodTextCount,3);
 assert(!JSON.stringify(diagnostics).includes('PRIVATE'));
 assert.equal(normalizeLoginDiagnostics({version:2,frames:[raw]}),undefined);
 assert.equal(normalizeLoginDiagnostics({version:1,frames:[{iframes:-1}]}),undefined);
});

// Reconstruct the proven evidence, without claiming these are captured Safari DOM nodes.
// The real counters: title present, 3 methods, 4 visible labels, 2 inputs, no profile/list.
function evidenceForm({hidden=false,inArticle=false,withProfile=false,title=true,methods=3,inputs=2}={}){
 const texts=['扫码登录','验证码登录','密码登录'].slice(0,methods);
 const content=(title?'登录后即可观看喜欢、收藏的视频\n':'')+texts.join('\n');
 const root=element(inArticle?'article':'main',content,{style:hidden?{display:'none'}:{}});
 const labels=texts.map(t=>element('p',t,{parentElement:root}));
 const fields=Array.from({length:inputs},(_,i)=>element('input','',{attrs:{placeholder:i?'请输入验证码':'请输入手机号'},parentElement:root}));
 const children=[...labels,...fields];root.querySelectorAll=s=>children.filter(n=>matches(n,s));
 const nodes=[root,...children];if(withProfile)nodes.push(element('div','粉丝 1',{attrs:{'data-e2e':'user-info-fans'}}));
 return {nodes,body:content};
}
test('Douyin self-page recognizes proven login evidence independently of label tags and layout wrappers',()=>{
 assert.equal(runGate(evidenceForm()),'needs_login');
});
test('self-page evidence fallback keeps hidden forms, content examples and incomplete evidence unknown',()=>{
 for(const options of [{hidden:true},{withProfile:true},{title:false},{methods:1},{inputs:1}])assert.equal(runGate(evidenceForm(options)),'parse_error',JSON.stringify(options));
 assert.equal(runGate({...evidenceForm(),url:'https://www.douyin.com/user/public_fixture'}),'parse_error');
 const f=evidenceForm();f.nodes.push(visibleCaptcha());assert.equal(runGate(f),'needs_attention');
});
test('real adapter stops on the evidence-only Douyin form before waiting for unavailable profile data',async()=>{
 const f=adapterFixture({nodesAt:()=>evidenceForm().nodes,body:evidenceForm().body});
 await assert.rejects(collect({page:f.page,platform:'douyin'}),e=>e.status==='needs_login');
 assert(f.elapsed()<1000);
});

function combinedMethodForm({separator=' | ',hidden=false,inArticle=false,tabText=null}={}){
 const root=element(inArticle?'article':'div','登录后即可观看喜欢、收藏的视频\n扫码登录\n'+(tabText??['验证码登录','密码登录'].join(separator)),{style:{position:'fixed'}});
 let parent=root;const labels=[];
 for(let i=0;i<4;i++){const n=element('span','扫码登录',{parentElement:parent});labels.push(n);parent=n;}
 const tabs=element('p',tabText??['验证码登录','密码登录'].join(separator),{parentElement:root,style:hidden?{visibility:'hidden'}:{}});
 const fields=[element('input','',{attrs:{placeholder:'手机号'},parentElement:root}),element('input','',{attrs:{placeholder:'验证码'},parentElement:root})];
 const nodes=[root,...labels,tabs,...fields,element('iframe'),element('iframe')];
 root.querySelectorAll=s=>nodes.filter(n=>n!==root&&matches(n,s));
 return {nodes,body:root.innerText};
}
test('combined login tabs reproduce every real Safari diagnostic counter but need not use distinct elements',()=>{
 const f=combinedMethodForm();const document=documentFor(f.nodes,f.body);
 const d=vm.runInNewContext('('+readLoginDiagnostics.toString()+')()',{document,getComputedStyle:n=>({display:'block',visibility:'visible',opacity:'1',...n.style})});
 assert.deepEqual(JSON.parse(JSON.stringify(d)),{titlePresent:true,methodTextCount:3,exactMethodLabels:4,normalizedMethodLabels:4,visibleMethodLabels:4,zeroSizeMethodLabels:0,loginInputs:2,visibleLoginInputs:2,iframes:2,openShadowRoots:0,profileFansPresent:false,postListPresent:false,largeAncestors:0,positionedPanels:1});
 assert.equal(runGate(f),'needs_login');
});
test('compact combined method labels accept platform separators and do not count prose or hidden methods',()=>{
 for(const separator of [' | ','｜',' / ','／',' · ','','\n'])assert.equal(runGate(combinedMethodForm({separator})),'needs_login',separator);
 for(const options of [{hidden:true},{tabText:'介绍验证码登录和密码登录的教程'},{tabText:'扫码登录 | 扫码登录'}])assert.equal(runGate(combinedMethodForm(options)),'parse_error',JSON.stringify(options));
 const f=combinedMethodForm();f.nodes.push(visibleCaptcha());assert.equal(runGate(f),'needs_attention');
});
test('adapter returns a login requirement promptly for the counter-matching combined form',async()=>{
 const data=combinedMethodForm(),f=adapterFixture({nodesAt:()=>data.nodes,body:data.body});
 await assert.rejects(collect({page:f.page,platform:'douyin'}),e=>e.status==='needs_login');assert(f.elapsed()<1000);
});

// Safari console evidence proves the real login form is inside ARTICLE: both visible
// inputs and all three accepted method labels were rejected solely by closest(article).
// Reconstruct that relationship; this fixture is not a captured page DOM.
test('Douyin self login form can use an article container without becoming post content',()=>{
 for(const data of [evidenceForm({inArticle:true}),combinedMethodForm({inArticle:true})]){
  assert.equal(runGate(data),'needs_login');
  data.nodes.push(visibleCaptcha());assert.equal(runGate(data),'needs_attention');
 }
});
test('article login evidence still rejects actual post lists, comments, hidden forms and profile content',()=>{
 for(const options of [{attrs:{'data-e2e':'user-post-list'}},{attrs:{'data-e2e':'comment-item'}},{classes:['comment-body']},{style:{display:'none'}}]){
  const data=evidenceForm({inArticle:true});
  const wrapper=element('div','',options);data.nodes[0].parentElement=wrapper;data.nodes.unshift(wrapper);
  assert.equal(runGate(data),'parse_error',JSON.stringify(options));
 }
 assert.equal(runGate(evidenceForm({inArticle:true,withProfile:true})),'parse_error');
 assert.equal(runGate({...evidenceForm({inArticle:true}),url:'https://www.douyin.com/user/public_fixture'}),'parse_error');
});
test('real adapter stops for the article-wrapped login form before entering profile-data wait',async()=>{
 const data=evidenceForm({inArticle:true});
 for(const input of data.nodes.filter(n=>n.tagName==='INPUT'))Object.defineProperty(input,'value',{get(){throw Error('must not read credentials');}});
 const f=adapterFixture({nodesAt:()=>data.nodes,body:data.body});
 await assert.rejects(collect({page:f.page,platform:'douyin'}),e=>e.status==='needs_login');
 assert.equal(f.elapsed(),0);
});
