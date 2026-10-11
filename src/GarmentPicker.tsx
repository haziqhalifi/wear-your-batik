import { useEffect, useState } from 'react';
import { GARMENTS, GARMENT_GROUPS, garmentDefaults, garmentInfo } from './garments';
import { garmentSvg, svgUrl, type Design } from './patterns';

export default function GarmentPicker({ design, update }: { design: Design; update: (patch: Partial<Design>) => void }) {
  const selected = garmentInfo(design.garment);
  const [group, setGroup] = useState(selected.group);
  useEffect(() => setGroup(selected.group), [selected.group]);
  return <div className="garment-picker">
    <div className="garment-categories" role="group" aria-label="Clothing category">{GARMENT_GROUPS.map(g => <button key={g.value} aria-pressed={group === g.value} onClick={() => setGroup(g.value)}>{g.label}</button>)}</div>
    <div className="guide-shapes garment-grid" role="group" aria-label="Choose a garment">{GARMENTS.filter(g => g.group === group).map(g => <button key={g.value} aria-pressed={design.garment === g.value} onClick={() => update(garmentDefaults(g.value))}>
      <img src={svgUrl(garmentSvg(design.garment === g.value ? design : { ...design, ...garmentDefaults(g.value) }))} alt=""/>
      <strong>{g.label}{design.garment === g.value && <span aria-hidden="true"> ✓</span>}</strong><small>{g.hint}</small>
    </button>)}</div>
    <p className="guide-selection" role="status">Selected: {selected.label}. {selected.group === 'kids' ? 'For photo try-on, use a photo of a child already wearing clothes. Their age and proportions stay the same.' : selected.region !== 'upper' ? 'Use a full-body photo to preview the whole garment.' : selected.value === 'kebaya' ? 'A contemporary lined blouse; pair it with your own skirt or kain.' : 'Your pattern and painted marks carry across every garment.'}</p>
  </div>;
}
