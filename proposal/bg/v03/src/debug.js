// HUD de análisis (?debug): estado de la cámara y capas que se pueden apagar.
export default function debug(scene, scr, progress) {
  const el = document.createElement('div');
  el.id = 'debug';
  el.innerHTML = `<div id="debug-state"></div>${Object.keys(scene.show)
    .map((k) => `<label><input type="checkbox" ${scene.show[k] ? 'checked' : ''} data-k="${k}"> ${k}</label>`)
    .join('')}`;
  document.body.appendChild(el);
  el.addEventListener('change', (e) => {
    scene.show[e.target.dataset.k] = e.target.checked;
  });
  const state = el.querySelector('#debug-state');
  let frames = 0;
  let fps = 0;
  let last = performance.now();
  const tick = (now) => {
    frames++;
    if (now - last >= 1000) {
      fps = frames;
      frames = 0;
      last = now;
    }
    state.textContent =
      `p ${progress().toFixed(3)} · C ${scene.C.toFixed(1)} (${scene.C0}→${scene.C1}) · ` +
      `horizonte ${scene.hr} · ${scr.cols}×${scr.rows} · ${fps} fps`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
