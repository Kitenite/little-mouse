import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createExperimentControls} from '../public/experiment-controls.js';
test('observations require the current explicit comparison and reset for ordinary play',()=>{
 const previous=globalThis.document,byId=new Map();
 const node=()=>({children:[],listeners:{},append(...items){this.children.push(...items);for(const item of items)if(item.id)byId.set(item.id,item);},get options(){return this.children;},addEventListener(type,fn){this.listeners[type]=fn;}});
 globalThis.document={createElement:node};
 try{
  let observed=0;const recorder={observe(){observed++;},exportData:()=>({sessions:[{id:'test'}]}),diagnostics:()=>({activeId:'test'})};
  const root=node(),ui=createExperimentControls(root,{recorder}),feedback=root.children[0].children[4],button=feedback.children[0];
  assert.equal(button.disabled,true);button.listeners.click();assert.equal(observed,0);
  ui.started();assert.equal(button.disabled,false);button.listeners.click();assert.equal(observed,1);
  ui.resetObservation();assert.equal(button.disabled,true);button.listeners.click();assert.equal(observed,1);
 }finally{globalThis.document=previous;}
});
