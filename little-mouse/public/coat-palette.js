// Deliberately varied visual identities, not a claim about feline color preference.
export const coatDefaults=Object.freeze({coatPalette:'mixed',coatSaturation:1,coatBrightness:1});
export const coatControls=Object.freeze({
 coatSaturation:{label:'Coat color strength',min:0,max:1.8,step:.05},
 coatBrightness:{label:'Coat brightness',min:.45,max:1.6,step:.05},
});
export const COATS=Object.freeze([
 {name:'agouti',color:'#958474',hair:'#736253',pattern:'agouti',skin:'#bc9b91'},
 {name:'warm brown',color:'#80644d',hair:'#66503e',pattern:'solid',skin:'#b58f83'},
 {name:'silver gray',color:'#b2b0aa',hair:'#95938e',pattern:'solid',skin:'#c6a49a'},
 {name:'charcoal',color:'#5d5b58',hair:'#464543',pattern:'solid',skin:'#aa8a83'},
 {name:'cream',color:'#f2dfb7',hair:'#dcc69e',pattern:'solid',skin:'#d8b7aa'},
 {name:'piebald',color:'#eeeae0',hair:'#c4bfb4',pattern:'piebald',patch:'#43392e',skin:'#c4a195'},
 {name:'snow white',color:'#faf8ef',hair:'#eae8df',pattern:'solid',skin:'#e3b5ac'},
 {name:'ink black',color:'#282d33',hair:'#353c44',pattern:'solid',skin:'#b8908c'},
 {name:'cream pied',color:'#fff0cc',hair:'#e3cb9f',pattern:'piebald',patch:'#99734a',skin:'#d6a99d'},
 {name:'silver white',color:'#e8edf0',hair:'#c8d0d6',pattern:'agouti',skin:'#d6afa7'},
 {name:'sky blue',color:'#71b2ed',hair:'#5e9fd8',pattern:'solid',skin:'#d5b3af'},
 {name:'butter yellow',color:'#f5d85c',hair:'#dcbf49',pattern:'solid',skin:'#dcb4a2'},
 {name:'checker',color:'#f6f5ec',hair:'#babcb5',pattern:'checkered',patch:'#303944',skin:'#cfaba0'},
 {name:'blue pied',color:'#e8f2f4',hair:'#bacfdc',pattern:'piebald',patch:'#487eac',skin:'#d3b2aa'},
 {name:'sand',color:'#d8bc83',hair:'#c1a36b',pattern:'solid',skin:'#cfaa94'},
 {name:'chestnut',color:'#aa6844',hair:'#8b5639',pattern:'agouti',skin:'#c39a8a'},
 {name:'tangerine stripes',color:'#f59037',hair:'#e37920',pattern:'stripes',patch:'#633c30',skin:'#d6aa98'},
 {name:'magenta speckles',color:'#e977bb',hair:'#ca5b9d',pattern:'speckled',patch:'#5c3e62',skin:'#d8b1b4'},
 {name:'teal mottled',color:'#43c8bc',hair:'#2ba89e',pattern:'mottled',patch:'#276c83',skin:'#c6aaa5'},
 {name:'lemon stripes',color:'#ffe269',hair:'#ddbd3c',pattern:'stripes',patch:'#445979',skin:'#dbb3a0'},
 {name:'copper speckles',color:'#e9ac76',hair:'#c88b5b',pattern:'speckled',patch:'#633d38',skin:'#d8ac9b'},
 {name:'violet mottled',color:'#b8a0e8',hair:'#9680c9',pattern:'mottled',patch:'#654c99',skin:'#d4aeb4'},
].map(Object.freeze));
export const coatPalettes=Object.freeze([
 {id:'mixed',label:'All coats',indices:COATS.map((_,i)=>i)},
 {id:'natural',label:'Natural variety',indices:[0,1,2,3,4,5,6,7,8,9,14,15]},
 {id:'highcontrast',label:'Light, dark & patterned',indices:[6,7,5,8,9,12]},
 {id:'playful',label:'Vibrant colors & patterns',indices:[10,11,12,13,16,17,18,19,20,21,6,4]},
].map(item=>Object.freeze({...item,indices:Object.freeze(item.indices)})));
const clamp=(n,a,b,fallback)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):fallback;
export function coatSettings(config={}){return{coatPalette:coatPalettes.some(p=>p.id===config.coatPalette)?config.coatPalette:coatDefaults.coatPalette,coatSaturation:clamp(config.coatSaturation,0,1.8,1),coatBrightness:clamp(config.coatBrightness,.45,1.6,1)};}
const rgb=hex=>[1,3,5].map(offset=>parseInt(hex.slice(offset,offset+2),16));
const hex=channels=>'#'+channels.map(n=>Math.round(Math.max(0,Math.min(255,n))).toString(16).padStart(2,'0')).join('');
export function adjustCoatColor(color,saturation=1,brightness=1){const source=rgb(color),luma=source[0]*.2126+source[1]*.7152+source[2]*.0722;return hex(source.map(v=>(luma+(v-luma)*clamp(saturation,0,1.8,1))*clamp(brightness,.45,1.6,1)));}
function mixColor(a,b,amount){const first=rgb(a),second=rgb(b);return hex(first.map((v,i)=>v+(second[i]-v)*amount));}
/** Selection derives solely from the existing identity. Hiding never rerolls a coat. */
export function resolveCoat(identity,config={}){
 const settings=coatSettings(config),pool=coatPalettes.find(p=>p.id===settings.coatPalette).indices;
 const variation=clamp(config.coatVariation,0,1,1);
 const index=Number.isInteger(identity?.coat)?Math.abs(identity.coat):Math.abs(identity?.seed||0);
 const coat=COATS[variation===0?0:pool[index%pool.length]];
 return{coat,coatMix:variation,coatTint:adjustCoatColor(mixColor(COATS[0].color,coat.color,variation),settings.coatSaturation,settings.coatBrightness),coatHair:adjustCoatColor(mixColor(COATS[0].hair,coat.hair,variation),settings.coatSaturation,settings.coatBrightness)};
}
function seeded(seed){let value=seed>>>0;return()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};}
/** Neutralized photographic microtexture preserves bright/blue/yellow tint instead of multiplying brown twice.
 * Bounded 22 maps: saturation/brightness belong in material tint, never in this texture cache key. */
