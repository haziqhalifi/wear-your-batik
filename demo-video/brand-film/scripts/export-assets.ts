// Exports the app's own vector artwork (src/patterns.ts, src/garments.ts) for the brand film.
// The hero design is rebuilt from the exact state captured in the running app (assets/app/capture.json),
// and verified against the app's own cloth SVG so the film never shows an approximation.
// Run from the repo root: npx tsx demo-video/brand-film/scripts/export-assets.ts
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { DEFAULT_DESIGN, MOTIFS, PALETTES, motifArtwork, fabricSvg, garmentSvg, garmentPanelSvg, patternTileSvg, tileArtwork, type Design, type Stroke } from '../../../src/patterns';
import { garmentDefaults } from '../../../src/garments';

const root = new URL('../assets/', import.meta.url).pathname;
const out = `${root}generated/`;
mkdirSync(out, { recursive: true });
const capture = JSON.parse(readFileSync(`${root}app/capture.json`, 'utf8'));
const appFabric = decodeURIComponent(capture.design.fabric.split(',').slice(1).join(','));

// Same pairing as the website's intro collection: motif i with palette i, upright, scale 1.35.
const collectionDesign = (i: number): Design => ({ ...DEFAULT_DESIGN, ...PALETTES[i], motif: MOTIFS[i].value, rotation: 0, scale: 1.35 });
const collection = MOTIFS.map((motif, i) => {
  const design = collectionDesign(i);
  return {
    motif: motif.value, label: motif.label, palette: PALETTES[i].name,
    colours: { background: PALETTES[i].background, foreground: PALETTES[i].foreground, accent: PALETTES[i].accent, secondary: PALETTES[i].secondary, wax: PALETTES[i].wax },
    artwork: motifArtwork(motif.value, design),
    fabric: fabricSvg(design),
    panel: garmentPanelSvg(design, 1, 2.6, 'body'),
  };
});

// The design made on camera: "Create with Daun tropika" → Bunga raya → Laut & coral → one wax line.
const firstTile = /<g clip-path="url\(#tile-clip\)">([\s\S]*?)<\/g><g transform="translate\(-50 100\)">/.exec(appFabric)?.[1] || '';
const marks = [...firstTile.matchAll(/<path d="M([^"]+)" fill="none" stroke="(#[0-9a-f]{6})" stroke-width="([\d.]+)"/gi)];
if (marks.length !== 1) throw Error(`Captured cloth should hold exactly one drawn stroke, found ${marks.length}`);
const strokeMatch = marks[0];
const points = strokeMatch[1].split('L').map(p => p.trim().split(/\s+/).map(Number) as [number, number]);
const palette = PALETTES[0];
const stroke: Stroke = { points, kind: 'wax', color: palette.wax, width: Number(strokeMatch[3]), stamp: 'flower', rotation: 0, size: 45, accent: palette.accent, secondary: palette.secondary, wax: palette.wax };
const hero: Design = { ...collectionDesign(1), ...palette, motif: 'flower', mode: 'draw', underlay: true, strokes: [stroke], ...garmentDefaults('shirt'), wearer: 'male' };
const heroNoStroke: Design = { ...hero, strokes: [] };
if (fabricSvg(hero) !== appFabric) {
  writeFileSync(`${out}debug-app-fabric.svg`, appFabric); writeFileSync(`${out}debug-rebuilt-fabric.svg`, fabricSvg(hero));
  throw Error('Rebuilt hero design does not match the app’s captured cloth');
}

const strip = (svg: string) => svg.replace('<rect width="600" height="600" fill="#f5f2ea"/>', '');
const shirt = strip(garmentSvg(hero));
// The garment page opens on the kebaya-inspired blouse: its silhouette is the seam the wax line follows.
const kebaya = strip(garmentSvg({ ...hero, ...garmentDefaults('kebaya') }));
const kebayaSilhouette = /<clipPath id="garment"><path d="([^"]+)"/.exec(kebaya)![1];
const emblem = motifArtwork('flower', DEFAULT_DESIGN);

const manifest = {
  collection,
  hero: {
    label: 'Bunga raya', palette: palette.name, colours: { background: palette.background, foreground: palette.foreground, accent: palette.accent, secondary: palette.secondary, wax: palette.wax },
    scale: hero.scale, arrangement: hero.arrangement, strokePoints: points, strokeWidth: stroke.width,
    artwork: motifArtwork('flower', hero),
    tileNoStroke: tileArtwork(heroNoStroke, 'hero'),
    tile: patternTileSvg(hero),
    fabric: appFabric,
    fabricNoStroke: fabricSvg(heroNoStroke),
    clothWide: garmentPanelSvg(heroNoStroke, 2.4, 4.2, 'body'),
    shirt, kebaya, kebayaSilhouette, patternDef: /<pattern[\s\S]*<\/pattern>/.exec(fabricSvg(heroNoStroke))![0],
  },
  emblem,
};
writeFileSync(`${out}manifest.json`, JSON.stringify(manifest));
writeFileSync(`${out}manifest.js`, `window.MANIFEST=${JSON.stringify(manifest)};`);
for (const c of collection) { writeFileSync(`${out}fabric-${c.motif}.svg`, c.fabric); writeFileSync(`${out}panel-${c.motif}.svg`, c.panel); }
writeFileSync(`${out}hero-fabric.svg`, appFabric);
writeFileSync(`${out}hero-cloth-wide.svg`, manifest.hero.clothWide);
writeFileSync(`${out}hero-shirt.svg`, shirt);
writeFileSync(`${out}hero-kebaya.svg`, kebaya);
console.log(`exported ${collection.length} collection designs; hero stroke ${points.length} points, width ${stroke.width}; app cloth verified`);
