import * as THREE from 'three';
import type { Design } from '../patterns';
import { garmentInfo } from '../garments';
import { supports3D } from '../previewGarments';

export type ClothPart = { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>; width: number; height: number; placement: 'body' | 'sleeve' | 'trim' | 'wrap' };
export type GarmentModel = { group: THREE.Group; parts: ClothPart[]; human: THREE.Group; bottom: number };
type Point = (u: number, v: number) => THREE.Vector3;
type Profile = readonly (readonly [number, number, number])[];
const lerp = THREE.MathUtils.lerp;

function surface(cols: number, rows: number, at: Point, reverse = false) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    positions.push(...at(i / cols, j / rows).toArray());
    uv.push(reverse ? 1 - i / cols : i / cols, j / rows);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
    indices.push(...(reverse ? [a,c,b,b,c,d] : [a,b,c,b,d,c]));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  geometry.userData.grid={cols,rows};
  return geometry;
}

// UV islands need separate vertices, but a sewn surface should still share its
// lighting normal. Only join coincident boundary vertices; preserve sharp folds
// and leave overlapping trims, seams and the sarong's open wrap edge separate.
function smoothClothJoins(parts: ClothPart[]) {
  const joins=new Map<string,{geometry:THREE.BufferGeometry;index:number;normal:THREE.Vector3}[]>();
  for(const {mesh} of parts) {
    const geometry=mesh.geometry,grid=geometry.userData.grid;
    if(!grid)continue;
    const {cols,rows}=grid,position=geometry.getAttribute('position'),normal=geometry.getAttribute('normal');
    for(let row=0;row<=rows;row++)for(let col=0;col<=cols;col++) {
      if(row!==0&&row!==rows&&col!==0&&col!==cols)continue;
      const index=row*(cols+1)+col;
      const key=[position.getX(index),position.getY(index),position.getZ(index)].map(v=>Math.round(v*1e5)).join(',');
      const entries=joins.get(key)??[];
      entries.push({geometry,index,normal:new THREE.Vector3().fromBufferAttribute(normal,index)});joins.set(key,entries);
    }
  }
  for(const entries of joins.values())if(entries.length>1)for(const entry of entries) {
    const normal=new THREE.Vector3();
    for(const other of entries)if(entry.geometry===other.geometry||entry.normal.dot(other.normal)>.25)normal.add(other.normal);
    normal.normalize();entry.geometry.getAttribute('normal').setXYZ(entry.index,normal.x,normal.y,normal.z);
  }
}

// Monotone cubic tangents keep a continuous silhouette through the waist and
// hips. Easing every segment to zero used to create stacked, rigid-looking bulges.
function profileAt(profile: Profile, y: number): [number, number] {
  if(y<=profile[0][0])return [profile[0][1],profile[0][2]];
  for (let i = 1; i < profile.length; i++) if (y <= profile[i][0]) {
    const a = profile[i - 1], b = profile[i];
    const h=b[0]-a[0],t=(y-a[0])/h;
    const tangent=(j:number,k:1|2)=>{
      const slope=(n:number)=>(profile[n+1][k]-profile[n][k])/(profile[n+1][0]-profile[n][0]);
      if(j===0)return slope(0);
      if(j===profile.length-1)return slope(j-1);
      const l=slope(j-1),r=slope(j);
      return l*r<=0?0:2*l*r/(l+r);
    };
    return ([1,2] as const).map(k=>(2*t**3-3*t*t+1)*a[k]+(t**3-2*t*t+t)*h*tangent(i-1,k)+(-2*t**3+3*t*t)*b[k]+(t**3-t*t)*h*tangent(i,k)) as [number,number];
  }
  return [profile.at(-1)![1], profile.at(-1)![2]];
}

