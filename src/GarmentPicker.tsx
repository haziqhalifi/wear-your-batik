import { useEffect, useState } from 'react';
import { GARMENTS, GARMENT_GROUPS, garmentDefaults, garmentInfo, garmentName } from './garments';
import { garmentSvg, svgUrl, type Design } from './patterns';

export default function GarmentPicker({ design, update }: { design: Design; update: (patch: Partial<Design>) => void }) {
  const selected = garmentInfo(design.garment);
  const [group, setGroup] = useState(selected.group);
  useEffect(() => setGroup(selected.group), [selected.group]);
  return <div className="garment-picker">
    <div className="garment-categories" role="group" aria-label="Clothing category">{GARMENT_GROUPS.map(g => <button key={g.value} title={g.label} aria-pressed={group === g.value} onClick={() => setGroup(g.value)}>{g.label}</button>)}</div>
    <div className="guide-shapes garment-grid" role="group" aria-label="Choose a garment">{GARMENTS.filter(g => g.group === group).map(g => <button key={g.value} title={g.hint} aria-pressed={design.garment === g.value} onClick={() => update(garmentDefaults(g.value))}>
      <div className="garment-card-art"><img src={svgUrl(garmentSvg(design.garment === g.value ? design : { ...design, ...garmentDefaults(g.value) }).replace('<rect width="600" height="600" fill="#f5f2ea"/>', ''))} alt=""/><span className="garment-card-choice" aria-hidden="true">{design.garment === g.value ? '✓' : ''}</span></div>
      <strong>{garmentName(g.value)}</strong>
    </button>)}</div>

  </div>;
}
