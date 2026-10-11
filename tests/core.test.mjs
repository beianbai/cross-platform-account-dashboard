import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,stat,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {profileURL,parseCount,safeWorkURL,normalizeSnapshot,applySnapshot,emptyState} from '../src/core.mjs';
import {loadState,saveState} from '../src/store.mjs';
const sample=()=>({url:'https://www.douyin.com/user/self',name:'我的昵称',accountId:'test-account',fans:'0',following:'12',workCount:'0',works:[],worksStatus:'empty'});
test('count parser distinguishes zero, missing, invalid and approximate',()=>{
  assert.equal(parseCount('0').value,0);assert.equal(parseCount('1.2万').value,12000);assert.equal(parseCount('1.2万').approximate,true);assert.equal(parseCount('2,100').value,2100);
  for(const v of ['',null,'未知','-1','NaN','Infinity','12人'])assert.equal(parseCount(v),null);
});
test('profile URL canonicalization prevents cross-platform and local requests',()=>{
  assert.equal(profileURL('bilibili','https://space.bilibili.com/123?from=x'),'https://space.bilibili.com/123');
  for(const u of ['http://127.0.0.1','https://space.bilibili.com.evil/123','https://user:pass@space.bilibili.com/123','https://space.bilibili.com:4430/123','file:///etc/passwd','https://www.douyin.com/user/self','https://space.bilibili.com/123/video'])assert.throws(()=>profileURL('bilibili',u));
  assert.throws(()=>profileURL('unknown',''));assert.equal(profileURL('douyin',''),'');
});
test('work links reject script, spoofed hosts and unrelated page paths',()=>{
  assert.equal(safeWorkURL('bilibili','javascript:alert(1)'),'');assert.equal(safeWorkURL('douyin','https://www.douyin.com.evil/video/123'),'');
  assert.equal(safeWorkURL('bilibili','https://www.bilibili.com/video/BV123?token=secret'),'https://www.bilibili.com/video/BV123');
});
test('snapshot validates identity, keeps zero, missing total and deduplicates',()=>{
  const raw=sample();raw.workCount='1';raw.works=[{url:'https://www.douyin.com/video/123',title:'真实作品'},{url:'https://www.douyin.com/video/123?from=a'}, {url:'https://evil.test/video/123'}];
  const a=normalizeSnapshot('douyin',raw,raw.url);assert.equal(a.fans.value,0);assert.equal(a.works.length,1);
  assert.throws(()=>normalizeSnapshot('douyin',raw,'https://www.douyin.com/user/other'));
  assert.throws(()=>normalizeSnapshot('douyin',{...raw,fans:null,following:null}));
  assert.throws(()=>normalizeSnapshot('douyin',{...raw,accountId:''}));
});
test('changed login never silently overwrites previous personal account',()=>{
  const a=normalizeSnapshot('douyin',sample());const s=applySnapshot(emptyState(),'douyin',a);
  assert.throws(()=>applySnapshot(s,'douyin',{...a,accountId:'someone-else'}));
  assert.equal(s.accounts.douyin.accountId,'test-account');
  let next=s;for(let i=0;i<100;i++)next=applySnapshot(next,'douyin',a);assert.equal(next.accounts.douyin.history.length,90);
});
test('atomic persistence and corrupt-file fail closed',async()=>{
  const root=await mkdtemp(join(tmpdir(),'personal-social-test-'));assert.deepEqual(await loadState(root),emptyState());
  const state=applySnapshot(emptyState(),'douyin',normalizeSnapshot('douyin',sample()));await saveState(root,state);assert.deepEqual(await loadState(root),state);
  assert.equal((await stat(join(root,'accounts.json'))).mode&0o777,0o600);
  await writeFile(join(root,'accounts.json'),'broken');await assert.rejects(loadState(root));assert.equal(await readFile(join(root,'accounts.json'),'utf8'),'broken');
});
test('X accepts exact profile hosts, canonicalizes handle identity, and rejects routes and spoofing',()=>{
  assert.equal(profileURL('x','https://twitter.com/Alice_123?lang=en'),'https://x.com/alice_123');
  for(const url of ['https://x.com/home','https://x.com/i','https://x.com/search','https://x.com/alice/status/123','https://x.com.evil/alice','https://x.com/alice/with_replies','https://x.com/too_long_handle_here'])assert.throws(()=>profileURL('x',url));
  assert.equal(safeWorkURL('x','https://twitter.com/Alice/status/123?s=20'),'https://x.com/alice/status/123');
  assert.equal(safeWorkURL('x','https://x.com/alice/likes'),'');
});
test('X snapshot filters other authors and does not infer post totals from loaded list',()=>{
  const a=normalizeSnapshot('x',{url:'https://x.com/alice',name:'Alice',fans:'1.2K',following:'0',likes:'120',works:[{url:'https://x.com/alice/status/123'},{url:'https://x.com/bob/status/123'}]});
  assert.equal(a.works.length,1);assert.equal(a.workCount,null);assert.equal(a.likes,null);assert.equal(a.fans.approximate,true);
});
test('shared page gate admits only official profile and login inspection pages',async()=>{
  const {isPlatformPageURL}=await import('../src/platforms.mjs');
  for(const [platform,url] of [['x','https://x.com/home'],['x','https://twitter.com/alice'],['x','https://x.com/i/flow/login'],['x','https://x.com/account/access'],['bilibili','https://www.bilibili.com/'],['bilibili','https://space.bilibili.com/123/upload'],['xiaohongshu','https://www.xiaohongshu.com/explore']])assert.equal(isPlatformPageURL(platform,url),true,url);
  for(const [platform,url] of [['x','https://x.com/intent/post'],['x','https://x.com/settings'],['x','https://x.com/alice/status/123'],['douyin','https://www.douyin.com/video/1'],['x','https://x.com.evil/alice'],['bilibili','https://www.bilibili.com/video/BV123']])assert.equal(isPlatformPageURL(platform,url),false,url);
});
test('Bilibili coverage preserves per-kind totals without leaking arbitrary collector fields',()=>{
 const raw={url:'https://space.bilibili.com/123',accountId:'123',name:'投稿者',fans:'2',following:'3',workCount:'3',works:[{url:'https://www.bilibili.com/opus/12345',kind:'图文'},{url:'https://www.bilibili.com/audio/au123',kind:'音频'}],coverage:{video:{total:'0',loaded:0,status:'empty'},opus:{total:'2',loaded:99,status:'partial',cookie:'secret'},audio:{total:null,loaded:1,status:'unavailable',reason:'network_error'},other:{token:'secret'}}};
 const a=normalizeSnapshot('bilibili',raw);assert.equal(a.works.length,2);assert.deepEqual(a.coverage.video,{total:{value:0,display:'0',approximate:false},loaded:0,status:'empty'});assert.equal(a.coverage.opus.loaded,1);assert.equal(a.coverage.opus.cookie,undefined);assert.equal(a.coverage.other,undefined);assert.equal(a.coverage.audio.reason,'network_error');assert.equal(a.coverage.audio.total,null);
});

