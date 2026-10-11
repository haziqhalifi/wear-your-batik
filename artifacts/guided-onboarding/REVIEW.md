# Guided onboarding review — 11 October 2026

## Reference and design direction

Mobbin search: creative-tool onboarding with guided choices, personalization and a project preview. Inspected returned preview images for Canva, FLORA and Magnific.

Primary reference: [Canva onboarding](https://mobbin.com/flows/11b3ca8d-85da-45e2-bea3-43f7a173eb8a). The preview of screen 10 shows a focused question, selectable choices, a progress indicator, a visual panel, Back, and a clear Continue action. Adapted that structure to real batik creation rather than adding account or preference questionnaires.

Kept the existing indigo (#293c64), paper (#f8f6f0), dark text (#293344), line (#deded5), and textile colours. Retained Libre Caslon Display headings and DM Sans controls. The textile is the main visual; choices sit beside it on desktop and below a compact preview on phones.

## Implemented flow

Welcome → Pattern → Colours → Shirt → Review → Photo → existing generated reveal.

The creation step has a fixed screen frame, contained scrolling only where needed, and persistent Back/Continue controls. Ready-made colour palettes and shirt presets avoid asking beginners to operate technical design controls. Review changes, full studio access, downloads and photo input share the existing design state.

Photo selection now uses a compact screen with upload, camera and sample paths, a design preview, and a generation footer. Sample-person labeling, generation disclosure, service errors and existing request protections remain present.

## Verification

- Production TypeScript/Vite build passed.
- All 9 existing tests passed using `node --import tsx --test tests/*.test.ts` (localhost access required for the API test).
- Browser: welcome, motif selection, palette selection, shirt preset and placement, review, change-colours link, full studio and return, photo handoff, sample photo, reset.
- Selected Orkid, Hijau rimba, long sleeves and side panels survived review and full-studio navigation.
- At 1280 × 900, the creation preview and Continue action fit in the viewport.
- At 390 × 667, the creation page height equalled the viewport and the footer bottom was 608.5px. Choice content can scroll inside its panel.
- At 390 × 844, the photo page height equalled the viewport with no horizontal overflow; the generation footer bottom was about 792px.
- No new paid generation request or real camera capture was performed. Existing reveal/request behavior was retained, not live-retested.

Screenshots: colours-desktop.jpg, colours-mobile.jpg (465px panel), welcome-mobile.jpg (390px), photo-mobile.jpg (390px).
