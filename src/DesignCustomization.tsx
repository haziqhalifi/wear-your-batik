import { garmentInfo } from './garments';
import { garmentSvg, svgUrl, type Design } from './patterns';

type Props = { design: Design; update: (patch: Partial<Design>) => void };

export function ColourCustomization({ design, update }: Props) {
  return <div className="journey-customization"><h2>Mix your own</h2><div className="dye-colours">{([{ key:'background', label:'Cloth' },{ key:'foreground', label:'Petals' },{ key:'accent', label:'Highlights' },{ key:'secondary', label:'Leaves' },{ key:'wax', label:'Wax outline' }] as const).map(c => <label key={c.key}><input type="color" aria-label={`${c.label} colour`} value={design[c.key]} onInput={e => update({ [c.key]:e.currentTarget.value })}/><span>{c.label}</span></label>)}</div><button className="text-button" onClick={() => update({ foreground:design.accent, accent:design.foreground })}>Swap petals & highlights</button><p className="small-note">Painted marks keep their ink colour.</p></div>;
}

export function LayoutCustomization({ design, update }: Props) {
  return <div className="journey-customization"><label className="studio-range">Repeat size <output>{Math.round(design.scale*100)}%</output><input type="range" aria-label="Repeat size" min=".7" max="3" step=".1" value={design.scale} onChange={e => update({ scale:Number(e.target.value) })}/></label><label className="studio-range">Motif angle <output>{design.rotation}°</output><input type="range" aria-label="Motif angle" min="-90" max="90" step="5" value={design.rotation} onChange={e => update({ rotation:Number(e.target.value) })}/></label><label className="studio-range">Motif fullness <output>{Math.round(design.density*100)}%</output><input type="range" aria-label="Motif fullness" min=".5" max="1.3" step=".05" value={design.density} onChange={e => update({ density:Number(e.target.value) })}/></label><label className="studio-select">Repeat<select value={design.arrangement} onChange={e => update({ arrangement:e.target.value as Design['arrangement'] })}><option value="staggered">Half-drop</option><option value="grid">Straight repeat</option></select></label><label className="studio-select">Cloth detail<select value={design.texture} onChange={e => update({ texture:e.target.value as Design['texture'] })}><option value="plain">Plain dye</option><option value="dots">Fine wax dots</option><option value="crackle">Wax crackle</option></select></label><p className="small-note">Angle and fullness change the motif, not your painted marks.</p></div>;
}

export function GarmentCustomization({ design, update }: Props) {
  const garment = garmentInfo(design.garment);
  return <div className="journey-customization garment-cut-options">
    {garment.sleeves.length > 1 && <fieldset><legend>Sleeves</legend><div>{garment.sleeves.map(value => <button type="button" key={value} aria-pressed={design.sleeve === value} onClick={() => update({ sleeve:value })}>{value === 'sleeveless' ? 'Sleeveless' : value === 'long' ? 'Long' : 'Short'}</button>)}</div></fieldset>}
    {garment.collars.length > 1 && <fieldset><legend>Neckline</legend><div>{garment.collars.map(value => <button type="button" key={value} aria-pressed={design.collar === value} onClick={() => update({ collar:value })}>{value === 'round' ? 'Round' : value === 'classic' ? 'Classic' : 'Mandarin'}</button>)}</div></fieldset>}
    {design.garment !== 'sarong' && <fieldset><legend>Fit</legend><div>{(['regular','relaxed'] as const).map(value => <button type="button" key={value} aria-pressed={design.fit === value} onClick={() => update({ fit:value })}>{value === 'regular' ? 'Regular' : 'Relaxed'}</button>)}</div></fieldset>}
    <fieldset><legend>Placement</legend><div className="garment-placement-options">{([{ value:'allover', label:'All over' }, { value:'hem', label:'Border' }, { value:'panels', label:'Panels' }] as const).map(p => <button type="button" key={p.value} aria-label={p.label} title={p.label} aria-pressed={design.placement === p.value} onClick={() => update({ placement:p.value })}><img src={svgUrl(garmentSvg({ ...design, placement:p.value }).replace('<rect width="600" height="600" fill="#f5f2ea"/>',''))} alt=""/><span>{p.label}</span></button>)}</div></fieldset>
  </div>;
}
