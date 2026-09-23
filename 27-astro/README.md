# A tangled mesh of Natochi

Astro source for https://natochi.cv/27/.

- Edit a title in `src/data/authors.ts`: change `name` (for example, `STEIN`). Keep `slug` to preserve its URL. The map label, page heading and page text use the same name. `x` and `y` position the text in the 751 × 646 SVG. For wrapped labels, also edit the optional `lines` array.
- Edit the connections in `src/data/lines.json`: each row is `[x1, y1, x2, y2]`, drawn as a native SVG line.
- Edit the caption in `src/pages/index.astro`.
- The full viewport paper texture is procedural SVG in `src/components/Paper.astro`.

`npm install` then `npm run dev` for development. `npm run build` writes static pages to `../27/`.

The map uses native SVG text and lines. No raster image or invisible link overlay is used.
