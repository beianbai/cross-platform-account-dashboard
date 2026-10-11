import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {collect} from '../src/collector.mjs';
import {PLATFORM_BY_ID,isPlatformPageURL} from '../src/platforms.mjs';
import {createPageAdapter} from '../extension/adapter.mjs';

test('Bilibili permits observed upload redirects and bounded content routes only',()=>{
 for(const suffix of ['/upload/video','/upload/opus','/upload/audio'])assert(isPlatformPageURL('bilibili','https://space.bilibili.com/123'+suffix));
 for(const suffix of ['/favlist','/dynamic','/upload/anything'])assert.equal(isPlatformPageURL('bilibili','https://space.bilibili.com/123'+suffix),false);
 assert(PLATFORM_BY_ID.bilibili.workPattern.test('/audio/au12345'));
});
test('Bilibili navigation accepts a ready DOM while late resources remain loading',async()=>{
 let time=0;const updates=[];
 const api={tabs:{update:async(id,change)=>updates.push(change),get:async()=>({url:'https://space.bilibili.com/123/upload/video',status:'loading'})},scripting:{executeScript:async({func})=>[{result:vm.runInNewContext('('+func.toString()+')()',{document:{readyState:'interactive',body:{innerText:'投稿'}},location:new URL('https://space.bilibili.com/123/upload/video')})}]}};
 const page=createPageAdapter(api,1,'bilibili',{automatic:true,now:()=>time,sleep:async ms=>time+=ms});
 await page.goto('https://space.bilibili.com/123/upload');assert(time<12000);assert.equal(updates[0].active,false);
});
const node=(innerText='',extra={})=>({innerText,getBoundingClientRect:()=>({width:100,height:20}),querySelector:()=>null,querySelectorAll:()=>[],getAttribute:()=>null,...extra});
function fixture({counts=['2','3','1'],missing='',otherOwner=false,fail=''}={}){
 let url='https://www.bilibili.com/';const visited=[];
 const entries=[['视频','video','https://www.bilibili.com/video/BVabc1'],['图文','opus','https://www.bilibili.com/opus/123'],['音频','audio','https://www.bilibili.com/audio/au123']];
 const sidebar=entries.map(([label],i)=>node(label+'\n'+counts[i],{querySelector:s=>s.includes('main-text')?node(label):s.includes('sub-text')?node(counts[i]):null}));
 const document={body:node(),querySelector(selector){
  if(selector.includes('.header-avatar-wrap'))return node('',{href:'https://space.bilibili.com/'+(otherOwner?'456':'123')});
  if(selector==='.nickname')return node('测试作者');if(selector==='.nav-statistics')return node('粉丝数 7 关注数 71 获赞数 4');
  if(selector==='.upload-sidenav')return node('',{querySelectorAll:()=>sidebar});
  const type=url.split('/').at(-1),entry=entries.find(e=>e[1]===type);
  if(selector==='.upload-content')return missing===type?null:node('',{querySelector:s=>s==='.'+type?this.querySelector('.upload-content .'+type):null});
  if(selector==='.upload-content .'+type&&entry&&missing!==type){const anchor=node('本人'+entry[0],{href:entry[2],getAttribute:key=>key==='title'?'本人'+entry[0]:null});return node('',{querySelector:s=>s==='.empty-content'&&counts[entries.indexOf(entry)]==='0'?node('暂无'):null,querySelectorAll:s=>s==='a[href]'?[anchor,anchor,node('恶意',{href:'https://evil.test/video/BVbad'}),node('其他类型',{href:'https://www.bilibili.com/video/BVwrong'})]:[]});}
  return null;
 },querySelectorAll(selector){if(selector==='.upload-sidenav .side-nav__item')return sidebar;if(selector==='a')return [node('投稿 6',{pathname:'/123/upload'})];return [];}};
 const evaluate=async fn=>vm.runInNewContext('('+fn.toString()+')()',{document,location:new URL(url),URL});
 return {visited,page:{async goto(target){url=target.endsWith('/upload')?target+'/video':target;visited.push(url);if(url.endsWith('/'+fail))throw Object.assign(Error('failed'),{status:'network_error'});},evaluate,async waitForFunction(fn){if(!await evaluate(fn))throw Error('selector not ready');}}};
}
test('Bilibili reads only own bounded video, opus and audio containers and keeps independent total',async()=>{
 const f=fixture();const raw=await collect({page:f.page,platform:'bilibili'});
 assert.equal(raw.workCount,'6');assert.equal(raw.works.length,4);assert.deepEqual(raw.works.map(w=>w.kind).sort(),['图文','视频','视频','音频'].sort());
 assert(!raw.works.some(w=>w.url.includes('evil')));assert.equal(raw.coverage.audio.status,'partial');assert.equal(raw.coverage.video.total,'2');assert.equal(raw.coverage.opus.loaded,1);assert.match(raw.scope,/图文/);
});
test('Bilibili unavailable subtype is not claimed empty; explicit zero remains empty',async()=>{
 const raw=await collect({page:fixture({counts:['0','3','0'],missing:'opus'}).page,platform:'bilibili'});
 assert.equal(raw.coverage.video.status,'empty');assert.equal(raw.coverage.opus.status,'unavailable');assert.equal(raw.coverage.audio.status,'empty');assert.equal(raw.worksStatus,'unavailable');assert.match(raw.scope,/图文.*未读取/);
});
test('Bilibili never collects another profile as the signed-in user',async()=>{
 await assert.rejects(collect({page:fixture({otherOwner:true}).page,platform:'bilibili',url:'https://space.bilibili.com/123'}),e=>e.status==='account_mismatch');
});
test('Bilibili partial category failure preserves successful categories with a precise reason',async()=>{
 const raw=await collect({page:fixture({fail:'audio'}).page,platform:'bilibili'});assert.equal(raw.coverage.audio.status,'unavailable');assert.equal(raw.coverage.audio.reason,'network_error');assert(raw.works.length>0);
});

test('navigation does not mistake the previous allowed document for the destination',async()=>{
 let time=0,reads=0;const api={tabs:{update:async()=>{},get:async()=>({url:++reads<3?'https://www.bilibili.com/':'https://space.bilibili.com/123/upload/video',status:'complete'})}};
 const page=createPageAdapter(api,1,'bilibili',{now:()=>time,sleep:async ms=>time+=ms});await page.goto('https://space.bilibili.com/123/upload');assert(reads>=3);
});
