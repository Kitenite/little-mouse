// Asset updates only. Gameplay and settings remain on the play device.
export async function api(request,_env,version){
 const path=new URL(request.url).pathname;
 if(path==='/api/version'&&request.method==='GET')return Response.json({version},{headers:{'Cache-Control':'no-store'}});
 return Response.json({error:'Not found'},{status:404});
}
