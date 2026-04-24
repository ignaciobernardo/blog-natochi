'use client';

import { useEffect, useRef } from 'react';
import { FaBitcoin } from 'react-icons/fa6';
import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function hslCssToColor(hslString: string): THREE.Color {
  const parts = hslString.trim().split(/\s+/);
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  return new THREE.Color().setHSL(h, s, l);
}

function getCssThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    primary: hslCssToColor(style.getPropertyValue('--primary').trim()),
    background: hslCssToColor(style.getPropertyValue('--background').trim()),
  };
}

const duotoneGLSL = /* glsl */ `
  #ifdef USE_MAP
  {
    float maxC = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b));
    float minC = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b));
    float delta = maxC - minC;
    float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
    float sat = (maxC > 0.001) ? delta / maxC : 0.0;
    float hue = 0.0;
    if (delta > 0.001) {
      if (maxC == diffuseColor.r)      hue = mod((diffuseColor.g - diffuseColor.b) / delta, 6.0) / 6.0;
      else if (maxC == diffuseColor.g) hue = ((diffuseColor.b - diffuseColor.r) / delta + 2.0) / 6.0;
      else                             hue = ((diffuseColor.r - diffuseColor.g) / delta + 4.0) / 6.0;
    }
    if (hue < 0.0) hue += 1.0;
    float hueDist = min(hue, 1.0 - hue);
    float redness = smoothstep(0.12, 0.03, hueDist) * smoothstep(0.2, 0.5, sat);
    float shade = clamp(luma * 0.48, 0.0, 1.0);
    diffuseColor.rgb = mix(uBgColor * shade, uPrimaryColor, redness);
  }
  #endif
`;

function applyDuotone(
  material: THREE.Material,
  primaryColor: THREE.Color,
  bgColor: THREE.Color,
) {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPrimaryColor = { value: primaryColor };
    shader.uniforms.uBgColor = { value: bgColor };
    shader.fragmentShader =
      'uniform vec3 uPrimaryColor;\nuniform vec3 uBgColor;\n' +
      shader.fragmentShader.replace(
        '#include <map_fragment>',
        `#include <map_fragment>\n${duotoneGLSL}`,
      );
  };
  material.needsUpdate = true;
}

const CAM_START_Z = 4;
const CAM_END_Z = 7;
const CAM_END_Z_MOBILE = 9.1;
const ENTRY_DURATION = 1.2;
const TRANSFORM_DURATION = 0.9;
const START_X = -9;
const END_ROT_X = -Math.PI / 2;
const HOVER_ROT_X = 0;
const END_POS_Y = -1.4;

const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
const easeInExpo = (t: number) => (t === 0 ? 0 : 2 ** (10 * t - 10));
const PRIZE_TARGET_USD = 3000;

