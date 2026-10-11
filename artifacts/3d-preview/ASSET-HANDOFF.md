# Replacing concept garments with product assets

The current Three.js viewer uses original procedural meshes for all 15 garment types. No product-specific garment models, body measurements or sewing patterns were supplied. The human reference meshes are derived from CC0 MakeHuman assets, documented in `public/models/README.md`; these reference bodies are not personal-fit avatars. The viewer is an appearance concept, not a digital twin or fit recommendation. No cloth dynamics are simulated. The upgraded concepts include shaped panels, static folds, construction details, cloth sheen, micro-weave bump maps and studio shadows. These appearance improvements do not validate size, physical fabric behaviour or seam matching.

For purchase-grade assets, provide each actual product's approved sewing pattern, measurements and material reference. Author the garment on a neutral form in garment software and prepare a web-ready GLB with:

- Correct length, cut, construction, seams, openings and thickness. Verify sleeve/collar/fit variants individually; do not silently substitute one variant for another.
- Named meshes/material regions for front, back, sleeves, collar, trims, buttons, lining and hem/panel masks. Keep buttons and lining separate from the editable textile.
- Consistent UV density and a documented physical repeat size. For a wrapped sarong, identify overlap direction and front/back positions. Confirm print matching across seams against the actual cutting layout.
- Optimized geometry, small texture maps and an agreed device performance budget. Bake fine weave/seam relief instead of adding geometry for every stitch.
- Measured bounds, scale units, neutral pose, camera target, product/style ID, asset version and variant availability in a manifest.
- Commercial rights covering browser distribution of the model and textures.

Integration: replace `createGarmentModel` in `src/three/garmentGeometry.ts` with a GLTFLoader-backed asset adapter that returns the named cloth meshes and a disposable model. Keep the live artwork and explicit placement mapping. Preserve the 2D fallback for missing assets, unavailable variants or unsupported WebGL2. Do not present concept geometry as a purchasable size or fabric simulation.

Before enabling ordering, bind the approved model/variant, fabric, size and exact design revision to a saved order configuration. The existing photo try-on continues to use the 2D garment reference and is an AI appearance preview.
