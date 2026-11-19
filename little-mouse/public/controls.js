import{settingsSchema,settingGroups,groupDefaults,readProfiles,saveProfile}from'./settings.js';
import{backgroundCatalog,applyBackground}from'./backgrounds.js';
// One control implementation for local play and the playground. Programmatic sync never emits input events.
export function createSettingsControls(root,{getSettings,onChange,onTestSound,storage=globalThis.localStorage}={}){
 const fields=new Map();let profiles={},soundStatus;try{profiles=readProfiles(storage)}catch{}
 const make=(tag,props={})=>Object.assign(document.createElement(tag),props);
 const status=make('p',{className:'control-status',role:'status'});
 function apply(patch){onChange(patch);sync();}
 for(const[group,title]of Object.entries(settingGroups)){
 const details=make('details',{className:'control-group',open:group==='movement'}),summary=make('summary',{textContent:title});details.append(summary);
 if(group==='appearance'){const preview=make('div',{className:'surface-swatch background-preview',ariaLabel:'Selected surface preview'});details.append(preview);fields.set('$preview',preview);}
 for(const[key,spec]of Object.entries(settingsSchema).filter(([,s])=>s.group===group)){
 const row=make('div',{className:'setting-control'}),label=make('label',{textContent:spec.label,htmlFor:key});row.append(label);
 if(spec.type==='number'){
 const pair=make('div',{className:'numeric-control'}),range=make('input',{id:key,type:'range',min:spec.min,max:spec.max,step:spec.step,ariaLabel:spec.label}),number=make('input',{id:key+'Number',type:'number',min:spec.min,max:spec.max,step:spec.step,inputMode:spec.step<1?'decimal':'numeric',ariaLabel:spec.label+' exact value'}),unit=make('span',{textContent:spec.unit,className:'control-unit'});
 range.addEventListener('input',()=>{number.value=range.value;apply({[key]:Number(range.value)});});
 number.addEventListener('change',()=>{if(number.value===''||!Number.isFinite(Number(number.value))){number.value=getSettings()[key];return;}const value=Math.max(spec.min,Math.min(spec.max,Number(number.value)));number.value=key==='count'?Math.round(value):value;range.value=number.value;apply({[key]:Number(number.value)});});
 pair.append(range,number,unit);row.append(pair);fields.set(key,[range,number]);
 }else{
 const input=make(spec.type==='select'?'select':'input',{id:key});if(spec.type==='select'){
 const options=key==='background'?backgroundCatalog.map(v=>({value:v.id,label:v.family+' · '+v.label})):spec.options;for(const option of options)input.append(make('option',{value:option.value,textContent:option.label}));
 }else input.type=spec.type==='boolean'?'checkbox':'color';
 if(spec.type==='boolean')input.setAttribute('role','switch');input.addEventListener('input',()=>apply({[key]:spec.type==='boolean'?input.checked:input.value}));row.append(input);fields.set(key,[input]);
 }details.append(row);
 }
 if(['movement','reactions','animation'].includes(group))details.append(make('p',{className:'control-note',textContent:'Values marked × multiply the normal behavior. 1× is the default; reaction delay and duration controls are relative, not seconds.'}));
 if(group==='movement'){const note=make('p',{id:'huntControls',className:'control-note',textContent:'Peeks, pauses, creeping and retreats respond to recent paw taps. Hunt tempo changes the rhythm; hiding time controls how long the mouse stays away.'});details.append(note);fields.set('$hunt',note);}
 if(group==='sound'&&onTestSound){const test=make('button',{type:'button',className:'secondary',textContent:'Test sound'});soundStatus=make('p',{className:'control-status',role:'status'});test.addEventListener('click',()=>{const result=onTestSound();Promise.resolve(result).catch(e=>setSoundStatus('Sound test failed: '+e.message));});details.append(test,soundStatus);}
 if(group==='sound')details.append(make('p',{className:'control-note',textContent:'Randomized idle, teasing, scurrying and hit cues. Tap the game screen once to unlock audio after opening or updating it.'}));
 const reset=make('button',{type:'button',className:'secondary reset-group',textContent:'Reset '+title.toLowerCase()});reset.addEventListener('click',()=>apply(groupDefaults(group)));details.append(reset);root.append(details);
 }
 const section=make('details',{className:'control-group'});section.append(make('summary',{textContent:'Saved profiles'}));
 const name=make('input',{placeholder:'Profile name',maxLength:48,ariaLabel:'New profile name'}),select=make('select',{ariaLabel:'Saved profile'}),save=make('button',{type:'button',textContent:'Save current',className:'secondary'}),load=make('button',{type:'button',textContent:'Apply profile',className:'secondary'}),remove=make('button',{type:'button',textContent:'Delete profile',className:'secondary'}),reset=make('button',{type:'button',textContent:'Reset all settings',className:'secondary'});
 function refresh(){const current=select.value;select.replaceChildren();for(const key of Object.keys(profiles))select.append(make('option',{value:key,textContent:key}));if(Object.hasOwn(profiles,current))select.value=current;load.disabled=remove.disabled=!Object.keys(profiles).length;}
 save.addEventListener('click',()=>{try{profiles=saveProfile(storage,name.value,getSettings());refresh();select.value=name.value.trim().slice(0,48);status.textContent='Profile saved on this device.';}catch(e){status.textContent=e.message;}});
 load.addEventListener('click',()=>{if(profiles[select.value]){apply(profiles[select.value]);status.textContent='Profile applied live.';}});
 remove.addEventListener('click',()=>{delete profiles[select.value];try{storage.setItem('little-mouse-profiles',JSON.stringify(profiles));refresh();status.textContent='Profile deleted.';}catch{status.textContent='Could not save profiles on this device.';}});
 reset.addEventListener('click',()=>{apply(groupDefaults());status.textContent='All settings reset.';});section.append(name,save,select,load,remove,reset,make('p',{className:'control-note',textContent:'Profiles are saved on this device. Applying one updates this game.'}));root.append(section,status);refresh();
 function sync(){const config=getSettings();for(const[key,inputs]of fields){if(key.startsWith('$'))continue;for(const input of inputs){if(document.activeElement===input)continue;if(settingsSchema[key].type==='boolean')input.checked=config[key];else input.value=config[key];}}fields.get('$hunt').hidden=config.mode!=='hunt';applyBackground(fields.get('$preview'),config);}
 function setSoundStatus(message){if(soundStatus&&soundStatus.textContent!==message)soundStatus.textContent=message;}
 sync();return{sync,setSoundStatus};
}
