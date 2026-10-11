# Human reference model verification

Verified locally on 2026-10-11 at http://127.0.0.1:5180/.

- Production build: passed (`npm run build`). Vite reports the existing large lazy viewer chunk warning.
- Automated suite: 25/25 tests passed (`npm test`). Coverage includes all 15 garment types with both reference model choices, binary asset validation, covered-body masking, and geometry/material disposal.
- Browser: all 15 garment choices loaded successfully and were captured in this directory. Visually inspected representative adult upper garments, long dresses, lower garments and child outfits.
- Responsive check: 390 × 844 viewport; full human outfit and controls remain visible. Screenshot: `mobile-shirt.jpg`.
- Interaction checks: human visibility toggle removes/restores both the person and companion clothing; rear and side views render; switching to 2D and back to 3D works.
- No browser console errors observed at completion. Temporary viewport override reset.
- Targeted whitespace check passed for the changed preview, model, test and documentation files.

The four baked shapes derive from CC0 MakeHuman graphical assets. Exact source revision, checksums, license and rebuild instructions are in `public/models/README.md`. Assets are bundled locally; no runtime third-party service is required.

These are human reference models for styling previews. They are not photorealistic body scans, personalized sizing, simulated fabric drape, or fit recommendations. The static garment geometry uses covered-body masking rather than cloth collision physics. Nothing was committed, pushed or deployed as part of this change.
