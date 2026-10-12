// Single source of truth for picture and sound. 120 BPM: one beat = 0.5 s, one bar = 2 s.
const TL = {
  bpm: 120,
  duration: 24,
  wax: { start: 0.5, end: 3.6 },                       // canting draws Bunga raya in wax
  dye: { flood: 4.0, blooms: [4.0, 4.2, 4.4, 4.6] },  // downbeat of bar 3: colour floods
  repeat: { start: 6.0, ringStep: 0.11, rings: 6, zoomEnd: 8.0, swaps: [7.0, 7.5, 8.0, 8.5, 9.0, 9.5] },
  phone: { enter: 10.0, tapPaint: 10.6, tapWax: 10.85, drawStart: 10.95, drawEnd: 11.6, tapStampTool: 11.85, tapStamp: 12.2, exit: 13.0 },
  garments: { start: 13.0, step: 0.25, count: 8 },
  turn: { start: 15.0, end: 17.0 },
  wear: { open: 17.0, wipeStart: 17.9, wipeEnd: 18.7, chip: 18.85, exit: 19.75 },
  end: { start: 20.0, mark: 21.0, sub: 21.5, tag: 21.9, url: 22.3 },
};
if (typeof module !== 'undefined') module.exports = TL; else window.TL = TL;
