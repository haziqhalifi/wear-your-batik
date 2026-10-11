import * as THREE from 'three';
import type { Design } from '../patterns';
import { supports3D } from '../previewGarments';

export type ClothPart = { mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>; width: number; height: number; placement: 'body' | 'sleeve' | 'trim' | 'wrap' };
export type GarmentModel = { group: THREE.Group; parts: ClothPart[]; mannequin: THREE.Group; bottom: number };

function surface(cols: number, rows: number, at: (u: number, v: number) => THREE.Vector3, reverse = false) {
  const positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    positions.push(...at(i / cols, j / rows).toArray());
    uv.push(reverse ? 1 - i / cols : i / cols, j / rows);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
    indices.push(...(reverse ? [a,b,c,b,d,c] : [a,c,b,b,c,d]));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

/** Original procedural concept meshes. Coordinates are illustrative, not garment measurements. */
export function createGarmentModel(design: Design): GarmentModel {
  if (!supports3D(design.garment)) throw new Error('This garment has no 3D concept model.');
  const group = new THREE.Group(), mannequin = new THREE.Group(), parts: ClothPart[] = [];
  group.name = `concept-${design.garment}`;
  const dress = design.garment === 'dress', sarong = design.garment === 'sarong';
  const bottom = sarong ? -.88 : dress ? -.98 : -.55;
  const relaxed = design.fit === 'relaxed' ? 1.1 : 1;
  function cloth(name: string, geometry: THREE.BufferGeometry, width: number, height: number, placement: ClothPart['placement'] = 'body') {
    const material = new THREE.MeshStandardMaterial({ color: design.background, roughness: .88, metalness: 0, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true;
    group.add(mesh); parts.push({ mesh, width, height, placement }); return mesh;
  }
  const seamMaterial = new THREE.MeshStandardMaterial({ color: design.background, roughness: 1 });
  function seam(points: THREE.Vector3[], name: string, thickness = .0018) {
    const curve = new THREE.CatmullRomCurve3(points);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 2, thickness, 4, false), seamMaterial);
    mesh.name = name; group.add(mesh);
  }
  if (sarong) {
    // The cloth makes more than one turn, producing an actual overlapping wrap edge.
    const point = (u: number, v: number) => {
      const angle = u * Math.PI * 2.24 - .4;
      const fold = .009 * Math.sin(angle * 13) * (1 - v);
      const overlap = .014 * u;
      const rx = .415 + .025 * (1-v) + fold + overlap, rz = .235 + fold + overlap;
      return new THREE.Vector3(rx * Math.sin(angle), bottom + v * 1.4 + .008*Math.cos(angle*7)*(1-v), rz * Math.cos(angle));
    };
    cloth('wrapped-cloth', surface(100, 40, point), 2.2, 1.4, 'wrap');
    seam(Array.from({length:61},(_,i) => point(i/60,.015)), 'hem');
    seam(Array.from({length:61},(_,i) => point(i/60,.99)), 'waist');
    seam(Array.from({length:30},(_,i) => point(1,i/29)), 'wrap-edge', .003);
  } else {
    const halfWidth = (v: number) => {
      if (dress) return (v < .59 ? THREE.MathUtils.lerp(.67,.30,v/.59) : THREE.MathUtils.lerp(.30,.405,(v-.59)/.41)) * relaxed;
      const shaped = design.wearer === 'female' ? .055 * Math.sin(v*Math.PI) : .008 * Math.sin(v*Math.PI);
      return (.39 - shaped + .01*v) * relaxed;
    };
    const topY = (s: number, front: boolean) => Math.abs(s) < .43
      ? (front ? .32 : .46) + (front ? .18 : .04) * (s/.43)**2
      : .50 - .08 * (Math.abs(s)-.43)/.57;
    const point = (u: number, v: number, front: boolean) => {
      const s = u*2-1, x = s*halfWidth(v), y = bottom + v*(topY(s,front)-bottom);
      const curve = Math.sqrt(Math.max(0,1-s*s));
      const depth = dress ? .20 + .08*(1-v) - .045*Math.sin(v*Math.PI) : .21;
      const folds = (dress ? .023 : .011)*Math.sin(s*27+v*2)*(1-v)**1.5;
      return new THREE.Vector3(x,y,(front?1:-1)*(depth+folds)*curve);
    };
    cloth('front-panel', surface(64,48,(u,v)=>point(u,v,true)), .8*relaxed, .50-bottom);
    cloth('back-panel', surface(64,48,(u,v)=>point(u,v,false),true), .8*relaxed, .50-bottom);
    for (const side of [-1,1]) {
      const start = side < 0 ? 0 : .715, end = side < 0 ? .285 : 1;
      cloth(`shoulder-${side}`, surface(20,8,(u,v)=>point(THREE.MathUtils.lerp(start,end,u),1,true).lerp(point(THREE.MathUtils.lerp(start,end,u),1,false),v)), .23, .32, 'trim');
    }
    for (const front of [true,false]) {
      seam(Array.from({length:41},(_,i)=>point(i/40,.01,front)), `hem-${front}`);
      seam(Array.from({length:41},(_,i)=>point(.285+.43*i/40,1,front)), `neck-${front}`);
    }
    if (design.sleeve !== 'sleeveless') for (const side of [-1,1]) {
      const long = design.sleeve === 'long', length = long ? .64 : .29;
      const origin = new THREE.Vector3(side*.28*relaxed,.32,0);
      const axis = new THREE.Vector3(side*.65,-.76,0).normalize();
      const tangent = new THREE.Vector3(.76,side*.65,0).normalize();
      const pointSleeve = (u:number,v:number) => {
        const radius = THREE.MathUtils.lerp(.155,long?.087:.14,v), angle = u*Math.PI*2;
        return origin.clone().addScaledVector(axis,length*v).addScaledVector(tangent,Math.cos(angle)*radius).add(new THREE.Vector3(0,0,Math.sin(angle)*radius));
      };
      cloth(`sleeve-${side}`,surface(40,24,pointSleeve),.96,length,'sleeve');
      seam(Array.from({length:49},(_,i)=>pointSleeve(i/48,.98)),`cuff-${side}`);
    }
    if (design.collar !== 'round') {
      for (const front of [true,false]) cloth(`neckband-${front}`,surface(32,6,(u,v)=> {
        const p = point(.285+.43*u,1,front); p.y += v*(design.collar==='mandarin'?.055:.035); return p;
      },!front),.35,.06,'trim');
      if (design.collar === 'classic') for (const side of [-1,1]) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position',new THREE.Float32BufferAttribute([side*.17,.5,.17, side*.025,.34,.22, side*.11,.22,.235, side*.235,.385,.17],3));
        geometry.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,1,1,1,0,0,0],2));
        geometry.setIndex([0,1,2,0,2,3]); geometry.computeVertexNormals();
        cloth(`collar-${side}`,geometry,.21,.24,'trim');
      }
    }
    if (!dress && design.collar !== 'round') {
      const geometry = new THREE.PlaneGeometry(.026,.79,1,20); geometry.translate(0,-.12,.215);
      const placket = new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:design.background,roughness:.9,side:THREE.DoubleSide}));
      placket.name='button-placket'; group.add(placket);
      const buttonMaterial = new THREE.MeshStandardMaterial({color:design.wax,roughness:.5});
      for (let y=-.43;y<.30;y+=.13) { const button = new THREE.Mesh(new THREE.SphereGeometry(.009,10,6),buttonMaterial); button.scale.z=.4;button.position.set(0,y,.224);group.add(button); }
    }
  }
  // A neutral tailor's form gives scale and makes openings readable; never a personal-fit avatar.
  const formMaterial = new THREE.MeshStandardMaterial({color:'#ccc4b2',roughness:1});
  const form = new THREE.Mesh(new THREE.CylinderGeometry(.265,.29,.82,40),formMaterial);
  form.scale.z=.55;form.position.y=.03;mannequin.add(form);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.105,.125,.20,32),formMaterial);neck.position.y=.49;mannequin.add(neck);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(.105,24,12),formMaterial);cap.scale.y=.25;cap.position.y=.595;mannequin.add(cap);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(.016,.016,1.3,16),new THREE.MeshStandardMaterial({color:'#9b9485',metalness:.5,roughness:.5}));rod.position.y=-.68;mannequin.add(rod);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(.27,.30,.04,48),formMaterial);foot.position.y=-1.32;mannequin.add(foot);
  mannequin.name='tailors-form';group.add(mannequin);
  return {group,parts,mannequin,bottom};
}

export function disposeModel(model: GarmentModel) {
  const materials = new Set<THREE.Material>();
  model.group.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) materials.add(material);
    }
  });
  for (const material of materials) { if (material instanceof THREE.MeshStandardMaterial) material.map?.dispose();material.dispose(); }
}
