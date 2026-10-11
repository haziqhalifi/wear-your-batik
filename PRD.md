# Wear Your Batik Five Hour Prototype PRD

Wear Your Batik lets someone create a contemporary batik-inspired pattern and see themselves wearing it. The five-hour prototype should deliver one complete creative journey: make a pattern, apply it to a shirt, upload a photo, and reveal a personal wearing preview.

Status: Draft ready for team review. The participant has confirmed the concept and focus on pattern creation and personal preview. Detailed scope, targets, and implementation below are proposed build decisions.

## Purpose and audience

Provisional audience: makeathon visitors curious about batik, fashion, or personal creative expression. No design skills required. The experience should make someone feel “I made this, and I can imagine wearing it.”

Suggested setting: a browser on a laptop at the demo table, with a usable phone layout. Target a two-to-three-minute creative session, excluding generation time. The audience and setting are assumptions for this prototype.

Cultural framing: let people participate in pattern making rather than only browse finished fabric. Present original botanical and geometric artwork as contemporary batik-inspired designs. Do not assign traditional names, meanings, or regional origins without a source. Digital drawing evokes wax-resist marks; it does not reproduce physical batik production.

## Primary journey

1. Enter the studio and see a ready-to-edit pattern.
2. Choose one of three original motifs: leaf, flower, or flowing geometry.
3. Customize the background and motif colours, pattern size, and repeat arrangement.
4. Optionally add a personal mark using a simple digital wax pen.
5. See the pattern update immediately on the fabric and a front-view shirt template.
6. Choose “See it on me” and select a photo or the supplied sample person.
7. Review the photo and explicitly request generation.
8. See the generated wearing preview beside the original photo and pattern swatch.
9. Download the pattern PNG or wearing preview, then return to edit.

If the pattern changes after generation, label the old image as a previous design and require a new generation. An old result must never appear to represent the current pattern.

## Essential capabilities

### Pattern studio

Use three hand-authored vector motifs and three coordinated palettes. Allow colour overrides, small/medium/large motif scale, and grid or staggered repeats. Render a seamless tile and a larger fabric preview locally using SVG or Canvas.

The optional drawing interaction adds strokes to the repeating tile with a warm wax-like line treatment. Provide undo-last-stroke and clear-drawing controls. Do not add advanced drawing tools within this build.

Export the tile as PNG. Store the design settings and tile in session state. Keep editing fast and independent of AI availability.

### Shirt preview

Use one unisex short-sleeved shirt silhouette with a consistent front view. Apply the exact tile through a mask and retain shading, collar, buttons, and seams. This preview is an illustration of pattern placement.

Create a clean product image from this same design for the try-on request. Start with one template; switch to a photographed neutral shirt only if the first provider test shows that it materially improves results.

### Personal photo try-on

Accept JPEG or PNG up to 10 MB. Recommend a clear, front-facing, waist-up photo with visible shoulders and arms, good lighting, and no major torso obstruction. Show these tips before upload.

Show a local photo preview and allow replacement. “Generate my look” sends the person image and the current shirt product image to a server-side virtual try-on or image-editing service. Use the first authenticated service that passes the feasibility check; provider access is not yet established.

Before sending, disclose the actual provider name and that the photo will be processed by it. Do not send the photo merely because it was selected. Keep credentials on the server, validate inputs there, avoid logging image payloads, and request no application-side persistent storage. Provider retention must be checked before promising deletion or zero retention.

Permit one request at a time. Show a working state and prevent duplicate submissions. Preserve the design and photo on failure, then offer retry or return to the studio. Initial request deadline: 90 seconds; this is a prototype limit, not a latency promise.

Every AI result displays “AI appearance preview. Pattern details may vary. Fit is not guaranteed.” Show the exact source pattern alongside it. No body measurements or size recommendation.

### Result and export

Make the result large enough to inspect. Include an original/result toggle, the current design swatch, download controls, “Edit my pattern,” and “Start again.”

“Start again” clears application session photo and result state and revokes local object URLs. Temporary application files must be removed after processing. This control does not assert deletion of data retained by an external provider.

## Demo fallback

Prepare one sample person image with permission to use it. The sample-photo path must use the same generation flow as personal uploads.

If live generation is unavailable, keep the editor and exact shirt preview functional. Show a clearly labelled pre-generated example with its matching locked preset, or show an error with retry. Never display a canned image as the result of a visitor’s photo or newly edited pattern.

A fallback demonstrates only the working editor and a recorded try-on example. Live personal try-on remains incomplete until verified.

## Experience direction

