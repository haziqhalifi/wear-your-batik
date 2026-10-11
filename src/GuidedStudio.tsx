import { useEffect, useRef, useState } from 'react';
import GarmentPicker from './GarmentPicker';
import BatikIntro from './BatikIntro';
import StudioIcon from './StudioIcon';
import DesignCanvas from './DesignCanvas';
import LiveGarmentPreview from './LiveGarmentPreview';
import { ColourCustomization, LayoutCustomization, GarmentCustomization } from './DesignCustomization';
import { garmentInfo } from './garments';
import { MOTIFS, PALETTES, patternTileSvg, svgUrl, type Design } from './patterns';

const steps = ['Welcome', 'Create', 'Garment'];
const finalStep = steps.length - 1;
const titles = ['Your story, in batik.', 'Create your cloth.', 'Choose your shape.'];

export default function GuidedStudio({ design, update, fabric, shirt, step, setStep, onPreview, onExport, onExportCloth, onRestart }: {
  design: Design; update: (patch: Partial<Design>) => void; fabric: string; shirt: string;
  step: number; setStep: (step: number) => void; onPreview: () => void; onExport: () => void; onExportCloth: () => void; onRestart: () => void;
}) {
  const [personaliseTab, setPersonaliseTab] = useState<'paint' | 'cloth' | 'repeat'>('paint');
  const [paintVisited, setPaintVisited] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    content.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [step]);
  useEffect(() => {
    if (step !== 1) return;
    setPaintVisited(true);
    if (design.mode === 'motifs') update({ mode: 'draw', underlay: true });
  }, [step, design.mode, update]);
  const garment = garmentInfo(design.garment);
  const motif = MOTIFS.find(m => m.value === design.motif);
  const palette = PALETTES.find(p => (['background', 'foreground', 'accent', 'secondary', 'wax'] as const).every(k => p[k] === design[k]));
  return <section className={`guided-studio ${step === 1 ? 'personalise-step' : ''} ${step === 2 ? 'garment-step' : ''} ${step === 0 ? 'welcome-studio' : ''}`} aria-label="Guided batik creation">
    {step === 0 && <BatikIntro onStart={() => setStep(1)} onChoose={preset => { update({ ...preset, garment: design.garment, wearer: design.wearer, strokes: design.strokes, mode: 'draw', underlay: true }); setStep(1); }}/>}
    <div className="guide-workspace" hidden={step === 0}>
    <div className="guide-navigation">
      {step !== 0 && <div className="guide-navigation-actions"><details className="atelier-options"><summary aria-label="Studio options" title="Studio options"><StudioIcon name="settings"/></summary><div><button type="button" onClick={onExportCloth}>Download cloth</button><button type="button" onClick={onExport}>Download tile</button><button type="button" onClick={onRestart}>Start again</button></div></details><button className="primary-button" onClick={() => step === finalStep ? onPreview() : setStep(step + 1)}>{step === finalStep ? 'Preview in 3D' : 'Choose garment'}<span aria-hidden="true">→</span></button></div>}
    </div>
    <div className={`guide-body guide-step-${step}`}>
      <div className="guide-content" ref={content}>
        <h1 ref={title} tabIndex={-1}>{titles[step]}</h1>

        {step === 0 && <div className="welcome-route"><button className="primary-button welcome-start" onClick={() => setStep(1)}>Create my batik <span aria-hidden="true">→</span></button><details className="heritage-note"><summary>Our batik inspiration</summary><p>These are original digital designs, inspired by cloth traditions rather than reproductions of a particular artisan’s batik.</p><div><a href="https://www.mkn.gov.my/web/ms/2024/01/25/martabatkan-penggunaan-batik-dikalangan-penjawat-awam/" target="_blank" rel="noreferrer">Malaysia: drawn and block batik</a><a href="https://www.nhb.gov.sg/acm/whats-on/exhibitions/batik-kita" target="_blank" rel="noreferrer">Singapore: batik in port cities</a><a href="https://ich.unesco.org/en/RL/indonesian-batik-00170" target="_blank" rel="noreferrer">Indonesia: batik heritage</a></div></details></div>}
        {step === 1 && <div className="personalise-tabs" role="group" aria-label="Personalise your cloth"><button aria-pressed={personaliseTab === 'paint'} onClick={() => setPersonaliseTab('paint')}>Paint</button><button aria-pressed={personaliseTab === 'cloth'} onClick={() => setPersonaliseTab('cloth')}>Patterns</button><button aria-pressed={personaliseTab === 'repeat'} onClick={() => setPersonaliseTab('repeat')}>Repeat</button></div>}
        {step === 1 && personaliseTab === 'cloth' && <div className="cloth-choices">
          <section className="cloth-motifs"><h2>Motifs</h2><div className="guide-motifs" role="group" aria-label="Choose a pattern">{MOTIFS.map(m => <button key={m.value} aria-pressed={(design.mode === 'motifs' || design.underlay) && design.motif === m.value} onClick={() => update({ motif: m.value, underlay: true })}><img src={svgUrl(patternTileSvg({ ...design, mode: 'motifs', motif: m.value, arrangement: 'grid', rotation: 0, density: .9 }))} alt=""/><span>{m.label}<i aria-hidden="true">{(design.mode === 'motifs' || design.underlay) && design.motif === m.value ? '✓' : ''}</i></span></button>)}</div></section>
          <section className="cloth-palettes"><h2>Colours</h2><div className="guide-palettes" role="group" aria-label="Choose colours">{PALETTES.map(p => <button key={p.name} aria-pressed={palette?.name === p.name} onClick={() => update({ background: p.background, foreground: p.foreground, accent: p.accent, secondary: p.secondary, wax: p.wax })}><span className="guide-swatches">{[p.background, p.foreground, p.accent, p.secondary, p.wax].map((c, i) => <i key={i} style={{ background: c }}/>)}</span><span>{p.name}<i aria-hidden="true">{palette?.name === p.name ? '✓' : ''}</i></span></button>)}</div><details className="studio-disclosure"><summary>Mix your own</summary><ColourCustomization design={design} update={update}/></details></section>
        </div>}

        {paintVisited && <div hidden={step !== 1 || personaliseTab !== 'paint'} className="journey-paint">
          <div className="journey-paint-actions" role="group" aria-label="Painting background"><button className="text-button" aria-pressed={design.underlay} onClick={() => setPersonaliseTab('cloth')}>Starter motif</button><button className="text-button" aria-pressed={!design.underlay} onClick={() => update({ mode: 'draw', underlay: false })}>Blank cloth</button></div>
          {/* Keep the canvas mounted so brush settings and undo survive step changes. */}
          <DesignCanvas design={design} update={patch => update({ ...patch, mode: 'draw' })}/>
        </div>}
        {step === 1 && personaliseTab === 'repeat' && <LayoutCustomization design={design} update={update}/>}
        {step === 2 && <>
          <div className="wearer-toggle" role="group" aria-label="Choose male or female garment style">{(['male', 'female'] as const).map(wearer => <button key={wearer} aria-pressed={design.wearer === wearer} onClick={() => update({ wearer })}>{wearer === 'male' ? 'Male' : 'Female'}</button>)}</div>
          <details className="studio-disclosure garment-fitting"><summary>Cut & placement</summary><GarmentCustomization design={design} update={update}/></details>
          <GarmentPicker design={design} update={update}/>

        </>}

      </div>
      <aside className="guide-preview" aria-label="Your live garment preview">{step !== 0 && <div className="guide-preview-label"><span className="status-dot"/> {step === 2 ? 'Your selected silhouette' : 'Your cloth, in the making'}</div>}{step === 0 ? <img className="guide-cloth" src={fabric} alt="Your cloth"/> : <LiveGarmentPreview design={design} shirt={shirt}/>}<div className="guide-fabric">{step !== 0 && <img src={fabric} alt="Your batik fabric close-up"/>}<span>{step !== 0 && garment.label}<small>{design.mode === 'motifs' || design.underlay ? motif?.label : design.strokes.length ? 'Your artwork' : 'Blank cloth'} · {palette?.name || 'Custom colours'}</small></span></div></aside>
    </div>
    </div>

  </section>;
}
