# Wear Your Batik submission readiness

Reviewed 11 October 2026 against the Common Ground Makeathon Figma deck:
https://www.figma.com/deck/Q7sE5bPof5xGub56Wlhhg4/Common-Ground-Makeathon

## Verdict

A credible local prototype, but not fully ready for submission through the current hosted demo. The latest production deployment opens publicly, but its try-on screen says “Live try-on is not connected yet.” It has Create / Try on / Reveal, while the current local prototype also has a working 3D preview screen. Do not pitch hosted 3D or hosted live generation as available until verified.

## Verified guidance

- Slide 5: solo participation or teams of up to three; Design × Tech and Culture × Tech tracks.
- Slide 7: submission deadline 3:15 PM, judging/open mic 3:30 PM, finalists presentation 4:30 PM, results 4:45 PM, event ends 5 PM. Singapore local time, 11 October 2026. Schedule is described as the organisers' planned day.
- Slide 12: overall track awards score Concept, Track Fit, Execution and Presentation equally at 25% each. Culture × Tech asks whether technology meaningfully reinterprets its subject rather than merely adding tech.
- Slide 13: Common Ground Award scores visible cross-disciplinary input 60% and an account of how team perspectives shaped the build 40%. Best Use of Tech scores Codex centrality 60% and inventiveness 40%.
- The reviewed deck does not specify a submission form, mandatory file format, repository requirement or pitch duration. Confirm those operational details with organisers; do not infer them from the schedule.

## Readiness evidence

- Current local TypeScript/Vite production build passes. A non-blocking warning reports a 567 kB 3D chunk before compression.
- All 17 current tests pass with local listener permissions. Initial sandbox-only failures were EPERM listener restrictions, not application assertions.
- Local browser loads the 3D concept viewer and its front/back/side, zoom and dress-form controls. This check establishes loadability, not real-device fidelity or a complete interaction audit.
- Prior synthetic-person try-on evidence: artifacts/tryon/leaf/test.json records HTTP 200 in 27.974 seconds; result.png contains the recorded output. It predates the latest garment and 3D changes.
- Latest production deployment checked: https://wear-your-batik.vercel.app/ . Vercel reports READY; browser shows the disconnected try-on notice.
- Latest camera/garment review notes still leave real-phone capture and new-garment live AI fidelity unverified.
- No dedicated pitch deck, demo recording, or completed submission form was found in this workspace. Existing PRD and BUILD-STATUS contain outdated implementation descriptions; use README and current source for feature claims.

## Recommended track and framing

Culture × Tech is the strongest fit. Explain the cultural change: a visitor moves from viewing a finished textile to making a personal contemporary batik-inspired pattern and imagining wearing it. The digital wax marks, repeat construction and garment placement should be central to that story. Do not invent heritage meanings or claim authentic artisan technique, accurate fit, or exact AI reproduction.

Suggested opening:

“Wear Your Batik turns appreciation of batik into participation. You choose a botanical pattern, shape its colours and add your own marks, then explore it on a garment and imagine wearing it. This is a contemporary batik-inspired creative experience, with an AI appearance preview rather than a sizing tool.”

## Priority before submission

1. Select the exact demo version. If using the public site, configure its production image service and deploy the reviewed latest version, then verify it publicly. This audit does not authorise deployment.
2. Rehearse one complete journey with one adult shirt, from pattern creation to reveal and a saved export. Prefer the tested synthetic sample for a dependable demonstration. Verify any personal photo separately with consent.
3. Prepare a labelled recorded example using the existing matching source/result pair, so generation latency or network failure does not derail the presentation.
4. Prepare a concise pitch: cultural motivation, audience, live journey, design decisions, Codex contribution, current limits and next step. Pitch duration must be confirmed.
5. Explain concrete Codex contributions if entering Best Use of Tech: translating the brief into the creative workflow, shared rendering, image-service integration, tests and iterative fixes. This is distinct from OpenAI being the runtime image provider.
6. Confirm track, team details, submission destination, required links/files and pitch duration with organisers. Submit by the stated 3:15 PM deadline if unchanged.

For the Common Ground Award, describe actual collaborator contributions only. Solo eligibility is permitted by the deck, but team-perspective evidence is currently unestablished.
