/** Bake the CC0 MakeHuman mesh into a small static fitting-room asset.
 * Run: node scripts/build-human-model.mjs /path/to/downloaded/source-directory
 * Source URLs, checksums and licenses: public/models/README.md.
 */
import fs from 'node:fs';
import * as T from 'three';
const dir=process.argv[2];if(!dir)throw new Error('Pass the source directory.');
const source=[],faces=[],groups={};let group='';
for(const line of fs.readFileSync(`${dir}/base.obj`,'utf8').split('\n')) {
 const bits=line.trim().split(/\s+/);
 if(bits[0]==='v')source.push(new T.Vector3(...bits.slice(1).map(Number)));
 if(bits[0]==='g')group=bits[1];
 if(bits[0]==='f') {const ids=bits.slice(1).map(b=>Number(b.split('/')[0])-1);(groups[group]??=[]).push(...ids);if(group==='body')for(let i=1;i<ids.length-1;i++)faces.push(ids[0],ids[i],ids[i+1]);}
}
const weights=JSON.parse(fs.readFileSync(`${dir}/weights.json`)).weights;
const vertWeights=source.map(()=>[]);
for(const [name,entries] of Object.entries(weights))for(const [index,weight] of entries)vertWeights[index].push([name,weight]);
const used=[...new Set(faces)].sort((a,b)=>a-b), remap=new Map(used.map((id,i)=>[id,i]));
const indices=faces.map(id=>remap.get(id));
const out={version:1,indices,variants:{}};
for(const gender of ['female','male','female-child','male-child']) {
 const raw=source.map(v=>v.clone());
 for(const line of fs.readFileSync(`${dir}/${gender}.target`,'utf8').split('\n')) {
  const b=line.trim().split(/\s+/);if(b.length===4&&!line.startsWith('#'))raw[Number(b[0])].add(new T.Vector3(...b.slice(1).map(Number)));
 }
 const joint=name=>{const ids=[...new Set(groups[name])];return ids.reduce((sum,i)=>sum.add(raw[i]),new T.Vector3()).multiplyScalar(1/ids.length);};
 const shoulderY=joint('joint-l-shoulder').y,pelvisY=joint('joint-pelvis').y;
 const headTop=Math.max(...used.map(id=>raw[id].y));
 const headCenter=joint('joint-head'),neck=joint('joint-neck'),jaw=joint('joint-jaw');
 const headWidth=2*Math.max(...used.filter(id=>raw[id].y>jaw.y).map(id=>Math.abs(raw[id].x)));
 const headScale=.275/headWidth;
 const neckHeight=.505;
 const body=p=> {
  if(p.y>=neck.y)return new T.Vector3(p.x*headScale,neckHeight+(p.y-neck.y)*headScale,(p.z-neck.z)*headScale-.012);
  const y=p.y>shoulderY?.39+(p.y-shoulderY)*(neckHeight-.39)/(neck.y-shoulderY):-.27+(p.y-pelvisY)*.66/(shoulderY-pelvisY);
  const blend=T.MathUtils.smoothstep(p.y,shoulderY,neck.y);
  return new T.Vector3(p.x*T.MathUtils.lerp(.17,headScale,blend),y,T.MathUtils.lerp((p.z-.25)*.16,(p.z-neck.z)*headScale-.012,blend));
 };
 function segment(p,a,b,c,d,radial=.14) {
  const axis=b.clone().sub(a), target=d.clone().sub(c),offset=p.clone().sub(a),t=offset.dot(axis)/axis.lengthSq();
  const perpendicular=offset.addScaledVector(axis,-t).multiplyScalar(radial).applyQuaternion(new T.Quaternion().setFromUnitVectors(axis.normalize(),target.clone().normalize()));
  return c.clone().addScaledVector(target,t).add(perpendicular);
 }
 const limbs={};
 for(const [s,side] of [[1,'l'],[-1,'r']]) {
  const shoulder=joint(`joint-${side}-shoulder`),elbow=joint(`joint-${side}-elbow`),wrist=joint(`joint-${side}-hand`);
  const hip=joint(`joint-${side}-upper-leg`),knee=joint(`joint-${side}-knee`),ankle=joint(`joint-${side}-ankle`);
  const sh=new T.Vector3(s*.32,.405,0),el=new T.Vector3(s*.49,-.005,0),wr=new T.Vector3(s*.645,-.37,0);
  const hp=new T.Vector3(s*.16,-.27,0),kn=new T.Vector3(s*.18,-.93,.015),an=new T.Vector3(s*.19,-1.50,0);
  limbs[s]={upper:p=>segment(p,shoulder,elbow,sh,el),lower:p=>segment(p,elbow,wrist,el,wr,.13),thigh:p=>segment(p,hip,knee,hp,kn,.145),shin:p=>segment(p,knee,ankle,kn,an,.145)};
 }
 const positions=[],colors=[],hair=[],regions=[];
 const eyeY=(joint('joint-l-eye').y+joint('joint-r-eye').y)/2;
 const lipY=jaw.y+(eyeY-jaw.y)*.32;
 for(const id of used) {
  const p=raw[id],s=p.x>=0?1:-1,limb=limbs[s];let final=new T.Vector3(),sum=0,armWeight=0;
  for(const [bone,w] of vertWeights[id]) {
   let q=body(p);
   if(/upperarm/.test(bone)){q=limb.upper(p);armWeight+=w;}
   else if(/lowerarm|wrist|finger|metacarpal/.test(bone)){q=limb.lower(p);armWeight+=w;}
   else if(/upperleg/.test(bone))q=limb.thigh(p);
   else if(/lowerleg|foot|toe/.test(bone))q=limb.shin(p);
   final.addScaledVector(q,w);sum+=w;
  }
  if(sum)final.multiplyScalar(1/sum);else final=body(p);
  // The source trapezius rises above the shoulder joint. Lower the lateral
  // shoulder tissue smoothly while preserving the neck centre and forearms.
  final.y-=.09*T.MathUtils.smoothstep(Math.abs(final.x),.08,.25)*Math.exp(-(((final.y-.45)/.19)**2));
  positions.push(...final.toArray().map(n=>+n.toFixed(5)));
  // Subtle variation only; no photo texture or inferred skin attributes.
  const skin=new T.Color('#bd8b70');
  // Anatomical groups follow each morphology; fixed source-height bands did
  // not follow the mouth/cheeks of the child and female shapes correctly.
  const lip=Math.exp(-(((p.y-lipY)/.13)**2)-((p.x/.34)**4))*T.MathUtils.smoothstep(p.z,headCenter.z+.65,headCenter.z+1.05);
  skin.lerp(new T.Color('#945d53'),lip*.42);
  const cheek=Math.exp(-(((p.y-(eyeY-.35))/.32)**2)-(((Math.abs(p.x)-.58)/.30)**2))*T.MathUtils.smoothstep(p.z,headCenter.z+.55,headCenter.z+.9);
  skin.lerp(new T.Color('#bc7764'),cheek*.18);
  const noise=Math.sin(id*12.9898)*.002;skin.offsetHSL(0,0,noise);
  colors.push(...skin.toArray().map(n=>+n.toFixed(4)));
  const front=p.z>headCenter.z+.45;
  hair.push(p.y>headTop-(headTop-neck.y)*(front?.23:.63)?1:0);
  regions.push(armWeight>.45?1:0);
 }
 const eyes=['l','r'].map(side=>body(joint(`joint-${side}-eye`)).toArray());
 out.variants[gender]={positions,colors,hair,regions,eyes};
}
const variants=['female','male','female-child','male-child'];
const chunks=[];
const header=Buffer.alloc(12);header.write('BHM1');header.writeUInt32LE(used.length,4);header.writeUInt32LE(indices.length,8);chunks.push(header);
chunks.push(Buffer.from(new Uint16Array(indices).buffer));
for(const key of variants) {
 const v=out.variants[key];chunks.push(Buffer.from(new Float32Array(v.positions).buffer));
 chunks.push(Buffer.from(v.colors.map(n=>Math.round(Math.max(0,Math.min(1,n))*255))));
 chunks.push(Buffer.from(v.hair.map((h,i)=>h+v.regions[i]*2)));
 chunks.push(Buffer.from(new Float32Array(v.eyes.flat()).buffer));
}
fs.writeFileSync('public/models/human.bin',Buffer.concat(chunks));
console.log(`${used.length} vertices; ${indices.length/3} triangles; ${(fs.statSync('public/models/human.bin').size/1024).toFixed(0)} kB`);
