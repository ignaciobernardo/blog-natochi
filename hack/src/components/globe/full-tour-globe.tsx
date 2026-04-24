'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  Quaternion,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three';
import type ThreeGlobeType from 'three-globe';
import countries from '@/public/assets/globe/globe-data-min.json';

type Marker = {
  lat: number;
  lng: number;
  name: string;
};

interface FullTourGlobeProps {
  className?: string;
  rotationSpeed?: number;
  markers?: Marker[];
  activeMarkerName?: string | null;
  cameraFov?: number;
  mobileCameraFov?: number;
  cameraDistance?: number;
  mobileCameraDistance?: number;
  globeOpacity?: number;
  hexOpacity?: number;
  atmosphereOpacity?: number;
  canvasOpacity?: number;
}

const defaultMarkers: Marker[] = [
  { lat: -34.6, lng: -58.38, name: 'Buenos Aires' },
  { lat: 19.43, lng: -99.13, name: 'Ciudad de México' },
  { lat: 4.71, lng: -74.07, name: 'Bogotá' },
  { lat: 10.48, lng: -66.9, name: 'Caracas' },
  { lat: -33.45, lng: -70.65, name: 'Santiago' },
];
const DEFAULT_CAMERA_POSITION = new Vector3(0, 0, 315);
const GLOBE_CENTER = new Vector3(0, 0, 0);
const GLOBE_FRONT = new Vector3(0, 0, 1);
const WORLD_UP = new Vector3(0, 1, 0);

