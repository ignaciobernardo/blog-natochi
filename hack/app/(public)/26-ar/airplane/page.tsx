'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const PI = Math.PI;
const toDeg = (r: number) => ((r * 180) / PI).toFixed(1);
const toRad = (d: number) => (d * PI) / 180;

export default function AirplaneDebugPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pivotRef = useRef<THREE.Group | null>(null);

  const [rx, setRx] = useState(0);
  const [ry, setRy] = useState(0);
  const [rz, setRz] = useState(0);
  const [camDist, setCamDist] = useState(4);
  const controlsRef = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    camera.position.set(0, 0, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controlsRef.current = controls;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(5, 10, 7);
    scene.add(sun);
    scene.add(
      new THREE.DirectionalLight(0xffffff, 0.6).position.set(-5, 2, -5) && sun,
    );
    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-5, 2, -5);
    scene.add(fill);

    // Axes helper
    scene.add(new THREE.AxesHelper(3));

    // Grid
    scene.add(new THREE.GridHelper(10, 10, 0x444466, 0x333355));

    const pivot = new THREE.Group();
    pivotRef.current = pivot;
    pivot.rotation.set(toRad(rx), toRad(ry), toRad(rz));
    scene.add(pivot);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
    );
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      '/assets/models/airplane-textures.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = 4 / Math.max(size.x, size.y, size.z);
        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));
        pivot.add(model);
      },
      undefined,
      (e) => console.error(e),
    );

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener('resize', resize);
      renderer.setAnimationLoop(null);
      dracoLoader.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync sliders → pivot rotation
  useEffect(() => {
    if (pivotRef.current) {
      pivotRef.current.rotation.set(toRad(rx), toRad(ry), toRad(rz));
    }
  }, [rx, ry, rz]);

  // Sync camera distance
  useEffect(() => {
    if (controlsRef.current) {
      const controls = controlsRef.current;
      const dir = controls.object.position.clone().normalize();
      controls.object.position.copy(dir.multiplyScalar(camDist));
      controls.update();
    }
  }, [camDist]);

  const SliderRow = ({
    label,
    value,
    onChange,
    min = -180,
    max = 180,
  }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
  }) => (
    <div className="flex items-center gap-3">
      <span className="w-8 font-mono text-white/60 text-xs">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-yellow-400"
      />
      <span className="w-14 text-right font-mono text-sm text-yellow-300">
        {value}°
      </span>
      <span className="w-20 text-right font-mono text-white/40 text-xs">
        {toDeg(toRad(value))}° = {(toRad(value) / PI).toFixed(3)}π
      </span>
    </div>
  );

  return (
    <div className="flex h-dvh w-full flex-col bg-[#0f0f1a] text-white">
      <div className="flex items-center gap-4 border-white/10 border-b px-4 py-2">
        <span className="font-mono text-white/40 text-xs">
          airplane rotation debug
        </span>
        <span className="font-mono text-white/20 text-xs">
          red=X · green=Y · blue=Z
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 3D Viewport */}
        <div ref={containerRef} className="flex-1" />

        {/* Controls panel */}
        <div className="flex w-72 flex-col gap-4 overflow-y-auto border-white/10 border-l bg-black/40 p-4">
          <div>
            <p className="mb-3 font-mono text-white/40 text-xs uppercase tracking-widest">
              rotation (degrees)
            </p>
            <div className="flex flex-col gap-3">
              <SliderRow label="X" value={rx} onChange={setRx} />
              <SliderRow label="Y" value={ry} onChange={setRy} />
              <SliderRow label="Z" value={rz} onChange={setRz} />
            </div>
          </div>

          <div>
            <p className="mb-3 font-mono text-white/40 text-xs uppercase tracking-widest">
              camera distance
            </p>
            <SliderRow
              label="D"
              value={camDist}
              onChange={setCamDist}
              min={2}
              max={30}
            />
          </div>

          <div className="rounded border border-white/10 bg-white/5 p-3">
            <p className="mb-2 font-mono text-white/40 text-xs uppercase tracking-widest">
              copy values
            </p>
            <pre className="whitespace-pre-wrap font-mono text-green-300 text-xs">
              {`pivot.rotation.set(\n  ${(toRad(rx) / PI).toFixed(3)} * PI, // X\n  ${(toRad(ry) / PI).toFixed(3)} * PI, // Y\n  ${(toRad(rz) / PI).toFixed(3)} * PI  // Z\n);`}
            </pre>
          </div>

          <div className="text-white/20 text-xs">
            <p>Drag viewport to orbit camera</p>
            <p>Scroll to zoom</p>
            <p>Right-drag to pan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
