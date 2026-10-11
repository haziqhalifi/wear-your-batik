import assert from 'node:assert/strict';
import { test } from 'node:test';
import sharp from 'sharp';
import { GARMENTS, garmentDefaults, supportsSample } from '../src/garments.ts';
import { DEFAULT_DESIGN, garmentSvg } from '../src/patterns.ts';

const plain = { ...DEFAULT_DESIGN, mode: 'draw' as const, underlay: false, texture: 'plain' as const, background: '#123f50' };
test('all garment types render distinct silhouettes with all three placements and retain painted ink', async () => {
  const images = [];
  for (const garment of GARMENTS) {
    const variants = [];
    for (const placement of ['allover', 'hem', 'panels'] as const) {
      const svg = garmentSvg({ ...plain, ...garmentDefaults(garment.value), placement, strokes: [{ points: [[15,50],[85,50]], color:'#ff0000', width:8 }] });
      const { data, info } = await sharp(Buffer.from(svg)).resize(300,300).removeAlpha().raw().toBuffer({ resolveWithObject:true });
      let red = 0;
      for (let i = 0; i < data.length; i += info.channels) if (data[i] > 170 && data[i+1] < 70 && data[i+2] < 70) red++;
      assert.ok(red > 30, `${garment.value}/${placement} must preserve custom ink`);
      variants.push(data.toString('base64'));
    }
    assert.equal(new Set(variants).size, 3, `${garment.value} must render distinct placements`);
    images.push(variants[0]);
  }
  assert.equal(new Set(images).size, GARMENTS.length);
});

test('lower garments leave upper body empty; pants have a leg gap and skirts do not', async () => {
  async function pixels(garment: 'sarong' | 'skirt' | 'palazzo') {
    const { data, info } = await sharp(Buffer.from(garmentSvg({ ...plain, ...garmentDefaults(garment) }))).resize(600,600).removeAlpha().raw().toBuffer({ resolveWithObject:true });
    return (x:number,y:number) => [...data.subarray((y*info.width+x)*info.channels,(y*info.width+x)*info.channels+3)];
  }
  const background = [245,242,234];
  for (const garment of ['sarong','skirt','palazzo'] as const) assert.deepEqual((await pixels(garment))(300,80), background);
  assert.deepEqual((await pixels('palazzo'))(300,450), background);
  assert.notDeepEqual((await pixels('palazzo'))(230,450), background);
  assert.notDeepEqual((await pixels('skirt'))(300,450), background);
  assert.notDeepEqual((await pixels('sarong'))(300,450), background);
});

test('cropped adult sample is available only for adult upper garments', () => {
  assert.equal(supportsSample('shirt'), true);
  assert.equal(supportsSample('blazer'), true);
  for (const garment of ['gown','dress','sarong','palazzo','kids-shirt','kids-dress','romper'] as const) assert.equal(supportsSample(garment), false);
});
