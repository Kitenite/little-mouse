/** Offline, static material tiles. Generated only on a settings change, never in the frame loop. */
export const backgroundDefaults=Object.freeze({backgroundScale:1,backgroundContrast:1});
export const backgroundControls=Object.freeze([
  {key:'backgroundScale',label:'Surface texture scale',min:0.5,max:2.5,step:0.05,default:1},
  {key:'backgroundContrast',label:'Surface texture contrast',min:0,max:2,step:0.05,default:1},
]);
export const backgroundCatalog=Object.freeze([
  {id:'photo-linen',label:'Linen blanket · image',family:'Images',color:'#dfcfb3',image:'./assets/backgrounds/linen-blanket.jpg'},
  {id:'photo-clearing',label:'Woodland clearing · image',family:'Images',color:'#cfb58a',image:'./assets/backgrounds/woodland-clearing.jpg'},
  {id:'photo-boards',label:'Blond floor · image',family:'Images',color:'#dfbd8e',image:'./assets/backgrounds/blond-floor.jpg'},
  {id:'chalk',label:'Chalk · dark mice',family:'Contrast',color:'#f4f3e9',solid:true},
  {id:'ink',label:'Ink · pale mice',family:'Contrast',color:'#18232e',solid:true},
  {id:'pale-blue',label:'Pale sky',family:'Contrast',color:'#c5ddeb',solid:true},
  {id:'warm-yellow',label:'Soft butter',family:'Contrast',color:'#eee3a2',solid:true},
  {id:'linen',label:'Natural linen',family:'Fabric',color:'#e9ebdf'},
  {id:'plain',label:'Plain color',family:'Simple',color:'#e9ebdf'},
  {id:'wood',label:'Honey oak',family:'Wood',color:'#ceb18a'},
  {id:'walnut',label:'Dark walnut',family:'Wood',color:'#80634e'},
  {id:'birch',label:'Pale birch',family:'Wood',color:'#e6d8bb'},
  {id:'weathered',label:'Weathered boards',family:'Wood',color:'#b8b4a7'},
  {id:'parquet',label:'Basketweave parquet',family:'Wood',color:'#c0a17b'},
  {id:'marble',label:'Ivory marble',family:'Stone',color:'#e9e5dc'},
  {id:'limestone',label:'Warm limestone',family:'Stone',color:'#d7cdb5'},
  {id:'slate',label:'Blue slate',family:'Stone',color:'#829196'},
  {id:'terrazzo',label:'Pale terrazzo',family:'Stone',color:'#e1dbce'},
  {id:'ceramic',label:'Sage ceramic tile',family:'Tile',color:'#bdcbbd'},
  {id:'terracotta',label:'Terracotta tile',family:'Tile',color:'#c98e6d'},
  {id:'concrete',label:'Brushed concrete',family:'Stone',color:'#c4c6bf'},
  {id:'cork',label:'Natural cork',family:'Wood',color:'#c6a87b'},
  {id:'felt',label:'Soft moss felt',family:'Fabric',color:'#a8b29a'},
  {id:'woven',label:'Woven oatmeal rug',family:'Fabric',color:'#d0c4ab'},
  {id:'denim',label:'Washed blue denim',family:'Fabric',color:'#9bafb8'},
  {id:'paper',label:'Handmade paper',family:'Simple',color:'#eee5d2'},
  {id:'grass',label:'Quiet meadow',family:'Outdoors',color:'#a7b783'},
  {id:'earth',label:'Soft garden earth',family:'Outdoors',color:'#ad997d'},
  {id:'sand',label:'Fine beach sand',family:'Outdoors',color:'#e3d1ad'},
  {id:'night',label:'Midnight matte',family:'Simple',color:'#343e3b'},
].map(Object.freeze));
const byId=new Map(backgroundCatalog.map(item=>[item.id,item]));
const cache=new Map();
const clamp=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback;
const color=value=>/^#[\da-f]{6}$/i.test(value||'')?value:null;
function random(seed){let state=seed;return()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
const round=value=>Math.round(value*10)/10;

/** Safe, deterministic data URL. Pure function; also useful for companion swatches. */
export function createBackgroundTexture(id,contrast=1){
  const material=byId.get(id)||byId.get('linen');
  const strength=clamp(contrast,0,2,1);
  if(material.id==='plain'||material.solid||strength===0)return 'none';
  if(material.image)return `url("${material.image}")`;
  const key=`${material.id}:${strength.toFixed(2)}`;
  if(cache.has(key))return cache.get(key);
  let seed=0;for(const c of material.id)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;
  const rng=random(seed),parts=[];
  const opacity=value=>round(Math.min(.55,value*strength)*1000)/1000;
  const path=(d,stroke='#403b30',alpha=.1,width=1)=>parts.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-opacity="${opacity(alpha)}" stroke-width="${width}"/>`);
  const rect=(x,y,w,h,fill,alpha)=>parts.push(`<rect x="${round(x)}" y="${round(y)}" width="${round(w)}" height="${round(h)}" fill="${fill}" fill-opacity="${opacity(alpha)}"/>`);
  const grain=(count,range=1.2,alpha=.08)=>{for(let i=0;i<count;i++){const x=round(rng()*512),y=round(rng()*512),r=round(.25+rng()*range);parts.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${i%3?'#35362d':'#ffffff'}" fill-opacity="${opacity(alpha*(.3+rng()))}"/>`);}};
  const wood=(horizontal=false)=>{
    for(let plank=0;plank<4;plank++){
      rect(plank*128,0,128,512,plank%2?'#fff0ca':'#503a27',.025+rng()*.03);
      path(`M${plank*128} 0V512`,'#3c2e22',.16,2);
      const end=(plank%2)*256+96;
      path(`M${plank*128} ${end}h128`,'#4f3c2a',.13,1);
      for(let j=0;j<26;j++){
        const x=round(plank*128+rng()*128),bend=round((rng()-.5)*18);
        path(`M${x} 0Q${x+bend} 128 ${x} 256T${x} 512`,'#493924',.025+rng()*.055,.5+rng());
      }
      if(plank%2===0){const x=plank*128+40+rng()*40,y=80+rng()*320;for(let i=1;i<=4;i++)parts.push(`<ellipse cx="${round(x)}" cy="${round(y)}" rx="${i*2}" ry="${i*10}" fill="none" stroke="#513c28" stroke-opacity="${opacity(.045)}"/>`);}
    }
    if(horizontal){parts.unshift('<g transform="rotate(90 256 256)">');parts.push('</g>');}
  };
  switch(material.id){
    case 'wood':case 'walnut':case 'birch':case 'weathered':wood(material.id==='weathered');grain(240);break;
    case 'parquet':
      for(let row=0;row<4;row++)for(let col=0;col<4;col++){
        const x=col*128,y=row*128;parts.push(`<g transform="translate(${x} ${y})${(row+col)%2?' rotate(90 64 64)':''}">`);
        for(let n=0;n<4;n++){
          rect(n*32+1,1,30,126,(row+col+n)%2?'#f6d5a6':'#65452e',.09);
          path(`M${n*32} 0V128`,'#493626',.2,1);
          for(let g=0;g<5;g++){const p=round(n*32+4+rng()*24);path(`M${p} 0q-4 32 0 64t0 64`,'#493626',.06,.7);}
        }
        path('M0 0H128V128H0Z','#493626',.17,1);parts.push('</g>');
      }break;
    case 'linen':case 'woven':case 'denim':{
      const spacing=material.id==='woven'?8:4;
      for(let i=0;i<512;i+=spacing){
        path(`M${i} 0V512`,'#4a493b',material.id==='woven'?.14:.075,material.id==='woven'?3:1);
        path(`M0 ${i}H512`,'#ffffff',.19,material.id==='woven'?3:1);
      }
      if(material.id==='denim')for(let i=-512;i<1024;i+=8)path(`M${i} 0l512 512`,'#324c60',.08,2);
      grain(500,.5,.08);break;
    }
    case 'felt':case 'paper':
      for(let i=0;i<1150;i++){const x=round(rng()*512),y=round(rng()*512),dx=round((rng()-.5)*7),dy=round((rng()-.5)*7);path(`M${x} ${y}l${dx} ${dy}`,i%3?'#54563e':'#fffbed',.04+rng()*.075,.55);}
      grain(250,.8,.06);break;
    case 'marble':
      for(let n=0;n<6;n++){
        const x=round(n*100-30),a=round(x+80+rng()*70),b=round(x-80+rng()*70);
        const d=`M${x} -20C${a} 90 ${b} 150 ${x+55} 270S${a} 400 ${x} 532`;
        path(d,'#a4a092',.08,14);path(d,'#77786e',.1,2);path(d,'#ffffff',.28,.8);
      }grain(450,.7,.045);break;
    case 'limestone':case 'slate':case 'concrete':
      for(let n=0;n<55;n++){
        const x=round(rng()*512),y=round(rng()*512),width=round(10+rng()*100);
        path(`M${x} ${y}q${round(width/2)} ${round((rng()-.5)*10)} ${width} 0`,n%2?'#fffceb':'#5d665d',.035+rng()*.04,.5+rng()*3);
      }
      if(material.id==='limestone'){path('M0 0H512V512H0Z','#625f51',.15,3);path('M0 256H512M256 0V256','#625f51',.13,2);}
      if(material.id==='slate'){path('M0 0H512V512H0Z','#344448',.24,4);path('M0 256H512M170 0V256M340 256V512','#344448',.2,3);}
      grain(1000,1.1,.08);break;
    case 'ceramic':case 'terracotta':
      for(let row=0;row<2;row++)for(let col=0;col<2;col++){
        const x=col*256,y=row*256;
        rect(x+3,y+3,250,250,(row+col)%2?'#fffce6':'#724a34',.03);
        path(`M${x+2} ${y+254}V${y+2}H${x+254}`,'#fffced',.27,3);
        path(`M${x+254} ${y+2}V${y+254}H${x+2}`,'#574b3b',.17,2);
        path(`M${x} ${y}H${x+256}V${y+256}H${x}Z`,'#ddd5bd',.5,3);
      }grain(material.id==='terracotta'?1200:250,1.3,.085);break;
    case 'terrazzo':
      for(let n=0;n<170;n++){
        const x=round(rng()*512),y=round(rng()*512),size=3+rng()*10;
        const d=`M${x} ${y}l${round(size)} ${round(-size*.4)} ${round(size*.4)} ${round(size)} ${round(-size*.7)} ${round(size*.5)}Z`;
        parts.push(`<path d="${d}" fill="${['#807c70','#a7b9a6','#bd967e','#fffbed'][n%4]}" fill-opacity="${opacity(.24+rng()*.15)}"/>`);
      }grain(350,.6,.07);break;
    case 'cork':
      for(let n=0;n<650;n++){
        const x=rng()*512,y=rng()*512,size=2+rng()*10;
        rect(x,y,size,2+rng()*5,n%3?'#715033':'#fff1c2',.04+rng()*.13);
      }grain(600,.9,.12);break;
    case 'grass':
      for(let n=0;n<950;n++){
        const x=round(rng()*512),y=round(rng()*512),dx=round((rng()-.5)*12),dy=round(-4-rng()*17);
        path(`M${x} ${y}q${round(dx*.3)} ${round(dy*.8)} ${dx} ${dy}`,['#50683f','#e0db9d','#809051'][n%3],.09+rng()*.11,.6+rng());
      }grain(200);break;
    case 'earth':
      for(let n=0;n<340;n++){
        const x=round(rng()*512),y=round(rng()*512),r=round(1+rng()*4);
        parts.push(`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${round(r*.65)}" fill="${n%3?'#63513c':'#eee0ba'}" fill-opacity="${opacity(.1+rng()*.15)}"/>`);
      }grain(1300,1,.12);break;
    case 'sand':
      for(let n=0;n<12;n++)path(`M0 ${n*45}q128 -18 256 0t256 0`,'#998260',.035,4);
      grain(2300,.7,.12);break;
    case 'night':grain(800,.7,.07);break;
  }
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${parts.join('')}</svg>`;
  const url=`url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  if(cache.size>=32)cache.delete(cache.keys().next().value);
  cache.set(key,url);return url;
}

