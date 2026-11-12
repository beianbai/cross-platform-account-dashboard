// Maintainer-only packaging. Users receive an application, never an Xcode project.
import {readFile,readdir,mkdtemp,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';
import {tmpdir,homedir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const app=process.argv[2]&&resolve(process.argv[2]);
if(process.platform!=='darwin'||!app?.endsWith('.app'))throw Error('用法：node scripts/package-safari.mjs <Release 通用 .app 路径>（需 macOS）');
function run(command,args){const result=spawnSync(command,args,{encoding:'utf8'});if(result.error||result.status!==0)throw Error(result.stderr||result.error?.message||'Safari 打包校验失败');return result.stdout.trim();}
const info=path=>JSON.parse(run('/usr/bin/plutil',['-convert','json','-o','-',join(path,'Contents/Info.plist')]));
const version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const extensions=(await readdir(join(app,'Contents/PlugIns'))).filter(n=>n.endsWith('.appex'));
if(extensions.length!==1)throw Error('应用必须且只能包含一个 Safari 扩展');
const extension=join(app,'Contents/PlugIns',extensions[0]);
for(const [bundle,id] of [[app,'com.beianbai.accountdashboard'],[extension,'com.beianbai.accountdashboard.Extension']]){
 const metadata=info(bundle);
 if(metadata.CFBundleIdentifier!==id||metadata.CFBundleShortVersionString!==version)throw Error('应用身份或版本与工作台不一致');
 const architectures=run('/usr/bin/lipo',['-archs',join(bundle,'Contents/MacOS',metadata.CFBundleExecutable)]).split(/\s+/);
 if(!['arm64','x86_64'].every(a=>architectures.includes(a)))throw Error('下载包必须包含 Intel 和 Apple 芯片两种架构');
}
const resources={};
for(const name of (await readdir(join(root,'lib/browser-extension/safari'))).sort()){
 const source=await readFile(join(root,'lib/browser-extension/safari',name));
 if(!source.equals(await readFile(join(extension,'Contents/Resources',name))))throw Error('Safari 应用资源过期，请重新构建');
 resources[name]=createHash('sha256').update(source).digest('hex');
}
async function inspect(directory){for(const entry of await readdir(directory,{withFileTypes:true})){
 const path=join(directory,entry.name);
 if(entry.isSymbolicLink())throw Error('下载应用不应含有指向外部文件的链接');
 if(/\.dSYM$|\.xcodeproj$|\.swift$/.test(entry.name))throw Error('下载应用含有开发文件');
 if(entry.isDirectory())await inspect(path);
 else if((await readFile(path)).includes(Buffer.from(homedir()+'/')))throw Error('下载应用含有本机私人路径，请去除调试符号后重新构建');
}}
await inspect(app);
run('/usr/bin/codesign',['--verify','--deep','--strict',app]);
const stage=await mkdtemp(join(tmpdir(),'psw-safari-package-'));
const output=join(root,'lib/safari-connector.zip'),pending=join(stage,'download.zip');
try{
 const folder=join(stage,'Account-Dashboard-Safari');await mkdir(folder);
 run('/usr/bin/ditto',[app,join(folder,'Account Dashboard Safari.app')]);
 const instructions=await readFile(join(root,'extension/SAFARI-INSTALL.txt'));
 await writeFile(join(folder,'INSTALL.txt'),instructions);
 run('/usr/bin/ditto',['-c','-k','--sequesterRsrc','--keepParent',folder,pending]);
 // Move the fully validated result into place; no partially written download.
 const {copyFile}=await import('node:fs/promises');
 await copyFile(pending,output+'.tmp');await rename(output+'.tmp',output);
 const sha256=createHash('sha256').update(await readFile(output)).digest('hex');
 await writeFile(join(root,'lib/safari-connector.json'),JSON.stringify({version,sha256,architectures:['arm64','x86_64'],instructionsSha256:createHash('sha256').update(instructions).digest('hex'),resources},null,2)+'\n');
 console.log('已生成 Safari 应用下载包（ad-hoc 签名，无开发者证书、未公证）：',output);
}finally{await rm(stage,{recursive:true,force:true});}
