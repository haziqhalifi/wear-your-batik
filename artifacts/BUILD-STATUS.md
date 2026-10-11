# Build status

Local prototype: http://127.0.0.1:5180

## Implemented
- React and TypeScript studio with 3 hand-authored motifs, palette and custom colours, size, grid/staggered repeat, exact SVG fabric/shirt previews.
- Explicit photo selection and generation; synthetic sample model in public/sample-person.png.
- Express image-edit endpoint using OpenAI gpt-image-2, with in-memory photos, server-only credentials, JPEG/PNG decode validation, duplicate-request guard, same-origin checks, and 90-second timeout.
- Captured design/photo snapshots, stale-design label, original/result comparison, PNG exports and reset are implemented.
- No accounts, database or deployment. Wax pen and 3D remain deferred.

## Verified
- npm test: 4 tests passed, covering input validation, provider payload, provider errors, duplicate requests and cross-origin rejection.
- npm run build: TypeScript and production bundle passed.
- Browser: motifs, palette, size, repeat, shirt preview and synthetic photo selection work.
- 390px phone viewport: no horizontal overflow and all preview images loaded.
- No browser console errors after final reload.
- Pattern export generated and download initiation observed. Browser download event collection timed out and a final saved file was not verified.
- .env.local is ignored by Git.

## Live verification: 11 October 2026
OpenAI key configured. Two live synthetic-person leaf try-ons returned HTTP 200 using gpt-image-2 in 26.9 and 28.0 seconds. Results are in artifacts/tryon/leaf-before-fix and artifacts/tryon/leaf.

The first test exposed rectangular gaps in the SVG repeat background. Replaced percentage background dimensions with explicit tile coordinates. The corrected shirt raster has continuous background, and the second generated result no longer shows the patchwork artifact.

Visual review: face, pose, hands, trousers and background remain close to the synthetic input; the result reproduces the leaf motif and navy/cream/gold palette with plausible fabric folds. Exact repeat placement and scale vary. This is an approximate wearing visualization, not an exact fabric print or fit simulation.

After the fix, all 4 tests and production build passed. Personal-photo testing, other motifs, browser live-result interaction, verified saved downloads, and participant experience review remain pending. No personal photo was uploaded by these tests.

## Environment issues resolved
- Disk initially had about 103 MB free and returned ENOSPC. Cleared only the regenerable npm download cache through an approved escalated command, freeing about 1.7 GB.
- Existing project used port 5173; this app uses 5180 and a dedicated development socket on 24680.

Screenshots are in artifacts/screenshots. No participant feedback has been received yet.
