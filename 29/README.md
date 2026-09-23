# Una dirección en el universo

- `/29/`: historical bar/dash notation on procedural paper.
- `/29/binario/`: the same inscriptions written as 0 and 1.
- `/29/papeles/`: 15 distinct paper techniques to compare and select.
- `?paper=1` through `?paper=15`: addressable material variants. Default: 15.

The graphic is drawn in Canvas 2D from code and a small geometric dataset. No attached image or video is used at runtime. `paper.js` generates paper; `map.js` draws rays and notation; `app.js` handles material selection, ink wear, responsive rendering and PNG export. There is no continuous animation loop and no dependency installation/build step.

The 14 ray endpoints follow the user's blue visual reference. The common origin represents the Solar System (Earth at this galactic scale); the long ray is the galactic-center reference. This is a visual reconstruction, not a present-day catalogue projection. The binary values are the historical inscriptions transcribed in Wm. Robert Johnston's own analysis, table 1; they are not invented random digits or modern timing measurements.

Sources:
- [NASA — Golden Record cover](https://science.nasa.gov/mission/voyager/golden-record-cover/)
- [Wm. Robert Johnston — Reading the Pioneer/Voyager pulsar map](https://www.johnstonsarchive.net/astro/pulsarmap.html)

Edit endpoints and binary strings in `map.js`. `Paper.presets` defines the 15 materials; `Paper.render(canvas, id, seed)` and `PulsarMap.render(canvas, {mode, wear, seed})` are independently usable. Both use seeded deterministic random generators.

The material comparison and selection rationale are in `docs/paper-study.md`. Desktop, mobile, route switching, material selection, ink controls, binary consistency, export and error checks are captured in the accompanying verification report.
