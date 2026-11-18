import {test} from 'node:test';
import assert from 'node:assert/strict';
import {COATS,coatPalettes,coatSettings,adjustCoatColor,resolveCoat,paintCoatTexture} from '../public/coat-palette.js';
import {createMouseIdentity,ensureMouseIdentity,identitySettings,physicalTraits} from '../public/mouse-identity.js';
test('palettes expose broad stable color and marking diversity with valid bounds',()=>{
 assert.ok(COATS.length>=16);assert.equal(new Set(COATS.map(c=>c.name)).size,COATS.length);
 for(const coat of COATS)for(const key of ['color','hair','skin'])assert.match(coat[key],/^#[0-9a-f]{6}$/i);
 for(const palette of coatPalettes){assert.ok(palette.indices.length>=6);for(const index of palette.indices)assert.ok(index>=0&&index<COATS.length);}
 assert.ok(COATS.some(c=>c.pattern==='piebald'));assert.ok(COATS.some(c=>c.pattern==='checkered'));
 const settings=coatSettings({coatPalette:'invalid',coatBrightness:100,coatSaturation:Infinity});
 assert.deepEqual(settings,{coatPalette:'mixed',coatBrightness:1.6,coatSaturation:1});
 assert.equal(adjustCoatColor('#71b2ed',0,1).slice(1,3),adjustCoatColor('#71b2ed',0,1).slice(3,5));
});
test('same mouse keeps coat through hiding and palette controls preserve its morphology',()=>{
 const mouse={state:'active',identity:createMouseIdentity(113)},identity=mouse.identity;
 const initial=resolveCoat(identity,{coatPalette:'playful'});
 for(const state of ['away','active','hurt','away','active']){mouse.state=state;assert.equal(ensureMouseIdentity(mouse),identity);assert.deepEqual(resolveCoat(mouse.identity,{coatPalette:'playful'}),initial);}
 const bright=physicalTraits(identity,{coatPalette:'highcontrast',coatBrightness:1.5,coatSaturation:1.5});
 const baseline=physicalTraits(identity,{});
 assert.equal(bright.bodyLength,baseline.bodyLength);assert.equal(bright.headScale,baseline.headScale);
 assert.notDeepEqual(identitySettings({}),identitySettings({coatBrightness:1.5}),'renderer cache must rebuild when palette settings change');
 assert.equal(resolveCoat(identity,{coatVariation:0,coatPalette:'playful'}).coat.name,'agouti');
});
test('seeded populations actually reach every coat and playful palette stays within its pool',()=>{
 const colors=new Set(),names=new Set();
 for(let seed=0;seed<500;seed++){
  const identity=createMouseIdentity(seed),coat=resolveCoat(identity,{});colors.add(coat.coatTint);names.add(coat.coat.name);
  const playful=resolveCoat(identity,{coatPalette:'playful'});assert.ok(coatPalettes.find(p=>p.id==='playful').indices.some(i=>COATS[i]===playful.coat));
 }
 assert.equal(names.size,COATS.length);assert.equal(colors.size,COATS.length);
});
function context(){const ops=[];return new Proxy({ops,createRadialGradient(...args){ops.push(['gradient',...args]);return{addColorStop(...args){ops.push(['stop',...args]);}};}},{set(target,key,value){target[key]=value;ops.push([key,value]);return true;},get(target,key){return key in target?target[key]:(...args)=>ops.push([key,...args]);}});}
test('coat texture generation is deterministic and each pattern is present without extra map variants',()=>{
 const renders=[];
 for(const name of ['snow white','piebald','checker','sky blue','tangerine stripes','magenta speckles','teal mottled']){
  const coat=COATS.find(c=>c.name===name),a=context(),b=context();paintCoatTexture(a,{},coat);paintCoatTexture(b,{},coat);
  assert.equal(JSON.stringify(a.ops),JSON.stringify(b.ops));assert.deepEqual(a.ops[0],['save']);assert.deepEqual(a.ops.at(-1),['restore']);
  assert.ok(a.ops.some(op=>op[0]==='filter'&&op[1]==='grayscale(1)'));
  if(name==='piebald')assert.equal(a.ops.filter(op=>op[0]==='gradient').length,6);
  if(name==='tangerine stripes')assert.equal(a.ops.filter(op=>op[0]==='bezierCurveTo').length,10);
  if(name==='magenta speckles')assert.equal(a.ops.filter(op=>op[0]==='ellipse').length,90);
  if(name==='teal mottled')assert.equal(a.ops.filter(op=>op[0]==='gradient').length,24);
  if(name==='checker')assert.equal(a.ops.filter(op=>op[0]==='fillRect'&&op[3]===64&&op[4]===64).length,8);
  renders.push(JSON.stringify(a.ops));
 }
 assert.equal(new Set(renders).size,7);
});
