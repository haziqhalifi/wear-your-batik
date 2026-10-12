# Wear Your Batik — “Malam” motion piece

A 24-second motion graphics demo for Wear Your Batik. It's delivered at 9:16 (primary), 1:1 and 16:9 from one shared timeline.

| Deliverable | Path |
| --- | --- |
| 1080 × 1920 (9:16) | `out/final/wear-your-batik-9x16.mp4` |
| 1080 × 1080 (1:1) | `out/final/wear-your-batik-1x1.mp4` |
| 1920 × 1080 (16:9) | `out/final/wear-your-batik-16x9.mp4` |
| Contact sheets | `out/contact-sheet-{9x16,1x1,16x9}.png` |
| Score + sound design (–14 LUFS) | `out/audio/score.wav` |

## Concept

*Malam* is Malay for wax. In batik, a canting pen draws hot wax, the cloth is dyed, and the motif repeats across the fabric before it is worn. The video moves in that same order, and its typography follows the steps as six words: **Wax. Dye. Repeat. Yours. Shape. Wear.**

- **Motion language.** Every line is drawn by a glowing molten bead, the canting tip. Colour floods in through ink-bleed masks with noisy edges, never flat fades. Tiles *stamp* outward ring by ring. Palette changes ride a diagonal wax line, and a horizontal wax line passes down the body to turn the cream shirt into batik.
- **Art direction.** The app's own identity: Libre Caslon Display + DM Sans, night indigo, wax cream and brass gold, plus the six original motifs and palettes.
- **Rhythm.** 120 BPM. Each scene lands on a bar line, palette swaps fall on beats, garments flick on eighth notes, and the gong marks the signature.

| Time | Scene | Content |
| --- | --- | --- |
| 0–4 s | 01 Wax | Canting draws Bunga raya |
| 4–6 s | 02 Dye | Colour floods on the downbeat |
| 6–10 s | 03 Repeat | Tiles stamp outward; the camera pulls back; all six motif/palette pairs wipe through |
| 10–13 s | 04 Yours | Real phone UI: Patterns → Paint → wax line → stamp |
| 13–17 s | 05 Shape | 8 of the app's 15 garment renders, then a real 3D turntable |
| 17–20 s | 06 Wear | Recorded AI try-on with a synthetic person; source design shown beside it |
| 20–24 s | End | Logo redrawn in wax, wordmark, tagline, URL |

## Authenticity

Nothing in the video is mocked up.

- **Motifs, tiles and garments** are exported from `src/patterns.ts` and `src/garments.ts` (`scripts/export-assets.ts`). They are the same SVG functions the app uses.
- **Phone UI** is real screenshots of the running app at 390 × 844 @3x (`scripts/capture-flow.mjs`). The wax line and the stamp were actually drawn and placed in the app by automation.
- **3D turntable** is 28 frames of the app's own Three.js preview, rotated with its arrow-key control (`scripts/capture-turntable.mjs`).
- **Try-on** is the existing recorded result `artifacts/tryon/leaf/result.png` with `public/sample-person.png` (a synthetic person) and its source shirt. On screen it is labelled “Recorded example · AI try-on · synthetic demo person”. It is a separate example and is not presented as the output of the design shown earlier. No new paid generation was made.
- **Claims** are limited to facts in the codebase: 6 motifs, 6 palettes, 5 colour roles, 15 garment types, paint/wax/stamp tools, “3D concept preview”, and AI try-on. There are no metrics, testimonials or fit claims.

## Sound

The score is original and synthesised from scratch in `scripts/make-audio.mjs`. No samples are used.

- **Instruments.** Gamelan-style metallophones in a pelog-like scale on D, with paired bars detuned for the *ombak* shimmer, a gong ageng, and a soft modern pulse.
- **Sound design.** Wax sizzle with crackle while lines draw, dye drips on each bloom, stamp thuds per tile ring, whooshes on wipes, UI ticks on taps, a finger scratch during the wax line, a riser into the try-on, and a final gong.
- **Mix.** Freeverb-style reverb, then normalised to about –14 LUFS with a –1 dBTP limit.

Sound and picture both read `src/timeline.js`, so changing a cue time moves both.

## Rebuild

Requires the dev server (`npm run dev` in the repo root) only for re-capturing screens. Chromium comes from the local Playwright cache, and ffmpeg is required.

```sh
cd demo-video && npm install
npx tsx scripts/export-assets.ts            # run from repo root: cd .. && npx tsx demo-video/scripts/export-assets.ts
node -e "const m=require('./assets/generated/manifest.json');require('fs').writeFileSync('assets/generated/manifest.js','window.MANIFEST='+JSON.stringify(m)+';')"
node scripts/capture-flow.mjs               # phone UI states → assets/screens
node scripts/capture-turntable.mjs http://127.0.0.1:5180/ 28   # 3D frames → assets/turntable
node scripts/make-audio.mjs && ffmpeg -y -i out/audio/score-raw.wav -af "loudnorm=I=-14:TP=-1.0:LRA=9,alimiter=limit=0.89,volume=-1.5dB" -ar 48000 out/audio/score.wav
node scripts/render.mjs video 1080x1920 out/final/wear-your-batik-9x16.mp4 out/audio/score.wav
node scripts/render.mjs video 1080x1080 out/final/wear-your-batik-1x1.mp4 out/audio/score.wav
node scripts/render.mjs video 1920x1080 out/final/wear-your-batik-16x9.mp4 out/audio/score.wav
node scripts/contact-sheet.mjs out/final/wear-your-batik-9x16.mp4 out/contact-sheet-9x16.png 6
node scripts/render.mjs stills 1080x1920 out/stills 2.2,8.25,18.25   # quick frame checks
```

To preview any frame in a browser, open `src/stage.html?w=1080&h=1920&t=8.25`.

## Source map

- `src/stage.html`, `src/stage.js`: the animation engine. `window.renderAt(t)` is deterministic, and the layout adapts per aspect ratio.
- `src/timeline.js`: cue times shared by picture and sound.
- `assets/generated/`: the app's SVG motifs, fabrics, garments and manifest.
- `assets/screens/`, `assets/turntable/`, `assets/photos/`: real captures and the recorded try-on.
- `assets/fonts/`: Libre Caslon Display and DM Sans (Google Fonts, OFL), stored locally so renders are deterministic.
