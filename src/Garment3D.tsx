import { useEffect, useRef, useState } from 'react';
import { createGarmentScene, type GarmentScene, type ViewAngle } from './three/scene';
import { type Design } from './patterns';

export default function Garment3D({design,onFallback}:{design:Design;onFallback:()=>void}) {
  const host=useRef<HTMLDivElement>(null), scene=useRef<GarmentScene|null>(null);
  const [error,setError]=useState(false), [loading,setLoading]=useState(true), [spinning,setSpinning]=useState(false), [form,setForm]=useState(true);
  const [angle,setAngle]=useState<ViewAngle|null>('front');
  useEffect(()=> {
    if(!host.current) return;
    try {scene.current=createGarmentScene(host.current,(view)=>{setSpinning(false);setAngle(view??null);},()=>setError(true));}
    catch {setError(true);}
    return ()=>{scene.current?.dispose();scene.current=null;};
  },[]);
  useEffect(()=> {
    let current=true;setLoading(true);
    scene.current?.setDesign(design).then(()=>{if(current)setLoading(false);}).catch(()=>{if(current){setError(true);setLoading(false);}});
    return ()=>{current=false;};
  },[design]);
  useEffect(()=> {
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const stop=()=>{if(preference.matches){scene.current?.setSpin(false);setSpinning(false);}};
    preference.addEventListener('change',stop);return ()=>preference.removeEventListener('change',stop);
  },[]);
  function view(value:ViewAngle) {scene.current?.setAngle(value);setAngle(value);setSpinning(false);}
  return <div className="garment-3d">
    <div className="three-stage">
      <div className="three-canvas" ref={host}/>
      <span className="three-badge">3D concept preview</span>
      {loading && !error && <div className="three-loading" role="status">Preparing your fabric…</div>}
      {error && <div className="three-error" role="alert"><strong>3D is unavailable in this browser.</strong><p>Your design is still here.</p><button className="secondary-button" onClick={onFallback}>Show 2D preview</button></div>}
      {!error && <span className="three-gesture">Drag to rotate · Pinch or scroll to zoom</span>}
    </div>
    <div className="three-controls" aria-label="3D view controls">
      <div className="three-views" role="group" aria-label="Camera angle">{(['front','back','side','detail'] as const).map(value=><button key={value} disabled={error} aria-pressed={angle===value} onClick={()=>view(value)}>{value==='detail'?'Close-up':value[0].toUpperCase()+value.slice(1)}</button>)}</div>
      <div className="three-options"><button disabled={error} onClick={()=>scene.current?.zoom(.8)} aria-label="Zoom in">＋</button><button disabled={error} onClick={()=>scene.current?.zoom(1.25)} aria-label="Zoom out">−</button><button disabled={error} aria-pressed={form} onClick={()=>{setForm(!form);scene.current?.setForm(!form);}}>Dress form</button><button disabled={error} aria-pressed={spinning} onClick={()=>{setSpinning(!spinning);scene.current?.setSpin(!spinning);setAngle(null);}}>{spinning?'Stop rotation':'Rotate slowly'}</button></div>
    </div>
  </div>;
}
