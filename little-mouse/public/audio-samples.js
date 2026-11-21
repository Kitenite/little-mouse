// Recording provenance and processing details: assets/audio/ATTRIBUTION.json.
const ids=(prefix,count)=>Array.from({length:count},(_,i)=>`${prefix}-${String(i+1).padStart(2,'0')}`);
// Load direct-touch vocals first, before movement, eating and injury banks.
const touchVocals=ids('floor',4);
export const recordedSamples=[...touchVocals,...ids('mouse',12),...ids('crawl',3),...ids('cracker',6)];
export const sampleBanks={
 peek:ids('crawl',3),
 squeak:['mouse-01','mouse-03','mouse-07','mouse-08','mouse-02','mouse-04','mouse-05','mouse-06','mouse-09','mouse-10','mouse-11','mouse-12'],
 tease:ids('crawl',3),
 call:ids('crawl',3),reply:ids('crawl',3),
 hit:['mouse-10','mouse-12','floor-03','floor-04'],hurt:['mouse-02','mouse-05','mouse-09','mouse-11'],
 nibble:ids('cracker',6),eat:ids('cracker',6),groom:ids('crawl',3),facewipe:ids('crawl',3),hindlegscratch:ids('crawl',3),stretch:ids('crawl',3),roll:ids('crawl',3),sniff:ids('crawl',3),
 rustle:ids('crawl',3),patter:ids('crawl',3),retreat:ids('crawl',3),
 flinch:ids('crawl',3),dodge:ids('crawl',3),
 tap:touchVocals,scratch:ids('crawl',3),
 dragstart:touchVocals,dragloop:ids('crawl',3),dragrelease:touchVocals,
};
// Legacy call/reply keys are quiet social movement foley, not vocalizations.
// Keep surface details behind vocal cues; avoid artificial footstep beat trains.
export const sampleMix={eat:.3,groom:.025,facewipe:.025,hindlegscratch:.035,stretch:.02,roll:.03,peek:.025,squeak:.96,tease:.025,call:.02,reply:.02,hit:.96,hurt:.96,nibble:.3,sniff:.02,rustle:.03,patter:.018,retreat:.022,flinch:.025,dodge:.025,tap:.96,scratch:.035,dragstart:.80,dragloop:.022,dragrelease:.96};

// Preserve recorded transient/dynamic differences; no extra friction normalization.
export const sampleTrim={};

// Recorded crawl texture; material scaling is a game mix, not material-specific recordings.
export function surfaceFriction(background){
 if(['photo-linen','linen','felt','woven','denim','cork','paper'].includes(background))return 1;
 if(['photo-clearing','earth','sand','grass'].includes(background))return .65;
 return .08; // Hard/unknown floors keep friction almost inaudible.
}