/** Apply to #game or any .background-preview element. Does not touch children or their filters. */
export function applyBackground(element,config={}){
  if(!element?.style)return;
  const material=byId.get(config.background)||byId.get('linen');
  const scale=clamp(config.backgroundScale,.5,2.5,1);
  const contrast=clamp(config.backgroundContrast,0,2,1);
  const floor=['plain','linen'].includes(material.id)?color(config.backgroundColor)||material.color:material.color;
  element.dataset.background=material.id;
  element.dataset.backgroundTone=['walnut','night','ink'].includes(material.id)?'dark':'light';
  element.dataset.backgroundKind=material.image?'image':'texture';
  element.style.setProperty('--floor',floor);
  element.style.setProperty('--surface-size',`${round(512*scale)}px`);
  element.style.backgroundColor=floor;
  element.style.backgroundImage=material.image?'none':createBackgroundTexture(material.id,contrast);
  element.style.setProperty('--surface-image',material.image?`url("${material.image}")`:'none');
  element.style.setProperty('--surface-image-scale',`${Math.round(100*Math.max(1,scale))}%`);
  element.style.setProperty('--surface-image-contrast',String(Math.max(.25,contrast)));
  element.style.setProperty('--surface-image-opacity',String(Math.min(1,contrast)));
  element.style.backgroundSize=`${round(512*scale)}px ${round(512*scale)}px`;
  element.style.backgroundRepeat='repeat';
  return {background:material.id,backgroundScale:scale,backgroundContrast:contrast,backgroundColor:floor};
}
