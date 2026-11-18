export const livelyDefaults={speed:1.2,count:1,size:2.2,hide:3,mode:'hunt',sound:true,behaviorVersion:3};
export function upgradeSettings(settings){
 const upgraded=settings.behaviorVersion===3?settings:{...settings,...livelyDefaults};
 // Repair the legacy persisted mute once after the requested audio overhaul.
 // A new explicit mute carries audioVersion:1 and is never re-enabled by polling.
 return settings.audioVersion===1?{...upgraded,sound:settings.sound}: {...upgraded,sound:true,audioVersion:1};
}
