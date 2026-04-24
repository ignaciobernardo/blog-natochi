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
import type ThreeGlobeType from 'three-globe';
import countries from '@/public/assets/globe/globe-data-min.json';
import { disableFrameTicker } from './three-globe-ticker';

interface NorthPoleGlobeProps {
  className?: string;
  rotationSpeed?: number;
  isPaused?: boolean;
  startX?: number;
  startY?: number;
}

export default function NorthPoleGlobe({
  className,
  rotationSpeed = 0.008,
  isPaused = false,
  startX = -3.32,
  startY = 1.46,
}: NorthPoleGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const isVisibleRef = useRef(false);
  const wasVisibleRef = useRef(false);
  const visibilityInitializedRef = useRef(false);
  const targetSpeedRef = useRef(rotationSpeed);
  const globeRef = useRef<ThreeGlobeType | null>(null);
  const startXRef = useRef(startX);
  const startYRef = useRef(startY);
  const animationControlsRef = useRef<{
    stopAnimation: () => void;
    startAnimation: () => void;
  } | null>(null);

  const getIsVisible = () => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();
    return (
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  };

  // Intersection Observer to detect visibility and control animation
  useEffect(() => {
    if (!containerRef.current) return;

    if (!visibilityInitializedRef.current) {
      const initiallyVisible = getIsVisible();
      isVisibleRef.current = initiallyVisible;
      wasVisibleRef.current = initiallyVisible;
      visibilityInitializedRef.current = true;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting !== wasVisibleRef.current) {
            wasVisibleRef.current = entry.isIntersecting;
          }

          // Start/stop animation based on visibility
          if (animationControlsRef.current) {
            if (entry.isIntersecting) {
              animationControlsRef.current.startAnimation();
            } else {
              animationControlsRef.current.stopAnimation();
            }
          }
        });
      },
      { threshold: 0 }, // Trigger as soon as any part is visible
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    targetSpeedRef.current = isPaused ? 0 : rotationSpeed;
    if (!isPaused && isVisibleRef.current && animationControlsRef.current) {
      animationControlsRef.current.startAnimation();
    }
  }, [isPaused, rotationSpeed]);

  // Update rotation refs and apply to globe directly
  useEffect(() => {
    startXRef.current = startX;
    startYRef.current = startY;
    if (globeRef.current) {
      globeRef.current.rotation.x = startX;
      globeRef.current.rotation.y = startY;
    }
  }, [startX, startY]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      disableFrameTicker();
      const ThreeGlobe = (await import('three-globe')).default;

      // Initialize renderer with transparent background
      const renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Initialize scene - no background for transparency
      const scene = new Scene();
      scene.add(new AmbientLight(0xffffff, 2));

      // Initialize camera - positioned above looking down at north pole, zoomed in
      const camera = new PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        1,
        2000,
      );
      camera.position.set(0, 300, 80);
      camera.lookAt(0, 0, 0);

      const dLight = new DirectionalLight(0xffffff, 1.5);
      dLight.position.set(-400, 600, 400);
      camera.add(dLight);

      const dLight1 = new DirectionalLight(0xffffff, 0.8);
      dLight1.position.set(400, -200, 400);
      camera.add(dLight1);

      scene.add(camera);

      // Initialize globe - clean version without cities/rings
      const Globe = new ThreeGlobe({
        waitForGlobeReady: false,
        animateIn: false,
      })
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(true)
        .atmosphereColor('#333333')
        .atmosphereAltitude(0.18)
        .hexPolygonColor(() => '#e4ff00');

      if (typeof (Globe as any).pauseAnimation === 'function') {
        (Globe as any).pauseAnimation();
      }

      const globeMaterial = Globe.globeMaterial() as MeshPhongMaterial;
      globeMaterial.color = new Color(0x080808);
      globeMaterial.emissive = new Color(0x000000);
      globeMaterial.emissiveIntensity = 0;
      globeMaterial.shininess = 0.2;
      globeMaterial.transparent = true;
      globeMaterial.opacity = 0.7;

      // Start from provided position
      Globe.rotation.x = startXRef.current;
      Globe.rotation.y = startYRef.current;

      // Store ref for live updates
      globeRef.current = Globe;

      // Add beacons using three-globe's custom layer
      const beaconLocations = [
        { lat: -33.45, lng: -70.65, name: 'Santiago' }, // Santiago, Chile
        { lat: -34.6, lng: -58.38, name: 'Buenos Aires' }, // Buenos Aires, Argentina
        { lat: 4.71, lng: -74.07, name: 'Bogotá' }, // Bogotá, Colombia
        { lat: 10.48, lng: -66.9, name: 'Caracas' }, // Caracas, Venezuela
        { lat: 19.43, lng: -99.13, name: 'CDMX' }, // Mexico City, Mexico
      ];

      Globe.customLayerData(beaconLocations)
        .customThreeObject(() => {
          const group = new Group();
          const beaconHeight = 30;

          // Core beam (bright center)
          const coreGeometry = new CylinderGeometry(0.4, 0.4, beaconHeight, 8);
          const coreMaterial = new MeshBasicMaterial({
            color: new Color('#ffffff'),
            transparent: true,
            opacity: 0.9,
          });
          const core = new Mesh(coreGeometry, coreMaterial);
          core.position.y = beaconHeight / 2;
          group.add(core);

          // Inner glow
          const innerGlowGeometry = new CylinderGeometry(1, 1, beaconHeight, 8);
          const innerGlowMaterial = new MeshBasicMaterial({
            color: new Color('#e4ff00'),
            transparent: true,
            opacity: 0.4,
            blending: AdditiveBlending,
          });
          const innerGlow = new Mesh(innerGlowGeometry, innerGlowMaterial);
          innerGlow.position.y = beaconHeight / 2;
          group.add(innerGlow);

          // Outer glow
          const outerGlowGeometry = new CylinderGeometry(2, 2, beaconHeight, 8);
          const outerGlowMaterial = new MeshBasicMaterial({
            color: new Color('#e4ff00'),
            transparent: true,
            opacity: 0.15,
            blending: AdditiveBlending,
          });
          const outerGlow = new Mesh(outerGlowGeometry, outerGlowMaterial);
          outerGlow.position.y = beaconHeight / 2;
          group.add(outerGlow);

          return group;
        })
        .customThreeObjectUpdate((obj: Object3D, d: object) => {
          const data = d as { lat: number; lng: number };
          const coords = Globe.getCoords(data.lat, data.lng, 0);
          obj.position.set(coords.x, coords.y, coords.z);

          // Orient to point outward from globe center
          const direction = new Vector3(
            coords.x,
            coords.y,
            coords.z,
          ).normalize();
          obj.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        });

      scene.add(Globe);

      // Immediately pause the globe if not visible (before any animation starts)
      if (!isVisibleRef.current && typeof Globe.pauseAnimation === 'function') {
        // Use setTimeout to ensure pause happens after globe is fully initialized
        setTimeout(() => {
          Globe.pauseAnimation();
        }, 0);
      }

      const updateSize = () => {
        if (!container) return;
        const { clientWidth, clientHeight } = container;
        if (!clientWidth || !clientHeight) return;
        camera.aspect = clientWidth / clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
        renderer.render(scene, camera);
      };

      if (!visibilityInitializedRef.current) {
        const initiallyVisible = getIsVisible();
        isVisibleRef.current = initiallyVisible;
        wasVisibleRef.current = initiallyVisible;
        visibilityInitializedRef.current = true;
      }

      renderer.render(scene, camera);

      // Rotation with hover fade - fixed framerate (60fps baseline)
      let currentSpeed = rotationSpeed;
      const lerpFactor = 0.12;
      const targetFps = 60;
      const targetFrameTime = 1000 / targetFps;
      let lastTime = performance.now();

      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTime;
        if (deltaTime < targetFrameTime) {
          frameIdRef.current = requestAnimationFrame(animate);
          return;
        }
        lastTime = currentTime;

        // Normalize to 60fps - multiply by how many 60fps frames worth of time passed
        const frameMultiplier = deltaTime / targetFrameTime;

        // Lerp current speed towards target for smooth fade
        currentSpeed +=
          (targetSpeedRef.current - currentSpeed) *
          lerpFactor *
          frameMultiplier;
        Globe.rotation.x += currentSpeed * frameMultiplier;

        renderer.render(scene, camera);
        const isIdle =
          Math.abs(currentSpeed) < 0.00001 &&
          Math.abs(targetSpeedRef.current) < 0.00001;
        if (isIdle) {
          frameIdRef.current = null;
          return;
        }
        frameIdRef.current = requestAnimationFrame(animate);
      };

      const startAnimation = () => {
        if (frameIdRef.current === null) {
          lastTime = performance.now();
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
          // Try calling it multiple times to ensure it sticks
          (Globe as any).pauseAnimation();
          (Globe as any).pauseAnimation();
        }
      };

      window.addEventListener('resize', updateSize);
      updateSize();
      const resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(container);

      // Trigger entrance animation after a brief delay
      const loadTimeout = setTimeout(() => setIsLoaded(true), 100);

      // Start animation only if visible
      if (isVisibleRef.current) {
        startAnimation();
      }
      // Note: If not visible, globe is already paused above

      cleanup = () => {
        clearTimeout(loadTimeout);
        window.removeEventListener('resize', updateSize);
        resizeObserver.disconnect();
        stopAnimation();
        renderer.dispose();
        container.removeChild(renderer.domElement);
      };

      // Store animation controls
      animationControlsRef.current = { stopAnimation, startAnimation };

      // Check visibility immediately after setting controls
      // (in case Intersection Observer already fired while controls were null)
      if (!isVisibleRef.current) {
        stopAnimation();
      } else {
        startAnimation();
      }
    };

    init();

    return () => {
      cleanup?.();
      animationControlsRef.current = null;
    };
  }, [rotationSpeed]);

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-1000 ease-out ${
        isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    />
  );
}
