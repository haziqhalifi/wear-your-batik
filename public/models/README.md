# Human reference model assets

The human geometry is derived from **MakeHuman Community** core graphical assets, released under **CC0 1.0 Universal**. The MakeHuman application code has a different license; none of its application code is included. See [upstream license](https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.md) and the bundled `MAKEHUMAN-CC0.txt`.

Original asset copyright notices: Data Collection AB, Joel Palmius and Jonas Hauquier. The base mesh header explicitly states its CC0 release in September 2020. The weights file independently declares CC0. The body targets are bundled graphical assets covered by section C of the upstream license.

## Sources and reproducibility

Upstream tree revision: `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`.

Download each source under the local filename below, then run `node scripts/build-human-model.mjs /path/to/source-directory`. The script uses only the already-installed Three.js library. It strips helper meshes, applies the supplied shape targets, bakes a neutral garment-preview pose using the official skin weights, and writes a binary asset. It does not execute downloaded code.

| Local filename | Source | SHA-256 |
| --- | --- | --- |
| `base.obj` | [Source](https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/3dobjs/base.obj) | `8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c` |
| `weights.json` | [Source](https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/rigs/default_weights.mhw) | `0f3641d651ae3d00ad6b4ccee43142edb109d3bd909d27d9e4139ef1beed8625` |
| `female.target` | [Source](https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/targets/macrodetails/asian-female-young.target) | `095fe79694fa19e1fe98d93009ec116199bd524e081c640351a10eccf2cca1eb` |
| `male.target` | [Source](https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/targets/macrodetails/asian-male-young.target) | `ed2e8c191cb6b87b4a2d97c80486acb2604fa549316c7aa2a738a5d5a14334dc` |
| `female-child.target` | [Source](https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/targets/macrodetails/asian-female-child.target) | `a4fffea45a475a24a0a7332dac28a07dfd60a9af9eb50b61ed5abd1178197f75` |
| `male-child.target` | [Source](https://raw.githubusercontent.com/makehumancommunity/makehuman/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/targets/macrodetails/asian-male-child.target) | `c1b56e9cc549cd7c463f407557d7adceaa217b528c600d34c19df98bc3d6472e` |

## App integration

`human.bin` has 13,380 body vertices, 26,756 source triangles, and four distinct male/female adult/child shapes. The file is approximately 993 KiB uncompressed and is fetched once from this app's own origin, only when 3D is opened. No user data or photos go to MakeHuman. The asset is included by Vite's public-directory build copy.

Skin and facial colour variation, short hair, eyes, companion clothing and closed shoes are rendered locally. Arms are posed to follow the garment sleeves. Covered body faces are hidden to prevent skin showing through static garment geometry; this is a rendering technique, not cloth collision or fit simulation. Children’s garments select the separate child morphology automatically, with shorter limbs and relatively larger heads.

The realism refinement uses a wider head, shorter neck, smoothly lowered lateral shoulders, smaller footwear, and facial colour regions anchored to each source shape's joints. The upper chest remains continuous at the neckline. Short hair receives a locally generated strand relief texture. The asset URL carries a revision query so the rebuilt proportions replace previously cached geometry.

These are reference human models, not scans of real people, likenesses, user avatars or fit recommendations. The source shapes and clothing scale are adapted for a visual concept. No measured sizing, skin photogrammetry, animation rig or dynamic cloth physics is claimed.
