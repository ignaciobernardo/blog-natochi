'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AdditiveBlending,
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  type MeshPhongMaterial,
  type Object3D,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type ThreeGlobeType from 'three-globe';
import countries from '@/public/assets/globe/globe-data-min.json';
import { disableFrameTicker } from './three-globe-ticker';

export const tourCities = [
  { lat: -33.45, lng: -70.65, name: 'Santiago', country: 'Chile' },
  { lat: -34.6, lng: -58.38, name: 'Buenos Aires', country: 'Argentina' },
  { lat: 4.71, lng: -74.07, name: 'Bogotá', country: 'Colombia' },
  { lat: 10.48, lng: -66.9, name: 'Caracas', country: 'Venezuela' },
  { lat: 19.43, lng: -99.13, name: 'Ciudad de México', country: 'México' },
];

interface InteractiveTourGlobeProps {
  className?: string;
  activeCity?: string | null;
}

const DEFAULT_CAMERA = { x: -341.5, y: -112.83, z: 114.01 };
const CAMERA_DISTANCE = 377.29;
const MOBILE_BREAKPOINT = 768;

// Function to get camera distance based on screen size
const getCameraDistance = () => {
  if (typeof window === 'undefined') return CAMERA_DISTANCE;
  return window.innerWidth < MOBILE_BREAKPOINT
    ? CAMERA_DISTANCE * 1.3
    : CAMERA_DISTANCE;
};

