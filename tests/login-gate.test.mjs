import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readPageGate,collect} from '../src/collector.mjs';
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
 const s=part.trim();if(s.includes(' '))return false;
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
 return vm.runInNewContext('('+readPageGate.toString()+')()',{document,location:new URL(url),getComputedStyle:n=>({display:'block',visibility:'visible',opacity:'1',...n.style})});
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
 for(const node of [loginModal({style:{visibility:'hidden'}}),loginModal({style:{display:'none'}}),loginModal({attrs:{role:'dialog','aria-hidden':'true'}}),loginModal({parentElement:element('div','',{style:{visibility:'hidden'}})})])assert.equal(runGate({nodes:[node]}),'parse_error');
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
function adapterFixture({platform='douyin',nodesAt=()=>[],redirect='',readyAt=0,status='complete',body=''}={}){
 let clock=0,url='about:blank',injections=0;
 const api={tabs:{update:async(_id,change)=>{url=redirect||change.url;},get:async()=>({url,status})},scripting:{executeScript:async({func,args=[]})=>{
  injections++;const document=documentFor(nodesAt(clock,injections),body);document.readyState=clock>=readyAt?'complete':'loading';
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
 for(const options of [{style:{visibility:'hidden'}},{style:{opacity:'0'}},{attrs:{'aria-hidden':'true'}},{parentElement:element('div','',{attrs:{hidden:true}})}])assert.equal(runGate({nodes:[element('div','扫码登录',{classes:['login-panel'],...options})]}),'parse_error');
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
