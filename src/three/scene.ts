import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { garmentPanelSvg, svgUrl, type Design } from '../patterns';
import { createGarmentModel, disposeModel, type GarmentModel } from './garmentGeometry';

export type ViewAngle = 'front' | 'back' | 'side' | 'detail';
export function createGarmentScene(host: HTMLDivElement, onInteraction: (view?: ViewAngle) => void, onError: () => void) {
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.NeutralToneMapping;
  renderer.setClearColor('#e8ebe0',1);
  renderer.domElement.setAttribute('aria-label','Interactive 3D garment. Drag to rotate; pinch to zoom. View buttons are available below.');
  renderer.domElement.setAttribute('role','img');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34,1,.05,30);
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;controls.enableDamping=false;controls.minDistance=1.15;controls.maxDistance=5.8;
  controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI*.78;controls.autoRotateSpeed=.7;
  scene.add(new THREE.HemisphereLight('#ffffff','#8491a3',2.15));
  for (const [position,intensity] of [[[2,3,4],2.5],[[-3,1,1],1.1],[[1,2,-3],2]] as const) {
    const light = new THREE.DirectionalLight('#ffffff',intensity);light.position.set(position[0],position[1],position[2]);scene.add(light);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.05,64),new THREE.MeshBasicMaterial({color:'#d4d9c9',transparent:true,opacity:.55}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.35;scene.add(floor);
  let model: GarmentModel | null=null, frame=0, disposed=false, version=0, spinning=false, visible=true, last=0, showForm=true;
  function requestRender() { if (!frame && !disposed && !document.hidden) frame=requestAnimationFrame(render); }
  function render(time:number) {
    frame=0;if(disposed || document.hidden) return;
    if(spinning && visible) controls.update(Math.min((time-last)/1000,.05));
    last=time;renderer.render(scene,camera);
    if(spinning && visible) requestRender();
  }
  function setAngle(view:ViewAngle) {
    spinning=false;controls.autoRotate=false;
    const targetY=-.33;
    controls.target.set(0,view==='detail' ? .15 : targetY,0);
    const distance=view==='detail' ? 1.3 : 3.55;
    camera.position.set(view==='side'?distance:0,controls.target.y+.15,view==='back'?-distance:view==='side'?.01:distance);
    controls.update();requestRender();
  }
  function resize() {
    const {width,height}=host.getBoundingClientRect();if(!width || !height) return;
    renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();requestRender();
  }
  function interaction() { spinning=false;controls.autoRotate=false;onInteraction();requestRender(); }
  function contextLost(event:Event) {event.preventDefault();spinning=false;cancelAnimationFrame(frame);frame=0;onError();}
  controls.addEventListener('change',requestRender);controls.addEventListener('start',interaction);
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  document.addEventListener('visibilitychange',requestRender);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const visibilityObserver=new IntersectionObserver(entries=> { visible=entries[0]?.isIntersecting ?? true;requestRender(); });visibilityObserver.observe(host);
  setAngle('front');resize();
  return {
    async setDesign(design:Design) {
      const id=++version, next=createGarmentModel(design);
      try {
        // Wait for every pending decode before disposal, including after one fails.
        const results=await Promise.allSettled(next.parts.map(async part=> {
          const img=new Image();img.src=svgUrl(garmentPanelSvg(design,part.width,part.height,part.placement));await img.decode();
          if(disposed || id!==version) return;
          const canvas=document.createElement('canvas'), ratio=part.width/part.height;
          const resolution=part.placement==='trim'?256:part.placement==='sleeve'?512:1024;
          canvas.width=ratio>=1?resolution:Math.max(32,Math.round(resolution*ratio));canvas.height=ratio>=1?Math.max(32,Math.round(resolution/ratio)):resolution;
          const ctx=canvas.getContext('2d');if(!ctx) throw new Error('Texture canvas unavailable');
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
          texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
          part.mesh.material.map=texture;part.mesh.material.color.set('#ffffff');part.mesh.material.needsUpdate=true;
        }));
        if(results.some(r=>r.status==='rejected')) throw new Error('Texture could not be prepared');
        if(disposed || id!==version) {disposeModel(next);return;}
        const changedType=model?.group.name!==next.group.name;
        if(model) {scene.remove(model.group);disposeModel(model);}
        model=next;model.mannequin.visible=showForm;scene.add(model.group);
        if(changedType) {setAngle('front');onInteraction('front');}
        requestRender();
      } catch(error) {disposeModel(next);if(!disposed && id===version) throw error;}
    },
    setAngle,
    zoom(factor:number) {const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();requestRender();},
    setForm(value:boolean) {showForm=value;if(model) model.mannequin.visible=value;requestRender();},
    setSpin(value:boolean) {spinning=value;controls.autoRotate=value;last=performance.now();requestRender();},
    dispose() {
      disposed=true;version++;cancelAnimationFrame(frame);resizeObserver.disconnect();visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange',requestRender);renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      controls.dispose();if(model) disposeModel(model);floor.geometry.dispose();floor.material.dispose();
      renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    },
  };
}
export type GarmentScene = ReturnType<typeof createGarmentScene>;
