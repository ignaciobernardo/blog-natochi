# Personal terminal

`/24/` keeps the original instrumentation panel. Its SVG geometry is preserved in `source/panel.svg`; only selected text, accessible labels, and clickable wrappers are added on the home page.

The five sections are `/24/about/`, `/24/projects/`, `/24/blog/`, `/24/reading/`, and `/24/contact/`. Section pages reuse the original identity mark, radar and spectrum as SVG assets. Content scrolls inside the bordered frame. All pages are static HTML and work without JavaScript.

Personal copy and external links were adapted from `/info/`. Four existing articles are imported from their canonical `/blog/` HTML. Their original wording is retained, including short unfinished notes; the generator does not generate article text. The source `spomenik` article contains a missing image and is not included in this selection.

Run `python3 24/build.py` from the repository root to rebuild. Edit section copy in `build.py`, shared presentation in its `css` string, and the original blog source for imported articles. Generated files should not be edited separately.

Home geometry verification compares all 1,532 original path/rect/circle/pattern elements, excluding the new transparent link targets. The original elements remain identical.
