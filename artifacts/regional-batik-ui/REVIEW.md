# Regional batik UI

The batik workshop identity now carries through guided creation, full studio, painting controls, 2D/3D preview, photo selection, camera setup, and result styling. Parchment cloth surfaces, deep teal control bars, wax-colour selection states, brass rules, original botanical borders, and serif display headings form the common theme. Status panels and form controls use the same palette. Borders stay outside the artwork and photo areas.

The brand and introductory text now reference Malaysia, Singapore, and Indonesia. A collapsed welcome reference section links to regional heritage sources without adding another required step. The existing botanical artwork remains original digital interpretation; no motif is assigned an invented traditional meaning or claimed to reproduce an artisan textile.

References:
- Malaysia, MKN: https://www.mkn.gov.my/web/ms/2024/01/25/martabatkan-penggunaan-batik-dikalangan-penjawat-awam/ (drawn/block batik and wax/canting techniques).
- Singapore, Asian Civilisations Museum: https://www.nhb.gov.sg/acm/whats-on/exhibitions/batik-kita (regional batik connections and port-city perspectives).
- Indonesia, UNESCO: https://ich.unesco.org/en/RL/indonesian-batik-00170 (techniques, symbolism, and culture of Indonesian batik).

Validation:
- TypeScript and production build pass; all 20 existing tests pass; git diff whitespace check passes.
- Desktop full studio, interactive 3D preview, and photo selection visually reviewed at 1360 × 900.
- Phone welcome, expanded reference links, photo selection, and camera setup reviewed at 390 × 844. Guided page fits the viewport with no horizontal overflow and its primary action visible.
- Result toolbar/details and camera live/review states styled and source-reviewed. A new paid generation and real camera capture were not performed for this visual change.
- Existing lazy 3D bundle-size warning remains.

Changes are local; no new commit, push, or deployment was made for this revision. The unrelated submission readiness document remains untouched.
