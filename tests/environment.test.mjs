import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {inspectBrowser,checkBrowser} from '../src/browser-environment.mjs';

test('missing command is not incorrectly reported as an uninstalled browser',async()=>{
 const result=await checkBrowser('/intentionally-missing-ego-browser',{execute(){throw Error('must not run');}});
 assert.equal(result.status,'missing');assert.match(result.message,/可能.*未完成首次配置/);
});
test('a directory, relative path and nonexecutable file receive configuration guidance',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'social-env-'));const file=join(dir,'command');await writeFile(file,'fixture',{mode:0o600});
 for(const path of [dir,file,'ego-browser'])assert.equal((await inspectBrowser(path)).status,'not_executable');
});
test('passive detection does not claim a live connection',async()=>{
 assert.equal((await inspectBrowser(process.execPath)).status,'command_available');
});
function executeResult(error,stdout='',stderr=''){
 return (executable,args,opts,callback)=>{
  assert.equal(executable,process.execPath);assert.deepEqual(args.slice(0,2),['nodejs','-e']);
  assert.match(args[2],/await listTaskSpaces\(\)/);assert.doesNotMatch(args[2],/taskSpace\(|goto\(|profiles\(/);
  assert.equal(opts.timeout,12000);assert.equal(opts.maxBuffer,65536);assert.equal(opts.shell,undefined);
  queueMicrotask(()=>callback(error,stdout,stderr));return {stdin:{end(){}},kill(){}};
 };
}
test('a live connection marker is required; failure output is never exposed',async()=>{
 for(const [error,out,status] of [[null,'PERSONAL_SOCIAL_ENV_READY\n','ready'],[null,'unrelated','unavailable'],[Object.assign(Error('secret'),{killed:true}),'PERSONAL_SOCIAL_ENV_READY','unavailable'],[Object.assign(Error('secret'),{code:'ENOENT'}),'','missing'],[Object.assign(Error('secret'),{code:'EACCES'}),'','not_executable']]){
  const result=await checkBrowser(process.execPath,{execute:executeResult(error,out)});assert.equal(result.status,status);assert.doesNotMatch(result.message,/secret|unrelated/);
 }
});
