export function createLearningControls(root,learning){
 const make=(tag,props={})=>Object.assign(document.createElement(tag),props);
 const panel=make('details',{className:'control-group',id:'learningControls'});
 panel.append(make('summary',{textContent:'Play learning'}));
 const actor=make('select',{id:'learningActor',ariaLabel:'Who is playing?'});
 for(const [value,textContent]of [['unknown','Player unknown'],['cat','My cat'],['human','Human testing']])actor.append(make('option',{value,textContent}));
 const mode=make('select',{id:'learningMode',ariaLabel:'Learning policy'});
 for(const [value,textContent]of [['adapt','Adapt slowly'],['fixed','Fixed policy']])mode.append(make('option',{value,textContent}));
 const status=make('p',{className:'control-status',role:'status'});
 function refresh(){const s=learning.status();actor.value=s.actor||'unknown';mode.value=s.frozen?'fixed':'adapt';status.textContent=s.storageError||s.storageMode==='memory-only'?'Local storage unavailable; export to keep data.':'Local only. Three completed cat sessions per chapter before small changes. Taps measure interaction, not enjoyment.';}
 actor.addEventListener('change',()=>{learning.configure({actor:actor.value});refresh();});
 mode.addEventListener('change',()=>{learning.configure({frozen:mode.value==='fixed'});refresh();});
 const exportButton=make('button',{type:'button',className:'secondary',textContent:'Export play data'});
 exportButton.addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([learning.export()],{type:'application/json'})),a=make('a',{href:url,download:'podrick-play-learning.json'});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);});
 const copy=make('button',{type:'button',className:'secondary',textContent:'Copy play data'});
 copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(learning.export());status.textContent='Copied.';}catch{status.textContent='Copy unavailable. Use Export play data.';}});
 const reset=make('button',{type:'button',className:'secondary',textContent:'Reset learning'});let confirm=false;
 reset.addEventListener('click',()=>{if(!confirm){confirm=true;reset.textContent='Confirm reset';return;}learning.reset();confirm=false;reset.textContent='Reset learning';refresh();});
 panel.append(actor,mode,status,exportButton,copy,reset);root.append(panel);refresh();return{refresh};
}
