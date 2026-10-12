import { useRef, useState, type PointerEvent } from 'react';
import StudioIcon from './StudioIcon';
import { MOTIFS, motifArtwork, stampTransform, tileArtwork, type Design, type Motif, type Stroke } from './patterns';
import { moveStamp, stampAtPoint, STAMP_BOUNDS, type CanvasPoint } from './stampEditing';

type Tool = 'pen' | 'wax' | 'dots' | 'stamp' | 'move' | 'erase';
type Snapshot = { strokes: Stroke[]; underlay: boolean };
type StampEdit = { index: number; stroke: Stroke; before: Snapshot };
type Gesture = { id: number; stroke: Stroke } | { id: number; index: number; origin: CanvasPoint; stroke: Stroke };
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
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [symmetry, setSymmetry] = useState<'off' | 'mirror' | 'four'>('off');
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState<Stroke[]>([]);
  const [editPreview, setEditPreview] = useState<StampEdit | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [redo, setRedo] = useState<Snapshot[]>([]);
  const active = useRef<Gesture | null>(null);
  const edit = useRef<StampEdit | null>(null);
  const snapshot = (): Snapshot => ({ strokes: design.strokes, underlay: design.underlay });
  const displayedStrokes = editPreview ? design.strokes.map((stroke, index) => index === editPreview.index ? editPreview.stroke : stroke) : design.strokes;
  const selectedStamp = selected !== null && displayedStrokes[selected]?.kind === 'stamp' ? displayedStrokes[selected] : null;
  const stampTools = tool === 'stamp' || tool === 'move';
  const shownSize = selectedStamp ? selectedStamp.size ?? 30 : size;
  const shownRotation = selectedStamp ? selectedStamp.rotation ?? 0 : rotation;
  const shownFlipX = selectedStamp ? Boolean(selectedStamp.flipX) : flipX;
  const shownFlipY = selectedStamp ? Boolean(selectedStamp.flipY) : flipY;
  const stampIndices = design.strokes.flatMap((stroke, index) => stroke.kind === 'stamp' ? [index] : []);

  function commit(patch: Snapshot, before = snapshot()) {
    setHistory(previous => [...previous.slice(-49), before]); setRedo([]); update(patch);
  }
  function previewStamp(index: number, patch: Partial<Stroke>) {
    if (design.strokes[index]?.kind !== 'stamp') return;
    const previous = edit.current?.index === index ? edit.current : { index, stroke: design.strokes[index], before: snapshot() };
    edit.current = { ...previous, stroke: { ...previous.stroke, ...patch } };
    setEditPreview(edit.current);
  }
  function finishEdit(cancelled = false) {
    const pending = edit.current;
    edit.current = null; setEditPreview(null);
    if (!pending || cancelled || JSON.stringify(pending.stroke) === JSON.stringify(pending.before.strokes[pending.index])) return;
    commit({ ...snapshot(), strokes: design.strokes.map((stroke, index) => index === pending.index ? pending.stroke : stroke) }, pending.before);
  }
  function changeStamp(patch: Partial<Stroke>, preview = false) {
    if (selected !== null && selectedStamp) {
      previewStamp(selected, patch);
      if (!preview) finishEdit();
    } else {
      if (patch.size !== undefined) setSize(patch.size);
      if (patch.rotation !== undefined) setRotation(patch.rotation);
      if (patch.flipX !== undefined) setFlipX(patch.flipX);
      if (patch.flipY !== undefined) setFlipY(patch.flipY);
    }
  }
  function chooseTool(next: Tool) { finishEdit(); setSelected(null); setTool(next); }
  function point(event: PointerEvent<SVGSVGElement>): CanvasPoint {
    // SVG coordinates also handle any letterboxing of the square cloth.
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return [50, 50];
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return [p.x, p.y].map(value => Math.round(Math.max(0, Math.min(100, value)) * 100) / 100) as CanvasPoint;
  }
  function makeStroke(p: CanvasPoint): Stroke {
    return { points: [p], kind: tool === 'move' ? 'stamp' : tool, color: tool === 'wax' ? design.wax : ink, width: tool === 'erase' ? width*3 : width, stamp, rotation, size, flipX, flipY, accent: design.accent, secondary: design.secondary, wax: design.wax };
  }
  function placeStamp(stroke: Stroke) {
    const index = design.strokes.length;
    commit({ ...snapshot(), strokes: [...design.strokes, ...mirrorStroke(stroke, symmetry)] });
    setSelected(index); setTool('move');
  }
  function removeStamp() {
    if (selected === null || !selectedStamp) return;
    finishEdit(true);
    commit({ ...snapshot(), strokes: design.strokes.filter((_, index) => index !== selected) });
    setSelected(null);
  }
  function moveGesture(gesture: Extract<Gesture, { index: number }>, next: CanvasPoint) {
    const [x, y] = gesture.stroke.points[0];
    previewStamp(gesture.index, moveStamp(gesture.stroke, [x + next[0] - gesture.origin[0], y + next[1] - gesture.origin[1]]));
  }
  function finish(event: PointerEvent<SVGSVGElement>, cancelled = false) {
    const gesture = active.current;
    if (gesture?.id !== event.pointerId) return;
    active.current = null;
    if ('index' in gesture) {
      if (!cancelled) moveGesture(gesture, point(event));
      finishEdit(cancelled);
    } else if (!cancelled) {
      if (gesture.stroke.kind === 'stamp') placeStamp(moveStamp(gesture.stroke, point(event)));
      else {
        const stroke = { ...gesture.stroke, points: [...gesture.stroke.points, point(event)] };
        commit({ ...snapshot(), strokes: [...design.strokes, ...mirrorStroke(stroke, symmetry)] });
      }
    }
    setDraft([]);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  const rangeEvents = { onPointerUp: () => finishEdit(), onPointerCancel: () => finishEdit(true), onKeyUp: () => finishEdit(), onBlur: () => finishEdit() };

  return <div className="canvas-editor rich-canvas">
    <div className="drawing-tools" role="group" aria-label="Drawing tools">{([{ value: 'pen', label: 'Dye pen' }, { value: 'wax', label: 'Wax line' }, { value: 'dots', label: 'Dots' }, { value: 'stamp', label: 'Stamp' }, { value: 'move', label: 'Move / edit stamps' }, { value: 'erase', label: 'Eraser' }] as const).map(t => <button className="icon-control" key={t.value} aria-label={t.label} data-tooltip={t.label} aria-pressed={tool === t.value} onClick={() => chooseTool(t.value)}><StudioIcon name={t.value}/></button>)}</div>
    <div className="canvas-workbench"><div className="canvas-surface"><svg className={`drawing-canvas ${tool === 'move' ? 'editing-stamps' : ''}`} viewBox="0 0 100 100" role="img" aria-label="Batik drawing canvas" aria-describedby="canvas-instructions" tabIndex={0} onKeyDown={event => {
      if (tool !== 'move') return;
      if (event.key === 'Escape') { finishEdit(true); setSelected(null); }
      if (!selectedStamp || selected === null) return;
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeStamp(); }
      const directions: Record<string, CanvasPoint> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        const [x, y] = selectedStamp.points[0], step = event.shiftKey ? 5 : 1;
        previewStamp(selected, moveStamp(selectedStamp, [x + direction[0] * step, y + direction[1] * step]));
      }
    }} onKeyUp={() => finishEdit()} onBlur={() => finishEdit()} onPointerDown={event => {
      if (active.current || event.button !== 0) return;
      event.currentTarget.focus({ preventScroll: true });
      const p = point(event);
      if (tool === 'move') {
        const index = stampAtPoint(design.strokes, p);
        setSelected(index);
        if (index === null) return;
        active.current = { id: event.pointerId, index, origin: p, stroke: design.strokes[index] };
      } else {
        const stroke = makeStroke(p); active.current = { id: event.pointerId, stroke }; setDraft(mirrorStroke(stroke, symmetry));
      }
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      const gesture = active.current;
      if (gesture?.id !== event.pointerId) return;
      const next = point(event);
      if ('index' in gesture) { moveGesture(gesture, next); return; }
      if (gesture.stroke.kind === 'stamp') {
        gesture.stroke = moveStamp(gesture.stroke, next); setDraft(mirrorStroke(gesture.stroke, symmetry)); return;
      }
      const previous = gesture.stroke.points.at(-1)!;
      if (Math.hypot(next[0]-previous[0], next[1]-previous[1]) < .35) return;
      gesture.stroke = { ...gesture.stroke, points: [...gesture.stroke.points, next] }; setDraft(mirrorStroke(gesture.stroke, symmetry));
    }} onPointerUp={event => finish(event)} onPointerCancel={event => finish(event, true)} onLostPointerCapture={() => { if (active.current) { active.current = null; setDraft([]); finishEdit(true); } }}>
      <g dangerouslySetInnerHTML={{ __html: tileArtwork({ ...design, strokes: [...displayedStrokes, ...draft] }, 'canvas') }}/>
      {symmetry !== 'off' && <path d={`M50 0V100${symmetry === 'four' ? 'M0 50H100' : ''}`} stroke={design.wax} strokeWidth=".3" strokeDasharray="2 2" opacity=".5" pointerEvents="none"/>}
      {selectedStamp && tool === 'move' && <g className="stamp-selection" transform={stampTransform(selectedStamp)} pointerEvents="none" aria-hidden="true">
        <rect x={STAMP_BOUNDS.min} y={STAMP_BOUNDS.min} width={STAMP_BOUNDS.max - STAMP_BOUNDS.min} height={STAMP_BOUNDS.max - STAMP_BOUNDS.min} vectorEffect="non-scaling-stroke"/>
        <path d="M44 50H56M50 44V56" vectorEffect="non-scaling-stroke"/>
      </g>}
    </svg><div className="canvas-caption" id="canvas-instructions"><span>{tool === 'stamp' ? 'Tap or drag to place a motif' : tool === 'move' ? selectedStamp ? 'Drag to move · Arrow keys to nudge' : 'Select a stamp on the cloth or in the picker' : tool === 'erase' ? 'Erase your added ink and stamps' : 'Draw with your finger, mouse or pen'}</span><span>Repeat tile</span></div></div>
    <aside className="brush-settings" aria-label="Brush settings">
      {tool !== 'move' && <><label className="ink-picker" title="Custom ink colour"><span className="stage-title-sr-only">Ink colour</span><input type="color" value={ink} aria-label="Custom ink colour" disabled={tool === 'wax' || tool === 'erase'} onInput={e => setInk(e.currentTarget.value)}/></label>
      <div className="ink-swatches" role="group" aria-label="Ink colours">{[design.foreground, design.accent, design.secondary, design.wax, '#ffffff', '#252728'].map((c,i) => <button key={i} style={{ backgroundColor: c }} aria-label={`Use ink ${c}`} aria-pressed={ink === c} disabled={tool === 'wax' || tool === 'erase'} onClick={() => setInk(c)}/>)}</div></>}
      {tool === 'stamp' && <div className="stamp-design-picker" role="group" aria-label="Stamp design"><span>Stamp design</span><div className="stamp-design-options">{MOTIFS.map(m => <button type="button" key={m.value} aria-label={m.label} title={m.label} aria-pressed={stamp === m.value} onClick={() => setStamp(m.value)}><svg viewBox="-22 -22 144 144" aria-hidden="true" style={{ backgroundColor: design.background }}><g transform={`translate(50 50) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1}) rotate(${rotation}) translate(-50 -50)`} dangerouslySetInnerHTML={{ __html: motifArtwork(m.value, { ...design, foreground: ink }) }}/></svg><span className="stamp-design-check" aria-hidden="true">✓</span></button>)}</div></div>}
      {tool === 'move' && <div className="stamp-edit-picker"><label>Selected stamp<select aria-label="Selected stamp" value={selectedStamp ? selected! : ''} disabled={!stampIndices.length} onChange={event => { finishEdit(); setSelected(event.target.value === '' ? null : Number(event.target.value)); }}><option value="">{stampIndices.length ? 'Choose a stamp' : 'No stamps yet'}</option>{stampIndices.map((index, order) => <option key={index} value={index}>{order + 1}. {MOTIFS.find(m => m.value === design.strokes[index].stamp)?.label || 'Stamp'}</option>)}</select></label><button type="button" className="secondary-button" onClick={() => chooseTool('stamp')}>Add stamp</button></div>}
      {stampTools ? <div className="stamp-transform-settings" aria-label="Stamp customization">
        <label>Stamp size <output>{shownSize}%</output><input type="range" aria-label="Stamp size" min="15" max="95" value={shownSize} disabled={tool === 'move' && !selectedStamp} onChange={event => changeStamp({ size: Number(event.target.value) }, true)} {...rangeEvents}/></label>
        <label>Stamp angle <output>{shownRotation}°</output><input type="range" aria-label="Stamp angle" min="-180" max="180" step="1" value={shownRotation} disabled={tool === 'move' && !selectedStamp} onChange={event => changeStamp({ rotation: Number(event.target.value) }, true)} {...rangeEvents}/></label>
        <div className="stamp-mirror-controls" role="group" aria-label="Mirror stamp"><button type="button" aria-label="Mirror stamp left / right" title="Mirror left / right" aria-pressed={shownFlipX} disabled={tool === 'move' && !selectedStamp} onClick={() => changeStamp({ flipX: !shownFlipX })}><StudioIcon name="mirror-x"/><span>Left / right</span></button><button type="button" aria-label="Mirror stamp up / down" title="Mirror up / down" aria-pressed={shownFlipY} disabled={tool === 'move' && !selectedStamp} onClick={() => changeStamp({ flipY: !shownFlipY })}><StudioIcon name="mirror-y"/><span>Up / down</span></button></div>
        {tool === 'move' && selectedStamp && <><details className="stamp-position"><summary>Position</summary>{(['Horizontal', 'Vertical'] as const).map((label, axis) => <label key={label}>{label} <output>{selectedStamp.points[0][axis]}%</output><input type="range" aria-label={`${label} stamp position`} min="0" max="100" step="1" value={selectedStamp.points[0][axis]} onChange={event => { const position: CanvasPoint = [...selectedStamp.points[0]]; position[axis] = Number(event.target.value); changeStamp(moveStamp(selectedStamp, position), true); }} {...rangeEvents}/></label>)}</details><button type="button" className="text-button remove-stamp" onClick={removeStamp}>Remove stamp</button></>}
      </div> : <label>Brush width <output>{width}</output><input type="range" min=".5" max="10" step=".5" value={width} onChange={e => setWidth(Number(e.target.value))}/></label>}
      {tool !== 'move' && <details className="brush-more"><summary aria-label="More brush options" title="More brush options"><StudioIcon name="settings"/></summary>{tool === 'stamp' && <button className="secondary-button" onClick={() => placeStamp({ ...makeStroke([50,50]), kind: 'stamp' })}>Place in centre</button>}<label>Symmetry<select value={symmetry} onChange={e => setSymmetry(e.target.value as typeof symmetry)}><option value="off">Freehand</option><option value="mirror">Mirror left / right</option><option value="four">Four ways</option></select></label></details>}
      <p className="small-note">{tool === 'move' ? 'Each stamp can be edited independently. Position sliders also move it without dragging.' : tool === 'wax' ? 'Draw with your palette’s wax colour.' : tool === 'erase' ? 'The starter pattern stays underneath. Use Blank cloth to remove it.' : 'New marks use the colours selected here.'}</p>
    </aside></div>
    <div className="canvas-actions"><button className="icon-control" aria-label="Undo" data-tooltip="Undo" disabled={!history.length} onClick={() => { finishEdit(true); setSelected(null); setRedo(previous => [...previous, snapshot()]); update(history.at(-1)!); setHistory(history.slice(0,-1)); }}><StudioIcon name="undo"/></button><button className="icon-control" aria-label="Redo" data-tooltip="Redo" disabled={!redo.length} onClick={() => { finishEdit(true); setSelected(null); setHistory(previous => [...previous, snapshot()]); update(redo.at(-1)!); setRedo(redo.slice(0,-1)); }}><StudioIcon name="redo"/></button><button className="icon-control" aria-label="Clear cloth" data-tooltip="Clear cloth" onClick={() => { finishEdit(true); setSelected(null); commit({ strokes: [], underlay: false }); }}><StudioIcon name="clear"/></button><button className="icon-control starter-visibility" aria-label={design.underlay ? 'Hide starter motif' : 'Show starter motif'} data-tooltip={design.underlay ? 'Hide starter motif' : 'Show starter motif'} aria-pressed={design.underlay} onClick={() => commit({ ...snapshot(), underlay: !design.underlay })}><StudioIcon name={design.underlay ? 'eye' : 'eye-off'}/></button></div>
  </div>;
}