export default function PrizeSlide() {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const amountRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const overlay = overlayRef.current;
    const amountNode = amountRef.current;
    if (!section || !container || !overlay || !amountNode) return;

    const { primary, background } = getCssThemeColors();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    camera.position.set(0, 0, CAM_START_Z);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(5, 10, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -10;
    sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0xffffff, 0.6);
    fill.position.set(-5, 2, -5);
    scene.add(fill);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
    );

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const raycastTargets: THREE.Object3D[] = [];

    let pivot: THREE.Group | null = null;
    let entryElapsed = -1;
    let transformElapsed = -1;
    let transformStartY = 0;
    let idleElapsed = 0;
    let hoverBlend = 0;
    let counterFrameId = 0;
    let counterStarted = false;
    let isMobileViewport = false;
    let isPlaneHovered = false;

    const getFinalCameraZ = () =>
      isMobileViewport ? CAM_END_Z_MOBILE : CAM_END_Z;

    const startCounter = () => {
      if (counterStarted) return;
      counterStarted = true;

      const durationMs = 2400;
      let startTime = 0;

      const tick = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / durationMs, 1);
        const easedProgress = easeInExpo(progress);
        amountNode.textContent = String(
          Math.round(PRIZE_TARGET_USD * easedProgress),
        );

        if (progress < 1) {
          counterFrameId = requestAnimationFrame(tick);
          return;
        }

        amountNode.textContent = String(PRIZE_TARGET_USD);
      };

      counterFrameId = requestAnimationFrame(tick);
    };

    loader.load(
      '/assets/models/airplane-textures.glb',
      (gltf) => {
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const scale = 4 / Math.max(size.x, size.y, size.z);
        const hitRadius = 1.5;

        model.scale.setScalar(scale);
        model.position.sub(center.multiplyScalar(scale));

        model.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            const mats = Array.isArray(node.material)
              ? node.material
              : [node.material];
            for (const mat of mats) applyDuotone(mat, primary, background);
          }
        });

        pivot = new THREE.Group();
        const hoverHitArea = new THREE.Mesh(
          new THREE.SphereGeometry(hitRadius, 24, 24),
          new THREE.MeshBasicMaterial({
            color: 0xffffff,
            depthWrite: false,
            opacity: 0,
            transparent: true,
          }),
        );
        hoverHitArea.renderOrder = -1;
        raycastTargets.push(hoverHitArea);
        pivot.add(hoverHitArea);
        pivot.add(model);
        pivot.rotation.set(0, 0, 0);
        pivot.position.set(START_X, 0, 0);

        scene.add(pivot);
        camera.lookAt(0, 0, 0);
      },
      undefined,
      (error) => console.error('Failed to load airplane model', error),
    );

    // Trigger when slide enters viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entryElapsed === -1) {
          entryElapsed = 0;
          overlay.classList.remove('translate-y-4', 'opacity-0');
          overlay.classList.add('translate-y-0', 'opacity-100');
          startCounter();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);

    const updateHoverState = (event: PointerEvent) => {
      if (!pivot || raycastTargets.length === 0) {
        isPlaneHovered = false;
        return;
      }

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      isPlaneHovered =
        raycaster.intersectObjects(raycastTargets, false).length > 0;
    };

    const clearHoverState = () => {
      isPlaneHovered = false;
    };

    renderer.domElement.addEventListener('pointermove', updateHoverState);
    renderer.domElement.addEventListener('pointerleave', clearHoverState);

    const resize = () => {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      isMobileViewport = width < 768;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    resize();
    window.addEventListener('resize', resize);

    const clock = new THREE.Clock();

    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();

      if (!pivot) {
        renderer.render(scene, camera);
        return;
      }

      if (entryElapsed >= 0 && entryElapsed < ENTRY_DURATION) {
        entryElapsed += delta;
        const t = Math.min(entryElapsed / ENTRY_DURATION, 1);

        // Plane slides in from left, decelerates to center
        pivot.position.x = START_X + (0 - START_X) * easeOutQuint(t);

        // Subtle altitude drift — slight rise as it comes in, settles level
        pivot.position.y = Math.sin(t * Math.PI) * 0.08;

        // Camera pulls back as plane arrives
        camera.position.z =
          CAM_START_Z + (CAM_END_Z - CAM_START_Z) * easeOutCubic(t);

        // Start transform phase early so there's no gap
        if (t >= 0.2 && transformElapsed === -1) {
          transformElapsed = 0;
          transformStartY = pivot.position.y;
        }

        if (t >= 1) {
          pivot.position.set(0, 0, 0);
          camera.position.z = CAM_END_Z;
        }
      } else if (
        transformElapsed >= 0 &&
        transformElapsed < TRANSFORM_DURATION
      ) {
        // Phase 2: rotate X → -90° and sink toward bottom
        transformElapsed += delta;
        const t = Math.min(transformElapsed / TRANSFORM_DURATION, 1);
        const e = easeInOutCubic(t);
        const finalCameraZ = getFinalCameraZ();

        pivot.rotation.x = END_ROT_X * e;
        pivot.position.y = transformStartY + (END_POS_Y - transformStartY) * e;
        camera.position.z = CAM_END_Z + (finalCameraZ - CAM_END_Z) * e;

        if (t >= 1) {
          pivot.rotation.x = END_ROT_X;
          pivot.position.y = END_POS_Y;
          camera.position.z = finalCameraZ;
        }
      } else if (transformElapsed >= TRANSFORM_DURATION) {
        // Idle: gentle float in final pose
        idleElapsed += delta;
        const s = idleElapsed;
        const finalCameraZ = getFinalCameraZ();
        const hoverTarget = isPlaneHovered ? 1 : 0;
        hoverBlend += (hoverTarget - hoverBlend) * Math.min(1, delta * 7);
        const baseRotationX = THREE.MathUtils.lerp(
          END_ROT_X,
          HOVER_ROT_X,
          hoverBlend,
        );

        pivot.position.y = END_POS_Y + Math.sin(s * 0.5) * 0.04;
        pivot.position.x =
          Math.sin(s * 0.31) * 0.12 + Math.sin(s * 0.17) * 0.06;
        pivot.rotation.x =
          baseRotationX +
          Math.sin(s * 0.33) * 0.025 +
          Math.sin(s * 0.19) * 0.012;
        pivot.rotation.z = Math.sin(s * 0.4) * 0.006;

        // Subtle camera drift — slow pan + tiny FOV breathe
        camera.position.x = Math.sin(s * 0.22) * 0.15;
        camera.position.y = Math.sin(s * 0.17) * 0.08;
        camera.position.z = finalCameraZ + Math.sin(s * 0.21) * 0.04;
        camera.fov = 45 + Math.sin(s * 0.28) * 0.4;
        camera.updateProjectionMatrix();
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    });

    return () => {
      observer.disconnect();
      cancelAnimationFrame(counterFrameId);
      renderer.domElement.removeEventListener('pointermove', updateHoverState);
      renderer.domElement.removeEventListener('pointerleave', clearHoverState);
      window.removeEventListener('resize', resize);
      renderer.setAnimationLoop(null);
      dracoLoader.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="selection-on-light relative flex min-h-dvh w-full items-center overflow-hidden bg-primary px-6 py-16 text-background md:h-dvh md:py-0"
    >
      <div ref={containerRef} className="absolute inset-0 z-20" />

      <div
        ref={overlayRef}
        className="absolute inset-x-0 top-0 z-10 mx-auto w-full max-w-7xl translate-y-4 px-6 pt-10 opacity-0 transition-all duration-700 ease-out md:pt-14 lg:pt-20"
      >
        <div className="flex justify-center">
          <h2 className="font-bold font-title text-4xl leading-tight sm:text-5xl md:text-6xl">
            <span className="inline-block bg-background px-3 py-1 text-primary sm:px-4 sm:py-1.5">
              epic prizes
            </span>
          </h2>
        </div>

        <div className="mt-8 grid items-start gap-6 md:mt-10 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-8">
          <div className="max-w-md">
            <p className="font-title text-background/72 text-base sm:text-lg md:text-xl">
              pozo de premios
            </p>

            <div className="mt-3 font-bold font-title leading-[0.88]">
              <p
                ref={amountRef}
                className="text-[clamp(4.5rem,14vw,10rem)] tracking-[-0.06em]"
              >
                0
              </p>
              <p className="mt-2 flex items-center gap-3 text-[clamp(1.5rem,4.8vw,3rem)] tracking-[-0.04em]">
                <span>USD en</span>
                <span
                  className="inline-flex h-[0.9em] w-[0.9em] items-center justify-center rounded-full bg-background text-primary"
                  aria-hidden="true"
                >
                  <FaBitcoin className="text-[0.62em]" />
                </span>
              </p>
            </div>
          </div>

          <div className="hidden pt-8 text-center font-bold font-title text-[clamp(2.25rem,6vw,4.5rem)] leading-none md:block">
            +
          </div>

          <div className="max-w-md md:justify-self-end md:text-right">
            <p className="font-title text-background/72 text-base sm:text-lg md:text-xl">
              vuelo a Chile
            </p>
            <div className="mt-3 font-bold font-title leading-[0.92]">
              <p className="text-[clamp(2rem,5vw,4rem)] tracking-[-0.05em]">
                Pasajes a Platanus Hack 26 Santiago
              </p>
              <p className="mt-2 text-[clamp(1.2rem,3vw,2rem)] text-background/92 tracking-[-0.03em]">
                noviembre
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
