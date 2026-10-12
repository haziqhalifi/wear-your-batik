# Garment surface polish — 12 October 2026

The requested improvement concerns garment shape and fabric appearance. Changes in this pass are limited to `src/three/garmentGeometry.ts`, surface-quality settings in `src/three/scene.ts`, and regression checks in `tests/three.test.ts`. Other concurrent working-tree changes are outside this pass.

## Findings and changes

- Separate front/back panels had different normals at coincident side vertices: measured discontinuities reached approximately 23° for the shirt and 46° for the gown. Boundary normals now agree while UV islands remain separate. This is the duplicated-vertex shading issue described in the [Three.js custom geometry manual](https://threejs.org/manual/pages/custom-buffergeometry.html).
- Panels now use angular sampling around curved sides instead of concentrating their geometry on the flat centre.
- The previous sleeve construction mapped the armhole to a fixed angular phase, creating a pinched transition. Each point now follows its armhole direction into the sleeve, with a gentler transition and less exaggerated creasing.
- Raised collars use one continuous, curved neckband instead of two open strips. Classic collar pieces follow that band.
- Dress, skirt, and sarong folds are shallower; micro-weave relief and sheen are subtler. Removed the noise-based roughness map, raised supported texture anisotropy from 4 to 8, capped pixel density at 2, and increased shadow-map resolution to 2048.

## Verification

- Both new regression checks failed against the original implementation, then passed after the changes. They cover side/sleeve seam normals and closed raised collars.
- `npm test`: 28 passed, 0 failed. The runner required local socket permission for its IPC/API tests.
- `npm run build`: passed, including TypeScript. Vite still reports the existing large, lazily loaded Three.js chunk (approximately 596 KB minified).
- Browser: plain shirt and gown; Bunga raya pattern on gown, palazzo, kids' shirt and shirt; full-screen shirt; side/back inspection; reset; 390 × 844 mobile viewport. No captured warning/error logs in the final browser check.
- Existing tests continue to cover finite positions/normals, indices, UVs, every supported sleeve/collar combination, all 15 garment families, human assets, disposal, and triangle budgets.

## Evidence and limits

- `shirt-before.png` and `shirt-after.png`: same plain cloth and desktop viewport.
- `gown-after.png`: softened folds on plain fabric.
- `shirt-pattern-after.png`: full-screen textured result.
- `mobile-after.png`: mobile viewport result, not a physical-device performance test.

These remain static procedural concepts. Some shoulder shapes, joins, and pattern alignment remain stylised. For substantially more natural drape and construction, replace each garment with a carefully authored, UV-unwrapped GLB using the existing guidance in `artifacts/3d-preview/ASSET-HANDOFF.md`. No cloth simulation, physical fit validation, or phone GPU benchmark was performed. No commit, push, or deployment was made by this pass.
