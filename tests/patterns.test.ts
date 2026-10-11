import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { DEFAULT_DESIGN, fabricSvg, patternTileSvg, shirtSvg } from '../src/patterns.ts';

test('hand-drawn ink renders into the tile, repeated fabric and garment', async () => {
  const design = { ...DEFAULT_DESIGN, mode: 'draw' as const, strokes: [{ points: [[20, 20], [80, 80]] as [number, number][], color: '#ff0000', width: 6 }] };
  for (const svg of [patternTileSvg(design), fabricSvg(design), shirtSvg(design)]) {
    const { data, info } = await sharp(Buffer.from(svg)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let inkPixels = 0;
    for (let i = 0; i < data.length; i += info.channels) if (data[i] > 180 && data[i + 1] < 70 && data[i + 2] < 70) inkPixels++;
    assert.ok(inkPixels > 100, 'Custom red ink must be present in the rendered image');
  }
});

test('long sleeves extend the garment to the wrists and round neck leaves an opening', async () => {
  async function pixel(sleeve: 'short' | 'long' | 'sleeveless', collar: 'classic' | 'round', x: number, y: number) {
    const { data, info } = await sharp(Buffer.from(shirtSvg({ ...DEFAULT_DESIGN, sleeve, collar }))).resize(600, 600).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return [...data.subarray((y * info.width + x) * info.channels, (y * info.width + x) * info.channels + 3)];
  }
  const background = [245, 242, 234];
  assert.deepEqual(await pixel('short', 'classic', 155, 390), background);
  assert.notDeepEqual(await pixel('long', 'classic', 155, 390), background);
  assert.deepEqual(await pixel('sleeveless', 'classic', 155, 200), background);
  assert.deepEqual(await pixel('short', 'round', 300, 95), background);
});

test('eraser removes earlier ink while preserving cloth and later ink', async () => {
  const design = { ...DEFAULT_DESIGN, arrangement: 'grid' as const, texture: 'plain' as const, mode: 'draw' as const, underlay: false, background: '#123f50', strokes: [
    { points: [[10,50],[90,50]] as [number,number][], color: '#ff0000', width: 10 },
    { points: [[50,20],[50,80]] as [number,number][], color: '#000000', width: 20, kind: 'erase' as const },
  ] };
  const { data, info } = await sharp(Buffer.from(patternTileSvg(design))).resize(100,100).removeAlpha().raw().toBuffer({ resolveWithObject:true });
  const pixel = (x:number,y:number) => [...data.subarray((y*info.width+x)*info.channels, (y*info.width+x)*info.channels+3)];
  assert.deepEqual(pixel(20,50), [255,0,0]);
  assert.deepEqual(pixel(50,50), [18,63,80]);
  const withLaterInk = { ...design, strokes: [...design.strokes, { points: [[50,50]] as [number,number][], color:'#00ff00', width:5 }] };
  const later = await sharp(Buffer.from(patternTileSvg(withLaterInk))).resize(100,100).removeAlpha().raw().toBuffer();
  assert.deepEqual([...later.subarray((50*100+50)*3,(50*100+50)*3+3)], [0,255,0]);
});

test('all botanical motifs and garment placements render valid distinct images', async () => {
  const { MOTIFS } = await import('../src/patterns.ts');
  const images = await Promise.all(MOTIFS.map(async m => (await sharp(Buffer.from(patternTileSvg({ ...DEFAULT_DESIGN, motif:m.value }))).png().toBuffer()).toString('base64')));
  assert.equal(new Set(images).size, MOTIFS.length);
  const placements = await Promise.all((['allover','hem','panels'] as const).map(async placement => (await sharp(Buffer.from(shirtSvg({ ...DEFAULT_DESIGN, placement }))).png().toBuffer()).toString('base64')));
  assert.equal(new Set(placements).size, 3);
});

test('mirrored strokes keep matching geometry and stamps appear in the rendered tile', async () => {
  const { mirrorStroke } = await import('../src/DesignCanvas.tsx');
  const stroke = { points:[[20,30],[25,40]] as [number,number][], color:'#ff0000', width:3 };
  const mirrored = mirrorStroke(stroke,'four');
  assert.equal(mirrored.length,4);
  assert.deepEqual(mirrored.map(s => s.points[0]), [[20,30],[80,30],[20,70],[80,70]]);
  assert.equal(mirrored[1].flipX, true);
  assert.equal(mirrored[3].flipX, true);
  assert.equal(mirrored[3].flipY, true);
  const stamp = { points:[[50,50]] as [number,number][], color:'#ff0000', width:2, kind:'stamp' as const, stamp:'flower' as const, size:70, rotation:45, accent:'#ffff00', secondary:'#00ff00', wax:'#ffffff' };
  const withStamp = await sharp(Buffer.from(patternTileSvg({ ...DEFAULT_DESIGN, mode:'draw', underlay:false, strokes:[stamp] }))).png().toBuffer();
  const blank = await sharp(Buffer.from(patternTileSvg({ ...DEFAULT_DESIGN, mode:'draw', underlay:false, strokes:[] }))).png().toBuffer();
  assert.notDeepEqual(withStamp,blank);
});

test('female blouse has a shaped waist while preserving the selected artwork', async () => {
  async function waist(wearer: 'male' | 'female') {
    const { data, info } = await sharp(Buffer.from(shirtSvg({ ...DEFAULT_DESIGN, wearer }))).resize(600,600).removeAlpha().raw().toBuffer({ resolveWithObject:true });
    const offset = (340 * info.width + 212) * info.channels;
    return [...data.subarray(offset,offset+3)];
  }
  const male = await waist('male'), female = await waist('female');
  assert.ok(female[0] > male[0] + 30, 'Female waist should expose the light background outside the shaped garment');
  for (const sleeve of ['short','long','sleeveless'] as const) {
    const png = await sharp(Buffer.from(shirtSvg({ ...DEFAULT_DESIGN, wearer:'female', sleeve, collar:'round', placement:'panels' }))).png().toBuffer();
    assert.ok(png.length > 1000);
  }
});