test('work collection exposes truncation without changing platform totals or trusting supplied metadata',()=>{
  const works=Array.from({length:205},(_,i)=>({url:'https://www.douyin.com/video/'+(1000+i)}));
  const account=normalizeSnapshot('douyin',{...sample(),workCount:'999',works,workCollection:{limit:9999,truncated:false}});
  assert.equal(account.works.length,200);
  assert.equal(account.workCount.value,999);
  assert.deepEqual(account.workCollection,{limit:200,received:205,retained:200,truncated:true});
  const exact=normalizeSnapshot('douyin',{...sample(),workCount:'200',works:works.slice(0,200)});
  assert.equal(exact.workCollection.truncated,false);
});
test('work collection counts retained valid unique works and does not imply complete history',()=>{
  const account=normalizeSnapshot('douyin',{...sample(),workCount:'300',works:[{url:'https://www.douyin.com/video/1'},{url:'https://www.douyin.com/video/1'},{url:'https://evil.test/video/2'}]});
  assert.deepEqual(account.workCollection,{limit:200,received:3,retained:1,truncated:false});
  const state=applySnapshot(emptyState(),'douyin',account);
  const next=normalizeSnapshot('douyin',{...sample(),workCount:'300',works:[{url:'https://www.douyin.com/video/2'}]});
  const updated=applySnapshot(state,'douyin',next);
  assert.equal(updated.accounts.douyin.works.length,1);
  assert.equal(updated.accounts.douyin.works[0].url,'https://www.douyin.com/video/2');
});
test('optional collection metadata survives save/reload while legacy records remain accepted',async()=>{
  const root=await mkdtemp(join(tmpdir(),'social-collection-test-'));
  const account=normalizeSnapshot('douyin',sample());
  const state=applySnapshot(emptyState(),'douyin',account);
  await saveState(root,state);assert.deepEqual((await loadState(root)).accounts.douyin.workCollection,{limit:200,received:0,retained:0,truncated:false});
  const legacy=structuredClone(state);delete legacy.accounts.douyin.workCollection;
  await saveState(root,legacy);assert.equal((await loadState(root)).accounts.douyin.workCollection,undefined);
  const corrupted=structuredClone(state);corrupted.accounts.douyin.workCollection={limit:200,received:0,retained:2,truncated:false};
  await assert.rejects(saveState(root,corrupted),/作品读取范围/);
  assert.equal((await loadState(root)).accounts.douyin.workCollection,undefined);
});
