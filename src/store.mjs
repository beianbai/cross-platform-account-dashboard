import {readFile,mkdir,open,rename,unlink,lstat} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {emptyState,migrateState,validateState} from './core.mjs';
export async function loadState(root,timeZone) {
  let value,original;
  try {original=await readFile(join(root,'accounts.json'),'utf8');value=JSON.parse(original);}
  catch(e){if(e.code==='ENOENT')return emptyState(timeZone);throw Error('本地数据无法读取，已停止写入以保护原文件');}
  // Validate the full input before touching either the original or its backup.
  const migrated=migrateState(value,timeZone);
  if(value.version===1) {
    let backup;
    try {backup=await open(join(root,'accounts.v1.backup.json'),'wx',0o600);await backup.writeFile(original);await backup.sync();}
    catch(error) {
      if(error.code==='EEXIST') {
        if(!(await lstat(join(root,'accounts.v1.backup.json'))).isFile())throw Error('迁移备份路径不是普通文件，原账号数据已保留');
      } else {
        if(backup){await backup.close();backup=null;await unlink(join(root,'accounts.v1.backup.json'));}
        throw Error('迁移备份无法写入，原账号数据已保留',{cause:error});
      }
    }
    finally {await backup?.close();}
  }
  if(JSON.stringify(value)!==JSON.stringify(migrated))await saveState(root,migrated);
  return migrated;
}
export async function saveState(root,state) {
  validateState(state);
  if(state.version!==2)throw Error('只能保存新版数据，旧数据须先迁移');
  await mkdir(root,{recursive:true,mode:0o700});
  const target=join(root,'accounts.json'),temp=join(root,`.accounts-${randomUUID()}.tmp`);
  let file;
  try {
    file=await open(temp,'wx',0o600);await file.writeFile(JSON.stringify(state,null,2)+'\n');await file.sync();await file.close();file=null;await rename(temp,target);
  } finally {await file?.close();await unlink(temp).catch(e=>{if(e.code!=='ENOENT')throw e;});}
}
