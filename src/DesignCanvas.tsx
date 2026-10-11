import { useRef, useState, type PointerEvent } from 'react';
import StudioIcon from './StudioIcon';
import { MOTIFS, motifArtwork, tileArtwork, type Design, type Motif, type Stroke } from './patterns';

type Tool = 'pen' | 'wax' | 'dots' | 'stamp' | 'erase';
type Snapshot = { strokes: Stroke[]; underlay: boolean };
export function mirrorStroke(stroke: Stroke, symmetry: 'off' | 'mirror' | 'four'): Stroke[] {
  const result = [stroke];
  if (symmetry !== 'off') result.push({ ...stroke, flipX: !stroke.flipX, points: stroke.points.map(([x,y]) => [100-x,y]) });
  if (symmetry === 'four') result.push(...result.map(s => ({ ...s, flipY: !s.flipY, points: s.points.map(([x,y]): [number,number] => [x,100-y]) })));
  return result;
}
export default function DesignCanvas({ design, update }: { design: Design; update: (patch: Partial<Design>) => void }) {
  const [tool, setTool] = useState<Tool>('pen');
  const [ink, setInk] = useState(design.foreground);
  const [width, setWidth] = useState(2);
  const [stamp, setStamp] = useState<Motif>('flower');
  const [size, setSize] = useState(45);
  const [rotation, setRotation] = useState(0);
  const [symmetry, setSymmetry] = useState<'off' | 'mirror' | 'four'>('off');
  const [draft, setDraft] = useState<Stroke[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [redo, setRedo] = useState<Snapshot[]>([]);
  const active = useRef<{ id: number; stroke: Stroke } | null>(null);
  const snapshot = (): Snapshot => ({ strokes: design.strokes, underlay: design.underlay });
  function commit(patch: Snapshot) { setHistory(previous => [...previous.slice(-49), snapshot()]); setRedo([]); update(patch); }
  function point(event: PointerEvent<SVGSVGElement>): [number, number] {
    const rect = event.currentTarget.getBoundingClientRect();
    return [Math.round(Math.max(0, Math.min(100, (event.clientX-rect.left)/rect.width*100))*100)/100, Math.round(Math.max(0, Math.min(100, (event.clientY-rect.top)/rect.height*100))*100)/100];
  }
  function makeStroke(p: [number,number]): Stroke {
    return { points: [p], kind: tool, color: tool === 'wax' ? design.wax : ink, width: tool === 'erase' ? width*3 : width, stamp, rotation, size, accent: design.accent, secondary: design.secondary, wax: design.wax };
  }
  function addStamp() { commit({ ...snapshot(), strokes: [...design.strokes, ...mirrorStroke({ ...makeStroke([50,50]), kind: 'stamp' }, symmetry)] }); }
  function finish(event: PointerEvent<SVGSVGElement>, cancelled = false) {
    if (active.current?.id !== event.pointerId) return;
    if (!cancelled) {
      // Include the release point so a fast gesture still draws its full length.
      if (active.current.stroke.kind !== 'stamp') active.current.stroke.points.push(point(event));
      commit({ ...snapshot(), strokes: [...design.strokes, ...mirrorStroke(active.current.stroke, symmetry)] });
    }
    active.current = null; setDraft([]);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <div className="canvas-editor rich-canvas">
    <div className="drawing-tools" role="group" aria-label="Drawing tools">{([{ value: 'pen', label: 'Dye pen' }, { value: 'wax', label: 'Wax line' }, { value: 'dots', label: 'Dots' }, { value: 'stamp', label: 'Stamp' }, { value: 'erase', label: 'Eraser' }] as const).map(t => <button className="icon-control" key={t.value} aria-label={t.label} data-tooltip={t.label} aria-pressed={tool === t.value} onClick={() => setTool(t.value)}><StudioIcon name={t.value}/></button>)}</div>
    <div className="canvas-workbench"><div className="canvas-surface"><svg className="drawing-canvas" viewBox="0 0 100 100" role="img" aria-label="Batik drawing canvas" onPointerDown={event => {
      if (active.current || event.button !== 0) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const stroke = makeStroke(point(event)); active.current = { id: event.pointerId, stroke }; setDraft(mirrorStroke(stroke, symmetry));
    }} onPointerMove={event => {
      if (active.current?.id !== event.pointerId || active.current.stroke.kind === 'stamp') return;
      const next = point(event), previous = active.current.stroke.points.at(-1)!;
      if (Math.hypot(next[0]-previous[0], next[1]-previous[1]) < .35) return;
      active.current.stroke = { ...active.current.stroke, points: [...active.current.stroke.points, next] }; setDraft(mirrorStroke(active.current.stroke, symmetry));
    }} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)} onLostPointerCapture={() => { active.current = null; setDraft([]); }}>
      <g dangerouslySetInnerHTML={{ __html: tileArtwork({ ...design, strokes: [...design.strokes, ...draft] }, 'canvas') }}/>
      {symmetry !== 'off' && <path d={`M50 0V100${symmetry === 'four' ? 'M0 50H100' : ''}`} stroke={design.wax} strokeWidth=".3" strokeDasharray="2 2" opacity=".5" pointerEvents="none"/>}
    </svg><div className="canvas-caption"><span>{tool === 'stamp' ? 'Tap anywhere to place a motif' : tool === 'erase' ? 'Erase your added ink and stamps' : 'Draw with your finger, mouse or pen'}</span><span>Repeat tile</span></div></div>
    <aside className="brush-settings" aria-label="Brush settings">
      <label className="ink-picker" title="Custom ink colour"><span className="stage-title-sr-only">Ink colour</span><input type="color" value={ink} aria-label="Custom ink colour" disabled={tool === 'wax' || tool === 'erase'} onInput={e => setInk(e.currentTarget.value)}/></label>
      <div className="ink-swatches" role="group" aria-label="Ink colours">{[design.foreground, design.accent, design.secondary, design.wax, '#ffffff', '#252728'].map((c,i) => <button key={i} style={{ backgroundColor: c }} aria-label={`Use ink ${c}`} aria-pressed={ink === c} disabled={tool === 'wax' || tool === 'erase'} onClick={() => setInk(c)}/>)}</div>
      {tool === 'stamp' ? <><div className="stamp-design-picker" role="group" aria-label="Stamp design"><span>Stamp design</span><div className="stamp-design-options">{MOTIFS.map(m => <button type="button" key={m.value} aria-label={m.label} title={m.label} aria-pressed={stamp === m.value} onClick={() => setStamp(m.value)}><svg viewBox="-22 -22 144 144" aria-hidden="true" style={{ backgroundColor: design.background }}><g transform={`rotate(${rotation} 50 50)`} dangerouslySetInnerHTML={{ __html: motifArtwork(m.value, { ...design, foreground: ink }) }}/></svg><span className="stamp-design-check" aria-hidden="true">✓</span></button>)}</div></div><label>Stamp size <output>{size}%</output><input type="range" min="15" max="95" value={size} onChange={e => setSize(Number(e.target.value))}/></label></> : <label>Brush width <output>{width}</output><input type="range" min=".5" max="10" step=".5" value={width} onChange={e => setWidth(Number(e.target.value))}/></label>}
      <details className="brush-more"><summary aria-label="More brush options" title="More brush options"><StudioIcon name="settings"/></summary>{tool === 'stamp' && <><label>Stamp angle <output>{rotation}°</output><input type="range" min="-180" max="180" step="15" value={rotation} onChange={e => setRotation(Number(e.target.value))}/></label><button className="secondary-button" onClick={addStamp}>Place in centre</button></>}<label>Symmetry<select value={symmetry} onChange={e => setSymmetry(e.target.value as typeof symmetry)}><option value="off">Freehand</option><option value="mirror">Mirror left / right</option><option value="four">Four ways</option></select></label></details>
      <p className="small-note">{tool === 'wax' ? 'Draw with your palette’s wax colour.' : tool === 'erase' ? 'The starter pattern stays underneath. Use Blank cloth to remove it.' : 'New marks use the colours selected here.'}</p>
    </aside></div>
    <div className="canvas-actions"><button className="icon-control" aria-label="Undo" data-tooltip="Undo" disabled={!history.length} onClick={() => { setRedo(previous => [...previous, snapshot()]); update(history.at(-1)!); setHistory(history.slice(0,-1)); }}><StudioIcon name="undo"/></button><button className="icon-control" aria-label="Redo" data-tooltip="Redo" disabled={!redo.length} onClick={() => { setHistory(previous => [...previous, snapshot()]); update(redo.at(-1)!); setRedo(redo.slice(0,-1)); }}><StudioIcon name="redo"/></button><button className="icon-control" aria-label="Clear cloth" data-tooltip="Clear cloth" onClick={() => commit({ strokes: [], underlay: false })}><StudioIcon name="clear"/></button><button className="icon-control starter-visibility" aria-label={design.underlay ? 'Hide starter motif' : 'Show starter motif'} data-tooltip={design.underlay ? 'Hide starter motif' : 'Show starter motif'} aria-pressed={design.underlay} onClick={() => commit({ ...snapshot(), underlay: !design.underlay })}><StudioIcon name={design.underlay ? 'eye' : 'eye-off'}/></button></div>
  </div>;
}