A fabric studio with a warm neutral background, rich indigo or earthy accents, generous pattern space, and a prominent final reveal. Use three simple stages: Create, Try on, Reveal. Keep the initial pattern attractive and editable without setup.

Suggested motion: marks repeat across the cloth, then the same pattern appears on the shirt. Prioritize immediate feedback and the personal reveal over ornamental animation. Respect reduced-motion preferences and provide labelled keyboard-accessible controls.

## Scope boundary

Build today: local pattern customization, exact shirt mockup, photo selection, one generation integration, result view, PNG downloads, error handling, and a transparent demo fallback.

Add only after the full journey works: simple wax-pen drawing and a short user-written design title.

Defer: 3D models, live camera AR, avatars, fit simulation, multiple garment styles, AI-generated motif libraries, accounts, payments, ordering, public galleries, and social sharing.

## Suggested implementation

Use a single React and TypeScript web app with an SVG or Canvas renderer and one server endpoint for try-on. No database or authentication is required for this prototype.

Maintain a versioned design snapshot containing motif, colours, scale, arrangement, and optional strokes. A generation request captures the exact design version and rendered shirt image. Attach the same version to its result and ignore late results from superseded requests.

Keep photo, design, and result in memory during the session. Local downloads do not require public asset hosting. A minimal provider adapter should accept person image plus garment image and return an image or a clear error; avoid adding a second integration unless the first fails the initial check.

## Five hour build plan

| Elapsed time | Work | Checkpoint |
| --- | --- | --- |
| 0:00 to 0:30 | Establish provider credentials and run sample person plus patterned shirt through it. Prepare motif assets and shirt mask. | A usable try-on proves the integration route, or a fallback is explicitly selected. |
| 0:30 to 1:30 | Build motif controls, palettes, repeat renderer, exact shirt preview, and pattern export. | A visitor can create a different pattern and see it on a shirt. |
| 1:30 to 2:45 | Add photo validation, explicit generation, server endpoint, loading, retry, and result display. | One complete live personal preview journey succeeds. |
| 2:45 to 3:30 | Polish Create/Try on/Reveal, add result download, and optional wax pen if time permits. | The journey is understandable without explanation. |
| 3:30 to 4:30 | Check motif fidelity, stale-result handling, invalid uploads, provider failure, duplicate clicks, and phone layout. | Core flow and honest fallback are reliable. |
| 4:30 to 5:00 | Freeze features, prepare demo assets, rehearse, and package the prototype. | A concise repeatable demonstration is ready. |

Assumption: one builder with Codex assistance. Complete and locally verify the prototype before any deployment; deployment destination and authorization are separate from this PRD.

If the provider is still blocked at 30 minutes, activate the fallback and record live try-on as pending. If drawing threatens completion, omit it. If export-card composition takes too long, retain separate pattern and result downloads.

## Proposed completion checks

- Changing motif, palette, scale, or repeat produces an immediate visible change in both fabric and shirt previews.
- The PNG export matches the visible pattern and repeats without obvious seams.
- A valid photo remains unchanged until the user explicitly requests generation.
- A successful request shows the person wearing a shirt broadly matching the selected palette and motif; face and pose are reasonably preserved.
- Review at least three materially different patterns on the sample person, and one consented personal photo. Record distortions; do not claim production fidelity.
- A revised pattern cannot silently reuse an old try-on result.
- Invalid files, timeout, and generation errors show clear recovery while preserving the design.
- Downloads work, and fallback content is visibly labelled.
- The flow works on the demo laptop and one narrow browser viewport.

These are proposed review checks, not completed test results.

## Suggested demonstration

“I can appreciate batik, but I want to make something personal and imagine wearing it.”

Choose a motif, change its colours and scale, show the exact pattern on the shirt, select a photo, generate the wearing preview, and reveal the original/result comparison. Explain that it is a contemporary batik-inspired creation and an AI appearance preview. If generation takes time, demonstrate editing on a separate prepared session while it runs.

The key line: “From a pattern I create to a look I can imagine wearing.”

## Open dependencies and workshop progress

Confirmed: Wear Your Batik, pattern creation, personal preview, and a five-hour hackathon scope.

Pending: try-on provider access and cost, actual pattern fidelity, permitted sample photo, usable garment template, and team review of this brief. Culture × Tech positioning and the demo audience remain suggestions.

Stage: Start ready for team review. No prototype built and no testing completed. This brief follows the current conversation; the earlier Claude PRD was inaccessible and has not been merged into it.

Event context: [Common Ground Makeathon](https://luma.com/yjffwqr2).

