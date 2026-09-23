# /30 — 3D ink study

Astro source for `natochi.cv/30`. `npm install` and `npm run build`
generate the static site in `../30/`. `npm run dev` starts local development.

The original reference is reconstructed as a WebGL ink point cloud with connected
3D skeleton strands for oblique views. Every
nonwhite source pixel retains its original screen coordinate and opacity;
the initial orthographic projection preserves the reference composition,
lettering and individual marks. Depth is inferred inside the measured plot
frame; it is not the original scientific trajectory, which cannot be recovered
uniquely from a single image. All ink samples have actual 3D coordinates.

Drag or use arrow keys to orbit. Scroll, pinch or press +/- to zoom.
Double-click or press Home/0 to reset. No continuous animation. The original
image remains available as a fallback without JavaScript or WebGL.

To regenerate `public/cloud.bin`, run `python3 scripts/reconstruct.py`
with Pillow, NumPy, SciPy and scikit-image installed. The binary stores four little-endian
float32 values per sample: x, y, z and ink opacity.
