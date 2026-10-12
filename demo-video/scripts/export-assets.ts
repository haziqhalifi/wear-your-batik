// Exports the app's own vector artwork (src/patterns.ts) so the video uses real product visuals.
// Run from the repo root: npx tsx demo-video/scripts/export-assets.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { DEFAULT_DESIGN, MOTIFS, PALETTES, motifArtwork, fabricSvg, garmentSvg, patternTileSvg, type Design } from '../../src/patterns';
import { GARMENTS, garmentDefaults } from '../../src/garments';

const out = new URL('../assets/generated/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });

// Same pairing as the intro collection: motif i with palette i.
const collection = MOTIFS.map((motif, i) => {
  const palette = PALETTES[i];
  const design: Design = { ...DEFAULT_DESIGN, ...palette, motif: motif.value, rotation: 0, scale: 1.35 };
  return {
    motif: motif.value, label: motif.label, description: motif.description, palette: palette.name,
    colours: { background: palette.background, foreground: palette.foreground, accent: palette.accent, secondary: palette.secondary, wax: palette.wax },
    artwork: motifArtwork(motif.value, palette),
    tile: patternTileSvg(design),
    fabric: fabricSvg(design),
  };
});

// Hero design used through the story: Bunga raya in Laut & coral, the app's default.
const hero: Design = { ...DEFAULT_DESIGN };
const strip = (svg: string) => svg.replace('<rect width="600" height="600" fill="#f5f2ea"/>', '');
const garmentPicks = ['shirt', 'kebaya', 'dress', 'sarong', 'blazer', 'gown', 'jacket', 'palazzo', 'maxi', 'kids-dress'] as const;
const garments = garmentPicks.map((g, i) => {
  const pal = PALETTES[[0, 4, 1, 3, 2, 0, 5, 1, 4, 3][i]];
  const motif = MOTIFS[[0, 0, 2, 1, 3, 0, 4, 3, 1, 2][i]].value;
  const placement = (['allover', 'hem', 'allover', 'hem', 'allover', 'panels', 'allover', 'allover', 'hem', 'allover'] as const)[i];
  const d: Design = { ...hero, ...pal, motif, placement, ...garmentDefaults(g) };
  return { garment: g, label: GARMENTS.find(x => x.value === g)!.label, svg: strip(garmentSvg(d)) };
});

const heroShirt = strip(garmentSvg({ ...hero, garment: 'shirt' }));
const heroShirtHem = strip(garmentSvg({ ...hero, garment: 'shirt', placement: 'hem' }));
const heroShirtLong = strip(garmentSvg({ ...hero, garment: 'shirt', sleeve: 'long', collar: 'mandarin' }));

writeFileSync(out + 'manifest.json', JSON.stringify({ collection, garments, heroShirt, heroShirtHem, heroShirtLong, garmentCount: GARMENTS.length }, null, 1));
for (const c of collection) writeFileSync(`${out}fabric-${c.motif}.svg`, c.fabric);
for (const g of garments) writeFileSync(`${out}garment-${g.garment}.svg`, g.svg);
console.log(`exported ${collection.length} motifs, ${garments.length} garments, ${GARMENTS.length} garment types total`);
