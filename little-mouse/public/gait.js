const TAU=Math.PI*2;
export const MAX_CADENCE=4.5;
// Travel arrives in CSS pixels; the rig is expressed in unscaled model units.
export function advanceGait(state,speed,size,moving,dt){
 const localSpeed=moving?Math.max(0,speed)/Math.max(.1,size):0;
 const targetCadence=Math.min(MAX_CADENCE,localSpeed/72);
 const blend=1-Math.exp(-Math.max(0,dt)*10);
 state.cadence+=(targetCadence-state.cadence)*blend;
 state.activity+=((moving?1:0)-state.activity)*blend;
 state.phase=(state.phase+state.cadence*Math.max(0,dt)*TAU)%TAU;
 // Longer steps replace the old rapid, tiny paddling. Limit reach at sprint speeds.
 const reach=targetCadence>.01?Math.min(26,localSpeed*.62/targetCadence/2):state.reach;
 state.reach+=(reach-state.reach)*blend;
 return state;
}
export function footPose(state,offset){
 const cycle=(((state.phase+offset)/TAU)%1+1)%1,swing=cycle>.62;
 const u=swing?(cycle-.62)/.38:cycle/.62;
 const eased=u*u*(3-2*u);
 return{x:(swing?-state.reach+2*state.reach*eased:state.reach-2*state.reach*u)*state.activity,
 lift:(swing?Math.sin(Math.PI*u)*3:0)*state.activity,
 pitch:(swing?-Math.sin(Math.PI*u)*.2:0)*state.activity};
}
