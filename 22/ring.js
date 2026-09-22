import * as THREE from 'three';

const canvas = document.querySelector('#ring');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x272727);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 1, 2000);
camera.position.set(0, 100, 1150);
camera.lookAt(0, 0, 0);

const sculpture = new THREE.Group();
scene.add(sculpture);
const faceMaterial = new THREE.MeshBasicMaterial({ color: 0x050505, side: THREE.DoubleSide });
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xf4f4f4 });
let faces;
let edges;

const TAU = Math.PI * 2;
const phiCount = 72;
const thetaCount = 13;
const radiusCount = 21;
const step = Math.PI / 36;
const radii = Array.from({ length: radiusCount }, (_, i) => 200 + i * 5);
const angle = (degrees) => degrees * Math.PI / 180;

// Smooth, repeatable four-dimensional value noise. The last axis is time.
function hash(x, y, z, w) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177) + Math.imul(z, 1442695041) + Math.imul(w, 1597334677);
  n = Math.imul(n ^ (n >>> 16), 2246822519);
  return ((n ^ (n >>> 13)) >>> 0) / 4294967295;
}
function noise(x, y, z, w) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), iw = Math.floor(w);
  const sx = x - ix, sy = y - iy, sz = z - iz, sw = w - iw;
  const fx = sx * sx * (3 - 2 * sx), fy = sy * sy * (3 - 2 * sy);
  const fz = sz * sz * (3 - 2 * sz), fw = sw * sw * (3 - 2 * sw);
  let result = 0;
  for (let dw = 0; dw < 2; dw++) for (let dz = 0; dz < 2; dz++) {
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      result += hash(ix + dx, iy + dy, iz + dz, iw + dw)
        * (dx ? fx : 1 - fx) * (dy ? fy : 1 - fy)
        * (dz ? fz : 1 - fz) * (dw ? fw : 1 - fw);
    }
  }
  return result;
}
function point(radius, phi, theta) {
  const sin = Math.sin(theta);
  return [radius * sin * Math.cos(phi), radius * sin * Math.sin(phi), radius * Math.cos(theta)];
}
function addLine(target, a, b) { target.push(...a, ...b); }

function rebuild(time) {
  const triangles = [];
  const lines = [];
  const values = new Float32Array(radiusCount * phiCount * (thetaCount + 2));
  const stride = thetaCount + 2;
  const sample = (r, p, t) => values[(r * phiCount + (p + phiCount) % phiCount) * stride + t + 1];
  for (let r = 0; r < radiusCount; r++) {
    const nr = radii[r] * .001;
    for (let p = 0; p < phiCount; p++) {
      const phi = p * step;
      for (let t = -1; t <= thetaCount; t++) {
        const theta = angle(60 + t * 5);
        values[(r * phiCount + p) * stride + t + 1] = noise(
          (nr + Math.cos(phi)) * 2.2,
          (nr + Math.sin(phi)) * 2.2,
          (nr + Math.cos(theta)) * 2.2,
          time * .38
        );
      }
    }
  }
  for (let r = 0; r < radiusCount; r++) for (let p = 0; p < phiCount; p++) {
    const phi = p * step;
    for (let t = 0; t < thetaCount; t++) {
      const visible = (value) => value >= .45 && value <= .55;
      if (!visible(sample(r, p, t))) continue;
      const theta = angle(60 + t * 5);
      const a = point(radii[r], phi + step / 2, theta - step / 2);
      const b = point(radii[r], phi - step / 2, theta - step / 2);
      const c = point(radii[r], phi + step / 2, theta + step / 2);
      const d = point(radii[r], phi - step / 2, theta + step / 2);
      triangles.push(...a, ...b, ...d, ...a, ...d, ...c);
      if (t === 0 || !visible(sample(r, p, t - 1))) addLine(lines, a, b);
      if (!visible(sample(r, p + 1, t))) addLine(lines, a, c);
      if (!visible(sample(r, p - 1, t))) addLine(lines, b, d);
      if (t === thetaCount - 1 || !visible(sample(r, p, t + 1))) addLine(lines, c, d);
    }
  }
  if (faces) { sculpture.remove(faces); faces.geometry.dispose(); }
  if (edges) { sculpture.remove(edges); edges.geometry.dispose(); }
  const faceGeometry = new THREE.BufferGeometry();
  faceGeometry.setAttribute('position', new THREE.Float32BufferAttribute(triangles, 3));
  faces = new THREE.Mesh(faceGeometry, faceMaterial);
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3));
  edges = new THREE.LineSegments(edgeGeometry, lineMaterial);
  sculpture.add(faces, edges);
}

function resize() {
  const width = canvas.clientWidth, height = canvas.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.z = Math.max(1150, 850 / camera.aspect);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let dragging = false, previousX = 0, previousY = 0;
let tilt = -.3, spin = 0;
canvas.addEventListener('pointerdown', (event) => {
  dragging = true; previousX = event.clientX; previousY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  spin += (event.clientX - previousX) * .006;
  tilt = THREE.MathUtils.clamp(tilt + (event.clientY - previousY) * .005, -1.3, 1.3);
  previousX = event.clientX; previousY = event.clientY;
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const clock = new THREE.Clock();
let lastBuild = -Infinity;
function animate() {
  requestAnimationFrame(animate);
  const time = reducedMotion.matches ? 0 : clock.getElapsedTime();
  if (time - lastBuild > 1 / 25 || lastBuild === -Infinity) {
    rebuild(time);
    lastBuild = time;
  }
  sculpture.rotation.x = tilt;
  sculpture.rotation.y = spin + (reducedMotion.matches ? 0 : time * .045);
  renderer.render(scene, camera);
}
animate();
