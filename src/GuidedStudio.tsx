import { useEffect, useRef } from 'react';
import GarmentPicker from './GarmentPicker';
import { garmentInfo, garmentDefaults } from './garments';
import { MOTIFS, PALETTES, patternTileSvg, shirtSvg, svgUrl, type Design } from './patterns';

const steps = ['Welcome', 'Style', 'Pattern', 'Colours', 'Garment', 'Review'];
const titles = ['Your story, in batik.', 'Choose your style.', 'Choose a pattern.', 'Choose your colours.', 'Choose a garment.', 'Review your design.'];
const descriptions = ['A cloth workshop inspired by batik traditions in Malaysia, Singapore, and Indonesia. Choose a motif, colour your cloth, and try your design on.', 'Choose your starting cut. Every clothing category is available with either style.', 'Flowers, leaves, and curling stems. Choose a botanical motif to make your cloth.', 'These colours already work together. Choose a combination and watch your garment change.', 'Start with a garment shape, then choose where the pattern goes.', 'Inspect your design from every angle before trying it on.'];
const placements = [{ value: 'allover', label: 'All over' }, { value: 'hem', label: 'Along the hem' }, { value: 'panels', label: 'On the sides' }] as const;

export default function GuidedStudio({ design, update, fabric, shirt, step, setStep, onAdvanced, onPreview, onExport, onExportCloth }: {
  design: Design; update: (patch: Partial<Design>) => void; fabric: string; shirt: string;
  step: number; setStep: (step: number) => void; onAdvanced: () => void; onPreview: () => void; onExport: () => void; onExportCloth: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => { title.current?.focus({ preventScroll: true }); content.current?.scrollTo(0, 0); window.scrollTo(0, 0); }, [step]);
  const garment = garmentInfo(design.garment);
  const motif = MOTIFS.find(m => m.value === design.motif);
  const palette = PALETTES.find(p => (['background', 'foreground', 'accent', 'secondary', 'wax'] as const).every(k => p[k] === design[k]));
  return <section className="guided-studio" aria-label="Guided batik creation">
    <header className="guide-topbar">
      <span>{step === 0 ? 'Create your design' : `${steps[step]} · Step ${step} of 5`}</span>
      <button className="text-button" onClick={onAdvanced}>Open full studio</button>
    </header>
    <div className="guide-workspace">
    <div className="guide-progress" aria-label="Creation progress">
      {steps.slice(1).map((label, i) => <div key={label} className={step > i ? 'reached' : ''} aria-current={step === i + 1 ? 'step' : undefined}><span className="guide-step-index">{step > i + 1 ? '✓' : i + 1}</span><span className="progress-name">{label}</span></div>)}
    </div>
    <div className={`guide-body guide-step-${step}`}>
      <div className="guide-content" ref={content}>
        <h1 ref={title} tabIndex={-1}>{titles[step]}</h1>
        <p className="guide-description">{descriptions[step]}</p>
        {step === 0 && <div className="welcome-route"><ol><li><span>Choose your starting style</span><small>Male or female, with everyday and traditional garments.</small></li><li><span>Build your pattern</span><small>Pick a motif and a ready-made colour palette.</small></li><li><span>Preview and try it on</span><small>Inspect your garment, then add a full-body photo.</small></li></ol><p className="small-note">You can change your choices as you go.</p><details className="heritage-note"><summary>Explore the batik inspiration</summary><p>These are original digital designs, inspired by cloth traditions rather than reproductions of a particular artisan’s batik.</p><div><a href="https://www.mkn.gov.my/web/ms/2024/01/25/martabatkan-penggunaan-batik-dikalangan-penjawat-awam/" target="_blank" rel="noreferrer">Malaysia: drawn and block batik</a><a href="https://www.nhb.gov.sg/acm/whats-on/exhibitions/batik-kita" target="_blank" rel="noreferrer">Singapore: batik in port cities</a><a href="https://ich.unesco.org/en/RL/indonesian-batik-00170" target="_blank" rel="noreferrer">Indonesia: batik heritage</a></div></details></div>}
        {step === 1 && <div className="guide-wearer" role="group" aria-label="Choose male or female garment style">{(['male', 'female'] as const).map(wearer => <button key={wearer} aria-pressed={design.wearer === wearer} onClick={() => update({ wearer })}><img src={svgUrl(shirtSvg({ ...design, ...garmentDefaults(wearer === 'female' ? 'blouse' : 'shirt'), wearer }))} alt=""/><strong>{wearer === 'male' ? 'Male' : 'Female'}<span aria-hidden="true">{design.wearer === wearer ? '✓' : ''}</span></strong><small>{wearer === 'male' ? 'A straight starting cut' : 'A shaped starting cut'}</small></button>)}</div>}
        {step === 2 && <><div className="guide-motifs" role="group" aria-label="Choose a pattern">{MOTIFS.map(m => <button key={m.value} aria-pressed={design.motif === m.value} onClick={() => update({ motif: m.value, underlay: true })}><img src={svgUrl(patternTileSvg({ ...design, mode: 'motifs', motif: m.value, arrangement: 'grid', rotation: 0, density: .9 }))} alt=""/><span>{m.label}<i aria-hidden="true">{design.motif === m.value ? '✓' : ''}</i></span></button>)}</div><p className="guide-selection" role="status">{motif?.label}: {motif?.description}</p>{design.mode === 'draw' && <p className="small-note">Your painted marks are kept over the starting pattern.</p>}</>}
        {step === 3 && <><div className="guide-palettes" role="group" aria-label="Choose colours">{PALETTES.map(p => <button key={p.name} aria-pressed={palette?.name === p.name} onClick={() => update({ background: p.background, foreground: p.foreground, accent: p.accent, secondary: p.secondary, wax: p.wax })}><span className="guide-swatches">{[p.background, p.foreground, p.accent, p.secondary, p.wax].map((c, i) => <i key={i} style={{ background: c }}/>)}</span><span>{p.name}<i aria-hidden="true">{palette?.name === p.name ? '✓' : ''}</i></span></button>)}</div><p className="guide-selection" role="status">{palette ? `${palette.name} selected. A ready-made colour combination.` : 'Your custom colours are selected.'}</p>{design.strokes.length > 0 && <p className="small-note">Painted marks keep their original colours.</p>}</>}
        {step === 4 && <><GarmentPicker design={design} update={update}/><fieldset className="guide-placement"><legend>Where should the pattern go?</legend><div>{placements.map(p => <button key={p.value} aria-pressed={design.placement === p.value} onClick={() => update({ placement: p.value })}>{p.label}</button>)}</div></fieldset><p className="small-note">Open the full studio to adjust available sleeves, necklines, and fit.</p></>}
        {step === 5 && <><div className="guide-review">{[{ label: 'Style', value: design.wearer === 'female' ? 'Female style' : 'Male style', step: 1 }, { label: 'Pattern', value: design.mode === 'draw' ? 'Your painted pattern' : motif?.label, step: 2 }, { label: 'Colours', value: palette?.name || 'Your custom colours', step: 3 }, { label: 'Garment', value: `${garment.label} · ${placements.find(p => p.value === design.placement)?.label}`, step: 4 }].map(row => <div key={row.label}><span>{row.label}<strong>{row.value}</strong></span><button className="text-button" aria-label={`Change ${row.label.toLowerCase()}`} onClick={() => setStep(row.step)}>Change</button></div>)}</div><p className="guide-next-note">Next: inspect your garment, then try it on with a photo.</p><div className="guide-downloads"><button className="text-button" onClick={onExportCloth}>Download cloth</button><button className="text-button" onClick={onExport}>Download repeating tile</button></div></>}
      </div>
      <aside className="guide-preview" aria-label="Your live garment preview"><div className="guide-preview-label"><span className="status-dot"/> Live preview</div><img className="guide-shirt" src={shirt} alt="Live preview of your batik garment"/><div className="guide-fabric"><img src={fabric} alt="Your batik fabric close-up"/><span>{garment.label}<small>{motif?.label} · {palette?.name || 'Custom colours'}</small></span></div></aside>
    </div>
    </div>
    <footer className="guide-footer"><button className="text-button" onClick={() => setStep(step - 1)} disabled={step === 0}>← Back</button><span>{step === 0 ? 'Start with a style.' : step === 5 ? 'Your design is ready.' : `Up next: ${steps[step + 1].toLowerCase()}`}</span><button className="primary-button" onClick={() => step === 5 ? onPreview() : setStep(step + 1)}>{step === 0 ? 'Create my batik' : step === 5 ? 'Preview in 3D' : 'Continue'}<span aria-hidden="true">→</span></button></footer>
  </section>;
}