/** Original static tailoring concepts, not measured product assets or simulated cloth. */
export function createGarmentModel(design: Design): GarmentModel {
  if (!supports3D(design.garment)) throw new Error('This garment has no 3D concept model.');
  const kind = design.garment, info = garmentInfo(kind);
  const child = info.group === 'kids', lower = info.region === 'lower';
  const dress = ['dress','maxi','gown','kids-dress'].includes(kind);
  const blazer = kind === 'blazer', bomber = kind === 'jacket', kebaya = kind === 'kebaya';
  const relaxed = design.fit === 'relaxed' ? 1.07 : 1;
  const group = new THREE.Group(), human = new THREE.Group(), parts: ClothPart[] = [];
  group.name = `concept-${kind}`;
  const bottom = ({shirt:-.48,blouse:-.44,sarong:-1.12,kebaya:-.65,tunic:-.86,gown:-1.26,dress:-.98,maxi:-1.23,blazer:-.60,skirt:-.99,palazzo:-1.17,jacket:-.46,'kids-shirt':-.31,'kids-dress':-.78,romper:-.67})[kind];
  const seamMaterial = new THREE.MeshStandardMaterial({color: design.background, roughness: .92});
  const trimMaterial = new THREE.MeshStandardMaterial({color: design.background, roughness: .85});
  const metalMaterial = new THREE.MeshStandardMaterial({color: design.wax, metalness: .45, roughness: .38});
  function cloth(name: string, geometry: THREE.BufferGeometry, width: number, height: number, placement: ClothPart['placement'] = 'body') {
    // Lay out each row by arc length so large hems do not stretch the batik motif.
    const grid=geometry.userData.grid as {cols:number;rows:number}|undefined;
    if(grid&&placement!=='trim') {
      const {cols,rows}=grid,positions=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
      const rowLengths:number[][]=[];let maxLength=0;
      const a=new THREE.Vector3(),b=new THREE.Vector3();
      for(let j=0;j<=rows;j++) {
        const lengths=[0];
        for(let i=1;i<=cols;i++) {
          a.fromBufferAttribute(positions,j*(cols+1)+i-1);b.fromBufferAttribute(positions,j*(cols+1)+i);
          lengths.push(lengths[i-1]+a.distanceTo(b));
        }
        rowLengths.push(lengths);maxLength=Math.max(maxLength,lengths[cols]);
      }
      geometry.computeBoundingBox();const bounds=geometry.boundingBox!;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++) {
        const index=j*(cols+1)+i,lengths=rowLengths[j];
        const u=.5+(lengths[i]-lengths[cols]/2)/maxLength;
        uv.setX(index,uv.getX(j*(cols+1))>uv.getX(j*(cols+1)+cols)?1-u:u);
        if(placement==='body')uv.setY(index,(positions.getY(index)-bounds.min.y)/(bounds.max.y-bounds.min.y));
      }
      width=maxLength;if(placement==='body')height=bounds.max.y-bounds.min.y;
    }
    const fineCloth=kind==='gown'||kind==='kebaya';
    const material = new THREE.MeshPhysicalMaterial({color:design.background,roughness:fineCloth?.76:.9,metalness:0,side:THREE.DoubleSide,sheen:fineCloth?.3:.18,sheenRoughness:.85,sheenColor:'#ddd4c5',specularIntensity:.22});
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); parts.push({mesh,width,height,placement}); return mesh;
  }
  function detail(name: string, geometry: THREE.BufferGeometry, material: THREE.Material = trimMaterial) {
    const mesh = new THREE.Mesh(geometry,material); mesh.name=name;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  function seam(points: THREE.Vector3[], name: string, thickness = .0016, material = seamMaterial) {
    const curve = new THREE.CatmullRomCurve3(points);
    detail(name,new THREE.TubeGeometry(curve,points.length*2,thickness,5,false),material);
  }
  function edge(at: Point, v: number, name: string, thickness = .0016) {
    seam(Array.from({length:65},(_,i)=>at(i/64,v)),name,thickness);
  }
  function button(x: number, y: number, z: number, name: string, size = .008) {
    const mesh=detail(name,new THREE.CylinderGeometry(size,size,.004,16),metalMaterial);
    mesh.rotation.x=Math.PI/2;mesh.position.set(x,y,z);
    for (const side of [-1,1]) {const hole=detail(`${name}-stitch`,new THREE.SphereGeometry(.0017,6,4),seamMaterial);hole.position.set(x+side*.0025,y,z+.003);}
  }
  function ribbon(name: string, at: Point, width: number, height: number, solid = false) {
    const geometry=surface(64,6,at);
    if (solid) return detail(name,geometry);
    return cloth(name,geometry,width,height,'trim');
  }
  function lowerRing(name: string, at: Point, width: number, height: number, placement: ClothPart['placement'] = 'wrap') {
    cloth(name,surface(112,64,at),width,height,placement);
    edge(at,.012,`${name}-hem`,.0025);edge(at,.993,`${name}-waist`,.002);
  }

  if (kind === 'sarong' || kind === 'skirt') {
    const wrap=kind==='sarong', top=.24, length=top-bottom;
    const point: Point = (u,v) => {
      const angle=u*Math.PI*(wrap?2.22:2)-(wrap?.38:0), t=1-v;
      const fold=(wrap?.016:.038)*(Math.sin(angle*6+t*.5)+.18*Math.sin(angle*10-t*.7))*THREE.MathUtils.smootherstep(t,0,1);
      const radius=wrap ? .365+.052*Math.sin(v*Math.PI)+.025*t : .30+.34*Math.pow(t,.8);
      const depth=wrap ? .23+.025*Math.sin(v*Math.PI) : .19+.23*Math.pow(t,.8);
      const overlap=wrap ? u*.017 : 0;
      return new THREE.Vector3((radius+fold+overlap)*Math.sin(angle),bottom+v*length+.009*Math.cos(angle*12)*t,(depth+fold+overlap)*Math.cos(angle));
    };
    lowerRing(wrap?'wrapped-cloth':'flared-skirt',point,wrap?2.25:2.7,length);
    ribbon('folded-waistband',(u,v)=>point(u,.96+.04*v).multiply(new THREE.Vector3(1.008,1,1.008)),2.1,.055);
    if(wrap) seam(Array.from({length:65},(_,i)=>point(1,i/64)),'wrap-edge',.003);
    else seam(Array.from({length:65},(_,i)=>point(.5,i/64)),'back-skirt-seam');
  } else if (kind === 'palazzo') {
    // A joined hip section transitions to two distinct, open, wide trouser legs.
    const hip: Point=(u,v)=>{
      const angle=u*Math.PI*2, s=Math.sin(angle), c=Math.cos(angle);
      const width=lerp(.392,.30,THREE.MathUtils.smoothstep(v,.2,1));
      const saddle=-.17-.13*(1-Math.abs(s))**4;
      const legDepth=Math.sign(c)*.232*Math.sqrt(Math.max(0,1-(2*Math.abs(s)-1)**2));
      return new THREE.Vector3(width*s,lerp(saddle,.24,v),lerp(legDepth,.23*c,THREE.MathUtils.smoothstep(v,0,.7)));
    };
    cloth('trouser-hips',surface(96,28,hip),2.05,.43,'body');
    for(const side of [-1,1]) {
      const leg: Point=(u,v)=>{
        const angle=u*Math.PI*2, t=1-v, fold=.022*(Math.sin(angle*5+t*.6)+.25*Math.sin(angle*9-t))*t;
        const xCenter=side*lerp(.215,.196,v);
        const rx=lerp(.205,.196,v)+fold, rz=lerp(.26,.232,v)+fold;
        // Curved saddle at the inner seam joins the hips without a flat crotch cap.
        const inner=(1-side*Math.sin(angle))/2;
        const top=-.17-.13*inner**4;
        return new THREE.Vector3(xCenter+rx*Math.sin(angle),lerp(bottom,top,v)+.006*Math.cos(angle*7)*t,rz*Math.cos(angle));
      };
      lowerRing(`wide-leg-${side}`,leg,1.43,1.04,'body');
      seam(Array.from({length:50},(_,i)=>leg(side===1?.25:.75,i/49)),`trouser-side-seam-${side}`);
    }
    ribbon('trouser-waistband',(u,v)=>hip(u,.90+.1*v).multiply(new THREE.Vector3(1.009,1,1.009)),2,.045);
    seam([new THREE.Vector3(0,.20,.238),new THREE.Vector3(.018,.08,.244),new THREE.Vector3(.018,-.10,.237)],'trouser-fly');
    button(0,.215,.243,'waist-button');
  } else {
    const torsoBottom=kind==='romper'?-.38:bottom;
    const shoulderWidth=child?.31:.40;
    const top=.55, waist=child?.04:-.03;
    let profile: Profile;
    if(dress) profile=[[bottom,kind==='gown'?.78:kind==='maxi'?.65:child?.52:.65,kind==='gown'?.46:kind==='maxi'?.40:.32],[waist,child?.235:.285,.165],[.28,child?.29:.375,child?.18:.23],[top,shoulderWidth,.19]];
    else if(kebaya) profile=[[bottom,.44,.22],[-.29,.35,.21],[waist,.285,.17],[.28,.37,.225],[top,.39,.19]];
    else if(blazer) profile=[[bottom,.405,.235],[-.05,.32,.205],[.28,.40,.235],[top,.415,.205]];
    else if(bomber) profile=[[bottom,.32,.19],[bottom+.12,.405,.25],[.23,.405,.25],[top,.40,.20]];
    else if(kind==='tunic') profile=[[bottom,.44,.24],[-.30,.365,.215],[.28,.39,.225],[top,.40,.20]];
    else if(child) profile=[[torsoBottom,.30,.19],[.10,.285,.18],[top,.31,.18]];
    else profile=[[bottom,kind==='blouse'?.405:.375,.22],[-.05,kind==='blouse'||design.wearer==='female'?.32:.365,.20],[.28,.385,.23],[top,.40,.20]];
    const neckFraction=child?.40:.36, shoulderFraction=.74;
    const neckline=(s:number,front:boolean)=> {
      const a=Math.abs(s);
      if(a<neckFraction) {
        if(front&&(blazer||kebaya))return lerp(blazer?-.02:.13,top,a/neckFraction);
        return (front?.40:.52)+(front?.15:.03)*(a/neckFraction)**2;
      }
      if(a<shoulderFraction) return lerp(top,.47,(a-neckFraction)/(shoulderFraction-neckFraction));
      return .47-.31*Math.sqrt((a-shoulderFraction)/(1-shoulderFraction));
    };
    const panel=(u:number,v:number,front:boolean)=>{
      const s=2*u-1;
      let hem=torsoBottom;
      if(kind==='romper') hem=-.30-.10*(1-Math.abs(s))**4;
      else if(kebaya) hem+=.13*Math.abs(s); // pointed front hem
      else if(!dress&&!bomber) hem+=.025*Math.cos(s*Math.PI);
      const y=lerp(hem,neckline(s,front),v), [width,depth]=profileAt(profile,y);
      let curve=Math.sqrt(Math.max(0,1-s*s));
      if(kind==='romper')curve=lerp(Math.sqrt(Math.max(0,1-(2*Math.abs(s)-1)**2)),curve,THREE.MathUtils.smoothstep(v,0,.22));
      const skirtAmount=dress?THREE.MathUtils.smoothstep(waist-y,0,waist-bottom):0;
      const angle=Math.asin(s);
      const vertical=(.004+.030*skirtAmount)*(Math.sin(angle*6+y*.6)+.18*Math.sin(angle*10-y*.5));
      // Broad folds hang from the waist; small diagonal creases gather near it.
      const gathered=Math.exp(-(((y-waist+.05)/.20)**2));
      const tension=(.002+.005*gathered)*Math.sin(y*12+Math.abs(s)*5+.35)*Math.sin(v*Math.PI);
      const bust=front&&!child&&!bomber?.012*Math.exp(-(((y-.23)/.18)**2)):0;
      return new THREE.Vector3(s*(width+.018*skirtAmount*Math.sin(angle*14+y*.9))*relaxed,y,(front?1:-1)*(depth+vertical+tension+bust)*curve);
    };
    for(const front of [true,false]) {
      // Even angular spacing keeps the curved sides as smooth as the centre.
      const at:Point=(u,v)=>panel((1+Math.sin((u-.5)*Math.PI))/2,v,front);
      cloth(front?'front-panel':'back-panel',surface(80,72,at,!front),shoulderWidth*2.8*relaxed,top-torsoBottom);
      edge(at,.01,`hem-${front}`,.0022);
      seam(Array.from({length:49},(_,i)=>panel((1-neckFraction)/2+neckFraction*i/48,1,front)),`neck-${front}`,.002);
    }
    for(const side of [-1,1]) {
      const uFor=(s:number)=>(1+side*s)/2;
      const shoulder:Point=(u,v)=>{
        const p=panel(uFor(lerp(neckFraction,shoulderFraction,u)),1,true).lerp(panel(uFor(lerp(neckFraction,shoulderFraction,u)),1,false),v);
        p.y+=.035*Math.sin(v*Math.PI)*THREE.MathUtils.smoothstep(u,0,.25);
        return p;
      };
      cloth(`shoulder-${side}`,surface(24,16,shoulder,side<0),.22,.29,'trim');
      seam(Array.from({length:40},(_,i)=>panel(side<0?0:1,i/39,true)),`side-seam-${side}`);
      const sleeve=info.sleeves.length===1?info.sleeves[0]:design.sleeve;
      // Match the sleeve root to the front/back armhole and shoulder bridge.
      const root=(u:number)=> {
        if(u<.45) return panel(uFor(lerp(shoulderFraction,1,u/.45)),1,true);
        if(u<.9) return panel(uFor(lerp(1,shoulderFraction,(u-.45)/.45)),1,false);
        const t=(u-.9)/.1,p=panel(uFor(shoulderFraction),1,false).lerp(panel(uFor(shoulderFraction),1,true),t);
        p.y+=.035*Math.sin(t*Math.PI);return p;
      };
      if(sleeve!=='sleeveless') {
        const long=sleeve==='long', length=(long?.72:.29)*(child?.74:1);
        const origin=new THREE.Vector3(side*shoulderWidth*.91*relaxed,.32,0);
        const axis=new THREE.Vector3(side*.5,-.866,0).normalize(), tangent=new THREE.Vector3(side*.866,.5,0).normalize();
        const sleevePoint:Point=(u,v)=>{
          const start=root(u),relative=start.clone().sub(origin);
          // Carry each armhole point into the same direction at the cuff. A
          // fixed angular phase twisted the front and back into pinched ridges.
          const theta=Math.atan2(relative.z,relative.dot(tangent));
          const radius=lerp(child?.105:.125,long?.071:child?.098:.118,v);
          const elbow=Math.exp(-(((v-.56)/.19)**2));
          const fold=((long?.008:.003)*Math.sin(v*14+Math.cos(theta)*1.6)*elbow+.002*Math.sin(theta*3+v*2))*Math.sin(v*Math.PI);
          const ring=origin.clone().addScaledVector(axis,length*v).addScaledVector(tangent,Math.cos(theta)*(radius+fold)).add(new THREE.Vector3(0,0,Math.sin(theta)*(radius+fold)));
          const blend=THREE.MathUtils.smootherstep(v,0,.6);
          return start.addScaledVector(axis,length*v).lerp(ring,blend);
        };
        cloth(`sleeve-${side}`,surface(64,40,sleevePoint,side<0),child?.67:.88,length,'sleeve');
        edge(sleevePoint,.985,`cuff-${side}`,.0025);
        edge(sleevePoint,.015,`armhole-${side}`,.0015);
        if(long) {
          const cuff:Point=(u,v)=>sleevePoint(u,lerp(.88,1,v)).addScaledVector(tangent,.001*Math.cos(u*Math.PI*2));
          ribbon(`tailored-cuff-${side}`,cuff,.49,length*.12,bomber);
          edge(sleevePoint,.88,`cuff-stitch-${side}`);
          if(!bomber) {const p=sleevePoint(.15,.94);button(p.x,p.y,p.z+.004,`cuff-button-${side}`,.005);}
          if(bomber) for(let i=0;i<38;i++)seam([cuff(i/38,0),cuff(i/38,.5),cuff(i/38,1)],`cuff-rib-${side}-${i}`,.001);
        }
      } else seam(Array.from({length:65},(_,i)=>root(i/64)),`bound-armhole-${side}`,.004);
    }
    const frontZ=(x:number,y:number)=>{
      const [w,d]=profileAt(profile,y);return d*Math.sqrt(Math.max(0,1-(x/(w*relaxed))**2))+.012;
    };
    // Fitted darts catch the light without stamping a line through the print.
    if(dress||kebaya||blazer||kind==='blouse')for(const side of [-1,1]) {
      seam([-.28,waist,.20].map((y,i)=>{const x=side*(i===1?.135:.16);return new THREE.Vector3(x,y,frontZ(x,y));}),`front-dart-${side}`,.001);
    }
    if(blazer||kebaya) {
      for(const side of [-1,1]) {
        const lapel:Point=(u,v)=>{
          const x=side*lerp(lerp(.015,.14,v),lerp(.10,blazer?.285:.19,v),u),y=lerp(blazer?-.13:.05,.52,v)-Math.sin(u*Math.PI)*.025;
          return new THREE.Vector3(x,y,frontZ(x,y)+.010+Math.sin(u*Math.PI)*.028);
        };
        ribbon(blazer?`notched-lapel-${side}`:`kebaya-front-facing-${side}`,lapel,.20,.65);
        seam(Array.from({length:40},(_,i)=>lapel(1,i/39)),`lapel-edge-${side}`,.002);
        if(blazer) {
          const pocket:Point=(u,v)=>{const x=side*(.15+u*.17),y=-.32+v*.048;return new THREE.Vector3(x,y,frontZ(x,y)+.009);};
          ribbon(`welt-pocket-${side}`,pocket,.17,.048);edge(pocket,.05,`pocket-edge-${side}`);
        }
      }
      for(let y=blazer?-.30:-.20;y<.04;y+=.12)button(blazer?.04:0,y,frontZ(0,y)+.01,`fastening-${y}`,blazer?.012:.008);
    } else if(design.collar!=='round'||bomber) {
      const neckPoint=(u:number)=>{
        const left=(1-neckFraction)/2,right=(1+neckFraction)/2;
        if(u<=.4)return panel(lerp(left,right,u/.4),1,true);
        if(u<=.5)return panel(right,1,true).lerp(panel(right,1,false),(u-.4)/.1);
        if(u<=.9)return panel(lerp(right,left,(u-.5)/.4),1,false);
        return panel(left,1,false).lerp(panel(left,1,true),(u-.9)/.1);
      };
      const neckCurve=new THREE.CatmullRomCurve3(Array.from({length:40},(_,i)=>neckPoint(i/40)),true);
      const neckband:Point=(u,v)=>{
        const p=neckCurve.getPoint(u),height=design.collar==='mandarin'||bomber?.045:.025;
        p.y+=height*v;p.x*=1-.035*v;p.z*=1-.035*v;
        return p;
      };
      cloth('neckband',surface(120,8,neckband),1,.055,'trim');
      edge(neckband,1,'neckband-topstitch',.0015);
      if(design.collar==='classic'&&!bomber)for(const side of [-1,1]) {
        const collar:Point=(u,v)=>{
          const neckU=side<0?lerp(0,.19,u):lerp(.4,.21,u);
          const a=neckband(neckU,.8);
          const b=new THREE.Vector3(side*lerp(.21,.09,u),lerp(.43,.31,u),lerp(.205,.25,u));
          const p=a.lerp(b,v);p.z+=Math.sin(v*Math.PI)*.012;return p;
        };
        ribbon(`collar-${side}`,collar,.24,.22);edge(collar,1,`collar-topstitch-${side}`);
      }
    }
    if((['shirt','kids-shirt','tunic'].includes(kind)&&design.collar!=='round')||bomber) {
      const start=bomber?bottom+.06:torsoBottom+.05,end=.39;
      ribbon(bomber?'zipper-tape':'button-placket',(u,v)=>{const x=(u-.5)*(bomber?.014:.03),y=lerp(start,end,v);return new THREE.Vector3(x,y,frontZ(x,y)+.003);},.03,end-start,true);
      if(bomber) {
        for(let y=start;y<end;y+=.015) {const tooth=detail('zipper-tooth',new THREE.BoxGeometry(.012,.004,.003),metalMaterial);tooth.position.set(0,y,frontZ(0,y)+.007);}
        const pull=detail('zipper-pull',new THREE.BoxGeometry(.019,.034,.006),metalMaterial);pull.position.set(0,.34,frontZ(0,.34)+.015);
        for(const front of [true,false])ribbon(`ribbed-waist-${front}`,(u,v)=>panel(u,.012+v*.075,front).multiply(new THREE.Vector3(1.008,1,1.02)),1,.07,true);
      } else for(let y=start+.06;y<end;y+=child?.115:.145)button(0,y,frontZ(0,y)+.007,`shirt-button-${y}`,child?.006:.008);
    }
    if(kind==='romper') for(const side of [-1,1]) {
      const leg:Point=(u,v)=>{
        const angle=u*Math.PI*2, inner=(1-side*Math.sin(angle))/2;
        return new THREE.Vector3((side*.15+(.15+.009*Math.sin(angle*6)*(1-v))*Math.sin(angle))*relaxed,lerp(bottom,-.30-.10*inner**4,v),.19*Math.cos(angle));
      };
      lowerRing(`romper-short-leg-${side}`,leg,.99,.37,'body');
    }
  }

  // Human meshes are loaded separately, once per session, by the scene adapter.
  human.name='human-model';group.add(human);
  let displayedBottom=bottom;
  if(lower) {
    const targetBottom=kind==='skirt'?-1.18:kind==='palazzo'?-1.50:-1.40;
    displayedBottom=targetBottom;
    const scale=(targetBottom+.03)/(bottom-.24);
    for(const object of group.children)if(object!==human){object.scale.y=scale;object.position.y=-.03-.24*scale;}
  }
  if(kind==='gown'||kind==='maxi') {
    displayedBottom=-.03+(bottom+.03)*1.22;
    for(const object of group.children)if(object instanceof THREE.Mesh) {
      const attr=object.geometry.getAttribute('position');
      for(let i=0;i<attr.count;i++){const y=attr.getY(i);if(y<-.03)attr.setY(i,-.03+(y+.03)*1.22);}
      object.geometry.computeVertexNormals();
    }
  }
  if(!lower) {
    // Seat the shoulders on the body instead of suspending a wide, high shell
    // above it. Deform seams, collars and sleeves together to preserve joins.
    for(const object of group.children)if(object instanceof THREE.Mesh) {
      object.updateMatrix();const inverse=object.matrix.clone().invert();
      const attr=object.geometry.getAttribute('position');
      for(let i=0;i<attr.count;i++) {
        const vertex=new THREE.Vector3().fromBufferAttribute(attr,i).applyMatrix4(object.matrix);
        const {x,y,z}=vertex;
        const shoulder=Math.exp(-(((y-.43)/.24)**2));
        const drop=.09*THREE.MathUtils.smoothstep(y,.18,.55);
        vertex.set(x*(1-.105*shoulder),y-drop,z*(1-.10*shoulder)).applyMatrix4(inverse);
        attr.setXYZ(i,vertex.x,vertex.y,vertex.z);
      }
      object.geometry.computeVertexNormals();
    }
  }
  smoothClothJoins(parts);
  // Materials shared by details may be unused for simple separates.
  const used=new Set<THREE.Material>();group.traverse(o=>{if(o instanceof THREE.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])used.add(m);});
  for(const m of [seamMaterial,trimMaterial,metalMaterial])if(!used.has(m))m.dispose();
  return {group,parts,human,bottom:displayedBottom};
}

export function disposeModel(model: GarmentModel) {
  const materials=new Set<THREE.Material>(),textures=new Set<THREE.Texture>();
  model.group.traverse(object=>{
    if(object instanceof THREE.Mesh){object.geometry.dispose();for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);}
  });
  for(const material of materials){
    if(material instanceof THREE.MeshStandardMaterial)for(const texture of [material.map,material.bumpMap,material.normalMap,material.roughnessMap])if(texture)textures.add(texture);
    material.dispose();
  }
  textures.forEach(texture=>texture.dispose());
}
