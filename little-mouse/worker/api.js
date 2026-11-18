import{upgradeSettings}from'../public/settings-migration.js';
import{settingsDefaults,validateSettings}from'../public/settings.js';
export const defaults=settingsDefaults;
export const cleanSettings=validateSettings;
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function api(request,env,version){const url=new URL(request.url),path=url.pathname;
 if(path==='/api/version')return json({version});
 if(request.method!=='GET'&&request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'Origin mismatch'},403);
 if(!env.DB)return json({error:'Storage is unavailable'},503);
 if(path==='/api/rooms'&&request.method==='POST'){let settings;try{settings=cleanSettings((await request.json()).settings)}catch{return json({error:'Invalid settings'},400)}const code=Array.from(crypto.getRandomValues(new Uint8Array(8)),b=>b.toString(16).padStart(2,'0')).join('');await env.DB.prepare('INSERT INTO rooms (code,settings,command,telemetry,updated) VALUES (?,?,?,?,?)').bind(code,JSON.stringify({...upgradeSettings(defaults),...settings}),'{}','{}',Date.now()).run();return json({code},201);}
 const match=path.match(/^\/api\/rooms\/([a-f0-9]{16})(?:\/(settings|command|telemetry))?$/);if(!match)return json({error:'Not found'},404);
 const [,code,resource]=match;const room=await env.DB.prepare('SELECT * FROM rooms WHERE code=?').bind(code).first();if(!room)return json({error:'Pairing code not found'},404);
 if(request.method==='GET'&&!resource)return json({settings:{...settingsDefaults,...upgradeSettings(JSON.parse(room.settings))},command:JSON.parse(room.command),telemetry:JSON.parse(room.telemetry),revision:room.revision,updated:room.updated,version});
 if(request.method!=='POST'||!resource)return json({error:'Method not allowed'},405);
 let body;try{const raw=await request.text();if(raw.length>12000)throw Error();body=JSON.parse(raw)}catch{return json({error:'Invalid request'},400)}
 try{if(resource==='settings'){const existing=JSON.parse(room.settings);const patch={...(existing.behaviorVersion===3&&existing.audioVersion===1?{}:upgradeSettings(existing)),...cleanSettings(body)};await env.DB.prepare("UPDATE rooms SET settings=json_patch(settings,?),revision=revision+1,updated=? WHERE code=?").bind(JSON.stringify(patch),Date.now(),code).run();}
 if(resource==='command'){if(!['play','pause','steer','recall','reload'].includes(body.action))throw Error('Invalid command');const command={action:body.action,nonce:crypto.randomUUID(),at:Date.now()};if(body.action==='steer'){if(!Number.isFinite(body.x)||!Number.isFinite(body.y))throw Error('Invalid target');command.x=Math.max(0,Math.min(1,body.x));command.y=Math.max(0,Math.min(1,body.y));}const slot=['play','pause'].includes(body.action)?'playback':body.action;await env.DB.prepare('UPDATE rooms SET command=json_patch(command,?),revision=revision+1,updated=? WHERE code=?').bind(JSON.stringify({[slot]:command}),Date.now(),code).run();}
 if(resource==='telemetry'){const telemetry={at:Date.now(),playing:body.playing===true,catches:Math.max(0,Math.min(1e8,Number(body.catches)||0)),elapsed:Math.max(0,Number(body.elapsed)||0),version,mouse:Array.isArray(body.mouse)?body.mouse.slice(0,8).map(m=>({x:Math.max(0,Math.min(1,Number(m.x)||0)),y:Math.max(0,Math.min(1,Number(m.y)||0)),visible:m.visible===true})):[]};await env.DB.prepare('UPDATE rooms SET telemetry=? WHERE code=?').bind(JSON.stringify(telemetry),code).run();}
 return json({ok:true});}catch(e){return json({error:e.message||'Invalid request'},400)}
}
