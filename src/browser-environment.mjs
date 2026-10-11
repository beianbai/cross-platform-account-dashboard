import {access,stat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {isAbsolute} from 'node:path';
import {execFile} from 'node:child_process';
export const ENV_MESSAGES={
  missing:'未找到 Ego Lite 自动化命令。可能尚未安装，也可能未完成首次配置或命令路径不同；无需更改系统默认浏览器。',
  not_executable:'已找到配置位置，但它不是可执行命令。请检查 Ego Lite 首次配置、文件权限和命令路径，不必重复安装浏览器。',
  command_available:'已找到 Ego Lite 命令，尚未验证运行连接。首次同步会先检测；这不代表平台已经登录。',
  unavailable:'已找到 Ego Lite 命令，但运行连接失败或超时。请打开 Ego Lite、完成首次配置并检查连接后重试；不必直接重装。',
  ready:'Ego Lite 运行连接检测通过。平台登录与页面验证仍需在读取时检查；不会改变系统默认浏览器。'
};
export function environmentResult(status,executable){return {status,message:ENV_MESSAGES[status],executable,automaticBackground:false,automaticMayOpenWindow:true,automaticNote:'此连接执行计划时可能打开浏览器任务窗口；宿主与浏览器需保持运行。',checkedAt:new Date().toISOString()};}
export async function inspectBrowser(executable){
  if(typeof executable!=='string'||!isAbsolute(executable))return environmentResult('not_executable',String(executable||''));
  try {const info=await stat(executable);if(!info.isFile())return environmentResult('not_executable',executable);await access(executable,constants.X_OK);return environmentResult('command_available',executable);}
  catch(e){return environmentResult(['ENOENT','ENOTDIR'].includes(e.code)?'missing':'not_executable',executable);}
}
export async function checkBrowser(executable,{onChild=()=>{},execute=execFile}={}){
  const found=await inspectBrowser(executable);if(found.status!=='command_available')return found;
  // Probe the documented connection API without creating spaces, opening pages or reading platform data.
  const marker='PERSONAL_SOCIAL_ENV_READY';
  return new Promise(resolve=>{
    const child=execute(executable,['nodejs','-e',`await listTaskSpaces(); console.log(${JSON.stringify(marker)});`],{encoding:'utf8',timeout:12000,maxBuffer:64*1024,windowsHide:true},(error,stdout='',stderr='')=>{
      const ok=!error&&(stdout+'\n'+stderr).split(/\r?\n/).some(line=>line.trim()===marker);
      const status=ok?'ready':error?.code==='ENOENT'?'missing':['EACCES','EPERM'].includes(error?.code)?'not_executable':'unavailable';
      resolve(environmentResult(status,executable));
    });child.stdin?.end();onChild(child);
  });
}
