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
