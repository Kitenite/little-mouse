import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {backgroundCatalog,backgroundDefaults,backgroundControls,createBackgroundTexture,applyBackground} from '../public/backgrounds.js';
const element=()=>({dataset:{},style:{setProperty(key,value){this[key]=value;}}});
test('surface collection has distinct offline materials with deterministic bounded tiles',()=>{
  assert.ok(backgroundCatalog.length>=20);
  assert.equal(new Set(backgroundCatalog.map(x=>x.id)).size,backgroundCatalog.length);
  const textures=[];
  for(const {id,color,image,solid} of backgroundCatalog){
    assert.match(color,/^#[a-f0-9]{6}$/i);
    const texture=createBackgroundTexture(id);
    assert.equal(texture,createBackgroundTexture(id));
    assert.ok(texture.length<650000,`${id} texture should remain bounded`);
    if(id==='plain'||solid){assert.equal(texture,'none');continue;}
    if(image){assert.match(image,/^\.\/assets\/backgrounds\/[a-z-]+\.jpg$/);const file=new URL('../public/'+image,import.meta.url);assert.ok(statSync(file).size<650000);assert.equal(readFileSync(file).subarray(0,2).toString('hex'),'ffd8');textures.push(texture);continue;}
    const svg=decodeURIComponent(texture.slice('url("data:image/svg+xml,'.length,-2));
    assert.match(svg,/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert.ok(svg.endsWith('</svg>'));
    assert.doesNotMatch(svg,/<(?:image|script|filter|animate)|(?:href|onload)=/);
    textures.push(texture);
  }
  assert.equal(new Set(textures).size,textures.length,'every textured surface needs different visible marks');
});
test('background settings clamp unsafe numeric values without filtering the mouse layer',()=>{
  const surface=element();
  const result=applyBackground(surface,{background:'sand',backgroundScale:99,backgroundContrast:-1});
  assert.equal(result.backgroundScale,2.5);
  assert.equal(result.backgroundContrast,0);
  assert.equal(surface.style.backgroundImage,'none');
  assert.equal(surface.style.backgroundSize,'1280px 1280px');
  assert.equal(surface.style.filter,undefined);
  applyBackground(surface,{background:'unknown',backgroundScale:NaN,backgroundContrast:Infinity,backgroundColor:'url(https://evil)'});
  assert.equal(surface.dataset.background,'linen');
  assert.equal(surface.style.backgroundColor,'#e9ebdf');
  assert.equal(surface.style.backgroundSize,'512px 512px');
});
test('plain and linen honor custom colors while other surfaces retain material palettes',()=>{
  const surface=element();
  for(const background of ['plain','linen']){
    applyBackground(surface,{background,backgroundColor:'#123abc'});
    assert.equal(surface.style.backgroundColor,'#123abc');
  }
  applyBackground(surface,{background:'night',backgroundColor:'#ffffff'});
  assert.equal(surface.style.backgroundColor,'#343e3b');
  assert.equal(surface.dataset.backgroundTone,'dark');
  applyBackground(surface,{background:'marble'});
  assert.equal(surface.dataset.backgroundTone,'light');
});
test('scale and contrast controls agree with the runtime defaults and affect only static texture',()=>{
  for(const control of backgroundControls)assert.equal(backgroundDefaults[control.key],control.default);
  assert.notEqual(createBackgroundTexture('wood',.3),createBackgroundTexture('wood',1.5));
  assert.equal(createBackgroundTexture('wood',0),'none');
  const a=element(),b=element();
  applyBackground(a,{background:'wood',backgroundScale:.5});
  applyBackground(b,{background:'wood',backgroundScale:2});
  assert.equal(a.style.backgroundImage,b.style.backgroundImage,'scale should reuse texture rather than regenerate it');
  assert.notEqual(a.style.backgroundSize,b.style.backgroundSize);
});

test('photo settings use an isolated local image layer and fully reset when selecting a texture',()=>{
 const surface=element();
 applyBackground(surface,{background:'photo-clearing',backgroundContrast:1.6,backgroundScale:1.5});
 assert.equal(surface.dataset.backgroundKind,'image');
 assert.equal(surface.style.backgroundImage,'none');
 assert.equal(surface.style['--surface-image'],'url("./assets/backgrounds/woodland-clearing.jpg")');
 assert.equal(surface.style['--surface-image-contrast'],'1.6');
 assert.equal(surface.style['--surface-image-scale'],'150%');
 assert.equal(surface.style.filter,undefined,'mouse/HUD parent must never be filtered');
 applyBackground(surface,{background:'wood'});
 assert.equal(surface.dataset.backgroundKind,'texture');
 assert.equal(surface.style['--surface-image'],'none');
 assert.match(surface.style.backgroundImage,/data:image\/svg/);
});
