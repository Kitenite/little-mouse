import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../public/vendor/three.module.js';
import{lightingValues,createLighting,lightingPresets}from'../public/lighting.js';
test('lighting sanitizes numeric settings and unknown presets',()=>{
 const c=lightingValues({lighting:'missing',lightAzimuth:NaN,lightElevation:100,shadowStrength:-1});
 assert.equal(c.lighting,'daylight');assert.equal(c.lightAzimuth,135);assert.equal(c.lightElevation,85);assert.equal(c.shadowStrength,0);
});
test('light follows direction, viewport and preset without growing the scene',()=>{
 const scene=new T.Scene(),rig=createLighting(scene),count=scene.children.length;
 for(const lighting of Object.keys(lightingPresets))rig.update({lighting,lightAzimuth:0},1024,768);
 assert.equal(rig.key.position.y,0);assert.ok(rig.key.position.z>0);const previous=rig.key.shadow.camera.right;
 rig.update({lightAzimuth:90,shadowStrength:.6},768,1024);
 assert.ok(rig.key.position.y>0);assert.notEqual(rig.key.shadow.camera.right,previous);assert.equal(rig.floor.material.opacity,.6);assert.equal(scene.children.length,count);
});
