# Wear Your Batik submission draft

Prepared for review on 11 October 2026. Not submitted. Signed in successfully and filled the authenticated form. Download draft saved the project on this device and exported a JSON review copy to artifacts/submission-review.json. Team-save and final-submit actions were not used. Video remains blank as requested.

## Team name

Wear Your Batik (entered as the draft team name)

## Members

Haziq Halifi (team contact) and Timothy Lee. Participant supplied both contact emails for form entry. Individual contributions remain to be confirmed.

## Project name

Wear Your Batik

## Award tracks

Culture × Tech; Best Use of Tech

## Your project overview

Wear Your Batik turns appreciation of batik into a personal creative experience. Inspired by Malaysian botanical batik, it invites people who have never designed textiles to choose motifs, mix colours and add their own digital marks. Their pattern becomes a garment preview, with an AI photo try-on to help them imagine wearing it. The idea is to make cultural expression participatory: a visitor moves from admiring a finished textile to creating something of their own. These are original contemporary batik-inspired designs, not reproductions of artisan textiles or a simulation of traditional wax-resist production.

## Your build

Built with Codex, React, TypeScript, SVG, Three.js and a server-side OpenAI image-editing integration. The local prototype supports guided creation, botanical motifs, drawing, garment placement, PNG exports and a 3D concept viewer. A recorded synthetic-person try-on succeeded; the current hosted editor works, but hosted generation is not yet connected and its latest 3D update is pending. We explored translating one design across cloth, garment and AI previews while keeping the exact source visible. All 17 tests and the production build pass. Next: verify the deployed end-to-end flow, test real-device capture and refine fidelity with artisan feedback.

## Team & collaboration

Our team is Haziq Halifi and Timothy Lee. Haziq directed the concept and prototype development with Codex assistance. Timothy helped with ideation and testing. Together, these contributions connected the creative idea with a working experience that could be tried and reviewed. Codex assisted with the guided workflow, shared pattern rendering, image-service integration, tests and iterative fixes. An important prototype finding was that the locally rendered pattern can be exact, while the AI wearing preview is an approximation, so both remain visible. The prototype has not yet been reviewed by batik artisans; their feedback is a next step.

## AI & tool attribution

- OpenAI Codex: assisted with scoping, coding, debugging and verification of the React/TypeScript interface, SVG pattern and garment rendering, Three.js concept viewer, server integration and tests. The participant directed the concept and design choices.
- OpenAI gpt-image-2 API: generates approximate wearing previews from the explicitly selected person image and current garment image. The successful recorded test used a synthetic person.
- Built-in OpenAI image generation tool: created the fictional sample-person asset. No real person's reference photo was used for that asset.
- React, TypeScript, Vite, Express, Sharp and Three.js: interface, development/build tooling, API handling, image processing and 3D rendering.
- Mobbin: interface references from Canva, FLORA and Magnific informed guided creative onboarding. These were design references, not copied product assets.
- Participant-supplied Malaysian floral batik and shirt visual references informed the botanical direction. Six original vector motif compositions are digital interpretations, not reproductions of a named artisan's textile; traditional meanings or provenance are not claimed.
- Google Fonts: Libre Caslon Display and DM Sans for typography.

## Live demo / deployed project

https://wear-your-batik.vercel.app/

Review note: this deployment was verified as accessible, but is an earlier editor build with disconnected hosted try-on. Replace this URL if a later verified deployment is chosen.

## Demo video

Leave blank for now, as requested by the participant. An accessible video URL, maximum two minutes, is required before final submission.

## GitHub / source code

https://github.com/haziqhalifi/wear-your-batik

Review note: this is the configured repository remote. Judge accessibility and whether it contains the latest local changes have not been verified. The workspace has uncommitted changes.

## Figma / prototype

Leave blank unless a project-specific prototype link exists. The organiser's guidance deck is not this project's prototype.

## This project is not based on code

Unchecked.

## Other supporting materials or try-it instructions

For the hosted demo, choose Create my batik, then select a style, motif, colour palette and garment. The current public deployment demonstrates creation and garment previews; live hosted AI try-on is not connected yet.

For the latest local prototype, use Node.js 22 or newer, run npm install and npm run dev, then open http://127.0.0.1:5180. Configure your own OPENAI_API_KEY in .env.local for live generation. The editor and 3D preview work without a key. Start with an adult office shirt and the labelled synthetic sample person. Generation is an explicit action and uses the paid OpenAI API. Photos remain in application session memory; external provider retention policies apply.

AI output is an appearance approximation. Pattern details can vary, and fit is not guaranteed. Camera framing is guided, not automatically detected. The 3D viewer is a concept shape, not a fabric or tailoring simulation.

## Suggested two-minute demo recording

- 0:00–0:15: name the cultural inspiration and the visitor benefit.
- 0:15–0:45: choose a motif and palette; show an original drawing or stamp updating the garment.
- 0:45–1:05: rotate the local 3D shirt and briefly show the exact source pattern.
- 1:05–1:40: show the labelled synthetic-photo try-on and recorded matching result. Label any previously generated output as recorded; do not imply it came from a newly edited design.
- 1:40–2:00: show export, explain Codex's role and the approximation limits.

## Review before final entry

Confirm team details, provide the video URL, verify source accessibility and select a demo version. The form offers Save project draft, Download draft and Submit final entry. The participant requested review, so do not submit the final entry without their instruction.
