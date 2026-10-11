# UI refinement

The interface now uses a white workspace, neutral garment canvas, indigo actions, consistent sans-serif typography, and compact controls. The guided creation flow has a desktop step rail, one decision per screen, clear selected states, and a persistent next action. Mobile uses a compact live preview and progress indicator with independently scrollable choices.

## Mobbin references

- [Framer workspace](https://mobbin.com/screens/6914441d-d1f6-458a-9db3-3f6cc7907fe2): neutral canvas, white panels, clear navigation.
- [Jitter workspace](https://mobbin.com/screens/46f65180-3df4-41aa-a62d-7a91632cc742): compact controls beside a large preview.

The references informed hierarchy and spacing; the batik artwork and product identity remain original.

## Verification

- TypeScript and production build pass.
- All 20 existing tests pass, including camera countdown/cancellation, garment rendering, 3D geometry, and API safeguards.
- Guided pattern, palette, garment, review, 3D preview, and camera setup checked in the browser.
- Desktop 1360 × 900 and phone 390 × 844 / 390 × 667 checked. The guided page has no horizontal overflow; its primary action remains visible at 390 × 667.
- Camera setup instructions inspected without requesting camera access or generating a paid try-on.
- Existing build warning remains for the lazy-loaded 3D chunk size.

## Screenshots

- `pattern-desktop.jpg`
- `pattern-mobile.jpg`
- `preview-desktop.jpg`
- `camera-mobile.jpg`

Implementation: `src/workspace.css` supplies the visual theme, with small markup and copy refinements in the app and guided workspace. Existing garment choices, male/female style selection, drawing tools, 3D preview, and camera timer remain available. No commit, deployment, or external publishing was performed.
