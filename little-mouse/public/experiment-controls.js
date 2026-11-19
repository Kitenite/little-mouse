import {sensoryTrials} from './experiment-trials.js';
export function createExperimentControls(root,{recorder,storage,onSelectionChange=()=>{}}){
 const make=(tag,props={})=>Object.assign(document.createElement(tag),props);
 const read=()=>{try{return JSON.parse(storage?.getItem('podrick-experiment-choice')||'{}')}catch{return{}}};
 const saved=read();let rotation=Number.isSafeInteger(saved.rotation)?Math.max(0,saved.rotation):0;
 const details=make('details',{className:'control-group',id:'experimentControls'});
 details.append(make('summary',{textContent:'Try variations'}));
 const select=make('select',{id:'experimentTrial',ariaLabel:'Experiment'});
 select.append(make('option',{value:'off',textContent:'Off'}),make('option',{value:'rotation',textContent:'Rotate comparisons each round'}));
 for(const trial of sensoryTrials)select.append(make('option',{value:trial.id,textContent:trial.label}));
 select.value=[...select.options].some(o=>o.value===saved.trial)?saved.trial:'off';
 const actor=make('select',{id:'experimentActor',ariaLabel:'Who is playing?'});
 for(const [value,label]of [['unknown','Player unknown'],['cat','My cat'],['human','Human testing']])actor.append(make('option',{value,textContent:label}));
 actor.value=['cat','human'].includes(saved.actor)?saved.actor:'unknown';
 const note=make('p',{className:'control-note'}),status=make('p',{className:'control-status',role:'status'});
 const feedback=make('div',{className:'experiment-actions'});let observationTarget=null;const observationButtons=[];
 for(const [label,value]of [['Interested','interested'],['Watching','watching'],['Left','departed']]){
  const b=make('button',{type:'button',className:'secondary',textContent:label});b.disabled=true;observationButtons.push(b);b.addEventListener('click',()=>{if(!observationTarget||recorder.exportData().sessions.at(-1)?.id!==observationTarget){status.textContent='No comparison selected for observation.';return;}recorder.observe(value);status.textContent='Observation saved for the last comparison.';});feedback.append(b);
 }
 const exportButton=make('button',{type:'button',className:'secondary',textContent:'Export data'});
 exportButton.addEventListener('click',()=>{const blob=new Blob([JSON.stringify(recorder.exportData(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=make('a',{href:url,download:'podrick-experiments-'+new Date().toISOString().slice(0,10)+'.json'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);status.textContent='Export requested. Data stays on this device until you share it.';});
 const copy=make('button',{type:'button',className:'secondary',textContent:'Copy data'});
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(recorder.exportData(),null,2));status.textContent='Data copied.';}catch{status.textContent='Copy unavailable. Use Export data.';}});
 const clear=make('button',{type:'button',className:'secondary',textContent:'Clear experiment data'});let clearPending=false;
 clear.addEventListener('click',()=>{if(!clearPending){clearPending=true;clear.textContent='Confirm clear';return;}recorder.clear();observationTarget=null;observationButtons.forEach(b=>b.disabled=true);clearPending=false;clear.textContent='Clear experiment data';status.textContent='Experiment data cleared.';});
 function persist(){try{storage?.setItem('podrick-experiment-choice',JSON.stringify({trial:select.value,actor:actor.value,rotation}))}catch{}}
 function refresh(){const t=select.value==='rotation'?sensoryTrials[rotation%sensoryTrials.length]:sensoryTrials.find(t=>t.id===select.value);note.textContent=t?`${t.description||t.label} Changes on the next Play only. Local pilot data; no automatic difficulty changes.`:'Choose a comparison, then Play. No data is recorded while Off.';}
 select.addEventListener('change',()=>{persist();refresh();onSelectionChange();});actor.addEventListener('change',persist);
 details.append(select,actor,note,feedback,exportButton,copy,clear,status);root.append(details);refresh();
 return {
  get actor(){return actor.value;},
  nextTrial(){if(select.value==='off')return null;return select.value==='rotation'?sensoryTrials[rotation%sensoryTrials.length]:sensoryTrials.find(t=>t.id===select.value)||null;},
  resetObservation(){observationTarget=null;observationButtons.forEach(b=>b.disabled=true);},
  started(){observationTarget=recorder.diagnostics().activeId;observationButtons.forEach(b=>b.disabled=false);if(select.value==='rotation')rotation++;persist();refresh();status.textContent='Comparison running. Exit normally; play never stops on a timer.';},
  message(text){status.textContent=text;},
  stopped(){const data=recorder.exportData();status.textContent=`Saved locally · ${data.sessions?.length??0} rounds. Add an observation or Play again.`;},
 };
}
