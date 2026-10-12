# Wear Your Batik: "The line that becomes a story"

A 60-second brand film for Wear Your Batik, a digital batik atelier. A fine ivory wax line draws one petal. The petal blooms into the website's intro, travels through the six-motif collection, becomes the user's own stroke on the cloth, and becomes the seam of a garment. It ends by drawing the website's floral emblem.

## Deliverables (`out/`)

| File | What it is |
| --- | --- |
| `wear-your-batik-brand-film-9x16.mp4` | Main film: 1080 × 1920, 24 fps, exactly 60.000 s (1440 frames), narration, music and burned-in captions |
| `wear-your-batik-brand-film-9x16-clean.mp4` | Same picture and sound, no captions |
| `wear-your-batik-brand-film.srt` | Subtitles timed to the placed narration (14 cues, script word for word) |
| `wear-your-batik-brand-film-16x9.mp4`, `…-16x9-clean.mp4` | The 16:9 (1920 × 1080) version from the same timeline |
| `…-9x16-…-preview.mp4` | A 25 MB review copy for sharing (3.3 Mb/s); use the masters for publishing |
| `verification.json`, `*-contact-sheet.jpg` | Automated checks and one-frame-per-second contact sheets (the temporary-voice build writes `verification-temp-voice.json`) |

Video is H.264 High (CRF 16, BT.709 broadcast range) with AAC 320 kb/s, 48 kHz stereo audio, mastered to −14 LUFS integrated and −1 dBTP.

> **Narration status.** The project's OpenAI key had expired (HTTP 401), so the current files use a temporary macOS voice (Samantha, US English) for timing only. Every file built with it carries the suffix `-temp-voice`. It is not the warm, subtly Malaysian narrator the brief asks for. To finish the film, add a valid key to `.env.local` and run `VOICE=voice CAPTURE=0 demo-video/brand-film/scripts/build.sh`. That regenerates the voice and rebuilds every deliverable without the suffix. To use a human narrator instead, put `line-0.wav` to `line-6.wav` (one per scene, script below) in `assets/voice/` and add `TTS=0`.

## Timed storyboard

| Time | Scene | Picture |
| --- | --- | --- |
| 0:00–0:06 | The first line | Frame 1 opens on an extreme close-up of an ivory wax line tracing a Bunga raya petal over a woven indigo ground. A soft note sounds at 0:03 as coral dye spreads into the petal. |
| 0:06–0:14 | The bloom | The camera pulls back while the petals, stems and leaves draw themselves and teal, coral and gold flow in. The frame settles into the website's intro, headed "A living art. An unfolding story." |
| 0:14–0:22 | The collection | The bloom dissolves into the same cloth. Six hanging fabric panels pass, each named on screen. They resolve exactly onto the website's real collection grid ("One cloth. Endless expressions."), and Daun tropika is selected. |
| 0:22–0:34 | The invitation to create | Real app, one action at a time: choose Bunga raya, change the palette to Laut & coral, draw one wax-line tendril. The drawn tile match-cuts into the full cloth, where the stroke arrives tile by tile. |
| 0:34–0:45 | Cloth becomes clothing | The wax line traces the kebaya-inspired blouse's silhouette as a seam. The cloth lifts away into the app's own garment render, which lands in its real thumbnail. The garment page shows the kebaya-inspired blouse, then the maxi dress, then the shirt, which expands into the real 3D preview for one smooth 360° turn. |
| 0:45–0:54 | A personal expression | The real "See it on you" photo step and its synthetic sample person. Then the real 3D preview up close, opening into a rosette of all six fabrics (the warmest music). |
| 0:54–1:00 | The signature | Back to deep indigo. The ivory line completes the floral emblem, followed by "Wear Your Batik / Design your cloth. Wear your story. / Create my batik". The end card is fully readable from 0:56.8 to 1:00.0. |

## Narration (exact script, 86 words)

1. Before a pattern, there is a line.
2. Wax meets cloth. Colour finds its way. A living art begins to bloom.
3. Inspired by batik, rooted in culture, and open to your imagination.
4. With Wear Your Batik, discover botanical motifs. Choose your colours. Draw a little of yourself into every detail.
5. Watch your cloth become a garment. Explore its shape, then preview your look.
6. From one unfolding story to a world of expression, make something that feels like you.
7. Wear Your Batik. Design your cloth. Wear your story.

Each sentence is detected in the voiced line and placed on its own cue (`src/timeline.mjs`). For example, "Choose your colours" lands as the palette is tapped, and "Draw a little of yourself" as the stroke begins. The score dips about 7 dB under the voice. The burned-in captions leave out the last three sentences because the same words are already on the end card. The SRT includes them.

## Website fidelity

