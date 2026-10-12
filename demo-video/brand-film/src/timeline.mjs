// One timeline for picture, sound and subtitles. Times in seconds; the film is exactly 60 s at 24 fps.
export const TL = {
  duration: 60, fps: 24, bpm: 80,
  // Narration: target start for each sentence of each scripted line (see scripts/script.mjs).
  sentenceTargets: [[0.8], [6.4, 8.0, 9.7], [14.8], [22.6, 26.0, 27.9], [34.3, 37.9], [45.4], [55.0, 56.2, 57.4]],

  // 1 · The first line
  petalDraw: [0.0, 2.9], bloomNote: 3.0, petalFill: [3.0, 4.9], veinDraw: [3.9, 5.4],
  // 2 · The bloom
  pullBack: [4.6, 10.4], petalsDraw: [6.0, 8.2], stemsDraw: [6.3, 8.9], leavesDraw: [6.8, 9.0], smallBloom: [7.6, 9.1],
  fillsBloom: [7.0, 10.4], introWorld: [8.6, 11.2], headline: [10.2, 11.9],
  toCloth: [12.8, 14.25],
  // 3 · The collection
  panelsIn: [13.9, 15.0], panelsTravel: [14.9, 19.1], panelsResolve: [19.0, 20.4], collectionIn: [20.15, 20.6],
  // 4 · The invitation to create
  toApp: [21.75, 22.45], toPaint: [27.25, 27.85], stroke: [28.25, 30.75], toCloth2: [31.25, 31.5],
  clothPull: [31.4, 33.9], repeatDraw: [31.7, 33.4],
  // 5 · Cloth becomes clothing
  seam: [34.1, 35.6], silhouetteOut: [35.3, 36.0], toGarmentPage: [35.8, 36.6],
  to3D: [40.45, 40.95], turntable: [40.6, 45.1],
  // 6 · A personal expression
  toTryOn: [44.9, 45.4], toDetail: [47.75, 48.2], detail: [47.9, 51.0], rosette: [50.6, 53.9],
  // 7 · The signature
  toIndigo: [53.4, 54.2], emblemDraw: [53.9, 55.3], emblemFill: [54.8, 55.9],
  wordmark: [55.0, 55.8], tagline: [55.6, 56.4], cta: [56.1, 56.8],

  // Real app taps (names match assets/app/capture.json); `t` is the moment the finger lands.
  taps: [
    { name: 'swatch-daun', t: 20.95, shot: 'collection-1' },
    { name: 'create-with', t: 21.55 },
    { name: 'motif-bunga', t: 23.85, shot: 'patterns-1' },
    { name: 'palette-laut', t: 26.15, shot: 'patterns-2' },
    { name: 'group-everyday', t: 37.2, shot: 'garment-everyday' },
    { name: 'garment-maxi', t: 37.85, shot: 'garment-maxi' },
    { name: 'garment-shirt', t: 39.15, shot: 'garment-shirt' },
    { name: 'preview-3d', t: 40.3 },
    { name: 'try-sample', t: 46.35, shot: 'tryon-1' },
  ],
  // Cloth movement accents for the sound design.
  swishes: [13.2, 14.1, 19.2, 31.35, 34.05, 35.7, 40.5, 50.7, 53.5],
};
