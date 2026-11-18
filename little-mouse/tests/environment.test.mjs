import test from 'node:test';import assert from 'node:assert/strict';
import{GroundMemory,materialResponses,ENVIRONMENT_CAPACITY}from'../public/environment.js';
import{backgroundIds,normalizeProfile,validateSettings}from'../public/settings.js';
const config={background:'photo-clearing',size:1,environmentStrength:.55,environmentPersistence:1.8};
const feet=new Float64Array([0,30,3,0,50,3,20,30,3,20,50,3]);
function sample(m,t,x=100,drag=false,z=3){m.begin(config,t,10000,1000);for(let j=0;j<4;j++){feet[j*3]=x+j*10;feet[j*3+2]=z;}m.sample(0,1,x,100,1,feet,drag);}
test('all 30 materials explicitly classified; numeric zero survives profiles and validation',()=>{assert.equal(backgroundIds.length,30);for(const id of backgroundIds)assert.ok(materialResponses[id]);assert.equal(normalizeProfile({environmentStrength:0}).environmentStrength,0);assert.throws(()=>validateSettings({environmentPersistence:Infinity}));});
test('movement, grounded actual feet, and broad body drag are separate',()=>{const m=new GroundMemory();sample(m,0);sample(m,.1);assert.equal(m.emitted,0);sample(m,.2,110,false,10);assert.equal(m.emitted,0);sample(m,.3,120);assert.equal(m.emitted,0);sample(m,.4,140);assert.ok(m.emitted>=4);assert.equal(m.marks[0].x,134);const d=new GroundMemory();sample(d,0);sample(d,.1,120,true,20);assert.equal(d.emitted,1);assert.equal(d.marks[0].kind,1);assert.equal(d.marks[0].rx,17);});
test('hard boards and explicit disable clear immediately; surface/resize/size/backward-time/teleport reset',()=>{for(const change of [{background:'photo-boards'},{environmentStrength:0},{background:'linen'},{size:3}]){const m=new GroundMemory();sample(m,0);sample(m,.1,120);m.begin({...config,...change},.2,10000,1000);assert.equal(m.active,0);}const m=new GroundMemory();sample(m,0);sample(m,.1,120);m.begin(config,.2,900,1000);assert.equal(m.active,0);sample(m,.3,130);sample(m,.4,150);sample(m,.5,500);assert.equal(m.active,0);sample(m,.6,500);sample(m,.7,520);m.begin(config,0,10000,1000);assert.equal(m.active,0);});
test('30/60/120 Hz travel and exponential decay remain comparable',()=>{const totals=[];for(const hz of [30,60,120]){const m=new GroundMemory();for(let n=0;n<=hz*2;n++)sample(m,n/hz,100+120*n/hz);totals.push(m.emitted);const p=m.marks.find(p=>p.life&&p.kind!==2),before=m.opacity(p);for(let n=1;n<=10;n++)m.begin(config,2+n*.01,10000,1000);assert.ok(Math.abs(m.opacity(p)-before*Math.exp(-3*.1/p.life))<1e-10);}assert.ok(Math.max(...totals)-Math.min(...totals)<=8,JSON.stringify(totals));console.log('30/60/120 Hz emitted:',totals);});
test('eight mice extremes remain pooled under sustained drag and expire',()=>{const m=new GroundMemory(),slots=[...m.marks];const start=performance.now();for(let n=0;n<1200;n++){m.begin(config,n/120,10000,1000);for(let i=0;i<8;i++)m.sample(i,i,100+n*2,100+i*60,i%2?3:.6,feet,true);}assert.ok(m.active<=160);assert.equal(m.marks.length,ENVIRONMENT_CAPACITY);assert.ok(m.marks.every((p,i)=>p===slots[i]));m.begin(config,20,10000,1000);assert.equal(m.active,0);console.log('9600 samples ms:',(performance.now()-start).toFixed(2));});

test('800 px/s size .6 spatial resampling preserves density at 30/60/120 Hz',()=>{for(const drag of [false,true]){const counts=[];for(const hz of [30,60,120]){const m=new GroundMemory(),c={...config,size:.6,background:'linen'};for(let n=0;n<=hz;n++){const x=100+800*n/hz;m.begin(c,n/hz,10000,1000);for(let j=0;j<4;j++){feet[j*3]=x+j*10;feet[j*3+2]=1.8;}m.sample(0,1,x,100,.6,feet,drag);}counts.push(m.emitted);}assert.ok(Math.max(...counts)-Math.min(...counts)<=4,JSON.stringify(counts));console.log('800 px/s',drag?'drag':'feet',counts);}});
test('planted feet emit nothing when body shifts; hidden respawn and frozen time preserve reset behavior',()=>{const m=new GroundMemory();sample(m,0);m.begin(config,.1,10000,1000);m.sample(0,1,101,100,1,feet);assert.equal(m.emitted,0);m.sample(0,1,101,100,1,feet,false,false);m.sample(0,1,500,100,1,feet);assert.equal(m.emitted,0);sample(m,.2,520);const p=m.marks.find(p=>p.life),alpha=m.opacity(p);m.begin(config,.2,10000,1000);assert.equal(m.opacity(p),alpha);});

test('airborne feet seed on landing without interpolating a phantom trail',()=>{const m=new GroundMemory();sample(m,0);sample(m,.1,130,false,10);sample(m,.2,160,false,10);sample(m,.3,190);assert.equal(m.emitted,0);sample(m,.4,210);assert.ok(m.emitted>=4);assert.equal(m.marks[0].x,204);});


test('drag release never backfills footprints; stationary claim transitions reset spacing',()=>{
 const m=new GroundMemory();sample(m,0,100);sample(m,.1,150,true);sample(m,.2,200,true);
 const before=m.emitted;sample(m,.3,201);assert.equal(m.emitted,before);
 sample(m,.4,221);assert.ok(m.emitted>before);assert.ok(m.marks.filter(p=>p.life&&p.kind===0).every(p=>p.x>=201));
 const n=new GroundMemory();sample(n,0,100);sample(n,.1,111,true);sample(n,.2,111,false);sample(n,.3,111,true);
 sample(n,.4,113,true);assert.equal(n.emitted,0);sample(n,.5,124,true);assert.equal(n.emitted,1);
});
