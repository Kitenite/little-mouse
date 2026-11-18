import{COATS,coatSettings,resolveCoat}from'./coat-palette.js';
export{COATS}from'./coat-palette.js';
// Stable individuals. A new coat belongs to a new mouse, never to a hiding one.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const identityDefaults={morphologyVariation:.6,headScale:1,bodyLength:1,bodyWidth:1,legLength:1,tailLength:1,earSize:1,eyeSize:1,furLength:1,coatVariation:1,armLength:1,armWidth:1,bodyHairiness:1,armHairiness:.7,furSoftness:.5};
export const identityControls={morphologyVariation:{label:'Individual differences',min:0,max:1,step:.05},headScale:{label:'Head size',min:.8,max:1.2,step:.02},bodyLength:{label:'Body length',min:.8,max:1.2,step:.02},bodyWidth:{label:'Body width',min:.8,max:1.25,step:.02},legLength:{label:'Leg length',min:.8,max:1.25,step:.02},tailLength:{label:'Tail length',min:.7,max:1.4,step:.02},earSize:{label:'Ear size',min:.7,max:1.4,step:.02},eyeSize:{label:'Eye size',min:.8,max:1.3,step:.02},furLength:{label:'Coat length',min:.5,max:1.8,step:.05},coatVariation:{label:'Coat diversity',min:0,max:1,step:.05}};
Object.assign(identityControls,{armLength:{label:'Foreleg length',min:.8,max:1.25,step:.02},armWidth:{label:'Foreleg width',min:.7,max:1.35,step:.02},bodyHairiness:{label:'Body hair density',min:0,max:1.5,step:.05},armHairiness:{label:'Leg hair density',min:0,max:1.5,step:.05},furSoftness:{label:'Fuzziness',min:0,max:1,step:.05}});
// Independent regional widths: keep legacy random draws (including coat) stable.
const regionKeys=['ribcageWidth','waistWidth','pelvisWidth'];
Object.assign(identityDefaults,{ribcageWidth:1,waistWidth:.88,pelvisWidth:1});
for(const key of regionKeys)identityControls[key]={label:{ribcageWidth:'Ribcage width',waistWidth:'Waist width',pelvisWidth:'Pelvis width'}[key],min:.8,max:1.2,step:.02};
// Illustrative silhouette families inspired by mice; not species identification.
export const MOUSE_PROFILES=Object.freeze([
 {name:'House inspired',bodyLength:1,bodyWidth:1,headScale:1,tailLength:1,earSize:1,eyeSize:1},
 {name:'Woodland inspired',bodyLength:1.05,bodyWidth:.92,headScale:.97,tailLength:1.13,earSize:1.15,eyeSize:1.10},
 {name:'Harvest inspired',bodyLength:.91,bodyWidth:.94,headScale:.93,tailLength:1.12,earSize:.88,eyeSize:1.02},
 {name:'Deer mouse inspired',bodyLength:1.03,bodyWidth:.96,headScale:1.03,tailLength:1.05,earSize:1.14,eyeSize:1.12},
 {name:'Field inspired',bodyLength:1.03,bodyWidth:1.13,headScale:1.08,tailLength:.85,earSize:.91,eyeSize:.96},
 {name:'Fancy mouse inspired',bodyLength:1.10,bodyWidth:1.06,headScale:1.02,tailLength:1.07,earSize:1.07,eyeSize:1}
]);
export function identityRandom(seed){let value=seed>>>0;return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};}
let serial=0;
export function createMouseIdentity(seed){seed=Number.isFinite(seed)?seed>>>0:((Math.random()*4294967296)^(++serial*2654435761))>>>0;const random=identityRandom(seed),traits={};for(const key of Object.keys(identityDefaults))if(!['morphologyVariation','coatVariation',...regionKeys].includes(key))traits[key]=(random()*2-1);const coat=Math.floor(random()*COATS.length),shade=.91+random()*.18,profile=Math.floor(random()*MOUSE_PROFILES.length),regional=identityRandom(seed^0xa5f0193b);for(const key of regionKeys)traits[key]=regional()*2-1;return Object.freeze({id:`mouse-${seed.toString(36)}`,seed,coat,shade,profile,traits:Object.freeze(traits)});}
export function ensureMouseIdentity(mouse){
 if(!mouse.identity)mouse.identity=createMouseIdentity();
 if(mouse.state==='defeated')mouse.identityWasDefeated=true;
 else if(mouse.identityWasDefeated){mouse.identity=createMouseIdentity();delete mouse.identityWasDefeated;}
 return mouse.identity;
}
export function identitySettings(config={}){const out={};for(const key of Object.keys(identityDefaults)){const c=identityControls[key];out[key]=Number.isFinite(config[key])?clamp(config[key],c.min,c.max):identityDefaults[key];}return {...out,...coatSettings(config)};}
export function physicalTraits(identity=createMouseIdentity(0),config={}){const settings=identitySettings(config),out={};for(const key of Object.keys(identityDefaults)){if(['morphologyVariation','coatVariation'].includes(key))continue;const spread=key==='furLength'?.32:key==='tailLength'?.22:.14;const profile=MOUSE_PROFILES[identity.profile??0];out[key]=settings[key]*(1+(identity.traits[key]??0)*settings.morphologyVariation*spread)*(1+((profile[key]??1)-1)*settings.morphologyVariation);}out.profile=MOUSE_PROFILES[identity.profile??0].name;Object.assign(out,resolveCoat(identity,{...settings,coatVariation:settings.coatVariation}));return out;}
// Continuous deformation: torso and muzzle remain one surface. The same map
// moves every attachment and the hit-test's inverse uses these exact lengths.
const smooth=n=>{const t=clamp(n,0,1);return t*t*(3-2*t);};
// Partition of unity across pelvis, lumbar waist, ribcage and neck. The
// smooth joins cannot open seams; muzzle width retains its own head control.
export function regionalWidth(x,traits){const pelvis=traits.pelvisWidth??1,waist=traits.waistWidth??.88,ribs=traits.ribcageWidth??1;
 if(x<-8)return pelvis+(waist-pelvis)*smooth((x+24)/16);
 if(x<8)return waist+(ribs-waist)*smooth((x+8)/16);
 return ribs+(1-ribs)*smooth((x-8)/19);
}
export function morphologyPoint(x,y,z,traits){const head=Math.max(0,x-17),body=Math.min(x,17),headBlend=clamp(head/22,0,1),headWidth=1+(traits.headScale-1)*headBlend;return[body*traits.bodyLength+head*traits.headScale,y*traits.bodyWidth*headWidth*regionalWidth(x,traits),z+(traits.legLength-1)*12+(traits.headScale-1)*headBlend*(z-10)];}
export function unmorphologyPoint(x,y,traits){const seam=17*traits.bodyLength,originalX=x<=seam?x/traits.bodyLength:17+(x-seam)/traits.headScale,headBlend=clamp((originalX-17)/22,0,1);return[originalX,y/(traits.bodyWidth*(1+(traits.headScale-1)*headBlend)*regionalWidth(originalX,traits))];}
export function morphologyLeg(layout,traits){return{...layout,x:morphologyPoint(layout.x,0,0,traits)[0],y:morphologyPoint(layout.x,layout.y,0,traits)[1],anchor:morphologyPoint(...layout.anchor,traits),upper:layout.upper*traits.legLength*(layout.x>0?traits.armLength:1),lower:layout.lower*traits.legLength*(layout.x>0?traits.armLength:1),width:layout.x>0?traits.armWidth:1,nibblePoint:morphologyPoint(35,Math.sign(layout.y)*5.2,11,traits)};}
// Conservative dimensions available to steering and hide margins.
export function physicalBounds(identity,config={}){const t=physicalTraits(identity,config);return{front:17*t.bodyLength+35*t.headScale,rear:39*t.bodyLength,width:25*t.bodyWidth*Math.max(1,t.ribcageWidth,t.waistWidth,t.pelvisWidth),tail:36*t.bodyLength+90*t.tailLength};}
