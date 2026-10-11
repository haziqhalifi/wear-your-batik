# 3D preview verification — 11 October 2026

Implemented a Three.js inspection stage between design and photo try-on. Original procedural shirt, A-line dress and wrapped sarong concepts use live canvas textures derived from the same botanical/painter artwork. Controls provide front/back/side/close-up views, mouse/touch orbit, zoom buttons, optional rotation and a removable tailor’s form. Other garment types retain their own 2D reference.

Validation:
- `npm test`: 20 passing tests. New checks cover all supported geometry sleeve/neckline combinations, finite normals/vertices, valid indices/UVs, different garment proportions, wrap-edge geometry, painted-ink preservation, body border/panel placement and unchanged sleeve placement.
- `npm run build`: TypeScript and production build pass. Three.js is in a separate lazy chunk (~143 KB gzip); Vite notes its uncompressed size exceeds its 500 KB advisory threshold.
- Desktop browser: shirt front/side, dress front/back and hem border, sarong wrapping, live palette changes, optional turntable and drag-to-stop verified. The camera resets on garment changes.
- Mobile browser: 390 × 844 layout, camera controls, retained drawing after viewport changes, 2D switch and photo handoff verified. A tailored blazer correctly remains a 2D preview with 3D disabled. The dress and selected artwork carry into photo try-on.
- GPU buffers/textures are disposed on replacement/unmount; idle rendering uses requested frames, with continuous rotation paused offscreen/hidden. Preserved drawing buffers avoid blank captured canvases after viewport changes. Resource lifetime logic reviewed; no long-duration GPU profiling performed.
- Browser screenshots: `desktop-dress.jpg`, `mobile-shirt.jpg`. Actual phone hardware, context-loss recovery and a WebGL-disabled browser were not tested. Fallback UI exists for renderer/context/load failures.

No personal photo upload, paid generation, commit, push or deployment was performed for this change. Product-accurate GLBs, measured sizing, fabric physics and purchase checkout remain outside this concept preview. See ASSET-HANDOFF.md for the next asset requirements.
