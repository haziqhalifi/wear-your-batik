# Batik project context

## Confirmed context
- Participant is joining Common Ground Makeathon: Design x Tech x Culture, Singapore, 11 October 2026.
- Event source: https://luma.com/yjffwqr2 . Official page describes a one-day event with Design × Tech and Culture × Tech tracks and flexible prototype formats.
- Participant wants to make their existing concept more interesting and immersive, including seeing how it looks on them and 3D visualization.
- Existing PRD reference: https://claude.ai/artifact/QMc34TnpDbMevxRMkXWZrL#8307a7cd-d7d1 . Not read: browser displays “Sign in to view this page.”
- Participant supplied /Users/haziqhalifi/Downloads/agents-20261011T022045Z-1-001.zip and asked to use its skills. Read Start, its PRD outline, and Design directly from archive. Applying Start for concept refinement; no implementation or aesthetic stage started.

## Provisional suggestions, not participant decisions
- A batik experience connecting cultural discovery, motif creation/customization, and a personal wearing preview.
- Suggested demo journey: discover a sourced motif story, make a pattern, view it on one garment, and see a personal photo try-on if quality and available tools allow.
- Suggested Culture × Tech positioning; participant has not selected a track.
- 3D garment rotation is distinct from photo try-on and from measurement-based fit simulation.
- For a one-day prototype, prioritize one complete interaction and a dependable preview; live AR and personalized fit simulation remain possible later directions.

## Open questions and checkpoint
- Need accessible PRD content before treating the product, audience, cultural framing, and scope as confirmed.
- Batik product framing is inferred from workspace and conversation; exact concept remains unverified.
- Audience, confirmed flow, available garment assets, team capacity, and tools/access are unresolved.
- No shared project Page selected or created. No confirmed pyramid or completed PRD.
- Stage: Start, gathering existing brief and refining suggestions.

## Update after participant scope selection
- Participant explicitly selected Wear Your Batik, pattern creation and seeing it on their own photo, and requested a buildable PRD for five hours.
- Draft PRD saved as PRD.md and as https://chatgpt.com/space/page_e99279042e848191a5e741d59d28c71a . Page content read back successfully.
- The update supersedes the earlier notes that no Page exists and the concept is wholly provisional. Audience and detailed implementation remain proposed.
- Proposed MVP: three vector motifs, palette/scale/repeat controls, one exact shirt mockup, personal-photo try-on, PNG exports, errors and transparent fallback. Wax-pen drawing is optional after the full journey works.
- Proposed first 30 minutes: establish an authenticated generation route and assess pattern fidelity. Provider credentials, cost, permitted photo and actual results remain pending.
- Stage: Start ready for team review. No implementation started. No pyramid image or Mobbin research performed; the user directly requested the focused PRD.

## Develop checkpoint
- User requested building from the Page and testing photo try-on first; user selected OpenAI and has a key, but needs help adding it. Instructions supplied to edit .env.local. Key still empty at smoke-test checkpoint; no paid API call made.
- Built React/TypeScript + Vite client, Express local server and gpt-image-2 image-edit adapter. Local URL http://127.0.0.1:5180 . Own server launched via npm run dev.
- Client implemented with a bounded subagent under the Develop skill; main agent handled API, fixtures, integration, tests and Page updates.
- Three original vector motifs; exact shirt renderer; sample photo from built-in image generation (fictional person). Full generation prompt in artifacts/sample-asset.md.
- npm test passed 4 tests; npm run build passed. Browser checked editor controls, sample-photo loading and 390px responsive layout. Export initiation observed; actual saved download unverified.
- Live smoke test exited before sending any image because OPENAI_API_KEY is not configured. Identity and pattern fidelity, live result view and personal photo remain unverified.
- Build evidence and outstanding checks in artifacts/BUILD-STATUS.md. Page Build and experience review updated. Stage Develop; participant experience review pending.
- Cache cleanup freed about 1.7 GB after ENOSPC. Only npm's regenerable cache was cleared. No commits, pushes or deployment.

## Live try-on checkpoint
- User saved the OpenAI key and requested testing. Two synthetic-person leaf tests succeeded (26.9s and 28.0s) with gpt-image-2.
- Fixed SVG tile background gaps by using explicit coordinates; corrected result in artifacts/tryon/leaf/result.png. Prior result retained in leaf-before-fix.
- Visual review supports approximate motif/palette and face/pose preservation; exact repeat placement varies. Personal-photo and participant review remain pending.
- All 4 tests and production build pass after correction. No deployment or commit.

## Camera, drawing and garment customization
- User requested camera input, their own batik canvas and shirt customization. Implemented camera panel with front/back choice, capture/retake, native device-camera fallback and stream cleanup.
- Added vector drawing tile with ink/width, undo/redo/clear; feeds repeating fabric, shirt and PNG export.
- Added short/long/sleeveless sleeves, classic/Mandarin/round neckline and regular/relaxed silhouette. Updated try-on prompt to follow the supplied garment.
- Request design identity now uses SHA-256 so large drawings fit the server's version limit; full local design remains available for stale-result comparison.
- Browser verified drawing, undo/redo, garment choices and hand-drawn design summary in try-on; desktop and 390px phone layouts reviewed. Camera interface opened/closed; actual hardware capture and new garment AI fidelity remain unverified. No new paid image-generation request, commit or deployment.
- Production build and 6 tests pass, including image pixel checks for custom ink, sleeve length and round neck.

## Malaysian batik workshop revision
- User supplied floral Malaysian batik and men's shirt image-search screenshots and requested richer colour, drawing and customization.
- Replaced simple leaf/flower/wave graphics with six original botanical compositions with wax outlines, fine veins, stems, buds, and multicolour foliage. Added six five-colour palettes, editable dye roles, repeat size/angle/fullness, and wax-dot/crackle details.
- New Studio component groups motifs, colours, layout and shirt controls. Large canvas has pen, wax line, dots, stamps, partial eraser, symmetry, and undoable blank/reset operations. Stamp size, rotation, and centred keyboard placement supported.
- Added garment hem border/side panels and a full-cloth PNG export alongside the repeating tile. Shared SVG rendering carries all artwork into the garment image for try-on.
- Nine tests cover erasing/later ink, motif/placement rasterization, mirror geometry/stamp reflection, prior custom-ink and garment checks, and API behavior. Browser verified palettes, long sleeves/border, stamp placement, undo/redo, mirrored strokes and eraser; desktop and 390px layouts reviewed. No new paid try-on request.
- Preview screenshot: artifacts/batik-workshop/studio-desktop.png.
