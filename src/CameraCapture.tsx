import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { startCaptureTimer } from './captureTimer';

export default function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const nativeInput = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<'setup' | 'live' | 'review'>('setup');
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [delay, setDelay] = useState(10);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [captured, setCaptured] = useState<{ file: File; url: string } | null>(null);
  const mounted = useRef(true);
  const cancelTimer = useRef<(() => void) | null>(null);
  const captureLock = useRef(false);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.current?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; cancelTimer.current?.(); };
  }, []);
  useEffect(() => {
    if (!captured) return;
    return () => URL.revokeObjectURL(captured.url);
  }, [captured]);
  function stopCountdown() { cancelTimer.current?.(); cancelTimer.current = null; setRemaining(null); }
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && cancelTimer.current) { stopCountdown(); setError('The timer stopped when you left this screen. Start it again when you’re ready.'); }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    let disposed = false, stream: MediaStream | undefined;
    setReady(false); setError('');
    if (phase !== 'live') return;
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs HTTPS or localhost. You can also use your device camera below.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1080 }, height: { ideal: 1920 } }, audio: false });
        if (disposed) { stream.getTracks().forEach(track => track.stop()); return; }
        stream.getVideoTracks().forEach(track => track.addEventListener('ended', () => { if (!disposed) { setReady(false); stopCountdown(); setError('The camera disconnected. Close and reopen it, or choose a photo.'); } }));
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
      } catch (e) {
        if (disposed) return;
        const name = e instanceof Error ? e.name : '';
        setError(name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser, or choose a photo.' : name === 'NotFoundError' ? 'No camera was found. Choose a photo instead.' : e instanceof Error && e.message.includes('HTTPS') ? e.message : 'The camera could not open. Close other camera apps or choose a photo.');
      }
    }
    void start();
    return () => { disposed = true; cancelTimer.current?.(); stream?.getTracks().forEach(track => track.stop()); };
  }, [facing, phase]);
  function capture() {
    cancelTimer.current = null;
    const v = video.current;
    if (!v || !ready || !v.videoWidth || !v.videoHeight || captureLock.current) { setRemaining(null); return; }
    captureLock.current = true; setCapturing(true);
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setError('Capture is unavailable. Choose a photo instead.'); captureLock.current = false; setCapturing(false); return; }
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(blob => {
      if (!mounted.current) return;
      captureLock.current = false; setCapturing(false); setRemaining(null);
      if (blob) {
        const file = new File([blob], 'full-body-camera-photo.jpg', { type: 'image/jpeg' });
        setCaptured({ file, url: URL.createObjectURL(blob) }); setPhase('review');
      } else setError('The photo could not be captured. Please try again.');
    }, 'image/jpeg', .92);
  }
  function startTimer() {
    if (!ready || cancelTimer.current || remaining !== null || captureLock.current) return;
    setError('');
    cancelTimer.current = startCaptureTimer(delay, setRemaining, capture);
  }
  const counting = remaining !== null;
  return createPortal(<dialog ref={dialog} className="camera-dialog" aria-labelledby="camera-title" onCancel={event => { event.preventDefault(); stopCountdown(); onClose(); }}><div className={`camera-panel guided-camera camera-phase-${phase}`}>
    <div className="camera-toolbar"><strong id="camera-title">{phase === 'setup' ? 'Set up your photo' : phase === 'review' ? 'Check your photo' : 'Full-body photo'}</strong><button className="text-button camera-close" aria-label="Close camera" onClick={() => { stopCountdown(); onClose(); }}><span aria-hidden="true">×</span></button></div>
    {phase === 'setup' && <div className="camera-setup"><ol><li><strong>Place your phone.</strong><span>Upright at waist height, in good light.</span></li><li><strong>Step back.</strong><span>About 2–3 metres, with head and shoes in view.</span></li><li><strong>Face forward.</strong><span>Stand naturally, arms away from your sides.</span></li></ol><p className="small-note">The timer gives you time to get into position.</p><button className="primary-button" onClick={() => setPhase('live')}>Open camera</button></div>}
    {phase === 'live' && <>
      {error && <p className="camera-error" role="alert">{error}</p>}
      <div className="camera-framing"><video ref={video} autoPlay muted playsInline className={facing === 'user' ? 'camera-video mirrored' : 'camera-video'} onLoadedData={() => setReady(true)} onEmptied={() => { setReady(false); stopCountdown(); }}/><svg className="body-framing-guide" viewBox="0 0 180 300" fill="none" aria-hidden="true"><rect x="15" y="7" width="150" height="286" rx="18" stroke="white" strokeDasharray="5 6"/><circle cx="90" cy="39" r="20"/><path d="M73 60Q90 70 107 60L122 89L143 153Q147 166 138 166L115 111L111 172L120 267L105 277L90 196L75 277L60 267L69 172L65 111L42 166Q33 166 37 153L58 89Z"/><path d="M58 281H78M102 281H122"/></svg>{counting && <div className="camera-countdown" aria-hidden="true"><strong>{remaining || '✓'}</strong><span>Get into position</span></div>}<span className="camera-frame-caption">Keep your head and both shoes inside the guide</span></div>
      <p className="small-note" role="status">{error ? 'Use your device camera below, or close and try again.' : ready ? 'Step back until your whole body is visible.' : 'Opening camera…'}</p>
      <div className="camera-timer-options" role="group" aria-label="Photo timer"><span>Timer</span>{[5,10].map(seconds => <button key={seconds} aria-pressed={delay === seconds} disabled={counting || capturing} onClick={() => setDelay(seconds)}>{seconds}s</button>)}</div>
      <div className="camera-buttons">{counting ? <button className="primary-button" onClick={stopCountdown}>Cancel timer</button> : <button className="primary-button" disabled={!ready || capturing} onClick={startTimer}>{capturing ? 'Capturing…' : `Start ${delay}s timer`}</button>}<button className="secondary-button" disabled={counting || capturing} onClick={() => { stopCountdown(); setFacing(facing === 'user' ? 'environment' : 'user'); }}>Switch camera</button></div>
      <span className="visually-hidden" role="status" aria-live="assertive">{counting ? `${remaining} seconds until photo` : ''}</span>
      <p className="small-note">The selfie preview is mirrored. Your saved photo is unmirrored.</p>
    </>}
    {phase === 'review' && captured && <div className="camera-review"><img src={captured.url} alt="Your captured photo to review"/><p>Head, hands and shoes in view?</p><div className="camera-buttons"><button className="primary-button" onClick={() => onCapture(captured.file)}>Use this photo</button><button className="secondary-button" onClick={() => { setCaptured(null); setPhase('live'); }}>Retake</button></div></div>}
    {phase !== 'review' && <><button className="text-button" disabled={counting || capturing} onClick={() => nativeInput.current?.click()}>Device camera</button><p className="small-note">For the device camera, set its own timer to 10 seconds.</p><input ref={nativeInput} className="visually-hidden" type="file" accept="image/jpeg,image/png" capture={facing} aria-label="Take a full-body photo with device camera" onChange={e => { const file = e.currentTarget.files?.[0]; if (file) { setCaptured({ file, url: URL.createObjectURL(file) }); setPhase('review'); } e.currentTarget.value = ''; }}/></>}
  </div></dialog>, document.body);
}
