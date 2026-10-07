# Toolcraft worklog

## 2026-09-30 — Phase Lines

- Product goal: turn arbitrary text into the narrow, vertical bar display treatment shown in the supplied New Phase reference.
- Visible output: live paper poster or clean type canvas. Editable entities: text, format, composition, letter width and spacing, bar pitch and width, edge threshold, paper grain, colors, and optional local font.
- Control inventory: text entry; composition and canvas size; stripe construction; ink and paper; local font; export.
- Renderer: deterministic Canvas 2D mask sampling into vertical rectangular bars. The built-in source font is a locally bundled OFL serif. An uploaded font is rendered directly so its own stripe pattern is preserved.
- Layers, timeline, persistence, settings transfer, and animation: not needed for this static lettering tool.
- Export: PNG at 2× canvas dimensions; SVG rectangles from the generated mask. SVG is disabled when a user font is loaded because embedding a font in the exported vector would require a separate license decision.
- Integration: static standalone app under `tools/new-phase/`, linked from `tools/index.html`. This site does not contain a Toolcraft generated app contract or a Toolcraft CLI, so the existing static tool deployment pattern is used.
- Verification: syntax check, browser preview at desktop and mobile sizes, interactive text and export checks, then a scoped commit and push.

## 2026-09-30 — Editable poster copy and preferred settings

- Product goal: make all five poster text areas editable while retaining the editorial layout. The main title remains independently editable.
- Control inventory: three upper blocks, credit, and lower phrase within the composition section. The controls are hidden in the clean type layout.
- Defaults from user screenshots: scale 114%, tracking 0%, letter width 63%, stripe pitch 7 px, ink width 72%, edge threshold 85%, grain 49%, paper `#EEE800`, ink `#002800`.
- Renderer and export: a shared poster text layout drives Canvas preview, PNG, and SVG. Text is escaped in SVG. The lower phrase distributes its words across the poster width, and copy shrinks to fit its allotted space.
- Verification: checked defaults, live copy edits, SVG text, PNG signature, clean layout visibility, and desktop/mobile browser previews.

## 2026-09-30 — Poster edits not refreshing for existing visitors

- Reproduction: a fresh browser session on the live site updates the poster; the published page loads unversioned `app.js` and `style.css`, both served with a four-hour cache lifetime. The previous `app.js` does not register listeners for the new poster fields.
- Root cause: an existing visitor can receive the new HTML with the cached script from the first release.
- Fix: version the script and stylesheet URLs in the HTML so the browser requests the current assets.
- Verification: repeat the live poster edit after deployment with the versioned URLs.

## 2026-10-07 — Roots

- Product goal: a 1:1 reproduction of the Root Toy effect (nicolino.zip/root-toy): vines that cling to a word's outline, wrap around the letters passing in front and behind, and grow leaves and flowers.
- Method: reverse-engineered from the public production bundle. Same algorithm and constants: exact signed distance field of the text mask (Felzenszwalb EDT); one seed per letter at its lowest edge with a budget proportional to its perimeter; fixed-step particles that grip the contour at dTarget, follow the tangent, seek, wander with 1D noise, repel their own trail through a spatial hash, wrap across the glyph and are held by a leash; branches every branchEvery, alternating behind and in front; regrowth from the last anchor when a stem strays; "capital" mode with per-letter boxes and a 6×6 coverage navigator. Same seeds give the same stems as the original.
- Visible output: paper, optional letter boxes, back stems, back foliage, outlined glyph, front stems, front foliage. Stems are outlined, toned by depth, and tapered at the growing tip; leaves pop and sway in the wind; flowers go through three bud frames before opening.
- Art: leaves and flowers are redrawn as original vector paths in the same style; the original sprites are not copied.
- Controls: text (4 lines, 48 chars), system/Google/uploaded font, weight, alignment, size, tracking, line height, branches, leaves, flowers, stem width, seed, grow and duration, wind and breeze, format, letter boxes, monotone, transparent, visibility, paper/box/ink colors.
- Export: PNG at up to 2×, SVG (stems, foliage and live text), and MP4/WebM recordings of the growth and of one wind loop.
- Integration: static module app under `tools/roots/` (`engine.js`, `sprites.js`, `app.js`), linked from `tools/index.html`.
- Verification: side-by-side render against the live original with the same word and seed, growth frames, letter-box mode, PNG/SVG/video downloads, no console errors, no horizontal overflow at 390 px.
