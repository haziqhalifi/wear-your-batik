import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_DESIGN, MOTIFS, type Design, fabricSvg, patternTileSvg, shirtSvg, svgPng, svgUrl } from './patterns';

import { garmentInfo, supportsSample } from './garments';
import Studio from './Studio';
import PreviewStudio from './PreviewStudio';
import GuidedStudio from './GuidedStudio';
import CameraCapture from './CameraCapture';

type Stage = 'create' | 'preview' | 'try-on' | 'reveal';
type Photo = { image: string; label: string; sample: boolean };
type Result = { image: string; designVersion: string; design: Design; photo: Photo; durationMs: number };
type Status = { configured: boolean; provider: string; model: string };
const motifs = MOTIFS;
const version = (d: Design) => JSON.stringify(d);

function download(data: string, name: string) {
  const [header, encoded] = data.split(',');
  const mime = /data:([^;]+)/.exec(header)?.[1] || 'image/png';
  const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function readPhoto(file: Blob): Promise<string> {
  if (!['image/png', 'image/jpeg'].includes(file.type)) throw new Error('Choose a JPEG or PNG photo.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Your photo is over 10 MB. Choose a smaller JPEG or PNG.');
  if (!file.size) throw new Error('That photo is empty. Please choose another.');
  const image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('We could not open that photo. Please choose another.'));
    reader.readAsDataURL(file);
  });
  const preview = new Image(); preview.src = image;
  try { await preview.decode(); } catch { throw new Error('That image could not be read. Try a different JPEG or PNG.'); }
  return image;
}

async function uploadImage(source: string): Promise<string> {
  const image = new Image(); image.src = source; await image.decode();
  const scale = Math.min(1, 1536 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not prepare your photo. Please try again.');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.9, 0.8, 0.65, 0.5]) {
    const encoded = canvas.toDataURL('image/jpeg', quality);
    if (encoded.length < 2_000_000) return encoded;
  }
  throw new Error('That image is too detailed to upload. Please choose a smaller photo.');
}

