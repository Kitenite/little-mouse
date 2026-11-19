import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NullEngine} from '@babylonjs/core/Engines/nullEngine.js';
import {Scene} from '@babylonjs/core/scene.js';
import {Mesh} from '@babylonjs/core/Meshes/mesh.js';
import {VertexData} from '@babylonjs/core/Meshes/mesh.vertexData.js';
import {FurMaterial} from '@babylonjs/materials/fur/furMaterial.js';
import {readFile} from 'node:fs/promises';
test('pinned official fur library shares animated geometry across shells and disposes',()=>{
 const engine=new NullEngine(),scene=new Scene(engine),mesh=new Mesh('test',scene),v=new VertexData();
 v.positions=[0,0,0,1,0,0,0,1,0];v.normals=[0,0,1,0,0,1,0,0,1];v.uvs=[0,0,1,0,0,1];v.indices=[0,1,2];v.applyToMesh(mesh,true);
 mesh.material=new FurMaterial('fur',scene);const shells=FurMaterial.FurifyMesh(mesh,8);
 assert.equal(shells.length,8);for(const shell of shells)assert.equal(shell.geometry,mesh.geometry);
 mesh.updateVerticesData('position',[0,0,0,2,0,0,0,1,0]);for(const shell of shells)assert.equal(shell.getVerticesData('position')[3],2);
 for(const shell of shells)shell.material?.dispose(false,false);scene.dispose();assert.equal(scene.meshes.length,0);engine.dispose();
});
test('library comparison does not add Babylon downloads to normal play',async()=>{
 const source=await readFile(new URL('../public/game.js',import.meta.url),'utf8');assert.doesNotMatch(source,/babylon|fur-library/);
 const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));assert.equal(pkg.dependencies['@babylonjs/materials'],'9.37.1');assert.equal(pkg.dependencies['@babylonjs/core'],'9.37.1');
});
