import { Component, lazy, Suspense, useState, type ReactNode } from 'react';
import { MOTIFS, PALETTES, type Design } from './patterns';
import { garmentDefaults, garmentInfo } from './garments';
import { PREVIEW_GARMENTS, supports3D } from './previewGarments';
const Garment3D=lazy(()=>import('./Garment3D'));

class ViewerBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}

export default function PreviewStudio({design,update,shirt,fabric,onEdit,onTryOn}:{
  design:Design;update:(patch:Partial<Design>)=>void;shirt:string;fabric:string;onEdit:()=>void;onTryOn:()=>void;
}) {
  const [mode,setMode]=useState<'3d'|'2d'>('3d');
  const supported=supports3D(design.garment), garment=garmentInfo(design.garment);
  const flat=<div className="preview-flat"><img src={shirt} alt={`${garment.label}, your current 2D batik design`}/><span>2D design preview</span></div>;
  return <section className="preview-studio" aria-label="Inspect your batik">
    <div className="preview-model-column">
      <div className="preview-viewbar"><span>{garment.label}</span><div role="group" aria-label="Preview dimension"><button aria-pressed={mode==='3d'&&supported} disabled={!supported} onClick={()=>setMode('3d')}>3D</button><button aria-pressed={mode==='2d'||!supported} onClick={()=>setMode('2d')}>2D</button></div></div>
      {mode==='3d'&&supported ? <ViewerBoundary fallback={<><p className="viewer-load-error" role="alert">The 3D viewer could not load. Your 2D design is available below.</p>{flat}</>}><Suspense fallback={<div className="viewer-loading" role="status">Opening the 3D studio…</div>}><Garment3D design={design} onFallback={()=>setMode('2d')}/></Suspense></ViewerBoundary> : flat}
      <p className="preview-accuracy">{supported ? 'Concept shape with your live pattern. Drape, seam matching, colours and fit may differ from a finished garment.' : 'This garment has a 2D preview. 3D concepts are available for the shirt, A-line dress and sarong.'}</p>
    </div>
    <aside className="preview-settings" aria-label="Preview design settings">
      <div className="preview-fabric-summary"><img src={fabric} alt="Your current batik fabric"/><div><h2>Design details</h2><p>Adjust your garment and pattern.</p></div></div>
      <label className="studio-select">Garment<select value={design.garment} onChange={event=>{update(garmentDefaults(event.target.value as Design['garment']));setMode('3d');}}>{!supported && <option value={design.garment}>{garment.label} · 2D</option>}{PREVIEW_GARMENTS.map(value=><option key={value} value={value}>{garmentInfo(value).label}</option>)}</select></label>
      <label className="studio-select">Pattern<select value={design.motif} onChange={event=>update({motif:event.target.value as Design['motif'],underlay:true})}>{MOTIFS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
      <fieldset className="preview-palette"><legend>Colours</legend><div>{PALETTES.map(p=><button key={p.name} aria-label={p.name} aria-pressed={(['background','foreground','accent','secondary','wax'] as const).every(key=>design[key]===p[key])} onClick={()=>update({background:p.background,foreground:p.foreground,accent:p.accent,secondary:p.secondary,wax:p.wax})}>{[p.background,p.foreground,p.accent,p.secondary].map((colour,i)=><i key={i} style={{background:colour}}/>)}</button>)}</div></fieldset>
      <label className="studio-range">Repeat size <output>{Math.round(design.scale*100)}%</output><input type="range" min=".7" max="3" step=".1" value={design.scale} onChange={event=>update({scale:Number(event.target.value)})}/></label>
      <div className="garment-controls">{garment.sleeves.length>1&&<label>Sleeves<select value={design.sleeve} onChange={event=>update({sleeve:event.target.value as Design['sleeve']})}>{garment.sleeves.map(value=><option key={value} value={value}>{value==='sleeveless'?'Sleeveless':value==='short'?'Short sleeve':'Long sleeve'}</option>)}</select></label>}{garment.collars.length>1&&<label>Neckline<select value={design.collar} onChange={event=>update({collar:event.target.value as Design['collar']})}>{garment.collars.map(value=><option key={value} value={value}>{value==='round'?'Round neck':value==='classic'?'Classic collar':'Mandarin collar'}</option>)}</select></label>}</div>
      <fieldset className="preview-placement"><legend>Pattern placement</legend><div>{([{value:'allover',label:'All over'},{value:'hem',label:'Hem border'},{value:'panels',label:'Side panels'}] as const).map(p=><button key={p.value} aria-pressed={design.placement===p.value} onClick={()=>update({placement:p.value})}>{p.label}</button>)}</div></fieldset>
      {design.mode==='draw'&&<p className="small-note">Your painted marks are included and keep their ink colours.</p>}
      <div className="preview-next"><button className="primary-button" onClick={onTryOn}>Try on my design <span aria-hidden="true">→</span></button><button className="text-button" onClick={onEdit}>Back to design</button></div>
    </aside>
  </section>;
}
