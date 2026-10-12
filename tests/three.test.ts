import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { Vector3 } from 'three';
import { DEFAULT_DESIGN, garmentPanelSvg } from '../src/patterns.ts';
import { GARMENTS, garmentDefaults, garmentInfo } from '../src/garments.ts';
import { PREVIEW_GARMENTS, supports3D } from '../src/previewGarments.ts';
import { createGarmentModel, disposeModel } from '../src/three/garmentGeometry.ts';

test('3D concepts have finite geometry, valid UVs and indices for every supported sleeve/collar variant',()=>{
  assert.equal(PREVIEW_GARMENTS.length,15);
  for(const garment of PREVIEW_GARMENTS) for(const sleeve of (garmentInfo(garment).sleeves.length?garmentInfo(garment).sleeves:[garmentInfo(garment).sleeve])) for(const collar of (garmentInfo(garment).collars.length?garmentInfo(garment).collars:[garmentInfo(garment).collar])) {
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
    assert.equal(Boolean(model.group.getObjectByName('sleeve-1')),garmentInfo(garment).region!=='lower'&&sleeve!=='sleeveless');
    disposeModel(model);
  }
  assert.ok(GARMENTS.every(g=>supports3D(g.value)));
  assert.throws(()=>createGarmentModel({...DEFAULT_DESIGN,garment:'unknown' as typeof DEFAULT_DESIGN.garment}));
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


test('each garment family has its own construction and open hems stay above the floor',()=>{
  const signatures = {
    sarong:['wrapped-cloth','wrap-edge'],skirt:['flared-skirt','folded-waistband'],
    palazzo:['trouser-hips','wide-leg-1','wide-leg--1','trouser-waistband'],
    romper:['front-panel','romper-short-leg-1','romper-short-leg--1'],
    blazer:['notched-lapel-1','welt-pocket-1'],kebaya:['kebaya-front-facing-1'],
    jacket:['zipper-pull','ribbed-waist-true','tailored-cuff-1'],
  } as const;
  for(const [garment,names] of Object.entries(signatures)) {
    const model=createGarmentModel({...DEFAULT_DESIGN,...garmentDefaults(garment as typeof DEFAULT_DESIGN.garment)});
    for(const name of names)assert.ok(model.group.getObjectByName(name),`${garment}: ${name}`);
    disposeModel(model);
  }
  for(const garment of PREVIEW_GARMENTS) {
    const model=createGarmentModel({...DEFAULT_DESIGN,...garmentDefaults(garment)});
    let triangles=0;
    model.group.traverse(object=>{
      if('geometry' in object){const geometry=object.geometry as import('three').BufferGeometry;triangles+=(geometry.index?.count??geometry.getAttribute('position').count)/3;}
    });
    assert.ok(triangles<90000,`${garment} triangle budget: ${triangles}`);
    for(const part of model.parts) {
      part.mesh.geometry.computeBoundingBox();assert.ok(part.mesh.geometry.boundingBox!.min.y>-1.65,garment);
      assert.ok(part.mesh.material.sheen>0);
    }
    disposeModel(model);
  }
});

test('texture UVs preserve motif scale across the narrow waist and wide gown hem',()=>{
  const model=createGarmentModel({...DEFAULT_DESIGN,...garmentDefaults('gown')});
  const geometry=model.parts[0].mesh.geometry,uv=geometry.getAttribute('uv'),pos=geometry.getAttribute('position');
  const {cols,rows}=geometry.userData.grid;
  let minWidth=Infinity,maxWidth=0;
  for(let row=0;row<=rows;row++) {
    const a=row*(cols+1),b=a+cols;
    const physical=pos.getX(b)-pos.getX(a),uvWidth=Math.abs(uv.getX(b)-uv.getX(a));
    if(row<rows*.85){minWidth=Math.min(minWidth,uvWidth);maxWidth=Math.max(maxWidth,uvWidth);}
    assert.ok(physical>0&&uvWidth>0);
  }
  assert.ok(maxWidth>minWidth*1.6,'hem needs more UV width than waist, rather than stretching the same repeat');
  disposeModel(model);
});

test('joined body panels and closed sleeves have continuous shading at their UV seams',()=>{
  for(const garment of ['shirt','gown','dress','jacket','kids-shirt'] as const) {
    const model=createGarmentModel({...DEFAULT_DESIGN,...garmentDefaults(garment)});
    const front=model.parts.find(p=>p.mesh.name==='front-panel')!.mesh.geometry;
    const back=model.parts.find(p=>p.mesh.name==='back-panel')!.mesh.geometry;
    const {cols,rows}=front.userData.grid;
    for(let row=1;row<rows;row++) for(const col of [0,cols]) {
      const index=row*(cols+1)+col;
      const a=new Vector3().fromBufferAttribute(front.getAttribute('normal'),index);
      const b=new Vector3().fromBufferAttribute(back.getAttribute('normal'),index);
      assert.ok(a.dot(b)>.9999,`${garment}: visible shading split at side seam row ${row}`);
    }
    for(const part of model.parts.filter(p=>p.placement==='sleeve')) {
      const g=part.mesh.geometry,{cols,rows}=g.userData.grid;
      for(let row=1;row<rows;row++) {
        const a=row*(cols+1),b=a+cols;
        assert.ok(new Vector3().fromBufferAttribute(g.getAttribute('position'),a).distanceTo(new Vector3().fromBufferAttribute(g.getAttribute('position'),b))<1e-6);
        assert.ok(new Vector3().fromBufferAttribute(g.getAttribute('normal'),a).dot(new Vector3().fromBufferAttribute(g.getAttribute('normal'),b))>.9999,`${garment}: sleeve shading seam`);
      }
    }
    disposeModel(model);
  }
});

test('raised collars form a continuous band instead of two exposed pointed strips',()=>{
  for(const collar of ['classic','mandarin'] as const) {
    const model=createGarmentModel({...DEFAULT_DESIGN,collar});
    const band=model.parts.find(p=>p.mesh.name==='neckband');
    assert.ok(band,'collar should wrap around the complete neck opening');
    const g=band.mesh.geometry,{cols,rows}=g.userData.grid;
    for(let row=0;row<=rows;row++) {
      const p=g.getAttribute('position'),a=new Vector3().fromBufferAttribute(p,row*(cols+1)),b=new Vector3().fromBufferAttribute(p,row*(cols+1)+cols);
      assert.ok(a.distanceTo(b)<1e-6,'collar loop must close');
    }
    disposeModel(model);
  }
});
