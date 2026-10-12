import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { BLANK_DESIGN, fabricSvg, patternTileSvg, garmentPanelSvg, type Stroke } from '../src/patterns.ts';
import { moveStamp, stampAtPoint, stampLocalPoint, type CanvasPoint } from '../src/stampEditing.ts';

const stamp: Stroke = { kind: 'stamp', stamp: 'leaf', points: [[25, 35]], color: '#ef785c', accent: '#efbd66', secondary: '#479c96', wax: '#f9e6b8', width: 2, size: 25, rotation: 37, flipX: true };

test('moving a stamp preserves its artwork and clamps its centre to the cloth', () => {
  const moved = moveStamp(stamp, [81.234, -6]);
  assert.deepEqual(moved.points, [[81.23, 0]]);
  assert.deepEqual(stamp.points, [[25, 35]]);
  assert.equal(moved.rotation, 37);
  assert.equal(moved.flipX, true);
  assert.equal(moved.stamp, 'leaf');
  assert.deepEqual(moveStamp(stamp, [110, 70]).points, [[100, 70]]);
});

test('selection uses the same transform order as rotated and mirrored artwork', () => {
  for (const rotation of [-180, -73, 0, 37, 90, 179]) for (const flipX of [false, true]) for (const flipY of [false, true]) {
    const transformed = { ...stamp, rotation, flipX, flipY };
    const local: CanvasPoint = [100, 25];
    const angle = rotation * Math.PI / 180, size = transformed.size! / 100;
    const dx = (local[0] - 50) * size, dy = (local[1] - 50) * size;
    const world: CanvasPoint = [25 + (dx * Math.cos(angle) - dy * Math.sin(angle)) * (flipX ? -1 : 1),
      35 + (dx * Math.sin(angle) + dy * Math.cos(angle)) * (flipY ? -1 : 1)];
    const actual = stampLocalPoint(transformed, world);
    assert.ok(Math.abs(actual[0] - local[0]) < 1e-8);
    assert.ok(Math.abs(actual[1] - local[1]) < 1e-8);
    assert.equal(stampAtPoint([transformed], world), 0);
  }
});

test('selection chooses the top overlapping stamp and ignores brush marks', () => {
  const pen: Stroke = { ...stamp, kind: 'pen' };
  assert.equal(stampAtPoint([stamp, pen, { ...stamp, stamp: 'flower' }], [25, 35]), 2);
  assert.equal(stampAtPoint([stamp, pen], [25, 35]), 0);
  assert.equal(stampAtPoint([stamp], [99, 99]), null);
  assert.equal(stampAtPoint([pen], [25, 35]), null);
});

test('stamp edits change the exported tile, repeated cloth and 3D panel textures', async () => {
  const edits = [stamp, moveStamp(stamp, [70, 60]), { ...stamp, rotation: -80 }, { ...stamp, flipX: false }, { ...stamp, flipY: true }];
  const renderers = [patternTileSvg, fabricSvg, (design: typeof BLANK_DESIGN) => garmentPanelSvg(design, .5, .6, 'body')];
  for (const renderer of renderers) {
    const images = await Promise.all(edits.map(async stroke => sharp(Buffer.from(renderer({ ...BLANK_DESIGN, strokes: [stroke] }))).resize(180, 180).png().toBuffer()));
    assert.equal(new Set(images.map(image => image.toString('base64'))).size, edits.length);
  }
});
