import {readFile,readdir,stat} from 'node:fs/promises';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),p=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
assert.match(p.version,/^\d+\.\d+\.\d+$/);assert.equal(p.main,p.exports['.']);assert.equal(p.dsh.bundle.patch,'./cordis.patch.yml');assert.equal(p.dsh.client.platform,'web');assert(p.dsh.client.inject.includes('dsh-desktop-workbenches'));
for(const path of [p.main,p.exports['./client'],p.dsh.bundle.patch])assert((await stat(new URL(path,root))).isFile());
const patch=await readFile(new URL('cordis.patch.yml',root),'utf8');assert(patch.includes('name: '+p.name));assert(patch.startsWith('- insert:'));
const source=await readFile(new URL(p.exports['./client'],root),'utf8');let registration;
new vm.Script(source).runInNewContext({window:{__ModuleLoader__:{load(v){registration=v;}}}});
assert.equal(registration.id,p.name);const client=registration.factory(()=>({createElement(){}}));let entry;
client.apply(new Proxy({effect:fn=>fn(),desktopWorkbenches:{register(value,panel){entry=value;assert.equal(typeof panel,'function');return ()=>{};}}},{get(target,key){assert(key in target,`Client requested an undeclared host service: ${String(key)}`);return target[key];}}));
assert.match(entry.screenshot,/^data:image\/png;base64,iVBOR/);assert.equal(entry.repository,p.repository.url);assert(!('id'in entry));assert.equal(entry.customFrame,true);
const server=await import(new URL(p.main,root));assert.equal(typeof server.apply,'function');assert(server.Config);assert(server.inject.includes('connection'));
assert(!p.scripts.postinstall&&!p.scripts.preinstall);assert.equal(p.private,true);
const safari=JSON.parse(await readFile(new URL('lib/safari-connector.json',root),'utf8'));
assert.equal(safari.version,p.version,'Safari download version must match the workbench');
assert.deepEqual(safari.architectures,['arm64','x86_64']);
const digest=data=>createHash('sha256').update(data).digest('hex');
assert.equal(digest(await readFile(new URL('lib/safari-connector.zip',root))),safari.sha256,'Safari download archive changed');
assert.equal(digest(await readFile(new URL('extension/SAFARI-INSTALL.txt',root))),safari.instructionsSha256,'Safari install instructions changed; repackage the app');
assert.deepEqual(Object.keys(safari.resources).sort(),(await readdir(new URL('lib/browser-extension/safari',root))).sort(),'Safari resource set changed; rebuild the app');
for(const [name,hash] of Object.entries(safari.resources)){
 assert(/^[a-zA-Z0-9_.-]+$/.test(name));
 assert.equal(digest(await readFile(new URL('lib/browser-extension/safari/'+name,root))),hash,'Safari download is stale; rebuild and package the app');
}
console.log('PASS: manifest, patch, server Config, single-file client, repository identity, lifecycle safety.');
