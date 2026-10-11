# Garment options and full-body camera guidance — 11 October 2026

The guided flow now begins with Male/Female garment style. Male uses a straight-cut shirt; Female uses a shaped blouse with a curved waist. Both retain motif, colour, sleeve, collar and placement controls. Female presets provide everyday, relaxed and long-sleeve blouses. Full studio exposes the same style selector. Review includes a Change style link, and the selected shape is used as the image input for try-on.

Camera sequence: setup instructions → Open camera → uncropped live video with a head-to-shoes silhouette guide → 5- or 10-second countdown → local photo review → Use this photo or Retake. Default delay is 10 seconds. Setup explains stable upright phone placement, good light, starting 2–3 metres away, head/shoes in frame and arms slightly away from sides. Upload guidance also asks for a full-body image.

The framing guide is visual, not body detection. Countdown cancellation is wired to camera close, switch, component cleanup, visibility changes and camera disconnection. Tracks stop on review/close. Captured images remain local until generation is explicitly requested. Device-camera fallback uses the device app’s own timer; the interface tells the user to set it to 10 seconds.

Verification:
- Production build passed; all 12 tests passed.
- Timer tests cover delayed ticks, deadline completion exactly once, cancellation and a stale queued callback after cancellation.
- Image pixel test verifies the shaped female waist and rasterization with each sleeve option.
- Browser checked female selection, matching presets, review summary, Change style, full-body upload copy and mobile setup.
- Live camera became ready. Both timer durations were selectable. Started the 10-second timer and immediately cancelled it before any photo capture.
- Used public/sample-person.png through the local device-camera file chooser to verify review, Retake and Use this photo. No new personal photo was captured, saved, or sent for generation.
- A complete timed full-body capture on an actual phone, real pose/framing and generated blouse fidelity remain unverified.

Screenshots: male-female-mobile.jpg and setup-mobile.jpg, both at 390 × 844.
