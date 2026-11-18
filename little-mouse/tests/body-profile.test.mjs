import{test}from'node:test';import assert from'node:assert/strict';
import{BODY_PROFILE,bodySection}from'../public/body-profile.js';
test('silhouette interpolates landmarks without overshoot or negative radii',()=>{
 for(let i=0;i<BODY_PROFILE.length-1;i++){const a=BODY_PROFILE[i],b=BODY_PROFILE[i+1];for(let n=0;n<=100;n++){const s=bodySection(a[0]+(b[0]-a[0])*n/100);for(const [key,axis] of [['r',1],['z',2]])assert.ok(s[key]>=Math.min(a[axis],b[axis])-1e-10&&s[key]<=Math.max(a[axis],b[axis])+1e-10);}}
 for(const [x,r,z] of BODY_PROFILE)assert.deepEqual(bodySection(x),{r,z});
});
test('monotone rump and muzzle retain nonzero shared slopes, without profile shelves',()=>{
 const e=1e-4;for(const [x] of BODY_PROFILE.slice(1,-1))for(const key of ['r','z']){
  const left=(bodySection(x)[key]-bodySection(x-e)[key])/e,right=(bodySection(x+e)[key]-bodySection(x)[key])/e;
  assert.ok(Math.abs(left-right)<.001,`continuous ${key} tangent at ${x}`);
  if([-34,-24,17,27,37,48].includes(x))assert.ok(Math.abs((left+right)/2)>.01,`${key} must not flatten at ${x}`);
 }
});
