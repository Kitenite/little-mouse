// Neutral body footprint only; runtime callbacks must all come from the evaluated source.
const invalid = reason => ({valid:false, fraction:null, bodyArea:null, visibleArea:null, reason});
const area = polygon => {
 if (polygon.length < 3) return 0;
 const [ox,oy]=polygon[0]; let sum=0;
 for(let i=1;i<polygon.length-1;i++) {
  const a=polygon[i], b=polygon[i+1];
  sum+=(a[0]-ox)*(b[1]-oy)-(a[1]-oy)*(b[0]-ox);
 }
 return Math.abs(sum)/2;
};
function clip(polygon, axis, boundary, sign) {
 const out=[];
 for(let i=0;i<polygon.length;i++) {
  const a=polygon[i], b=polygon[(i+1)%polygon.length];
  const da=sign*(a[axis]-boundary), db=sign*(b[axis]-boundary);
  if(da>=0) out.push(a);
  if((da>=0)!==(db>=0)) {
   const t=da/(da-db), p=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];
   p[axis]=boundary; out.push(p);
  }
 }
 return out;
}
/** Fraction of the entire neutral torso/head footprint inside [0,w] x [0,h].
 * Not rendered-pixel visibility. No state/time gates or default runtime imports.
 * Invalid data returns null fraction, so callers must explicitly handle validity.
 */
export function createBodyVisibility({bodySection, morphologyPoint, physicalTraits}={}) {
 if([bodySection,morphologyPoint,physicalTraits].some(fn=>typeof fn!=='function'))
  throw new TypeError('Inject bodySection, morphologyPoint and physicalTraits from the selected runtime');
 const cache=new Map(); // Bounded; content keys also detect in-place config/identity edits.
 return function bodyVisibility(mouse,config,w,h) {
  if(!mouse?.identity || ![mouse.x,mouse.y,mouse.angle,config?.size,w,h].every(Number.isFinite)
    || config.size<=0 || w<=0 || h<=0) return invalid('invalid pose, identity, size or viewport');
  let key;
  try { key=JSON.stringify([mouse.identity,config],(_k,v)=>{
   if(typeof v==='function'||typeof v==='symbol'||typeof v==='undefined'
     || (typeof v==='number'&&!Number.isFinite(v))
     || (v && typeof v==='object' && !Array.isArray(v) && Object.getPrototypeOf(v)!==Object.prototype))
    throw new TypeError('uncacheable input');
   return v;
  }); } catch { /* Non-JSON inputs are evaluated without caching. */ }
  let footprint=key===undefined?null:cache.get(key);
  if(!footprint) {
  const upper=[],lower=[];
  try {
   const traits=physicalTraits(mouse.identity,config);
   for(let x=-39;x<=51;x++) {
    const s=bodySection(x);
    if(!s || !Number.isFinite(s.r) || s.r<0 || !Number.isFinite(s.z)) return invalid('invalid body profile');
    const a=morphologyPoint(x,s.r,s.z,traits), b=morphologyPoint(x,-s.r,s.z,traits);
    if(!a || !b || ![...a,...b].every(Number.isFinite) || a.length<3 || b.length<3
      || a[0]!==b[0] || a[1]<b[1] || (upper.length && a[0]<=upper.at(-1)[0]))
     return invalid('invalid or unsupported morphology');
    upper.push([a[0],a[1]]); lower.push([b[0],b[1]]);
   }
  } catch { return invalid('runtime profile or traits failed'); }
  const local=upper.concat(lower.reverse());
  footprint={local,localArea:area(local),bounds:[Math.min(...local.map(p=>p[0])),Math.max(...local.map(p=>p[0])),Math.min(...local.map(p=>p[1])),Math.max(...local.map(p=>p[1]))]};
  if(key!==undefined) { if(cache.size>=16) cache.delete(cache.keys().next().value); cache.set(key,footprint); }
  }
  const {local,localArea,bounds}=footprint,size=config.size;
  const bodyArea=localArea*size*size;
  if(!Number.isFinite(bodyArea) || bodyArea<=0) return invalid('degenerate body footprint');
  const c=Math.cos(mouse.angle),s=Math.sin(mouse.angle);
  const transform=([x,y])=>[size*(x*c+y*s),size*(x*s-y*c)];
  const corners=[[bounds[0],bounds[2]],[bounds[0],bounds[3]],[bounds[1],bounds[2]],[bounds[1],bounds[3]]].map(transform);
  const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
  const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  if([left,right,top,bottom].every(Number.isFinite)) {
   const hidden=right<=-mouse.x||left>=w-mouse.x||bottom<=-mouse.y||top>=h-mouse.y;
   const full=left>=-mouse.x&&right<=w-mouse.x&&top>=-mouse.y&&bottom<=h-mouse.y;
   if(hidden||full) return {valid:true,fraction:full?1:0,bodyArea,visibleArea:full?bodyArea:0,reason:null};
  }
  // Work relative to mouse center to avoid cancellation in area at large positions.
  let polygon=local.map(([x,y])=>[size*(x*c+y*s),size*(x*s-y*c)]);
  if(!polygon.flat().every(Number.isFinite)) return invalid('non-finite transformed body');
  for(const [axis,boundary,sign] of [[0,-mouse.x,1],[0,w-mouse.x,-1],[1,-mouse.y,1],[1,h-mouse.y,-1]]) {
   if(!Number.isFinite(boundary)) return invalid('non-finite viewport boundary');
   polygon=clip(polygon,axis,boundary,sign);
  }
  const clipped=area(polygon);
  if(!Number.isFinite(clipped)) return invalid('non-finite intersection');
  const visibleArea=Math.min(bodyArea,Math.max(0,clipped));
  return {valid:true,fraction:visibleArea/bodyArea,bodyArea,visibleArea,reason:null};
 };
}
