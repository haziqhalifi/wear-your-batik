import LiveGarmentPreview from './LiveGarmentPreview';
import { MOTIFS, PALETTES, type Design } from './patterns';
import { GARMENT_GROUPS, garmentDefaults, garmentInfo, garmentName } from './garments';
import { PREVIEW_GARMENTS } from './previewGarments';

export default function PreviewStudio({design,update,shirt,onEdit,onTryOn}:{
  design:Design;update:(patch:Partial<Design>)=>void;shirt:string;onEdit:()=>void;onTryOn:()=>void;
}) {
  const garment=garmentInfo(design.garment);
  return <section className="preview-studio" aria-label="Inspect your batik">
    <div className="preview-model-column premium-preview"><LiveGarmentPreview design={design} shirt={shirt}/></div>
    <aside className="preview-settings" aria-label="Preview design settings">
      <div className="atelier-preview-intro"><h1>Your design.</h1></div>
      <details className="studio-disclosure preview-style"><summary>Garment</summary><div className="preview-adjustment-fields">
      <label className="studio-select">Garment<select value={design.garment} onChange={event=>{update(garmentDefaults(event.target.value as Design['garment']));}}>{GARMENT_GROUPS.map(group=><optgroup key={group.value} label={group.label}>{PREVIEW_GARMENTS.filter(value=>garmentInfo(value).group===group.value).map(value=><option key={value} value={value}>{garmentName(value)}</option>)}</optgroup>)}</select></label>
      <label className="studio-select">Silhouette<select value={design.wearer} onChange={event=>update({wearer:event.target.value as Design['wearer']})}><option value="female">Female{garment.group==='kids'?' · child proportions':''}</option><option value="male">Male{garment.group==='kids'?' · child proportions':''}</option></select></label>
      </div></details>
      <details className="studio-disclosure preview-adjustments"><summary>Adjust design</summary><div className="preview-adjustment-fields">
      <label className="studio-select">Pattern<select value={design.mode === 'motifs' || design.underlay ? design.motif : ''} onChange={event=>event.target.value ? update({motif:event.target.value as Design['motif'],mode:'draw',underlay:true}) : update({mode:'draw',underlay:false})}><option value="">Blank cloth</option>{MOTIFS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select></label>
      <fieldset className="preview-palette"><legend>Colours</legend><div>{PALETTES.map(p=><button key={p.name} aria-label={p.name} aria-pressed={(['background','foreground','accent','secondary','wax'] as const).every(key=>design[key]===p[key])} onClick={()=>update({background:p.background,foreground:p.foreground,accent:p.accent,secondary:p.secondary,wax:p.wax})}>{[p.background,p.foreground,p.accent,p.secondary].map((colour,i)=><i key={i} style={{background:colour}}/>)}</button>)}</div></fieldset>
      <label className="studio-range">Repeat size <output>{Math.round(design.scale*100)}%</output><input type="range" min=".7" max="3" step=".1" value={design.scale} onChange={event=>update({scale:Number(event.target.value)})}/></label>
      <div className="garment-controls">{garment.sleeves.length>1&&<label>Sleeves<select value={design.sleeve} onChange={event=>update({sleeve:event.target.value as Design['sleeve']})}>{garment.sleeves.map(value=><option key={value} value={value}>{value==='sleeveless'?'Sleeveless':value==='short'?'Short sleeve':'Long sleeve'}</option>)}</select></label>}{garment.collars.length>1&&<label>Neckline<select value={design.collar} onChange={event=>update({collar:event.target.value as Design['collar']})}>{garment.collars.map(value=><option key={value} value={value}>{value==='round'?'Round neck':value==='classic'?'Classic collar':'Mandarin collar'}</option>)}</select></label>}</div>
      <fieldset className="preview-placement"><legend>Pattern placement</legend><div>{([{value:'allover',label:'All over'},{value:'hem',label:'Hem border'},{value:'panels',label:'Side panels'}] as const).map(p=><button key={p.value} aria-pressed={design.placement===p.value} onClick={()=>update({placement:p.value})}>{p.label}</button>)}</div></fieldset>
      {design.mode==='draw'&&<p className="small-note">Your painted marks are included and keep their ink colours.</p>}
      </div></details>
      <div className="preview-next"><button className="primary-button" onClick={onTryOn}>Try on <span aria-hidden="true">→</span></button><button className="text-button" onClick={onEdit}>Edit cloth</button></div>
    </aside>
  </section>;
}