- **Artwork.** Motifs, palettes, fabrics, garment renders and the emblem come from the app's own renderer (`src/patterns.ts`, `src/garments.ts`) via `scripts/export-assets.ts`. The collection keeps the website's pairing of motif *i* with palette *i*. The six motifs are the originals: Bunga raya, Daun tropika, Orkid, Sulur, Kipas daun and Pucuk.
- **The on-camera design** is rebuilt from the live app's state and checked to be byte-identical to the cloth SVG the app produced. The build stops if the two differ, or if the cloth holds anything other than exactly one drawn stroke.
- **Screen captures** come from the running localhost app at a 430 × 932 phone viewport (3× density), driven by real touch input (Chrome DevTools touch events). Each frame is a screenshot taken during the interaction; the edit sets the pacing. The ivory touch ring and fingertip are editorial overlays placed at the recorded touch points.
- **3D.** The app's own full-screen preview was captured at 540 × 960 CSS px at its 2× WebGL pixel-ratio cap, so frames are exactly 1080 × 1920. It was turned with real one-finger drags, one frame per small move, and the close-up uses the app's own zoom control.
- **Photo preview.** The film shows the real photo step and the app's synthetic sample person. No approved AI appearance result was supplied (the only stored result is an older, different design), so the film stays with the real 3D preview and never shows or invents a generated result. That is also why the "AI appearance preview" caption doesn't appear. The try-on endpoint was blocked during every capture, so no generation was requested.
- **Cropping.** The current try-on screen includes an OpenAI API-key field. It is cropped out of frame and nothing in the interface was altered.
- **Typography.** All titles and captions are typeset in the edit in Libre Caslon Display and DM Sans, the website's fonts, stored locally in `../assets/fonts`.

## Music and sound

The original score is synthesised from scratch in `scripts/make-score.mjs`, with no samples. It is in D major at 80 BPM:

- **Instruments.** Plucked strings (Karplus–Strong with a small wooden body), warm additive chords, a restrained breathy flute, soft hand percussion (frame-drum *dum*, palm *tek*, shaker), and a low pulse.
- **Shape.** It starts sparse, with one bloom note at 0:03. The shaker enters at 0:21.75, and the drum and pulse at 0:22.5. It builds through the garment section, is fullest from 0:45 to 0:54, and resolves into one sustained D6/9 chord that fades to silence exactly at 1:00.
- **Sound details.** The wax-line glide follows each drawn line's speed and pan. Soft cloth swishes accompany panels and transitions, and every tap gets a delicate tap with a tuned confirm tone. Tiny bells mark the stroke repeating ring by ring, and six notes follow the six rosette petals.
- **Mix.** The voice chain is a high-pass filter, gentle compression and slight presence. The score is ducked under the narration, and a two-pass loudness normalisation sets −14 LUFS and −1 dBTP (`scripts/mix.sh`).

## 16:9

The central action sits in the middle of the frame, and every layout in the stage is resolution-aware:

- The intro takes the website's desktop composition: headline left, bloom right.
- Several panels hang side by side.
- Phone screens sit centred on the woven indigo.
- 3D frames sit on a matching cream ground.

## Rebuild

Run from the repository root with the app running (`npm run dev`). You need ffmpeg and Playwright's Chromium in `~/Library/Caches/ms-playwright`.

```sh
VOICE=voice demo-video/brand-film/scripts/build.sh               # final narrator via OpenAI TTS (valid key needed)
VOICE=voice TTS=0 CAPTURE=0 demo-video/brand-film/scripts/build.sh   # your own recorded line-0…6.wav
VOICE=voice-scratch CAPTURE=0 demo-video/brand-film/scripts/build.sh # temporary local voice, "-temp-voice" files
```

Preview any frame by rendering stills:

```sh
node demo-video/brand-film/scripts/render.mjs stills 1080x1920 /tmp/stills 3.2,11.5,30 "voice=voice&subs=1"
```

## Source map

- `src/timeline.mjs`: every cue, shared by picture, sound and subtitles.
- `src/stage.html`, `src/stage.js`, `src/cloth3d.js`: the deterministic stage. `window.renderAt(t)` composites the vector artwork, captures, WebGL cloth and type.
- `scripts/capture-app.mjs`, `scripts/capture-3d.mjs`: the real-app captures, written to `assets/app` and `assets/three`.
- `scripts/stroke-path.mjs`: the single wax tendril drawn on camera.
- `scripts/tts.mjs`, `scripts/scratch-voice.mjs`, `scripts/build-voice.mjs`: narration and its placement.
- `scripts/make-score.mjs`, `scripts/mix.sh`: score, sound design and the master.
- `scripts/render.mjs`, `scripts/make-srt.mjs`, `scripts/verify.mjs`, `scripts/build.sh`: rendering, subtitles, checks and the whole pipeline.
