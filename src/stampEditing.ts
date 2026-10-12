import type { Stroke } from './patterns';

export type CanvasPoint = [number, number];
export const STAMP_BOUNDS = { min: -22, max: 122 };

export function moveStamp(stroke: Stroke, position: CanvasPoint): Stroke {
  const point = position.map(value => Math.round(Math.max(0, Math.min(100, value)) * 100) / 100) as CanvasPoint;
  return { ...stroke, points: [point] };
}

/** Invert the renderer's translation, reflection, rotation and size. */
export function stampLocalPoint(stroke: Stroke, [x, y]: CanvasPoint): CanvasPoint {
  const [cx, cy] = stroke.points[0] || [50, 50];
  const angle = (stroke.rotation || 0) * Math.PI / 180;
  const dx = (x - cx) * (stroke.flipX ? -1 : 1);
  const dy = (y - cy) * (stroke.flipY ? -1 : 1);
  const scale = (stroke.size || 30) / 100;
  return [(dx * Math.cos(angle) + dy * Math.sin(angle)) / scale + 50,
    (-dx * Math.sin(angle) + dy * Math.cos(angle)) / scale + 50];
}

export function stampAtPoint(strokes: Stroke[], point: CanvasPoint): number | null {
  // Search from the top so overlapping stamps can be selected naturally.
  for (let index = strokes.length - 1; index >= 0; index--) {
    if (strokes[index].kind !== 'stamp') continue;
    const local = stampLocalPoint(strokes[index], point);
    if (local.every(value => value >= STAMP_BOUNDS.min && value <= STAMP_BOUNDS.max)) return index;
  }
  return null;
}