export default function InteractiveTourGlobe({
  className,
  activeCity,
}: InteractiveTourGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const globeRef = useRef<ThreeGlobeType | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const targetPositionRef = useRef<Vector3 | null>(null);
  const isAnimatingRef = useRef(false);
  const controlsActiveRef = useRef(false);
  const animateRef = useRef<((time: number) => void) | null>(null);
  const dampingFramesRef = useRef(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const warmupFramesRef = useRef(0);
  const animationControlsRef = useRef<{
    stopAnimation: () => void;
    startAnimation: () => void;
  } | null>(null);

  // Visibility gating removed for reliable startup when reloading mid-page

  // Handle activeCity changes - pan camera to city
  useEffect(() => {
    if (!globeRef.current || !cameraRef.current) return;

    if (activeCity) {
      const city = tourCities.find((c) => c.name === activeCity);
      if (city) {
        // Get the 3D coordinates of the city on the globe
        const coords = globeRef.current.getCoords(city.lat, city.lng, 0);
        const cityPos = new Vector3(coords.x, coords.y, coords.z);

        // Calculate camera position: offset from city position
        const direction = cityPos.clone().normalize();
        const targetPos = direction.multiplyScalar(getCameraDistance());

        targetPositionRef.current = targetPos;
        isAnimatingRef.current = true;
        animationControlsRef.current?.startAnimation();
      }
    } else {
      // Return to default position
      const cameraScale = getCameraDistance() / CAMERA_DISTANCE;
      targetPositionRef.current = new Vector3(
        DEFAULT_CAMERA.x * cameraScale,
        DEFAULT_CAMERA.y * cameraScale,
        DEFAULT_CAMERA.z * cameraScale,
      );
      isAnimatingRef.current = true;
      animationControlsRef.current?.startAnimation();
    }
  }, [activeCity]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let cleanup: (() => void) | undefined;
    const init = async () => {
      disableFrameTicker();
      const ThreeGlobe = (await import('three-globe')).default;

      // Initialize renderer
      const renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      const initialWidth = container.clientWidth || 1;
      const initialHeight = container.clientHeight || 1;
      renderer.setSize(initialWidth, initialHeight);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Initialize scene
      const scene = new Scene();
      scene.add(new AmbientLight(0xffffff, 1.5));

      // Initialize camera
      const camera = new PerspectiveCamera(
        45,
        initialWidth / initialHeight,
        1,
        2000,
      );
      const cameraScale = getCameraDistance() / CAMERA_DISTANCE;
      camera.position.set(
        DEFAULT_CAMERA.x * cameraScale,
        DEFAULT_CAMERA.y * cameraScale,
        DEFAULT_CAMERA.z * cameraScale,
      );
      cameraRef.current = camera;

      const dLight = new DirectionalLight(0xffffff, 1.2);
      dLight.position.set(-400, 400, 400);
      camera.add(dLight);

      const dLight2 = new DirectionalLight(0xffffff, 0.6);
      dLight2.position.set(400, -200, -400);
      camera.add(dLight2);

      scene.add(camera);

      // Initialize OrbitControls for 3D rotation
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.minDistance = 250;
      controls.maxDistance = window.innerWidth < MOBILE_BREAKPOINT ? 700 : 600;
      controls.rotateSpeed = 0.5;
      controls.enableZoom = false;
      controlsRef.current = controls;
      controls.addEventListener('start', () => {
        controlsActiveRef.current = true;
        dampingFramesRef.current = 0;
        if (frameIdRef.current === null && animateRef.current) {
          frameIdRef.current = requestAnimationFrame(animateRef.current);
        }
      });
      controls.addEventListener('end', () => {
        controlsActiveRef.current = false;
        dampingFramesRef.current = 12;
      });

      // Initialize globe
      const Globe = new ThreeGlobe({
        waitForGlobeReady: false,
        animateIn: false,
      })
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(true)
        .atmosphereColor('#e4ff00')
        .atmosphereAltitude(0.2)
        .hexPolygonColor(() => '#e4ff00');

      if (typeof (Globe as any).pauseAnimation === 'function') {
        (Globe as any).pauseAnimation();
      }

      const globeMaterial = Globe.globeMaterial() as MeshPhongMaterial;
      globeMaterial.color = new Color(0x1a1a1a);
      globeMaterial.emissive = new Color(0x000000);
      globeMaterial.emissiveIntensity = 0;
      globeMaterial.shininess = 0.2;

      // No rotation - camera position handles the view
      Globe.rotation.y = 0;
      Globe.rotation.x = 0;

      // Add city markers
      Globe.customLayerData(tourCities)
        .customThreeObject(() => {
          const group = new Group();
          const beaconHeight = 25;

          // Core beam
          const coreGeometry = new CylinderGeometry(0.5, 0.5, beaconHeight, 8);
          const coreMaterial = new MeshBasicMaterial({
            color: new Color('#ffffff'),
            transparent: true,
            opacity: 0.95,
          });
          const core = new Mesh(coreGeometry, coreMaterial);
          core.position.y = beaconHeight / 2;
          group.add(core);

          // Inner glow
          const innerGlowGeometry = new CylinderGeometry(
            1.2,
            1.2,
            beaconHeight,
            8,
          );
          const innerGlowMaterial = new MeshBasicMaterial({
            color: new Color('#e4ff00'),
            transparent: true,
            opacity: 0.5,
            blending: AdditiveBlending,
          });
          const innerGlow = new Mesh(innerGlowGeometry, innerGlowMaterial);
          innerGlow.position.y = beaconHeight / 2;
          group.add(innerGlow);

          // Outer glow
          const outerGlowGeometry = new CylinderGeometry(
            2.5,
            2.5,
            beaconHeight,
            8,
          );
          const outerGlowMaterial = new MeshBasicMaterial({
            color: new Color('#e4ff00'),
            transparent: true,
            opacity: 0.2,
            blending: AdditiveBlending,
          });
          const outerGlow = new Mesh(outerGlowGeometry, outerGlowMaterial);
          outerGlow.position.y = beaconHeight / 2;
          group.add(outerGlow);

          // Base ring
          const ringGeometry = new CylinderGeometry(3, 3, 0.5, 16);
          const ringMaterial = new MeshBasicMaterial({
            color: new Color('#e4ff00'),
            transparent: true,
            opacity: 0.8,
          });
          const ring = new Mesh(ringGeometry, ringMaterial);
          ring.position.y = 0.25;
          group.add(ring);

          return group;
        })
        .customThreeObjectUpdate((obj: Object3D, d: object) => {
          const data = d as { lat: number; lng: number };
          const coords = Globe.getCoords(data.lat, data.lng, 0);
          obj.position.set(coords.x, coords.y, coords.z);

          const direction = new Vector3(
            coords.x,
            coords.y,
            coords.z,
          ).normalize();
          obj.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        });

      scene.add(Globe);
      globeRef.current = Globe;

      if (typeof Globe.pauseAnimation === 'function') {
        setTimeout(() => {
          Globe.pauseAnimation();
        }, 0);
      }

      const updateControlsForViewport = () => {
        const shouldDisableControls =
          window.innerWidth < MOBILE_BREAKPOINT ||
          (typeof window.matchMedia === 'function' &&
            window.matchMedia('(pointer: coarse)').matches);

        controls.enabled = !shouldDisableControls;
        controls.enableRotate = !shouldDisableControls;
        renderer.domElement.style.touchAction = shouldDisableControls
          ? 'pan-y'
          : 'none';
        controls.maxDistance = shouldDisableControls ? 700 : 600;
      };

      const updateSize = () => {
        if (!container) return;
        const { clientWidth, clientHeight } = container;
        if (!clientWidth || !clientHeight) return;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        updateControlsForViewport();
        renderer.render(scene, camera);
      };

      warmupFramesRef.current = 10;
      renderer.render(scene, camera);

      const targetFps = 60;
      const targetFrameTime = 1000 / targetFps;
      let lastTime = 0;

      // Animation loop with smooth camera panning (only when needed)
      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTime;
        if (deltaTime < targetFrameTime) {
          frameIdRef.current = requestAnimationFrame(animate);
          return;
        }
        lastTime = currentTime;

        // Smooth camera animation to target
        if (targetPositionRef.current && isAnimatingRef.current) {
          const lerpFactor = 0.05;
          camera.position.lerp(targetPositionRef.current, lerpFactor);

          // Check if close enough to target
          if (camera.position.distanceTo(targetPositionRef.current) < 0.5) {
            isAnimatingRef.current = false;
          }
        }

        controls.update();
        if (dampingFramesRef.current > 0) {
          dampingFramesRef.current -= 1;
        }

        renderer.render(scene, camera);
        if (warmupFramesRef.current > 0) {
          warmupFramesRef.current -= 1;
        }
        if (
          isAnimatingRef.current ||
          controlsActiveRef.current ||
          dampingFramesRef.current > 0 ||
          warmupFramesRef.current > 0
        ) {
          frameIdRef.current = requestAnimationFrame(animate);
          return;
        }

        frameIdRef.current = null;
      };

      animateRef.current = animate;

      const startAnimation = () => {
        if (frameIdRef.current === null) {
          frameIdRef.current = requestAnimationFrame(animate);
        }
      };

      const stopAnimation = () => {
        if (frameIdRef.current !== null) {
          cancelAnimationFrame(frameIdRef.current);
          frameIdRef.current = null;
        }
        // Pause three-globe's internal animation cycle
        if (Globe && typeof (Globe as any).pauseAnimation === 'function') {
          (Globe as any).pauseAnimation();
        }
      };

      window.addEventListener('resize', updateSize);
      updateSize();
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(container);

      const loadTimeout = setTimeout(() => setIsLoaded(true), 100);

      cleanup = () => {
        clearTimeout(loadTimeout);
        window.removeEventListener('resize', updateSize);
        resizeObserver.disconnect();
        stopAnimation();
        controls.dispose();
        renderer.dispose();
        container.removeChild(renderer.domElement);
      };

      // Store animation controls
      animationControlsRef.current = { stopAnimation, startAnimation };

      startAnimation();
    };

    init();

    return () => {
      cleanup?.();
      animationControlsRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-1000 ease-out ${
        isLoaded ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0'
      } ${className}`}
    />
  );
}
