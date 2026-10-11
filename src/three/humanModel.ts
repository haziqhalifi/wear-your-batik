import * as THREE from 'three';
import type { Design } from '../patterns';
import { createGarmentModel } from './garmentGeometry';
import { garmentInfo } from '../garments';

type BodyVariant = {positions:Float32Array;colors:Float32Array;hair:Uint8Array;regions:Uint8Array;eyes:number[][]};
export type HumanAsset = {version:number;indices:Uint16Array;variants:Record<'male'|'female'|'male-child'|'female-child',BodyVariant>};
export function decodeHumanAsset(buffer:ArrayBuffer):HumanAsset {
  const view=new DataView(buffer);
  if(buffer.byteLength<12||view.getUint32(0,false)!==0x42484d31)throw new Error('Invalid human model');
  const count=view.getUint32(4,true),indexCount=view.getUint32(8,true);
  if(count>65535||count<1||indexCount%3||buffer.byteLength!==12+indexCount*2+4*(count*16+24))throw new Error('Invalid human model size');
  let offset=12;
  const indices=new Uint16Array(buffer.slice(offset,offset+indexCount*2));offset+=indexCount*2;
  const variants={} as HumanAsset['variants'];
  for(const key of ['female','male','female-child','male-child'] as const) {
    const positions=new Float32Array(buffer.slice(offset,offset+count*12));offset+=count*12;
    const colors=Float32Array.from(new Uint8Array(buffer,offset,count*3),n=>n/255);offset+=count*3;
    const flags=new Uint8Array(buffer,offset,count);offset+=count;
    const eye=new Float32Array(buffer.slice(offset,offset+24));offset+=24;
    variants[key]={positions,colors,hair:Uint8Array.from(flags,n=>n&1),regions:Uint8Array.from(flags,n=>(n>>1)&1),eyes:[Array.from(eye.slice(0,3)),Array.from(eye.slice(3,6))]};
  }
  return {version:1,indices,variants};
}
let assetPromise:Promise<HumanAsset>|undefined;
export function loadHumanAsset() {
  if(!assetPromise)assetPromise=fetch('/models/human.bin?revision=4').then(async response=>{
    if(!response.ok)throw new Error('Human model unavailable');
    return decodeHumanAsset(await response.arrayBuffer());
  }).catch(error=>{assetPromise=undefined;throw error;});
  return assetPromise;
}

