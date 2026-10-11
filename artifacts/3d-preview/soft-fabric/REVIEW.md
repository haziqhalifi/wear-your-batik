# Body proportions and softer fabric

Local refinement verified 2026-10-11.

- Rebalanced head width, neck length, lateral shoulders and footwear; preserved separate adult and child source shapes.
- Lowered and narrowed garment shoulders, rounded the shoulder bridges and reduced inflated sleeve volume.
- Replaced individually eased torso sections with continuous monotone cubic profiles. Added broader, less uniform hanging folds, elbow creases, knee/ankle creases and smooth waistband gathering.
- Increased the depth of long skirt hems for a fuller silhouette in side view.
- Refined skin/eye shading and hair strand relief. Subtler yarn bump, woven roughness variation, restrained cloth highlights and balanced studio lighting improve surface detail without new runtime dependencies.
- Kept the neck and upper chest continuous to avoid visibly cut skin triangles along necklines.

Validation: all 25 tests pass, including every garment/model combination, all supported sleeve/collar variants, valid geometry/UVs, motif scale and disposal of shared material textures. Production build passes; Vite still reports the large lazy viewer chunk warning. Targeted whitespace check passes.

Browser checks covered the shirt, blazer, gown (including side view), children's dress, palazzo pants and their companion top. Screenshots are stored here. The final gown was also checked at 390 × 844; rotation starts/stops, 2D/3D switching works, and no browser console errors were observed. The viewport override was reset after testing.

The garments remain procedural static styling previews, not physically simulated cloth or measured personal fit. No commit, push or deployment was performed.
