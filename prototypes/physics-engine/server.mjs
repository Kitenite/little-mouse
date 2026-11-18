import http from 'node:http';
import {readFile,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../../',import.meta.url));
const allowed=['prototypes/physics-engine/','little-mouse/public/'];
const server=http.createServer(async(req,res)=>{
 try {
  let rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
  if(!rel)rel='prototypes/physics-engine/index.html';
  const file=await realpath(path.resolve(root,rel));const normalized=path.relative(root,file).split(path.sep).join('/');
  if(!allowed.some(p=>normalized.startsWith(p)))throw Error('Not allowed');
  const data=await readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html':/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(Number(process.env.PORT)||4177,'127.0.0.1',()=>console.log(`Physics prototype: http://127.0.0.1:${server.address().port}`));
