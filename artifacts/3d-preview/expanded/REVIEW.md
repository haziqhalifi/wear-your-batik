# Expanded garment preview review — 11 October 2026

## Delivered

All 15 catalog entries now have their own Three.js concept construction. Upper garments use shaped front/back panels, shoulder bridges and sleeves joined to the armhole perimeter. Lower garments include a wrapped sarong, a flared skirt and palazzo pants with separate legs and a joined crotch. Gowns, tunics, blazers, bombers and children's styles have different proportions and construction details.

Cloth rendering uses physical-material sheen, a procedural woven bump map, environment and directional lighting, filtered shadows, and arc-length horizontal UV mapping to reduce pattern stretching at flared hems. The initial three-quarter camera exposes depth; front, back, side and close-up remain available. The gesture hint is below the canvas so it does not cover hems.

## Verification

- `npm test`: 22 passed. The 3D checks cover all supported sleeve/neckline combinations, finite geometry and normals, valid indices and UVs, construction-specific parts, a 90,000-triangle ceiling per model, cloth clear of the stand, and increased UV coverage at the gown hem. Existing painted-ink/placement, 2D garment and API tests also passed.
- `npm run build`: passed. Vite still warns about the lazy Three.js chunk (~587 kB raw, ~149 kB gzip).
- Opened all 15 options in the actual local app and saved/reviewed screenshots. No 3D rendering errors observed during the catalog checks. The development log contains a later unrelated `Studio.tsx` hot-reload error during concurrent workspace edits; the subsequent production build passed. The earlier shadow-map deprecation warning was resolved by using `PCFShadowMap`.
- Tested three-quarter/front/back/side/close-up cameras, optional rotation and stop, form visibility, 2D/3D switching, sleeve and neckline edits, palette changes, hem and side-panel placement.
- Tested a floor-length gown at a 390 × 844 mobile viewport. Document width matched viewport width (390 px); camera buttons wrapped within the viewport.
- Texture/model replacement still waits for pending decodes and releases displaced resources. Disposal now also covers bump textures, environment render target and light shadow maps.

The 15 named garment screenshots record the silhouette review before the final softer-shadow, three-quarter-camera and hint-position polish. `desktop-blazer.jpg`, `mobile-gown.jpg` and `fabric-closeup.jpg` show the later state; `desktop-final.jpg` is the final review image.

## Limits

These are static, original procedural concepts. They are not scanned products, sewing-pattern models, personal sizing or cloth simulation. Product-specific seam matching, physical print repeat, material properties and fit still need approved product assets and measurements. See `../ASSET-HANDOFF.md`. No paid generation, product checkout, commit, push or deployment was performed for this change.
