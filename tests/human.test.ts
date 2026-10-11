import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import * as THREE from 'three';
import {decodeHumanAsset,createHumanModel} from '../src/three/humanModel.ts';
import {createGarmentModel,disposeModel} from '../src/three/garmentGeometry.ts';
import {GARMENTS,garmentDefaults} from '../src/garments.ts';
import {DEFAULT_DESIGN} from '../src/patterns.ts';
const bytes=fs.readFileSync(new URL('../public/models/human.bin',import.meta.url));
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
const asset=decodeHumanAsset(buffer);

test('packaged human asset has four distinct valid shapes and rejects a truncated download',()=>{
  assert.equal(asset.indices.length/3,26756);
  assert.equal(new Set(Object.values(asset.variants).map(v=>v.positions.join(','))).size,4);
  for(const shape of Object.values(asset.variants)) {
    assert.equal(shape.positions.length,13380*3);
    assert.ok([...shape.positions,...shape.colors,...shape.eyes.flat()].every(Number.isFinite));
    assert.ok([...asset.indices].every(i=>i<shape.positions.length/3));
    assert.ok(shape.hair.some(Boolean));
  }
  assert.throws(()=>decodeHumanAsset(buffer.slice(0,-1)));
  assert.throws(()=>decodeHumanAsset(new ArrayBuffer(4)));
});

test('every garment renders a clothed human with finite geometry and disposes all GPU resources',()=>{
  for(const garment of GARMENTS)for(const wearer of ['female','male'] as const) {
    const design={...DEFAULT_DESIGN,...garmentDefaults(garment.value),wearer};
    const model=createGarmentModel(design),human=createHumanModel(design,asset);model.human.add(human);
    assert.ok(human.getObjectByName('human-skin'));
    assert.ok(human.getObjectByName('human-eye-0'));
    assert.ok(human.getObjectByName('closed-shoe-1'));
    if(garment.region==='lower')assert.ok(human.getObjectByName('neutral-base-top'));
    if(garment.region==='upper')assert.ok(human.getObjectByName('neutral-trouser-leg-1'));
    const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
    let triangles=0;
    model.group.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      const geometry=object.geometry,position=geometry.getAttribute('position');
      assert.ok([...position.array,...geometry.getAttribute('normal').array].every(Number.isFinite));
      assert.ok([...geometry.index!.array].every(i=>i>=0&&i<position.count));
      triangles+=geometry.index!.count/3;geometries.add(geometry);
      for(const material of Array.isArray(object.material)?object.material:[object.material]){
        materials.add(material);
        if(material instanceof THREE.MeshStandardMaterial)for(const texture of [material.map,material.bumpMap,material.normalMap,material.roughnessMap])if(texture)textures.add(texture);
      }
    });
    assert.ok(triangles<135000,`${garment.value} triangle budget: ${triangles}`);
    let disposedGeometry=0,disposedMaterial=0,disposedTexture=0;
    geometries.forEach(g=>g.addEventListener('dispose',()=>disposedGeometry++));
    materials.forEach(m=>m.addEventListener('dispose',()=>disposedMaterial++));
    textures.forEach(t=>t.addEventListener('dispose',()=>disposedTexture++));
    disposeModel(model);
    assert.equal(disposedGeometry,geometries.size);assert.equal(disposedMaterial,materials.size);
    assert.equal(disposedTexture,textures.size,'shared hair relief and roughness texture is disposed once');
  }
});

test('covered torso and legs cannot poke through the middle of a full dress',()=>{
  const human=createHumanModel({...DEFAULT_DESIGN,...garmentDefaults('dress'),wearer:'female'},asset);
  const mesh=human.getObjectByName('human-skin') as THREE.Mesh,geometry=mesh.geometry,p=geometry.getAttribute('position'),indices=geometry.index!.array;
  for(let i=0;i<indices.length;i+=3){
    const ids=[indices[i],indices[i+1],indices[i+2]],x=ids.reduce((v,id)=>v+p.getX(id),0)/3,y=ids.reduce((v,id)=>v+p.getY(id),0)/3;
    assert.ok(!(Math.abs(x)<.20&&y<.30&&y>-.90));
  }
  const model=createGarmentModel(DEFAULT_DESIGN);model.human.add(human);disposeModel(model);
});
