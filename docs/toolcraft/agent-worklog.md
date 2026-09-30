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
