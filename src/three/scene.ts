import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { garmentPanelSvg, svgUrl, type Design } from '../patterns';
import { createHumanModel, loadHumanAsset } from './humanModel';
import { createGarmentModel, disposeModel, type GarmentModel } from './garmentGeometry';

export type ViewAngle = 'three-quarter' | 'front' | 'back' | 'side' | 'detail';
export function createGarmentScene(host: HTMLDivElement, onInteraction: (view?: ViewAngle) => void, onError: () => void, options: { garmentOnly?: boolean } = {}) {
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  renderer.setClearColor('#eee8d8',options.garmentOnly ? 0 : 1);
  renderer.domElement.setAttribute('aria-label',options.garmentOnly ? 'Your batik garment in 3D.' : 'Interactive 3D garment. Drag to rotate; pinch to zoom. View buttons are available below.');
  renderer.domElement.setAttribute('role','img');
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34,1,.05,30);
  const controls = new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false;controls.enableDamping=false;controls.minDistance=1.15;controls.maxDistance=options.garmentOnly ? 15 : 5.8;
  controls.minPolarAngle=.35;controls.maxPolarAngle=Math.PI*.78;controls.autoRotateSpeed=.7;
  const environment = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer);
  const environmentMap = pmrem.fromScene(environment,.04);
  scene.environment=environmentMap.texture;scene.environmentIntensity=.55;
  environment.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#fff8ef','#797b80',.9));
  for (const [position,intensity] of [[[2.5,4,3],2.2],[[-3,1,2],1.05],[[1,2,-3],1.4]] as const) {
    const light=new THREE.DirectionalLight('#ffffff',intensity);light.position.set(position[0],position[1],position[2]);scene.add(light);
    if(position[1]===4) {
      light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-2;light.shadow.camera.right=2;
      light.shadow.camera.top=2;light.shadow.camera.bottom=-2;light.shadow.camera.near=.1;light.shadow.camera.far=12;
      light.shadow.normalBias=.006;light.shadow.bias=-.0002;light.shadow.radius=4;
    }
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:options.garmentOnly ? .09 : .16}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.65;floor.receiveShadow=true;scene.add(floor);
  // Fine crossed yarn relief, kept separate from the editable batik colour map.
  const yarn=new Uint8Array(64*64*4);
  for(let y=0;y<64;y++)for(let x=0;x<64;x++) {
    const i=(y*64+x)*4, warp=Math.cos(x*Math.PI/2),weft=Math.cos(y*Math.PI/2);
    const irregular=Math.sin(x*12.9898+y*78.233)*6;
    const value=Math.round(220+14*warp+11*weft+5*warp*weft+irregular);
    yarn[i]=yarn[i+1]=yarn[i+2]=value;yarn[i+3]=255;
  }
  let model: GarmentModel | null=null, frame=0, disposed=false, version=0, spinning=false, visible=true, last=0, showHuman=!options.garmentOnly;
  const clothBounds=new THREE.Box3();
  function fittedDistance(aspect:number) {
    const size=clothBounds.getSize(new THREE.Vector3());
    return 1.3*Math.max(size.y,size.x/aspect)/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
  }
  function requestRender() { if (!frame && !disposed && !document.hidden) frame=requestAnimationFrame(render); }
  function render(time:number) {
    frame=0;if(disposed || document.hidden) return;
    if(spinning && visible) controls.update(Math.min((time-last)/1000,.05));
    last=time;renderer.render(scene,camera);
    if(spinning && visible) requestRender();
  }
  function setAngle(view:ViewAngle) {
    spinning=false;controls.autoRotate=false;
    const targetY=options.garmentOnly && !clothBounds.isEmpty() ? clothBounds.getCenter(new THREE.Vector3()).y : -.28;
    controls.target.set(0,view==='detail' ? .15 : targetY,0);
    const fit=fittedDistance(camera.aspect);
    const distance=view==='detail' ? 1.3 : options.garmentOnly && !clothBounds.isEmpty() ? fit : Math.max(5.05,3.15/Math.max(camera.aspect,.65));
    camera.position.set(view==='three-quarter'?distance*.50:view==='side'?distance:0,controls.target.y+.15,view==='three-quarter'?distance*.866:view==='back'?-distance:view==='side'?.01:distance);
    controls.update();requestRender();
  }
  function resize() {
    const {width,height}=host.getBoundingClientRect();if(!width || !height) return;
    const previousAspect=camera.aspect;
    renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();
    if(options.garmentOnly && !clothBounds.isEmpty() && previousAspect!==camera.aspect) {
      const offset=camera.position.clone().sub(controls.target);
      offset.multiplyScalar(fittedDistance(camera.aspect)/fittedDistance(previousAspect));
      camera.position.copy(controls.target).add(offset);controls.update();
    }
    requestRender();
  }
  function interaction() { spinning=false;controls.autoRotate=false;onInteraction();requestRender(); }
  function contextLost(event:Event) {event.preventDefault();spinning=false;cancelAnimationFrame(frame);frame=0;onError();}
  controls.addEventListener('change',requestRender);controls.addEventListener('start',interaction);
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  document.addEventListener('visibilitychange',requestRender);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  const visibilityObserver=new IntersectionObserver(entries=> { visible=entries[0]?.isIntersecting ?? true;requestRender(); });visibilityObserver.observe(host);
  setAngle('three-quarter');resize();
  return {
    async setDesign(design:Design) {
      const id=++version, next=createGarmentModel(design);
      try {
        if(!options.garmentOnly) {
          const humanAsset=await loadHumanAsset();
          if(disposed || id!==version){disposeModel(next);return;}
          next.human.add(createHumanModel(design,humanAsset));
        }
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
          const weave=new THREE.DataTexture(yarn,64,64,THREE.RGBAFormat);
          weave.wrapS=weave.wrapT=THREE.RepeatWrapping;weave.repeat.set(part.width*12,part.height*12);
          weave.magFilter=THREE.LinearFilter;weave.minFilter=THREE.LinearMipmapLinearFilter;weave.generateMipmaps=true;
          weave.anisotropy=texture.anisotropy;weave.needsUpdate=true;
          part.mesh.material.bumpMap=weave;part.mesh.material.bumpScale=.00065;
          part.mesh.material.roughnessMap=weave;
          part.mesh.material.map=texture;part.mesh.material.color.set('#ffffff');part.mesh.material.needsUpdate=true;
        }));
        if(results.some(r=>r.status==='rejected')) throw new Error('Texture could not be prepared');
        if(disposed || id!==version) {disposeModel(next);return;}
        const changedType=model?.group.name!==next.group.name;
        if(model) {scene.remove(model.group);disposeModel(model);}
        model=next;model.human.visible=showHuman;scene.add(model.group);
        clothBounds.makeEmpty();
        for(const part of model.parts) clothBounds.union(new THREE.Box3().setFromObject(part.mesh,true));
        floor.position.y=options.garmentOnly ? clothBounds.min.y-.08 : design.garment.startsWith('kids-')||design.garment==='romper'?-1.17:-1.65;
        if(changedType) {setAngle('three-quarter');onInteraction('three-quarter');}
        requestRender();
      } catch(error) {disposeModel(next);if(!disposed && id===version) throw error;}
    },
    setAngle,
    rotate(delta:number) {
      const offset=camera.position.clone().sub(controls.target), spherical=new THREE.Spherical().setFromVector3(offset);
      spherical.theta+=delta;camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      spinning=false;controls.autoRotate=false;controls.update();onInteraction();requestRender();
    },
    zoom(factor:number) {const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();requestRender();},
    setHuman(value:boolean) {showHuman=value;if(model) model.human.visible=value;requestRender();},
    setSpin(value:boolean) {spinning=value;controls.autoRotate=value;last=performance.now();requestRender();},
    dispose() {
      disposed=true;version++;cancelAnimationFrame(frame);resizeObserver.disconnect();visibilityObserver.disconnect();
      document.removeEventListener('visibilitychange',requestRender);renderer.domElement.removeEventListener('webglcontextlost',contextLost);
      controls.dispose();if(model) disposeModel(model);floor.geometry.dispose();floor.material.dispose();
      scene.traverse(object=>{if(object instanceof THREE.DirectionalLight)object.shadow.dispose();});
      environmentMap.dispose();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    },
  };
}
export type GarmentScene = ReturnType<typeof createGarmentScene>;
