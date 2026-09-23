# Paper material study — 15 rendered experiments

Test viewport: 1440 × 1000, Chrome, device scale 1. Each material was rendered at full viewport size with the same pulsar geometry and ink settings. A second comparison used 300 × 340 pixel crops at native resolution to inspect actual grain instead of judging only thumbnails.

The live comparison is at `/29/papeles/`. All 15 materials also work with binary notation via `/29/papeles/?mode=binary`. Click any card to open the full-sized rendering. Every surface is generated in `paper.js`; no image texture, stock photograph, source screenshot, or image-generation service is used.

| # | Material | Distinct construction | Visual assessment against the supplied reference |
|---|---|---|---|
| 01 | Celulosa | Fine stochastic grain + low-frequency pulp | Clean baseline; lacks scanning depth. |
| 02 | Algodón | Long quadratic fibers | Believable cotton; visible threads are too pronounced for this reference. |
| 03 | Vergé | Fine parallel laid lines + widely spaced chain modulation | Convincing manufactured sheet, but the repeating lines distract. |
| 04 | Lino | Crossed directional modulation | Reads as cloth at some scales; not the closest match. |
| 05 | Pulpa | Broad density clouds | Good uneven formation; too visibly mottled alone. |
| 06 | Prensado frío | Directional derivative of the height field | Tactile, but more watercolor paper than scanned document. |
| 07 | Prensado caliente | Low-noise compact surface with broad sheen | Smooth, almost too digital at normal size. |
| 08 | Periódico | Thresholded dark pores + short fibers | Distinct but too grey and dirty. |
| 09 | Trapo | Long/short fibers, edge density, pulp variation | Organic, warmer and heavier than the reference. |
| 10 | Escáner | Exponential side shading, sensor bands, dust | Closest single-process treatment; slightly flat inside the sheet. |
| 11 | Offset | Fine absorbent pore mottling | Useful pore model; spots are too evident in isolation. |
| 12 | Litografía | Mineral grain and surface relief | Too coarse, especially in native-resolution crops. |
| 13 | Pliegue | Paired shadow/highlight crease | Physical crease reads well; introduces a feature absent from the reference. |
| 14 | Archivo cálido | Warm base, edge aging and light foxing | Looks archival but too yellow. |
| 15 | Archivo / 1972 | Neutral cellulose + restrained pores + shallow relief + scanning shadow + short fibers | Selected. Closest balance of neutral tone, subtle fiber and scanned depth. |

Rendering took 44–114 ms per material in the first desktop capture run (synchronous drawing submission on this machine; not a universal performance guarantee). The surfaces are static and are only regenerated when changing paper or resizing the viewport.

The drawing gets a separate seeded ink treatment: irregular pressure, coherent dry patches, pinholes, tiny deposits, and small lateral deviations. Both notations use the same historic binary strings; the paper and map remain separate editable renderers.

Local full-size captures, the complete gallery, native-resolution texture contact sheet, and raw timing results are in `/Users/natochi/projects/pulsar-paper-study/`. The older Agustín Covarrubias paper page was searched for among project HTML files, including ignored files, but was not located. No claim is made that its implementation was reused.
