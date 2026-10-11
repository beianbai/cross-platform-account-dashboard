const metric=(key,label,description)=>({key,label,description});
const fans=metric('fans','粉丝','平台个人主页显示的粉丝数量');
const following=metric('following','关注','平台个人主页显示的关注数量');
const likes=metric('likes','获赞','平台个人主页显示的累计获赞');
export const PLATFORM_DEFINITIONS = [
  {id:'xiaohongshu',label:'小红书',color:'#e54659',metrics:[fans,following,likes,metric('workCount','笔记','主页显示的笔记数量')],hosts:['www.xiaohongshu.com'],profilePattern:/^\/user\/profile\/[a-fA-F0-9]{24}\/?$/,workHosts:['www.xiaohongshu.com'],workPattern:/^\/(?:explore\/[a-f0-9]{24}|user\/profile\/[a-f0-9]{24}\/[a-f0-9]{24})\/?$/},
  {id:'douyin',label:'抖音',color:'#292731',metrics:[fans,following,likes,metric('workCount','作品','主页显示的作品总数')],hosts:['www.douyin.com'],profilePattern:/^\/user\/[A-Za-z0-9_-]{3,160}\/?$/,workHosts:['www.douyin.com'],workPattern:/^\/video\/\d+\/?$/},
  {id:'bilibili',label:'哔哩哔哩',color:'#379ac3',metrics:[fans,following,likes,metric('workCount','投稿','主页显示的投稿总数；与已加载列表范围可能不同')],hosts:['space.bilibili.com'],profilePattern:/^\/[1-9][0-9]{0,19}\/?$/,workHosts:['www.bilibili.com'],workPattern:/^\/(?:video\/BV[A-Za-z0-9]+|read\/cv\d+|opus\/\d+|audio\/au\d+)\/?$/},
  {id:'x',label:'X',color:'#252525',metrics:[fans,following,metric('workCount','帖子','主页显示的帖子数，可能包含回复与转帖；不等于已加载本人帖子数')],hosts:['x.com','twitter.com'],profilePattern:/^\/[A-Za-z0-9_]{1,15}\/?$/,workHosts:['x.com','twitter.com'],workPattern:/^\/[A-Za-z0-9_]{1,15}\/status\/\d+\/?$/}
];
export const PLATFORM_BY_ID=Object.fromEntries(PLATFORM_DEFINITIONS.map(p=>[p.id,p]));
export const PLATFORMS=PLATFORM_DEFINITIONS.map(p=>p.id);
export const LABELS=Object.fromEntries(PLATFORM_DEFINITIONS.map(p=>[p.id,p.label]));
export const X_RESERVED_HANDLES=new Set(['home','explore','search','notifications','messages','i','settings','login','logout','signup','compose','intent','share','privacy','tos','account','accounts','help','about','download','jobs','hashtag','communities','connect_people']);
export function isPlatformPageURL(platform,value) {
  try {
    const u=new URL(value),path=u.pathname;
    if(u.protocol!=='https:'||u.port||u.username||u.password)return false;
    if(platform==='bilibili')return (u.hostname==='www.bilibili.com'&&path==='/')||(u.hostname==='space.bilibili.com'&&/^\/[1-9][0-9]{0,19}(?:\/upload(?:\/(?:video|opus|audio))?)?\/?$/.test(path));
    const definition=PLATFORM_BY_ID[platform];if(!definition?.hosts.includes(u.hostname))return false;
    if(platform==='xiaohongshu')return /^\/explore\/?$/.test(path)||definition.profilePattern.test(path);
    if(platform==='douyin')return /^\/user\/[A-Za-z0-9_-]+\/?$/.test(path);
    if(platform==='x')return ['/home','/i/flow/login','/account/access'].includes(path.replace(/\/$/,''))||(definition.profilePattern.test(path)&&!X_RESERVED_HANDLES.has(path.replace(/^\/|\/$/g,'').toLowerCase()));
    return false;
  }catch{return false;}
}