export default function App() {
  const [design, setDesign] = useState<Design>({ ...DEFAULT_DESIGN });
  const [stage, setStage] = useState<Stage>('create');
  const [guidedStep, setGuidedStep] = useState(0);
  const [advanced, setAdvanced] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [statusError, setStatusError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const photoReadId = useRef(0);
  const generationLock = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const garment = garmentInfo(design.garment);
  const sampleAllowed = supportsSample(design.garment);
  const sampleMismatch = Boolean(photo?.sample && !sampleAllowed);
  const designVersion = version(design);
  const stale = Boolean(result && result.designVersion !== designVersion);
  const fabric = useMemo(() => svgUrl(fabricSvg(design)), [design]);
  const shirt = useMemo(() => svgUrl(shirtSvg(design).replace('fill="#f5f2ea"', 'fill="#e8ebe0"')), [design]);

  async function checkStatus() {
    setStatusError(false);
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error();
      const value = await response.json();
      if (typeof value.configured !== 'boolean') throw new Error();
      setStatus(value);
    } catch { setStatusError(true); }
  }
  useEffect(() => { void checkStatus(); return () => { controller.current?.abort(); }; }, []);
  useEffect(() => {
    if (!busy) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [busy]);

  function navigate(next: Stage) {
    setCameraOpen(false); setStage(next); setError(''); setNotice('');
    window.requestAnimationFrame(() => { (heading.current || document.querySelector<HTMLHeadingElement>('.guide-content h1'))?.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  }
  function update(patch: Partial<Design>) { setDesign(current => ({ ...current, ...patch })); setNotice(''); }
  async function exportPattern(target = design) {
    try {
      const height = target.arrangement === 'staggered' ? 1024 : 512;
      download(await svgPng(patternTileSvg(target), 512, height), 'wear-your-story-pattern.png');
      setNotice('Your repeating pattern tile download has started.');
    } catch (e) { setError(e instanceof Error ? e.message : 'The download could not be prepared. Try again.'); }
  }
  async function exportCloth() {
    try { download(await svgPng(fabricSvg(design), 1600, 1600), 'wear-your-story-cloth.png'); setNotice('Your full cloth download has started.'); }
    catch { setError('The cloth could not be exported. Please try again.'); }
  }
  async function choosePhoto(file: File) {
    const id = ++photoReadId.current;
    setPhotoBusy(true); setError('');
    try {
      const image = await readPhoto(file);
      if (id === photoReadId.current) setPhoto({ image, label: file.name, sample: false });
    } catch (e) { if (id === photoReadId.current) setError((e as Error).message); }
    finally { if (id === photoReadId.current) setPhotoBusy(false); }
  }
  async function chooseSample() {
    if (!sampleAllowed) return;
    setCameraOpen(false);
    const id = ++photoReadId.current;
    setPhotoBusy(true); setError('');
    try {
      const response = await fetch('/sample-person.png');
      if (!response.ok) throw new Error('The sample photo is not available yet. You can upload your own photo.');
      const image = await readPhoto(await response.blob());
      if (id === photoReadId.current) setPhoto({ image, label: 'Synthetic demo model', sample: true });
    } catch (e) { if (id === photoReadId.current) setError((e as Error).message); }
    finally { if (id === photoReadId.current) setPhotoBusy(false); }
  }
  async function generate() {
    if (!photo || sampleMismatch || generationLock.current || photoBusy || !status?.configured) return;
    generationLock.current = true;
    const snapshot = { ...design }, inputPhoto = { ...photo }, id = ++requestId.current;
    const capturedVersion = version(snapshot), abort = new AbortController();
    controller.current = abort;
    setBusy(true); setElapsed(0); setError(''); setNotice('');
    const timeout = window.setTimeout(() => abort.abort(), 95_000);
    try {
      const fingerprint = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(capturedVersion));
      const requestVersion = Array.from(new Uint8Array(fingerprint), byte => byte.toString(16).padStart(2, '0')).join('');
      const garmentImage = await svgPng(shirtSvg(snapshot));
      const [personUpload, garmentUpload] = await Promise.all([uploadImage(inputPhoto.image), uploadImage(garmentImage)]);
      if (id !== requestId.current) return;
      const response = await fetch('/api/try-on', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: abort.signal,
        body: JSON.stringify({ personImage: personUpload, garmentImage: garmentUpload, garmentType: snapshot.garment, designVersion: requestVersion }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Your look could not be generated. Please try again.');
      if (typeof data.image !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(data.image) || data.designVersion !== requestVersion) throw new Error('The preview response was incomplete. Please try again.');
      if (id !== requestId.current) return;
      setResult({ image: data.image, designVersion: capturedVersion, design: snapshot, photo: inputPhoto, durationMs: data.durationMs });
      setShowOriginal(false); setStage('reveal');
      window.requestAnimationFrame(() => { (heading.current || document.querySelector<HTMLHeadingElement>('.guide-content h1'))?.focus({ preventScroll: true }); window.scrollTo(0, 0); });
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error && e.name === 'AbortError' ? 'This preview took too long. Your design and photo are safe here. Please try again.' : e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      window.clearTimeout(timeout);
      if (id === requestId.current) { generationLock.current = false; setBusy(false); controller.current = null; }
    }
  }
  function startAgain() {
    requestId.current++; photoReadId.current++; controller.current?.abort(); controller.current = null;
    generationLock.current = false; setBusy(false); setPhotoBusy(false); setPhoto(null); setResult(null); setCameraOpen(false);
    setGuidedStep(0); setAdvanced(false);
    setDesign({ ...DEFAULT_DESIGN }); setError(''); setNotice(''); setShowOriginal(false); setStage('create');
    if (fileInput.current) fileInput.current.value = '';
    window.requestAnimationFrame(() => { (heading.current || document.querySelector<HTMLHeadingElement>('.guide-content h1'))?.focus({ preventScroll: true }); window.scrollTo(0, 0); });
  }

  return <div className={`app-shell stage-${stage} ${stage === 'create' && !advanced ? 'guided-mode' : ''}`}>
    <header className="site-header">
      <a className="wordmark" href="#" onClick={event => { event.preventDefault(); navigate('create'); }} aria-label="Wear Your Story studio"><svg className="brand-mark" viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M18 18C4 18 2 4 10 4C18 4 18 18 18 18ZM18 18C18 4 32 2 32 10C32 18 18 18 18 18ZM18 18C32 18 34 32 26 32C18 32 18 18 18 18ZM18 18C18 32 4 34 4 26C4 18 18 18 18 18Z" fill="currentColor"/></svg><span>Wear Your Story<span className="brand-subtitle">A contemporary batik workshop</span></span></a>
      <span className="header-note">Malaysian-inspired batik</span>
    </header>
    <main>
      <nav className="steps" aria-label="Your design journey">
        {(['create', 'preview', 'try-on', 'reveal'] as Stage[]).map((value, i) => <button key={value} className={stage === value ? 'step active' : 'step'} aria-current={stage === value ? 'step' : undefined} disabled={value === 'reveal' && !result} onClick={() => navigate(value)}><span className="step-number">{i + 1}</span><span>{['Design', 'Preview', 'Try on', 'Result'][i]}</span>{value === 'reveal' && stale && <span className="stale-dot" aria-label="Previous design"/>}</button>)}
      </nav>
      {(stage !== 'create' || advanced) && <div className="page-intro"><div><p className="eyebrow">{stage === 'create' ? 'A PATTERN ONLY YOU COULD MAKE' : stage === 'preview' ? 'SEE EVERY SIDE' : stage === 'try-on' ? 'FROM YOUR IMAGINATION TO YOU' : 'YOUR DESIGN. YOUR MOMENT.'}</p><h1 ref={heading} tabIndex={-1}>{stage === 'create' ? <>Make your own batik.</> : stage === 'preview' ? <>Preview your garment.</> : stage === 'try-on' ? <>Try on your design.</> : <>Your finished look.</>}</h1><p className="intro-copy">{stage === 'create' ? 'Explore florals, mix your dyes, and make your own Malaysian-inspired batik.' : stage === 'preview' ? 'Rotate, zoom, and adjust your design before trying it on.' : stage === 'try-on' ? sampleAllowed ? 'Choose a photo, use your camera, or try a sample person.' : 'Choose a full-body photo or use your camera.' : 'Compare your original photo and save your wearing preview.'}</p></div><div className="studio-stamp" aria-hidden="true">ORIGINAL<br/><span>✳</span><br/>BY YOU</div></div>}
      {error && <div className="message error" role="alert"><strong>Let’s try that again.</strong> {error}</div>}
      {notice && <div className="message" role="status">{notice}</div>}

      {stage === 'create' && !advanced && <GuidedStudio design={design} update={update} fabric={fabric} shirt={shirt} step={guidedStep} setStep={setGuidedStep} onAdvanced={() => setAdvanced(true)} onPreview={() => navigate('preview')} onExport={() => void exportPattern()} onExportCloth={() => void exportCloth()}/>}
      {stage === 'create' && advanced && <div className="studio-return"><button className="text-button" onClick={() => { setGuidedStep(5); setAdvanced(false); }}>← Back to guided design</button><span className="small-note">Your changes will come with you.</span></div>}
      {stage === 'create' && advanced && <Studio design={design} update={update} fabric={fabric} shirt={shirt} onExport={() => void exportPattern()} onExportCloth={() => void exportCloth()} onPreview={() => navigate('preview')}/>}

      {stage === 'preview' && <PreviewStudio design={design} update={update} shirt={shirt} fabric={fabric} onEdit={() => navigate('create')} onTryOn={() => navigate('try-on')}/> }

      {stage === 'try-on' && <section className={`photo-wizard ${cameraOpen ? 'camera-is-open' : ''}`} aria-label="Try on your batik">
        <div className="photo-wizard-body">
          <section className="guided-photo">
            <div className="photo-step-toolbar"><h2>{photo ? 'Your selected photo' : 'Add a photo'}</h2>{photo?.sample && <span className="pill">Sample person</span>}</div>
            <div className="photo-step-content">
              {cameraOpen ? <CameraCapture onClose={() => setCameraOpen(false)} onCapture={file => { setCameraOpen(false); void choosePhoto(file); }}/> : photo ? <img className="guided-person" src={photo.image} alt={photo.sample ? 'Synthetic sample person selected for try-on' : 'Your selected photo'}/> : <div className="guided-photo-empty"><svg width="46" height="58" viewBox="0 0 72 85" fill="none" aria-hidden="true"><circle cx="36" cy="23" r="14" stroke="currentColor" strokeWidth="1.5"/><path d="M9 77V66C9 48 63 48 63 66V77M2 9V2H15M57 2H70V15M2 70V83H15M57 83H70V70" stroke="currentColor" strokeWidth="1.5"/></svg><h3>Add a full-body photo</h3><p>Use a clear, front-facing, full-body photo<br/>with your head, hands, and shoes visible.</p><div className="photo-choice-buttons"><button className="secondary-button" disabled={photoBusy || busy} onClick={() => fileInput.current?.click()}>{photoBusy ? 'Opening photo…' : 'Choose a photo'}</button><button className="secondary-button" disabled={photoBusy || busy} onClick={() => { setError(''); setCameraOpen(true); }}>Use camera</button></div><button className="text-button" disabled={photoBusy || busy || !sampleAllowed} onClick={() => void chooseSample()}>Use a sample person</button><span className="small-note">{!sampleAllowed ? garment.group === 'kids' ? 'For kids’ styles, add a photo of a child.' : 'This garment needs a full-body photo; the sample is cropped.' : 'JPEG or PNG · Up to 10 MB'}</span></div>}
            </div>
            <input ref={fileInput} type="file" className="visually-hidden" aria-label="Upload a JPEG or PNG photo" accept="image/jpeg,image/png" disabled={busy || photoBusy} onChange={e => { const file = e.currentTarget.files?.[0]; if (file) { setCameraOpen(false); void choosePhoto(file); } e.currentTarget.value = ''; }}/>
            {photo && !cameraOpen && <div className="guided-photo-actions"><button className="text-button" disabled={busy || photoBusy} onClick={() => fileInput.current?.click()}>Replace photo</button><button className="text-button" disabled={busy || photoBusy} onClick={() => { setError(''); setCameraOpen(true); }}>Use camera</button><button className="text-button" disabled={busy || photoBusy} onClick={() => void chooseSample()}>{photoBusy ? 'Opening photo…' : 'Use sample'}</button></div>}
          </section>
          <aside className="photo-design-preview"><div className="photo-step-toolbar"><h2>Your design</h2><button className="text-button" onClick={() => navigate('create')}>Edit design</button></div><img className="photo-preview-shirt" src={shirt} alt="Your current batik garment design to send for try-on"/><div className="photo-design-label"><img src={fabric} alt="Your source pattern"/><span>{design.mode === 'draw' ? 'Your painted batik' : motifs.find(m => m.value === design.motif)?.label}<small>{garment.label} · {design.placement === 'hem' ? 'Hem border' : design.placement === 'panels' ? 'Side panels' : 'All-over pattern'}</small></span></div></aside>
        </div>
        <footer className="photo-step-footer">
          <div className="photo-generation-copy">{busy ? <p role="status">Creating your preview. {elapsed}s elapsed.<br/>This can take up to 90 seconds.</p> : <><p>{sampleMismatch ? 'Replace the sample with a suitable full-body photo for this garment.' : !photo ? sampleAllowed ? 'Choose a photo or use a sample to continue.' : 'Upload a full-body photo or use your camera to continue.' : 'Generate sends this photo and garment design to OpenAI.'}</p><small>AI appearance preview. Pattern details may vary. Fit is not guaranteed.</small></>}{(statusError || status && !status.configured) && <p className="photo-service-note" role="status">{statusError ? 'The preview service is unavailable.' : 'Live try-on is not connected yet.'} <button className="text-button" onClick={() => void checkStatus()}>Check again</button></p>}</div>
          <button className="primary-button" onClick={() => void generate()} disabled={cameraOpen || !photo || sampleMismatch || busy || photoBusy || !status?.configured}>{busy ? <><span className="spinner"/> Creating your look…</> : <>Generate my look <span aria-hidden="true">→</span></>}</button>
        </footer>
      </section>}

      {stage === 'reveal' && result && <><div className="reveal-layout"><section className="result-card"><div className="result-toolbar"><span className="eyebrow">{showOriginal ? 'THE BEFORE' : 'MADE FROM YOUR IMAGINATION'}</span><div className="segmented" role="group" aria-label="Compare original and generated preview"><button aria-pressed={showOriginal} onClick={() => setShowOriginal(true)}>Original</button><button aria-pressed={!showOriginal} onClick={() => setShowOriginal(false)}>Your look</button></div></div><img className="result-image" src={showOriginal ? result.photo.image : result.image} alt={showOriginal ? 'Original photo used for this preview' : 'AI-generated appearance preview wearing your batik-inspired garment'}/><p className="result-caption">{showOriginal ? result.photo.sample ? 'Synthetic demo model · Original image' : 'Your original photo' : 'AI appearance preview. Pattern details may vary. Fit is not guaranteed.'}</p></section><aside className="reveal-details"><span className="eyebrow">DESIGNED BY YOU</span><h2>Your batik,<br/>on you.</h2><p>Save your look or return to your design to make changes.</p>{stale && <div className="message stale-message" role="status"><strong>A previous design.</strong> You’ve changed your pattern since this preview. Generate again to see your latest creation.<button className="text-button" onClick={() => navigate('try-on')}>Try on the latest design ↗</button></div>}<div className="source-pattern"><img src={svgUrl(fabricSvg(result.design))} alt="Exact source pattern used to generate this preview"/><div><span className="eyebrow">THE ORIGINAL PATTERN</span><p>This is the exact design used for this preview.</p></div></div><button className="primary-button" onClick={() => { download(result.image, 'wear-your-story-look.png'); setNotice('Your wearing preview has been downloaded.'); }}>Download my look <span aria-hidden="true">↓</span></button><button className="secondary-button" onClick={() => void exportPattern(result.design)}>Download this pattern</button><button className="text-button" onClick={() => navigate('create')}>← Edit my pattern</button></aside></div></>}
      <div className="session-footer"><p>Your design stays in this tab until you reload.</p><button className="text-button" onClick={startAgain}>Start again</button></div>
    </main>
    <footer className="site-footer"><span>Wear Your Story</span><span>Contemporary batik-inspired design</span></footer>
  </div>;
}
