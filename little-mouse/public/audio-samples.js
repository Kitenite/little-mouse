// Recording provenance and processing details: assets/audio/ATTRIBUTION.json.
const ids=(prefix,count)=>Array.from({length:count},(_,i)=>`${prefix}-${String(i+1).padStart(2,'0')}`);
export const recordedSamples=[...ids('mouse',12),...ids('rat',8),...ids('chew',6),...ids('paper',4)];
export const sampleBanks={
 peek:['paper-01','paper-02','paper-03'],
 squeak:['mouse-01','mouse-03','mouse-07','mouse-08','mouse-02','mouse-04','mouse-05','mouse-06','mouse-09','mouse-10','mouse-11','mouse-12'],
 tease:['paper-01','paper-03','paper-04'],
 call:['paper-01','paper-02'],reply:['paper-02','paper-03'],
 hit:['rat-04','rat-05','rat-06','rat-07','mouse-10','mouse-12'],hurt:['rat-01','rat-02','rat-03','rat-05','rat-08'],
 nibble:ids('chew',6),eat:ids('chew',6),groom:['paper-01','paper-03'],facewipe:['paper-01','paper-02'],hindlegscratch:['paper-02','paper-04'],stretch:['paper-01','paper-03'],roll:['paper-03','paper-04'],sniff:['paper-01','paper-02','paper-03'],
 rustle:ids('paper',4),patter:['paper-01','paper-02','paper-03'],retreat:['paper-02','paper-03','paper-04'],
 flinch:['paper-01','paper-03'],dodge:['paper-02','paper-03'],
 tap:['paper-01','paper-03'],scratch:['paper-01','paper-02','paper-04'],
 dragstart:['paper-01','paper-03','mouse-03'],dragloop:['paper-01','paper-02','paper-04'],dragrelease:['paper-02','paper-03'],
};
// Legacy call/reply keys are quiet social movement foley, not vocalizations.
// Keep surface details behind vocal cues; avoid artificial footstep beat trains.
export const sampleMix={eat:.3,groom:.08,facewipe:.07,hindlegscratch:.12,stretch:.07,roll:.14,peek:.12,squeak:.28,tease:.1,call:.08,reply:.07,hit:.38,hurt:.32,nibble:.3,sniff:.1,rustle:.16,patter:.1,retreat:.14,flinch:.16,dodge:.13,tap:.2,scratch:.14,dragstart:.19,dragloop:.12,dragrelease:.19};

// Match friction RMS without flattening individual transients; final mix is limited.
export const sampleTrim={'paper-01':.8,'paper-02':1,'paper-03':1.5,'paper-04':2};
