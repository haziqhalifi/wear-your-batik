# Wear Your Story

A five-hour makeathon prototype: create a contemporary batik-inspired pattern and preview it on your photo.

## Run locally

Requires Node.js 22 or newer.

```sh
npm install
cp .env.example .env.local # Only if .env.local does not exist yet
# Add OPENAI_API_KEY to .env.local using your editor
npm run dev
```

Open http://127.0.0.1:5180. The key is read on each request, so adding it does not require restarting. The prototype binds only to localhost. Image generation uses OpenAI's paid API when Generate my look is pressed. Keep .env.local private.

The editor works without an API key. Personal images are held in session memory and sent to OpenAI only on explicit generation. The app writes no uploaded photos to disk. OpenAI's own retention policies apply. The included sample person is synthetic, created with the built-in image generation tool. No real person's photo was used to create it.

## Design and camera controls

The workshop includes six original botanical motifs (Bunga raya, Daun tropika, Orkid, Sulur, Kipas daun and Pucuk) informed by the user's Malaysian batik visual references. These are digital interpretations, not reproductions of specific artisan textiles.

- **Motifs:** choose a starter or begin with blank cloth.
- **Colours:** six palettes and separate cloth, petal, highlight, leaf and wax-outline colours.
- **Layout:** repeat size, starter angle/fullness, straight or half-drop repeat, and plain, wax-dot or crackle detail.
- **Paint & stamp:** freehand dye, wax-colour lines, dotted strokes, botanical stamps, partial erasing, undo/redo, left/right or four-way symmetry. Stamps have size and rotation controls; the centre-placement button also works without a pointer.
- **Shirt:** short/long/sleeveless, classic/Mandarin/round neck, regular/relaxed fit, all-over pattern, a hem border or side panels.
- **Exports:** PNG repeat tile or full cloth including border/panel placement. The shirt image used for try-on includes the same drawing and placement.

Palette changes recolour the starter; previously added marks keep their chosen ink. Erasing removes added marks and reveals the starter/cloth. Blank cloth removes the starter and added marks, and can be undone. Designs are session-only and reset on page reload.

On **Try on**, select **Use camera**, allow browser camera access, frame your upper body and take a photo. You can switch front/back cameras, retake, or use device-camera capture on supported phones. Upload and synthetic sample remain available. Camera tracks stop when the camera panel closes or you leave the step. Camera capture requires localhost or HTTPS. Real camera hardware and phone camera behavior still need a device check.

## Check

```sh
npm test
npm run build
# With dev server running and key configured, makes ONE paid edit using the synthetic sample:
npm run test:tryon -- leaf
```

The smoke test writes its synthetic test inputs, result and timing under artifacts/tryon/leaf. Repeat explicitly with flower or flow to compare another design. It does not discover or upload personal photos.

Image editing is an appearance approximation, not accurate sizing or fit simulation. The exact source design remains visible beside the result. No canned try-on result is substituted for a live request.

## References

- [PRD](PRD.md)
- [OpenAI image edit API](https://developers.openai.com/api/reference/resources/images/methods/edit)
- [GPT Image 2](https://developers.openai.com/api/docs/models/gpt-image-2)

## Sample asset generation prompt

Built-in image generation tool, 11 October 2026. Fictional adult Southeast Asian man, front-facing, relaxed arms, plain cream short-sleeved collared button-up shirt, dark trousers, warm grey studio background, soft even light, portrait framed from above head to upper thighs, no accessories or text. Full prompt is preserved in artifacts/sample-asset.md.