export function paintCoatTexture(context,image,coat){
 const x=context;x.save();x.fillStyle='#b9b9b9';x.fillRect(0,0,256,256);
 if(image){x.filter='grayscale(1)';x.drawImage(image,0,0,256,256);x.filter='none';}
 x.globalCompositeOperation='screen';x.fillStyle='#a0a0a0';x.fillRect(0,0,256,256);x.globalCompositeOperation='source-over';
 const random=seeded(7301+Math.max(0,COATS.findIndex(c=>c.name===coat.name)));
 for(let i=0;i<2500;i++){const gray=150+random()*100;x.fillStyle=`rgba(${gray},${gray},${gray},.13)`;x.fillRect(random()*256,random()*256,.5,.7+random()*2);}
 if(coat.pattern==='piebald'){
  for(let i=0;i<6;i++){const px=random()*256,py=random()*256,r=24+random()*35,g=x.createRadialGradient(px,py,r*.73,px,py,r);g.addColorStop(0,coat.patch||'#52483e');g.addColorStop(1,(coat.patch||'#52483e')+'00');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2);}
 }else if(coat.pattern==='checkered'){
  x.globalAlpha=.9;x.fillStyle=coat.patch||'#303944';for(let row=0;row<4;row++)for(let column=0;column<4;column++)if((row+column)%2)x.fillRect(column*64,row*64,64,64);x.globalAlpha=1;
 }else if(coat.pattern==='stripes'){
  x.strokeStyle=coat.patch||'#4d4d4d';x.lineWidth=14;x.globalAlpha=.8;
  for(let i=-1;i<9;i++){x.beginPath();x.moveTo(i*40-15,0);x.bezierCurveTo(i*40+25,80,i*40-35,170,i*40+10,256);x.stroke();}x.globalAlpha=1;
 }else if(coat.pattern==='speckled'){
  x.fillStyle=coat.patch||'#515151';x.globalAlpha=.82;
  for(let i=0;i<90;i++){const px=random()*256,py=random()*256,r=2+random()*6;x.beginPath();x.ellipse(px,py,r,r*.7,random()*Math.PI,0,Math.PI*2);x.fill();}x.globalAlpha=1;
 }else if(coat.pattern==='mottled'){
  for(let i=0;i<24;i++){const px=random()*256,py=random()*256,r=12+random()*30,g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,coat.patch||'#626262');g.addColorStop(1,(coat.patch||'#626262')+'00');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2);}
 }else if(coat.pattern==='agouti'){
  for(let i=0;i<900;i++){x.strokeStyle='rgba(75,67,54,.12)';x.beginPath();const px=random()*256,py=random()*256;x.moveTo(px,py);x.lineTo(px+.4,py+2+random()*4);x.stroke();}
 }
 // Rest UV v=1 is muzzle: markings fade into fine pale facial fur, without a hard seam.
 for(let row=0;row<65;row++){x.globalAlpha=.78*(1-row/65)**2;x.fillStyle='#ececec';x.fillRect(0,row,256,1);}x.globalAlpha=1;
 // Fine directional fibers sit above markings; relief is supplied separately by coat-surfaces.
 for(let i=0;i<6200;i++){
  const px=random()*256,py=random()*256,length=1.5+random()*4;
  x.lineWidth=.45;x.strokeStyle=i%3===0?'rgba(255,255,255,.23)':'rgba(45,40,36,.1)';
  x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.sin(px/256*Math.PI*2)*.6,py+length);x.stroke();
 }
 x.restore();
}
