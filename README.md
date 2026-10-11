# Wear Your Batik

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

## Vercel deployment

The live site is https://wear-your-batik.vercel.app/ and the repository is https://github.com/haziqhalifi/wear-your-batik. The Vercel project is `haziqhalifis-projects/wear-your-batik`. Deploy the current workspace with `vercel deploy --prod`. Vite serves the studio and `api/[...path].ts` serves the Express API. Hosted requests retain the same-origin check; local development retains its localhost restriction.

Configure `OPENAI_API_KEY` as a sensitive production environment variable in Vercel, then redeploy to enable photo generation. Local `.env` files and development artifacts are excluded from deployment. Images are resized and compressed before upload to fit the hosted payload limit; hosted results use JPEG. The in-memory generation lock applies within one function instance, not across every Vercel instance.

## Guided creation

The experience starts with a welcome, then guides you through style, pattern, colours, paint, layout, garment, and review. Full customization is part of this journey: mix all five colours, paint and stamp your cloth, set repeat and wax details, and adjust sleeves, necklines, fit, and placement. Each step keeps a live garment preview and Back/Continue controls. The step rail and review links let you revisit choices. Painting is optional; marks and undo/redo stay available when moving between creation steps. The photo step keeps photo selection and generation in a compact layout. Designs and wizard progress stay in this session when moving between steps.

## Interactive 3D preview

The design flow now includes **3D preview** before photo try-on. All 15 garment types have distinct original procedural concept meshes: sarong, kebaya-inspired blouse, tunic, gown, blazer, shirt, blouse, A-line dress, maxi dress, skirt, palazzo pants, bomber jacket, kids’ shirt, kids’ dress and romper. The viewer supports three-quarter/front/back/side/close-up cameras, mouse/touch orbit and zoom, zoom buttons, a toggleable human reference model, and optional slow rotation. Live motif, palette, repeat size, drawing, border/panel placement, sleeve and neckline changes update the preview. Shaped panels, connected sleeve openings, folds, hems, lapels, waistbands, cuffs and fastenings distinguish the garment families. Arc-length UV mapping reduces motif stretching around flared hems; woven bump relief, cloth sheen, environment lighting and filtered shadows give the fabric depth.

Three.js loads only when opening a supported 3D view. Rendering stops while idle, offscreen or in a hidden tab; dragging stops optional rotation. The viewer caps pixel density, releases GPU resources on exit, and provides a 2D fallback if loading or WebGL2 fails. The bundled CC0 MakeHuman mesh loads once from the app (about 1 MB) and supplies male/female adult and child reference shapes. No user photo, paid generation or third-party runtime service is needed for 3D. Neutral companion clothing completes upper/lower separates. See [human asset provenance](public/models/README.md) for sources, license and rebuild steps.

These are illustrative shapes, not pattern-based product models or fit simulations. Drape, seam matching, colour and sizing are not validated for purchasing. See [the product asset handoff](artifacts/3d-preview/ASSET-HANDOFF.md) for replacing the concepts with actual garment GLBs. Checkout and personal sizing are not implemented.

## Design and camera controls

The workshop includes six original botanical motifs (Bunga raya, Daun tropika, Orkid, Sulur, Kipas daun and Pucuk) informed by the user's Malaysian batik visual references. These are digital interpretations, not reproductions of specific artisan textiles.

- **Motifs:** choose a starter or begin with blank cloth.
- **Colours:** six palettes and separate cloth, petal, highlight, leaf and wax-outline colours.
- **Layout:** repeat size, starter angle/fullness, straight or half-drop repeat, and plain, wax-dot or crackle detail.
- **Paint & stamp:** freehand dye, wax-colour lines, dotted strokes, botanical stamps, partial erasing, undo/redo, left/right or four-way symmetry. Stamps have size and rotation controls; the centre-placement button also works without a pointer.
- **Garment:** 15 choices within the creation journey. Traditional/formal: sarong/kain, a lined kebaya-inspired blouse, baju/tunic, formal gown, tailored blazer. Everyday: office/dress shirt, blouse/top, knee-length A-line dress, maxi dress, midi skirt, palazzo pants, bomber jacket. Kids: shirt, dress, romper. Available sleeve, neckline and fit controls depend on the garment. Every garment supports all-over pattern, hem borders and side panels.
- **Photo try-on:** the selected garment type controls which clothing is changed. Lower garments preserve the top; dresses/rompers replace the relevant upper and lower clothing; jackets layer over the inner top. The prompt preserves the person's age and proportions. The cropped adult sample is offered only for adult upper garments; other choices require a suitable uploaded or camera photo. Photo framing and age are guided, not automatically detected. These are illustrative silhouettes, not sewing patterns, material simulation or sizing models. New garment types have automated rendering/payload checks; live generation fidelity has not yet been checked.
- **Exports:** PNG repeat tile or full cloth including border/panel placement. The garment image used for try-on includes the same drawing and placement.

Palette changes recolour the starter; previously added marks keep their chosen ink. Erasing removes added marks and reveals the starter/cloth. Blank cloth removes the starter and added marks, and can be undone. Designs are session-only and reset on page reload.

On **Try on**, upload a full-body photo or select **Use camera**. The camera first explains stable phone placement, stepping back about 2–3 metres, good light, and a natural stance. **Open camera** starts the live preview with a head-to-shoes silhouette guide. Choose a 5- or 10-second timer (10 by default), then **Start timer**. The timer can be cancelled and stops when you leave the screen or close/switch the camera. The visual guide does not automatically detect whether your full body is visible.

After capture, review the photo and select **Use this photo** or **Retake**. Camera tracks stop during review and on close. Front/back switching, upload and the synthetic sample remain available. Device-camera fallback uses the device camera’s own timer; set that to 10 seconds. Camera access requires localhost or HTTPS. A complete full-body photo capture still needs an actual device/pose check; browser verification exercised the live countdown cancellation and fixture-based review/retake.

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
