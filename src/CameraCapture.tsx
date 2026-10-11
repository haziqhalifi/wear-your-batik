import { useEffect, useRef, useState } from 'react';

export default function CameraCapture({ onCapture, onClose }: { onCapture: (file: File) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [facing, setFacing] = useState<'user' | 'environment'>('user');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const nativeInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let disposed = false, stream: MediaStream | undefined;
    setReady(false); setError('');
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs HTTPS or localhost. You can also use your device camera below.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 1600 } }, audio: false });
        if (disposed) { stream.getTracks().forEach(track => track.stop()); return; }
        if (video.current) { video.current.srcObject = stream; await video.current.play(); }
      } catch (e) {
        if (disposed) return;
        const name = e instanceof Error ? e.name : '';
        setError(name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser, or choose a photo.' : name === 'NotFoundError' ? 'No camera was found. Choose a photo instead.' : e instanceof Error && e.message.includes('HTTPS') ? e.message : 'The camera could not open. Close other camera apps or choose a photo.');
      }
    }
    void start();
    return () => { disposed = true; stream?.getTracks().forEach(track => track.stop()); };
  }, [facing]);
  function capture() {
    const v = video.current;
    if (!v || !ready || !v.videoWidth || capturing) return;
    setCapturing(true);
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { setError('Capture is unavailable. Choose a photo instead.'); setCapturing(false); return; }
    ctx.drawImage(v, 0, 0);
    canvas.toBlob(blob => {
      if (!mounted.current) return;
      setCapturing(false);
      if (blob) onCapture(new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' }));
      else setError('The photo could not be captured. Please try again.');
    }, 'image/jpeg', .92);
  }
  return <div className="camera-panel"><div className="camera-toolbar"><strong>Take your photo</strong><button className="text-button" onClick={onClose}>Close camera</button></div>
    <p className="small-note">Frame your head, shoulders and waist. Keep both arms visible.</p>
    {error ? <p className="message" role="alert">{error}</p> : <><video ref={video} autoPlay muted playsInline className={facing === 'user' ? 'camera-video mirrored' : 'camera-video'} onLoadedData={() => setReady(true)}/><p className="small-note">{ready ? 'The selfie preview is mirrored. Your saved photo is unmirrored.' : 'Opening camera…'}</p></>}
    <div className="camera-buttons"><button className="primary-button" disabled={!ready || Boolean(error) || capturing} onClick={capture}>{capturing ? 'Capturing…' : 'Take photo'}</button><button className="secondary-button" disabled={capturing} onClick={() => setFacing(facing === 'user' ? 'environment' : 'user')}>Switch camera</button></div>
    <button className="text-button" onClick={() => nativeInput.current?.click()}>Use device camera instead</button><input ref={nativeInput} className="visually-hidden" type="file" accept="image/jpeg,image/png" capture={facing} aria-label="Take a photo with device camera" onChange={e => { const file = e.currentTarget.files?.[0]; if (file) onCapture(file); }}/>
  </div>;
}
