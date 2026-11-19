import {settingsDefaults} from './settings.js';
export const livelyDefaults={speed:1.2,count:2,size:2.2,hide:2.5,mode:'hunt',sound:true,behaviorVersion:3};
export function upgradeSettings(settings){
 const upgraded=settings.behaviorVersion===3?settings:{...settings,...livelyDefaults};
 // Repair the legacy persisted mute once after the requested audio overhaul.
 // A new explicit mute carries audioVersion:1 and is never re-enabled by polling.
 return settings.audioVersion===1?{...upgraded,sound:settings.sound}: {...upgraded,sound:true,audioVersion:1};
}

// Apply the owner's faster/larger preset once; later local adjustments remain authoritative.
export function upgradePlayStyle(settings,saved={}){
 if(saved.playStyleVersion===1)return settings;
 const size=Number.isFinite(saved.size)&&saved.size>=.6&&saved.size<=3
  ? Math.round(saved.size*130)/100 : settingsDefaults.size;
 const patch=Object.fromEntries(['speed','hide','huntTempo','runThroughChance','peekDuration','watchDuration','creepSpeed','dartSpeed'].map(key=>[key,settingsDefaults[key]]));
 return {...settings,...patch,size,playStyleVersion:1};
}
