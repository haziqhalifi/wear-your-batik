import { Component, lazy, Suspense, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { type Design } from './patterns';
import { garmentName } from './garments';

const Garment3D = lazy(() => import('./Garment3D'));
class LiveViewerBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

export default function LiveGarmentPreview({ design, shirt }: { design: Design; shirt: string }) {
  const [flat, setFlat] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.showModal();
    return () => { document.body.style.overflow = previousOverflow; opener.current?.focus({ preventScroll: true }); };
  }, [expanded]);
  const name = garmentName(design.garment);
  const fallback = <img className="live-garment-flat" src={shirt} alt={`Live preview of your ${name.toLowerCase()}`}/>;
  return <div className="live-garment-showroom">
    <div className="live-garment-heading"><h2>{name}</h2></div>
    <div className="live-garment-viewer">
      {!expanded && (flat ? fallback : <LiveViewerBoundary fallback={fallback}><Suspense fallback={fallback}><Garment3D compact design={design} onFallback={() => setFlat(true)}/></Suspense></LiveViewerBoundary>)}
      <button ref={opener} type="button" className="live-garment-expand" aria-label={`View ${name.toLowerCase()} full screen`} title="View full screen" onClick={() => setExpanded(true)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5"/></svg></button>
    </div>
    {expanded && createPortal(<dialog ref={dialog} className="garment-detail-dialog" aria-labelledby={titleId} onCancel={() => setExpanded(false)} onClose={() => setExpanded(false)}>
      <header><h2 id={titleId}>{name}</h2><button type="button" autoFocus className="garment-detail-close" aria-label="Close full-screen preview" title="Close" onClick={() => setExpanded(false)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></header>
      <div className="garment-detail-body">{flat ? fallback : <LiveViewerBoundary fallback={fallback}><Suspense fallback={fallback}><Garment3D compact detail design={design} onFallback={() => setFlat(true)}/></Suspense></LiveViewerBoundary>}</div>
      <p className="garment-detail-hint">Drag to rotate · Scroll or pinch to zoom</p>
    </dialog>, document.body)}
  </div>;
}
