import * as T from './vendor/three.module.js';

export const lightingDefaults={lighting:'daylight',lightAzimuth:135,lightElevation:65,lightIntensity:1,shadowStrength:.3,shadowSoftness:3,materialRoughness:.94};
export const lightingPresets={daylight:{label:'Soft daylight',key:0xfff4df,fill:0xe6edff,sky:0xfff8e9,ground:0x747064},overcast:{label:'Overcast',key:0xf0f4ff,fill:0xe4edff,sky:0xe9efff,ground:0x66707a},sunset:{label:'Warm sunset',key:0xffbf79,fill:0xc3d4ff,sky:0xffdfbd,ground:0x766054},moonlight:{label:'Cool moonlight',key:0xb8cdff,fill:0x95a8d4,sky:0xc0d2ff,ground:0x4d5467},studio:{label:'Neutral studio',key:0xffffff,fill:0xffffff,sky:0xffffff,ground:0x787878}};
export const lightingControls={lightAzimuth:{label:'Light direction',min:0,max:360,step:5,unit:'°'},lightElevation:{label:'Light height',min:20,max:85,step:1,unit:'°'},lightIntensity:{label:'Light intensity',min:.25,max:2,step:.05},shadowStrength:{label:'Shadow opacity',min:0,max:.7,step:.05},shadowSoftness:{label:'Shadow softness',min:0,max:8,step:.5},materialRoughness:{label:'Fur roughness',min:.5,max:1,step:.02}};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function lightingValues(config={}){const out={...lightingDefaults,...config};for(const [key,spec]of Object.entries(lightingControls)){out[key]=Number.isFinite(out[key])?clamp(out[key],spec.min,spec.max):lightingDefaults[key];}out.lighting=Object.hasOwn(lightingPresets,out.lighting)?out.lighting:'daylight';return out;}
export function createLighting(scene,{preview=false}={}){
 const ambient=new T.HemisphereLight(0xfff8e9,0x747064,2),key=new T.DirectionalLight(0xfff4df,3.2),fill=new T.DirectionalLight(0xe6edff,.8);
 key.castShadow=true;key.shadow.mapSize.set(preview?512:1024,preview?512:1024);key.shadow.normalBias=.6;key.shadow.bias=-.00008;
 fill.position.set(200,-100,250);scene.add(ambient,key,key.target,fill);
 const floor=new T.Mesh(new T.PlaneGeometry(5000,5000),new T.ShadowMaterial({opacity:.3}));floor.position.z=-1;floor.receiveShadow=true;scene.add(floor);
 let cached='';
 return{key,ambient,fill,floor,update(config,w,h){const c=lightingValues(config),signature=JSON.stringify([c.lighting,...Object.keys(lightingControls).map(k=>c[k]),w,h]);if(signature===cached)return c;cached=signature;const p=lightingPresets[c.lighting];ambient.color.setHex(p.sky);ambient.groundColor.setHex(p.ground);ambient.intensity=(c.lighting==='overcast'?2.3:1.65)*c.lightIntensity;key.color.setHex(p.key);key.intensity=(c.lighting==='overcast'?1.6:3.2)*c.lightIntensity;fill.color.setHex(p.fill);fill.intensity=.75*c.lightIntensity;
 const az=c.lightAzimuth*Math.PI/180,elev=c.lightElevation*Math.PI/180,r=Math.max(w,h,700);key.position.set(Math.cos(az)*Math.cos(elev)*r,Math.sin(az)*Math.cos(elev)*r,Math.sin(elev)*r);key.shadow.camera.left=-w*.8-200;key.shadow.camera.right=w*.8+200;key.shadow.camera.top=h*.8+200;key.shadow.camera.bottom=-h*.8-200;key.shadow.camera.far=r*3+1000;key.shadow.camera.updateProjectionMatrix();key.shadow.radius=c.shadowSoftness;floor.material.opacity=c.shadowStrength;return c;}};
}