export default function FullTourGlobe({
  className,
  rotationSpeed = 0.0018,
  markers = defaultMarkers,
  activeMarkerName = null,
  cameraFov = 45,
  mobileCameraFov = 56,
  cameraDistance = 315,
  mobileCameraDistance = 240,
  globeOpacity = 0.45,
  hexOpacity = 0.75,
  atmosphereOpacity = 0.5,
  canvasOpacity = 1,
}: FullTourGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ThreeGlobeType | null>(null);
  const targetQuaternionRef = useRef<Quaternion | null>(null);
  const isGlobeAnimatingRef = useRef(false);
  const freezeRotationRef = useRef(false);
  const activeMarkerRef = useRef<string | null>(activeMarkerName);
  const [isLoaded, setIsLoaded] = useState(false);

  const focusMarker = useCallback(
    (markerName: string | null) => {
      const globe = globeRef.current;

      if (!globe) return;

      if (!markerName) {
        targetQuaternionRef.current = null;
        isGlobeAnimatingRef.current = false;
        freezeRotationRef.current = false;
        return;
      }

      const marker = markers.find((item) => item.name === markerName);
      if (!marker) return;

      const markerCoords = globe.getCoords(marker.lat, marker.lng, 0);
      const markerWorldPosition = new Vector3(
        markerCoords.x,
        markerCoords.y,
        markerCoords.z,
      ).normalize();

      const alignQuaternion = new Quaternion().setFromUnitVectors(
        markerWorldPosition,
        GLOBE_FRONT,
      );

      // Keep the globe upright (no visible roll) while centering the marker.
      const rotatedUp = WORLD_UP.clone().applyQuaternion(alignQuaternion);
      const rollCorrectionAngle = Math.atan2(rotatedUp.x, rotatedUp.y);
      const rollCorrectionQuaternion = new Quaternion().setFromAxisAngle(
        GLOBE_FRONT,
        rollCorrectionAngle,
      );

      targetQuaternionRef.current =
        rollCorrectionQuaternion.multiply(alignQuaternion);
      isGlobeAnimatingRef.current = true;
      freezeRotationRef.current = true;
    },
    [markers],
  );

  useEffect(() => {
    activeMarkerRef.current = activeMarkerName;
    focusMarker(activeMarkerName);
  }, [activeMarkerName, focusMarker]);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoaded(false);
    const container = containerRef.current;
    let isDisposed = false;
    let frameId: number | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let renderer: WebGLRenderer | null = null;
    let updateSize: (() => void) | null = null;

    const init = async () => {
      const ThreeGlobe = (await import('three-globe')).default;
      if (isDisposed) return;
      const normalizedCanvasOpacity = Math.max(0, Math.min(canvasOpacity, 1));

      container.querySelectorAll('canvas').forEach((canvas) => canvas.remove());

      renderer = new WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(1);
      renderer.setSize(container.clientWidth || 1, container.clientHeight || 1);
      renderer.setClearColor(0x000000, 0);
      container.appendChild(renderer.domElement);
      renderer.domElement.style.opacity = normalizedCanvasOpacity.toString();

      const scene = new Scene();
      scene.add(new AmbientLight(0xffffff, 1.3));

      const camera = new PerspectiveCamera(
        cameraFov,
        (container.clientWidth || 1) / (container.clientHeight || 1),
        1,
        2000,
      );
      camera.position.copy(DEFAULT_CAMERA_POSITION);

      const dLight = new DirectionalLight(0xffffff, 1.15);
      dLight.position.set(-350, 350, 350);
      camera.add(dLight);

      const dLight2 = new DirectionalLight(0xffffff, 0.55);
      dLight2.position.set(350, -200, -350);
      camera.add(dLight2);

      scene.add(camera);

      const normalizedGlobeOpacity = Math.max(0, Math.min(globeOpacity, 1));
      const normalizedHexOpacity = Math.max(0, Math.min(hexOpacity, 1));
      const normalizedAtmosphereOpacity = Math.max(
        0,
        Math.min(atmosphereOpacity, 1),
      );

      const globe = new ThreeGlobe({
        waitForGlobeReady: false,
        animateIn: false,
      })
        .hexPolygonsData(countries.features)
        .hexPolygonResolution(3)
        .hexPolygonMargin(0.7)
        .showAtmosphere(true)
        .atmosphereColor(
          `rgba(228, 255, 0, ${normalizedAtmosphereOpacity.toString()})`,
        )
        .atmosphereAltitude(0.2)
        .hexPolygonColor(
          () => `rgba(228, 255, 0, ${normalizedHexOpacity.toString()})`,
        );

      const globeMaterial = globe.globeMaterial() as MeshPhongMaterial;
      globeMaterial.color = new Color(0x121212);
      globeMaterial.emissive = new Color(0x000000);
      globeMaterial.emissiveIntensity = 0;
      globeMaterial.shininess = 0.2;
      globeMaterial.transparent = normalizedGlobeOpacity < 1;
      globeMaterial.opacity = normalizedGlobeOpacity;

      globe
        .customLayerData(markers)
        .customThreeObject(() => {
          const group = new Group();
          const beaconHeight = 25;

          const coreGeometry = new CylinderGeometry(
            0.45,
            0.45,
            beaconHeight,
            8,
          );
          const coreMaterial = new MeshBasicMaterial({
            color: new Color('#ffffff'),
            transparent: true,
            opacity: 0.9,
          });
          const core = new Mesh(coreGeometry, coreMaterial);
          core.position.y = beaconHeight / 2;
          group.add(core);

          const glowGeometry = new CylinderGeometry(1.8, 1.8, beaconHeight, 8);
          const glowMaterial = new MeshBasicMaterial({
            color: new Color('#e4ff00'),
            transparent: true,
            opacity: 0.24,
            blending: AdditiveBlending,
          });
          const glow = new Mesh(glowGeometry, glowMaterial);
          glow.position.y = beaconHeight / 2;
          group.add(glow);

          return group;
        })
        .customThreeObjectUpdate((obj: Object3D, markerData: object) => {
          const point = markerData as Marker;
          const coords = globe.getCoords(point.lat, point.lng, 0);
          obj.position.set(coords.x, coords.y, coords.z);
          const direction = new Vector3(
            coords.x,
            coords.y,
            coords.z,
          ).normalize();
          obj.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        });

      scene.add(globe);
      globeRef.current = globe;

      updateSize = () => {
        const { clientWidth, clientHeight } = container;
        if (!clientWidth || !clientHeight || !renderer) return;
        const isMobileViewport = clientWidth < 768;
        const responsiveCameraDistance = isMobileViewport
          ? mobileCameraDistance
          : cameraDistance;
        camera.fov = isMobileViewport ? mobileCameraFov : cameraFov;
        camera.aspect = clientWidth / clientHeight;
        camera.position.set(0, 0, responsiveCameraDistance);
        camera.updateProjectionMatrix();
        renderer.setSize(clientWidth, clientHeight);
      };

      const animate = () => {
        if (isDisposed || !renderer) return;

        if (targetQuaternionRef.current && isGlobeAnimatingRef.current) {
          globe.quaternion.slerp(targetQuaternionRef.current, 0.08);
          if (globe.quaternion.angleTo(targetQuaternionRef.current) < 0.002) {
            globe.quaternion.copy(targetQuaternionRef.current);
            isGlobeAnimatingRef.current = false;
          }
        }

        if (!freezeRotationRef.current) {
          globe.rotation.y += rotationSpeed;
        }

        camera.lookAt(GLOBE_CENTER);
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(container);
      window.addEventListener('resize', updateSize);
      updateSize();
      focusMarker(activeMarkerRef.current);
      setIsLoaded(true);
      animate();
    };

    init();

    return () => {
      isDisposed = true;
      if (frameId !== null) {
        cancelAnimationFrame(frameId);
      }
      if (updateSize) {
        window.removeEventListener('resize', updateSize);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
      globeRef.current = null;
      targetQuaternionRef.current = null;
      isGlobeAnimatingRef.current = false;
      freezeRotationRef.current = false;
    };
  }, [
    atmosphereOpacity,
    canvasOpacity,
    cameraFov,
    focusMarker,
    globeOpacity,
    hexOpacity,
    cameraDistance,
    markers,
    mobileCameraFov,
    mobileCameraDistance,
    rotationSpeed,
  ]);

  return (
    <div
      ref={containerRef}
      className={`transition-opacity duration-700 ease-out motion-reduce:transition-none ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className ?? ''}`}
    />
  );
}