/** An illustrative posed human, never a measured avatar or a fit prediction. */
export function createHumanModel(design:Design,asset:HumanAsset) {
  const info=garmentInfo(design.garment),child=info.group==='kids',lower=info.region==='lower';
  const variant: keyof HumanAsset['variants']=child?`${design.wearer}-child`:design.wearer;
  const data=asset.variants[variant],group=new THREE.Group();group.name='human-model';
  const positions=new Float32Array(data.positions),skinIndices:number[]=[],topIndices:number[]=[],pantsIndices:number[]=[],hairIndices:number[]=[];
  const p=new THREE.Vector3();
  function childPoint(x:number,y:number,z:number) {
    if(!child)return new THREE.Vector3(x,y,z);
    // Shorter limbs and torso, relatively larger head; no personal measurements.
    const blend=THREE.MathUtils.smoothstep(y,.40,.66);
    const targetY=y>.52?.5083+(y-.52)*.95:y<-.27?-.179+(y+.27)*.77:.43+(y-.43)*.87;
    return new THREE.Vector3(x*THREE.MathUtils.lerp(.78,.95,blend),targetY,z*THREE.MathUtils.lerp(.83,.95,blend));
  }
  for(let i=0;i<positions.length;i+=3){p.copy(childPoint(positions[i],positions[i+1],positions[i+2]));positions.set(p.toArray(),i);}
  const needsTop=lower||['blazer','kebaya'].includes(design.garment),needsPants=info.region==='upper';
  const floor=child?-1.17:-1.65;
  const sleeve=info.sleeves.length===1?info.sleeves[0]:design.sleeve;
  const hems:Record<Design['garment'],number>={shirt:-.48,blouse:-.44,kebaya:-.65,tunic:-.86,blazer:-.60,jacket:-.46,dress:-.98,gown:-1.53,maxi:-1.49,skirt:-1.18,sarong:-1.40,palazzo:-1.50,'kids-shirt':-.31,'kids-dress':-.78,romper:-.67};
  for(let i=0;i<asset.indices.length;i+=3) {
    const ids=asset.indices.slice(i,i+3),y=ids.reduce((v,id)=>v+positions[id*3+1],0)/3,x=ids.reduce((v,id)=>v+positions[id*3],0)/3;
    const arm=ids.some(id=>data.regions[id]===1);
    // Closed shoes replace the foot mesh. Base shorts always cover the pelvis.
    if(y<(child?-1.04:-1.50))continue;
    if(info.region!=='lower' && arm && sleeve!=='sleeveless' && y>(sleeve==='long'?(child?-.19:-.34):.07))continue;
    const insideFrontOpening=needsTop&&!lower&&Math.abs(x)<.16&&y>.04;
    // Keep a continuous neck and upper chest. Cutting triangles at the visible
    // neckline creates jagged skin edges; the fitted cloth occludes this area.
    const coveredTorso=info.region!=='lower'&&!arm&&y<.30&&y>hems[design.garment]+.015&&!insideFrontOpening;
    const coveredLegs=lower&&!arm&&y<-.045&&y>hems[design.garment]+.012;
    if(coveredTorso||coveredLegs)continue;
    if(!arm && y<(child?-.19:-.20) && (needsPants||y>(child?-.57:-.54)))pantsIndices.push(...ids);
    else if(needsTop && y>(child?-.25:-.30) && y<.52 && (!arm||lower&&y>.07) && !(Math.abs(x)<.20&&y>.33))topIndices.push(...ids);
    else skinIndices.push(...ids);
    if(ids.every(id=>data.hair[id]))hairIndices.push(...ids);
  }
  const skin=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.55,metalness:0,specularIntensity:.32,sheen:.16,sheenColor:'#b77e69',sheenRoughness:.95});
  const cotton=new THREE.MeshStandardMaterial({color:'#e5ded0',roughness:.95,side:THREE.DoubleSide});
  const trousers=new THREE.MeshStandardMaterial({color:'#3b4142',roughness:.94,side:THREE.DoubleSide});
  const hair=new THREE.MeshStandardMaterial({color:'#211b18',roughness:.70});
  const strands=new Uint8Array(128*128*4);
  for(let y=0;y<128;y++)for(let x=0;x<128;x++) {
    const wave=Math.sin((x+.9*Math.sin(y*.06))*Math.PI/2);
    const value=Math.round(204+30*wave+8*Math.sin(x*17+y*.2)),i=(y*128+x)*4;
    strands[i]=strands[i+1]=strands[i+2]=value;strands[i+3]=255;
  }
  const hairTexture=new THREE.DataTexture(strands,128,128,THREE.RGBAFormat);
  hairTexture.wrapS=hairTexture.wrapT=THREE.RepeatWrapping;
  hairTexture.magFilter=THREE.LinearFilter;hairTexture.minFilter=THREE.LinearMipmapLinearFilter;hairTexture.generateMipmaps=true;hairTexture.needsUpdate=true;
  hair.bumpMap=hairTexture;hair.bumpScale=.0014;hair.roughnessMap=hairTexture;
  const base=new THREE.BufferGeometry();base.setAttribute('position',new THREE.BufferAttribute(positions,3));base.setIndex(new THREE.BufferAttribute(asset.indices,1));base.computeVertexNormals();
  function mesh(name:string,indices:number[],material:THREE.Material,expand=0) {
    const geometry=base.clone();geometry.setIndex(indices);
    if(expand) {
      const attr=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');
      for(let i=0;i<attr.count;i++){
        p.fromBufferAttribute(attr,i);
        const strand=material===hair?.0009*Math.sin(Math.atan2(p.x,p.z)*140+p.y*26):0;
        p.addScaledVector(new THREE.Vector3().fromBufferAttribute(normal,i),expand+strand);attr.setXYZ(i,p.x,p.y,p.z);
      }
    }
    if(material===skin)geometry.setAttribute('color',new THREE.Float32BufferAttribute(data.colors,3));
    if(material===hair) {
      const attr=geometry.getAttribute('position'),uv=new Float32Array(attr.count*2);
      for(let i=0;i<attr.count;i++){uv[i*2]=.5+Math.atan2(attr.getX(i),attr.getZ(i))/(Math.PI*2);uv[i*2+1]=attr.getY(i)*2;}
      geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
    }
    const object=new THREE.Mesh(geometry,material);object.name=name;object.castShadow=true;object.receiveShadow=true;group.add(object);return object;
  }
  mesh('human-skin',skinIndices,skin);
  // Actual loose cloth, rather than colouring the anatomical skin as a shirt.
  if(needsTop) {
    const shirt=createGarmentModel({...design,garment:'shirt',sleeve:lower?'short':'sleeveless',collar:'round',fit:'regular',background:'#e5ded0'});
    shirt.group.name='neutral-base-top';
    for(const object of [...shirt.group.children]) {
      if(!(object instanceof THREE.Mesh))continue;
      const geometry=object.geometry,attr=geometry.getAttribute('position');
      for(let i=0;i<attr.count;i++) {
        const y=attr.getY(i);
        if(y<.15&&!/sleeve|cuff|armhole/.test(object.name)){const t=THREE.MathUtils.clamp((.15-y)/.65,0,1);attr.setY(i,.15-.208*(1-Math.exp(-(.15-y)/.208)));attr.setX(i,attr.getX(i)*(1-.23*t));}
      }
      if(!lower) {
        if(object.name!=='front-panel') {shirt.group.remove(object);geometry.dispose();(object.material as THREE.Material).dispose();continue;}
        const ids=geometry.index!.array,visible:number[]=[];
        for(let i=0;i<ids.length;i+=3){const x=(attr.getX(ids[i])+attr.getX(ids[i+1])+attr.getX(ids[i+2]))/3;const y=(attr.getY(ids[i])+attr.getY(ids[i+1])+attr.getY(ids[i+2]))/3;if(Math.abs(x)<.17&&y>.03)visible.push(ids[i],ids[i+1],ids[i+2]);}
        geometry.setIndex(visible);
      }
      geometry.computeVertexNormals();
    }
    group.add(shirt.group);
  }
  cotton.dispose();
  mesh('neutral-base-bottoms',pantsIndices,trousers,.004);
  mesh('human-hair',hairIndices,hair,.006);
  if(needsPants)for(const side of [-1,1]) {
    const verts:number[]=[],indices:number[]=[];
    const top=child?-.22:-.30,bottom=floor+.14;
    for(let row=0;row<=24;row++)for(let col=0;col<=40;col++) {
      const t=row/24,angle=col/40*Math.PI*2,y=THREE.MathUtils.lerp(bottom,top,t);
      const knee=Math.exp(-(((t-.48)/.12)**2)),ankle=Math.exp(-(((t-.09)/.08)**2));
      const fold=.005*Math.sin(angle*5+t*3)*Math.sin(t*Math.PI)+.0045*(knee+ankle)*Math.sin(t*45+Math.cos(angle)*1.5);
      const radius=THREE.MathUtils.lerp(child?.071:.088,child?.11:.14,t)+fold;
      const bend=.022*Math.sin(t*Math.PI);
      verts.push(side*THREE.MathUtils.lerp(child?.148:.19,child?.125:.16,t)+radius*Math.sin(angle),y,bend+radius*Math.cos(angle));
      if(row<24&&col<40){const a=row*41+col;indices.push(a,a+1,a+41,a+1,a+42,a+41);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();
    const leg=new THREE.Mesh(g,trousers);leg.name=`neutral-trouser-leg-${side}`;leg.castShadow=true;leg.receiveShadow=true;group.add(leg);
  }
  base.dispose();
  const eyeWhite=new THREE.MeshStandardMaterial({color:'#c7bdb0',roughness:.35}),iris=new THREE.MeshStandardMaterial({color:'#493b2e',roughness:.38}),pupil=new THREE.MeshStandardMaterial({color:'#15110f',roughness:.18});
  for(let i=0;i<2;i++) {
    const center=childPoint(...data.eyes[i] as [number,number,number]);center.z-=.003;
    const browPoints=[-.025,0,.026].map((x,j)=>center.clone().add(new THREE.Vector3(x,.030+(j===1?.005:0),.018)));
    const brow=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(browPoints),12,.0028,5,false),hair);brow.name=`human-brow-${i}`;group.add(brow);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(.023,24,16),eyeWhite);eye.position.copy(center);eye.scale.set(1,.8,1);group.add(eye);eye.name=`human-eye-${i}`;
    const irisMesh=new THREE.Mesh(new THREE.SphereGeometry(.010,24,12),iris);irisMesh.scale.z=.24;irisMesh.position.copy(center).add(new THREE.Vector3(0,0,.022));group.add(irisMesh);
    const pupilMesh=new THREE.Mesh(new THREE.SphereGeometry(.0045,16,8),pupil);pupilMesh.scale.z=.3;pupilMesh.position.copy(center).add(new THREE.Vector3(0,0,.025));group.add(pupilMesh);
  }
  const shoeMaterial=new THREE.MeshStandardMaterial({color:'#39332d',roughness:.72}),soleMaterial=new THREE.MeshStandardMaterial({color:'#b7ac9b',roughness:1});
  for(const side of [-1,1]) {
    const shoe=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),shoeMaterial);shoe.name=`closed-shoe-${side}`;
    shoe.position.set(side*(child?.148:.19),floor+.07,.073);shoe.scale.set(child?.071:.078,.068,child?.135:.164);shoe.castShadow=true;group.add(shoe);
    const sole=new THREE.Mesh(new THREE.SphereGeometry(1,32,12),soleMaterial);sole.position.set(shoe.position.x,floor+.016,.073);sole.scale.set(shoe.scale.x+.002,.016,shoe.scale.z+.002);group.add(sole);
  }
  group.userData.floor=floor;
  return group;
}
