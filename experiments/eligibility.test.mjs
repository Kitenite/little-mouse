import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {settingsDefaults} from '../little-mouse/public/settings.js';
import {trialEligibility} from './eligibility.mjs';
const {trials}=JSON.parse(await readFile(new URL('trials.json',import.meta.url)));
const context=()=>({settings:{...settingsDefaults},observed:{ownerReady:true,catPresentAtStart:true,appReady:true,audioReady:true,contrastChangeVerified:true}});
test('reviewed baselines pass and unsupported modes fail before exposure',()=>{
 for(const t of trials){const c=context();assert.equal(trialEligibility(t,c).eligible,true);c.settings.mode='scurry';assert.equal(trialEligibility(t,c).eligible,false);}
});
test('sound requires actual availability and nonzero finite gain',()=>{
 const t=trials.find(t=>t.variable==='sound');
 for(const volume of [0,NaN,undefined]){const c=context();c.settings.soundVolume=volume;assert.equal(trialEligibility(t,c).eligible,false);}
 const c=context();c.observed.audioReady=false;assert.equal(trialEligibility(t,c).eligible,false);
});
test('unknown presence and changed saved baselines cannot silently enter a pair',()=>{
 const t=trials[0],c=context();delete c.observed.catPresentAtStart;
 assert.equal(trialEligibility(t,c).eligible,false);c.observed.catPresentAtStart=true;c.settings.watchDuration=1.3;
 const before=JSON.stringify(c);assert.equal(trialEligibility(t,c).eligible,false);assert.equal(JSON.stringify(c),before);
});
test('visual applicability needs a verified surface/effect',()=>{
 const t=trials.find(t=>t.variable==='backgroundContrast'),c=context();c.observed.contrastChangeVerified=false;
 assert.equal(trialEligibility(t,c).eligible,false);c.observed.contrastChangeVerified=true;c.settings.background='plain';assert.equal(trialEligibility(t,c).eligible,false);
});
