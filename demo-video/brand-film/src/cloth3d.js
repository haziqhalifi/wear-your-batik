// Hanging fabric panels for "The collection": the app's own cloth artwork on lit, gently folding cloth.
// `flat` blends each panel to an unlit, colour-exact view of its texture, so match-cuts to vector art
// and to the real website collection are seamless.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const PANEL_W = 1, PANEL_H = 2.6;

export async function createCloth(canvas, W, H, panelSources) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, W / H, .01, 60);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .22;
  const hemi = new THREE.HemisphereLight('#fff3df', '#0b1628', .55); scene.add(hemi);
  const key = new THREE.DirectionalLight('#fff0d8', 1.55); key.position.set(-2.4, 3.1, 3.6); scene.add(key);
  const fill = new THREE.DirectionalLight('#c7d8ff', .28); fill.position.set(3.2, .4, 2.2); scene.add(fill);
  const rim = new THREE.DirectionalLight('#ffd7a3', .55); rim.position.set(.6, 2.2, -3); scene.add(rim);

  // Fine plain-weave relief, the same idea the app uses for its garments.
  const yarn = new Uint8Array(64 * 64 * 4);
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = (y * 64 + x) * 4, warp = Math.cos(x * Math.PI / 2), weft = Math.cos(y * Math.PI / 2);
    const v = Math.round(222 + 12 * warp + 10 * weft + 4 * warp * weft);
    yarn[i] = yarn[i + 1] = yarn[i + 2] = v; yarn[i + 3] = 255;
  }
  const weave = new THREE.DataTexture(yarn, 64, 64, THREE.RGBAFormat);
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(26, 26 * PANEL_H);
  weave.magFilter = THREE.LinearFilter; weave.minFilter = THREE.LinearMipmapLinearFilter; weave.generateMipmaps = true; weave.needsUpdate = true;

  const panels = await Promise.all(panelSources.map(async src => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = 1536; c.height = Math.round(1536 * PANEL_H);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    map.generateMipmaps = true; map.minFilter = THREE.LinearMipmapLinearFilter;
    const geo = new THREE.PlaneGeometry(PANEL_W, PANEL_H, 64, 166);
    const base = geo.attributes.position.array.slice();
    const mat = new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: new THREE.Color('#ffffff'), roughness: .9, metalness: 0, side: THREE.DoubleSide, bumpMap: weave, bumpScale: .0011, transparent: true });
    const mesh = new THREE.Mesh(geo, mat);
    scene.add(mesh);
    return { mesh, geo, base, map, mat };
  }));

  // Hanging folds: pinned along the top edge, fuller towards the hem, moving slowly.
  function folds(x, y, t, phase, amount) {
    const hang = (PANEL_H / 2 - y) / PANEL_H;
    const w = .28 + .72 * hang;
    const z = .052 * Math.sin(2 * Math.PI * 1.55 * x + 1.3 + phase + .55 * t)
      + .028 * Math.sin(2 * Math.PI * 3.1 * x + .4 + phase * 1.7 - .7 * t)
      + .011 * Math.sin(2 * Math.PI * 6.2 * x + 2.1 + phase * .6 + 1.1 * t);
    const billow = .018 * hang * hang * Math.sin(.9 * t + phase * 2.3 + y * 1.4);
    return amount * (z * w + billow);
  }

  function setPanel(i, p) {
    const { mesh, geo, base, map, mat } = panels[i];
    const pos = geo.attributes.position.array;
    for (let k = 0; k < pos.length; k += 3) {
      const x = base[k], y = base[k + 1];
      pos[k + 2] = p.folds ? folds(x, y, p.time, p.phase || 0, p.folds) : 0;
    }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    mesh.position.set(p.x || 0, p.y || 0, p.z || 0);
    mesh.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0);
    mesh.scale.set(p.sx || 1, p.sy || 1, 1);
    map.repeat.set(p.cropU ?? 1, p.cropV ?? 1);
    map.offset.set(0, 1 - (p.cropV ?? 1));
    const flat = p.flat ?? 0;
    mat.color.setScalar(1 - flat);
    mat.emissiveIntensity = flat;
    mat.bumpScale = .0011 * (1 - flat);
    mat.opacity = p.opacity ?? 1;
    mesh.visible = (p.opacity ?? 1) > .001;
    mesh.renderOrder = p.order ?? i;
  }
  function look(x, y, dist) { camera.position.set(x, y, dist); camera.lookAt(x, y, 0); camera.updateMatrixWorld(); }
  // Visible size of the z = 0 plane for a camera at `dist`.
  const viewAt = dist => { const h = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); return { h, w: h * camera.aspect }; };
  return { renderer, scene, camera, panels, setPanel, look, viewAt, lights: { hemi, key, fill, rim }, render: () => renderer.render(scene, camera) };
}
