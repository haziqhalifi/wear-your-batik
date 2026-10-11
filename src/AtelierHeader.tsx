import { DEFAULT_DESIGN, motifArtwork } from './patterns';
const emblem = motifArtwork('flower', DEFAULT_DESIGN);
const steps = ['Create', 'Garment', 'Preview', 'Try on'];
export default function AtelierHeader({ current, onNavigate, onHome, busy }: { current: number; onNavigate: (step: number) => void; onHome: () => void; busy: boolean }) {
  return <header className="atelier-header">
    <button className="atelier-brand" onClick={onHome} disabled={busy} aria-label="Back to the batik collection"><svg viewBox="0 0 100 110" aria-hidden="true" dangerouslySetInnerHTML={{ __html: emblem }}/><span>Wear Your Batik</span></button>
    <nav className="atelier-steps" aria-label="Your batik journey">{steps.map((step, index) => <button key={step} disabled={busy} aria-current={current === index ? 'step' : undefined} onClick={() => onNavigate(index)}>{step}</button>)}</nav>
    
  </header>;
}
