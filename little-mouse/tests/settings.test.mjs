import{test}from'node:test';
import assert from'node:assert/strict';
import{settingsDefaults,settingsSchema,validateSettings,groupDefaults,saveProfile,readProfiles}from'../public/settings.js';
import{backgroundCatalog}from'../public/backgrounds.js';
import{coatDefaults,coatControls,coatPalettes}from'../public/coat-palette.js';
import{audioDefaults,audioControlSchema}from'../public/audio.js';
import{secondaryMotionDefaults,secondaryMotionControls}from'../public/secondary-motion.js';
import{createSettingsControls}from'../public/controls.js';
import{validateSettings as cleanSettings}from'../public/settings.js';

test('all shared settings round trip through server validation, including each mouse count and surface',()=>{
 assert.deepEqual(cleanSettings(settingsDefaults),settingsDefaults);
 for(let count=1;count<=8;count++)assert.deepEqual(cleanSettings({count}),{count});
 for(const {id:coatPalette}of coatPalettes)assert.deepEqual(cleanSettings({coatPalette}),{coatPalette});
 for(const {id:background}of backgroundCatalog)assert.deepEqual(cleanSettings({background}),{background});
 for(const[key,spec]of Object.entries(settingsSchema).filter(([,s])=>s.type==='number')){
 for(const value of [spec.min,spec.max])assert.equal(validateSettings({[key]:value})[key],value);
 for(const value of [spec.min-.01,spec.max+.01,NaN,Infinity,'1',null])assert.throws(()=>validateSettings({[key]:value}),key);
 }
 assert.throws(()=>validateSettings({count:2.5}));assert.throws(()=>validateSettings({sound:'false'}));assert.throws(()=>validateSettings({lighting:'bad'}));assert.throws(()=>validateSettings({backgroundColor:'javascript:x'}));
});
test('module fallback values and physics bounds remain valid under the rich shared preset',()=>{
 for(const[defaults,controls]of [[{coatSaturation:coatDefaults.coatSaturation,coatBrightness:coatDefaults.coatBrightness},coatControls],[audioDefaults,audioControlSchema],[secondaryMotionDefaults,secondaryMotionControls]])for(const[key,value]of Object.entries(defaults)){
 assert.equal(validateSettings({[key]:value})[key],value,key);for(const bound of ['min','max','step'])assert.equal(settingsSchema[key][bound],controls[key][bound],key+bound);
 }
});
test('profiles preserve settings and safely restore valid fields after schema changes',()=>{
 const data=new Map(),storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};
 const profile={...settingsDefaults,count:3,background:'slate',lightAzimuth:270,soundVolume:.25};saveProfile(storage,'Evening',profile);
 assert.deepEqual(readProfiles(storage).Evening,profile);saveProfile(storage,'__proto__',profile);assert.deepEqual(readProfiles(storage)['__proto__'],profile);assert.throws(()=>saveProfile(storage,'   ',profile));
 storage.setItem('little-mouse-profiles',JSON.stringify({Legacy:{speed:-50,size:1.4,background:'gone',obsolete:22}}));
 const legacy=readProfiles(storage).Legacy;assert.equal(legacy.size,1.4);assert.equal(legacy.speed,settingsDefaults.speed);assert.equal(legacy.background,settingsDefaults.background);assert.equal(legacy.obsolete,undefined);
 assert.ok(!Object.hasOwn(groupDefaults('sound'),'speed'));assert.equal(groupDefaults('sound').soundVolume,.7);
});
function dom(){const ids=new Map();return{activeElement:null,ids,createElement(tag){return{tagName:tag.toUpperCase(),children:[],listeners:{},style:{setProperty(){}},dataset:{},value:'',append(...nodes){this.children.push(...nodes);for(const n of nodes)if(n.id)ids.set(n.id,n);},replaceChildren(){this.children=[];},setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this.listeners[k]=fn;}};}};}
test('every numeric setting renders a paired slider and exact entry; sync emits no edits',()=>{
 const previous=globalThis.document,document=dom();globalThis.document=document;try{
 const root=document.createElement('div');let config={...settingsDefaults},changes=0;
 const controls=createSettingsControls(root,{getSettings:()=>config,onChange:patch=>{Object.assign(config,patch);changes++;},storage:{getItem(){return null;},setItem(){}}});
 for(const[key,spec]of Object.entries(settingsSchema).filter(([,s])=>s.type==='number')){const range=document.ids.get(key),number=document.ids.get(key+'Number');assert.equal(range.type,'range',key);assert.equal(number.type,'number',key);assert.equal(number.min,spec.min);assert.equal(number.max,spec.max);}
 controls.sync();assert.equal(changes,0);const number=document.ids.get('countNumber');number.value='3';number.listeners.change();assert.equal(config.count,3);assert.equal(Number(document.ids.get('count').value),3);
 number.value='99';number.listeners.change();assert.equal(config.count,8);number.value='';number.listeners.change();assert.equal(config.count,8);
 config.mode='manual';controls.sync();assert.equal(document.ids.get('huntControls').hidden,true);
 config.background='slate';controls.sync();assert.equal(document.ids.get('background').value,'slate');assert.equal(changes,2);
 }finally{globalThis.document=previous;}
});

test('fresh startup keeps the rich preset and current user choices survive migration',async()=>{
 const{upgradeSettings}=await import('../public/settings-migration.js');
 const fresh=upgradeSettings({...settingsDefaults});
 for(const[key,value]of Object.entries(settingsDefaults))assert.equal(fresh[key],value,key);
 const custom={...fresh,count:1,hide:8,sound:false};assert.deepEqual(upgradeSettings(custom),custom);
});
test('Fuzziness keeps the persisted numeric softness key and shared control label',async()=>{
 const {identityControls}=await import('../public/mouse-identity.js');assert.equal(settingsSchema.furSoftness.label,'Fuzziness');assert.equal(identityControls.furSoftness.label,'Fuzziness');assert.equal(settingsSchema.furSoftness.min,0);assert.equal(settingsSchema.furSoftness.max,1);for(const value of [0,.5,1])assert.equal(cleanSettings({furSoftness:value}).furSoftness,value);
});
