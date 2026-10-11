import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { DEFAULT_DESIGN, garmentPanelSvg } from '../src/patterns.ts';
import { garmentDefaults } from '../src/garments.ts';
import { PREVIEW_GARMENTS, supports3D } from '../src/previewGarments.ts';
import { createGarmentModel, disposeModel } from '../src/three/garmentGeometry.ts';

test('3D concepts have finite geometry, valid UVs and indices for every supported sleeve/collar variant',()=>{
  for(const garment of PREVIEW_GARMENTS) for(const sleeve of ['short','long','sleeveless'] as const) for(const collar of ['classic','mandarin','round'] as const) {
    const model=createGarmentModel({...DEFAULT_DESIGN,...garmentDefaults(garment),sleeve,collar});
    assert.ok(model.parts.length>0);
    for(const part of model.parts){
      const {geometry}=part.mesh, position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),normal=geometry.getAttribute('normal');
      assert.ok([...position.array,...normal.array].every(Number.isFinite));
      assert.equal(position.count,uv.count);
      assert.ok([...uv.array].every(n=>n>=0&&n<=1));
      assert.ok([...geometry.index!.array].every(n=>n>=0&&n<position.count));
      assert.ok(part.width>0&&part.height>0);
    }
    assert.equal(Boolean(model.group.getObjectByName('sleeve-1')),garment!=='sarong'&&sleeve!=='sleeveless');
    disposeModel(model);
  }
  assert.equal(supports3D('palazzo'),false);
  assert.throws(()=>createGarmentModel({...DEFAULT_DESIGN,garment:'palazzo'}));
});

test('dress is longer and more flared than shirt; sarong has a separate wrap edge',()=>{
  const shirt=createGarmentModel(DEFAULT_DESIGN),dress=createGarmentModel({...DEFAULT_DESIGN,...garmentDefaults('dress')}),sarong=createGarmentModel({...DEFAULT_DESIGN,...garmentDefaults('sarong')});
  const bounds=(model:typeof shirt)=>{const g=model.parts[0].mesh.geometry;g.computeBoundingBox();return g.boundingBox!;};
  assert.ok(bounds(dress).min.y<bounds(shirt).min.y-.3);
  assert.ok(bounds(dress).max.x>bounds(shirt).max.x+.2);
  assert.ok(sarong.group.getObjectByName('wrap-edge'));
  [shirt,dress,sarong].forEach(disposeModel);
});

test('cloth panel atlases preserve added ink and apply placement only to the body',async()=>{
  const design={...DEFAULT_DESIGN,mode:'draw' as const,underlay:false,texture:'plain' as const,strokes:[{points:[[10,50],[90,50]] as [number,number][],color:'#ff0000',width:8}]};
  const buffers=[];
  for(const placement of ['allover','hem','panels'] as const){
    const svg=garmentPanelSvg({...design,placement},.8,1,'body');
    const {data,info}=await sharp(Buffer.from(svg)).resize(300,400).removeAlpha().raw().toBuffer({resolveWithObject:true});
    let red=0;for(let i=0;i<data.length;i+=info.channels) if(data[i]>200&&data[i+1]<30&&data[i+2]<30)red++;
    assert.ok(red>100);buffers.push(data.toString('base64'));
  }
  assert.equal(new Set(buffers).size,3);
  assert.equal(garmentPanelSvg({...design,placement:'hem'},.9,.3,'sleeve'),garmentPanelSvg({...design,placement:'allover'},.9,.3,'sleeve'));
});
