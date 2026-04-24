'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight,
  Color,
  DirectionalLight,
  Fog,
  type MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import countries from '@/public/assets/globe/globe-data-min.json';

interface GithubGlobeProps {
  className?: string;
}

export default function GithubGlobe({ className }: GithubGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const frameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const ThreeGlobe = (await import('three-globe')).default;

      // Initialize renderer
      const renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Initialize scene
      const scene = new Scene();
      scene.add(new AmbientLight(0xffffff, 1.5)); // Brighter ambient light
      scene.background = new Color(0x333333); // --background: 0 0% 20%

      // Initialize camera
      const camera = new PerspectiveCamera(
        50,
        container.clientWidth / container.clientHeight,
        1,
        2000,
      );
      camera.position.set(-341.5, -112.83, 114.01);

      const dLight = new DirectionalLight(0xffffff, 1.2);
      dLight.position.set(-800, 2000, 400);
      camera.add(dLight);

      const dLight1 = new DirectionalLight(0xffffff, 1);
      dLight1.position.set(200, -500, 400);
      camera.add(dLight1);

      scene.add(camera);
      scene.fog = new Fog(0x333333, 400, 2000);

      // Initialize controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enablePan = false;
      controls.minDistance = 200;
      controls.maxDistance = 500;
      controls.rotateSpeed = 0.8;
      controls.enableZoom = false;
      controls.autoRotate = false; // We'll do custom rotation
      controls.minPolarAngle = Math.PI / 3.5;
      controls.maxPolarAngle = Math.PI - Math.PI / 3;

      // Initialize globe
      const Globe = new ThreeGlobe({
        waitForGlobeReady: false,
        animateIn: false,
      })
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(true)
        .atmosphereColor('#e4ff00') // Primary color
        .atmosphereAltitude(0.12)
        .hexPolygonColor(() => '#e4ff00'); // Primary color - full opacity

      const globeMaterial = Globe.globeMaterial() as MeshPhongMaterial;
      globeMaterial.color = new Color(0x080808); // Very dark for max contrast
      globeMaterial.emissive = new Color(0x000000);
      globeMaterial.emissiveIntensity = 0;
      globeMaterial.shininess = 0.2;

      scene.add(Globe);

      // Chile rotation values (found via debug)
      const chileRotationY = (65 * Math.PI) / 180;
      const chileRotationX = (-24 * Math.PI) / 180;

      // Camera position
      camera.position.set(-341.5, -112.83, 114.01);
      camera.lookAt(0, 0, 0);

      const onWindowResize = () => {
        if (!container) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      };

      // Slow gentle animation
      let angle = 0;
      const orbitSpeed = 0.0003;

      const animate = () => {
        angle += orbitSpeed;

        // Apply Chile rotation with wobble
        Globe.rotation.y = chileRotationY + Math.sin(angle) * 0.1;
        Globe.rotation.x = chileRotationX + Math.sin(angle * 0.7) * 0.07;

        controls.update();
        renderer.render(scene, camera);
        frameIdRef.current = requestAnimationFrame(animate);
      };

      window.addEventListener('resize', onWindowResize);

      onWindowResize();
      animate();

      cleanup = () => {
        window.removeEventListener('resize', onWindowResize);
        if (frameIdRef.current) {
          cancelAnimationFrame(frameIdRef.current);
        }
        renderer.dispose();
        controls.dispose();
        container.removeChild(renderer.domElement);
      };
    };

    init();

    return () => {
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className={className} />;
}
