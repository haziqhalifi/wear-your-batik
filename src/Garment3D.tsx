import { useEffect, useRef, useState } from 'react';
import { createGarmentScene, type GarmentScene, type ViewAngle } from './three/scene';
import { type Design } from './patterns';

export default function Garment3D({design,onFallback,compact=false,detail=false}:{design:Design;onFallback:()=>void;compact?:boolean;detail?:boolean}) {
  const host=useRef<HTMLDivElement>(null), scene=useRef<GarmentScene|null>(null);
  const [error,setError]=useState(false), [loading,setLoading]=useState(true), [spinning,setSpinning]=useState(false), [human,setHuman]=useState(true);
  const [angle,setAngle]=useState<ViewAngle|null>('three-quarter');
  useEffect(()=> {
    if(!host.current) return;
    try {scene.current=createGarmentScene(host.current,(view)=>{setSpinning(false);setAngle(view??null);},()=>setError(true),{garmentOnly:compact});}
    catch {setError(true);}
    return ()=>{scene.current?.dispose();scene.current=null;};
  },[compact]);
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
  return <div className={`garment-3d${compact ? ' garment-3d-compact' : ''}`}>
    <div className="three-stage" tabIndex={detail ? 0 : undefined} aria-label={detail ? 'Rotate garment with left and right arrow keys. Use plus and minus to zoom.' : undefined} onKeyDown={event => {
      if (!detail) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); scene.current?.rotate(event.key === 'ArrowLeft' ? -.2 : .2); }
      if (event.key === '+' || event.key === '=') { event.preventDefault(); scene.current?.zoom(.8); }
      if (event.key === '-') { event.preventDefault(); scene.current?.zoom(1.25); }
    }}>
      <div className="three-canvas" ref={host}/>
      {!compact && <span className="three-badge">3D concept preview</span>}
      {loading && !error && <div className="three-loading" role="status">Preparing your preview…</div>}
      {error && <div className="three-error" role="alert"><strong>3D is unavailable in this browser.</strong><p>Your design is still here.</p><button className="secondary-button" onClick={onFallback}>Show 2D preview</button></div>}
    </div>
    {compact ? detail && <div className="garment-detail-controls" role="group" aria-label="Garment view controls">
      <button type="button" aria-label="Zoom out" title="Zoom out" disabled={error} onClick={()=>scene.current?.zoom(1.25)}>−</button>
      <button type="button" aria-label="Reset garment view" title="Reset view" disabled={error} onClick={()=>view('three-quarter')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/></svg></button>
      <button type="button" aria-label="Zoom in" title="Zoom in" disabled={error} onClick={()=>scene.current?.zoom(.8)}>＋</button>
    </div> : <div className="three-controls" aria-label="3D view controls">
      {!error && <span className="three-gesture">Drag to rotate · Pinch or scroll to zoom</span>}
      <div className="three-views" role="group" aria-label="Camera angle">{(compact ? ['three-quarter','front','back','detail'] as const : ['three-quarter','front','back','side','detail'] as const).map(value=><button key={value} disabled={error} aria-pressed={angle===value} onClick={()=>view(value)}>{value==='three-quarter'?'3/4 view':value==='detail'?'Close-up':value[0].toUpperCase()+value.slice(1)}</button>)}</div>
      <div className="three-options"><button disabled={error} onClick={()=>scene.current?.zoom(.8)} aria-label="Zoom in">＋</button><button disabled={error} onClick={()=>scene.current?.zoom(1.25)} aria-label="Zoom out">−</button>{!compact && <button disabled={error} aria-pressed={human} onClick={()=>{setHuman(!human);scene.current?.setHuman(!human);}}>Human model</button>}<button disabled={error} aria-pressed={spinning} onClick={()=>{setSpinning(!spinning);scene.current?.setSpin(!spinning);setAngle(null);}}>{spinning?'Stop rotation':'Rotate slowly'}</button></div>
    </div>}
  </div>;
}
