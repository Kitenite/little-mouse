// Authored coat families, not species classifications. Independent stable seed stream.
export function furStyle(seed,variation=1){
 let n=(seed^0xf0942b71)>>>0;const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};random();random();
 const styles=[{name:'sleek',length:.8,loft:.7,roughness:.2},{name:'fluffy',length:1.12,loft:1.2,roughness:.4},{name:'coarse',length:1.08,loft:.85,roughness:.65},{name:'scruffy',length:1.15,loft:1.05,roughness:1}];
 const chosen=styles[Math.floor(random()*styles.length)],v=Math.max(0,Math.min(1,variation));
 return{name:chosen.name,length:1+(chosen.length-1)*v,loft:1+(chosen.loft-1)*v,roughness:chosen.roughness*v,phase:random()*Math.PI*2};
}
export function createFurCompression(){return{x:0,y:0,strength:0,pointer:null,radius:15};}
export function advanceFurCompression(state,contact,dt){
 if(!Number.isFinite(dt)||dt<=0)return state;
 const active=contact&&contact.part!=='tail'&&Number.isFinite(contact.x)&&Number.isFinite(contact.y);
 if(active){if(state.pointer!==contact.pointer){state.x=contact.x;state.y=contact.y;state.pointer=contact.pointer;}state.radius=contact.part==='head'?11:contact.part?.includes('paw')?8:16;}
 else state.pointer=null;
 const target=active?.82:0,rate=active?14:3.5;
 state.strength+=(target-state.strength)*(1-Math.exp(-rate*Math.min(dt,.1)));
 if(state.strength<.0001)state.strength=0;
 return state;
}
