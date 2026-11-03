// HUD de depuración (?debug): capas on/off y avance del viaje.
export default function debug(scene) {
  const box = document.createElement('div');
  box.id = 'debug';
  const keys = Object.keys(scene.show);
  box.innerHTML =
    keys.map((k) => `<label><input type="checkbox" data-k="${k}" checked> ${k}</label>`).join('') + '<div id="dbg-info"></div>';
  document.body.appendChild(box);
  box.addEventListener('change', (e) => {
    const k = e.target.dataset.k;
    if (k) scene.show[k] = e.target.checked;
  });
  const info = box.querySelector('#dbg-info');
  setInterval(() => {
    info.textContent = `p ${scene.p?.toFixed(3)} · ${scene.cols}×${scene.rows} · hc main ${scene.layers[3].hc}`;
  }, 250);
}
