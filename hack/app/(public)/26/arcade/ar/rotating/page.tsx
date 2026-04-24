'use client';

import { useRef } from 'react';
import { ArcadeShowcase } from '@/app/(public)/26-ar/_components/arcade-showcase';

// ── Orbit constants (match the intro page's start position so the
//    camera looks familiar at the front of each circle) ──────────────────────
const ORBIT_RADIUS = 13;
const ORBIT_Y = 8;
const ORBIT_CENTER: [number, number, number] = [0, 4, 0];
const ORBIT_FOV = 48;
const ORBIT_DURATION_S = 7.2; // faster overall shot, with the close-up folded into the same motion

// ── Zoom-in constants (same close-up as the OG page) ───────────────────────
const CLOSE_POS: [number, number, number] = [0.2, 4.8, 11.5];
const CLOSE_TARGET: [number, number, number] = [0.1, 4.0, 0.3];
const CLOSE_FOV = 17;
const CLOSE_RADIUS = CLOSE_POS[2] - CLOSE_TARGET[2];
const CLOSE_X_OFFSET = CLOSE_POS[0] - CLOSE_TARGET[0];
const ZOOM_START_AT = 0.5;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

function arcadeCameraAnim(elapsed: number): {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
} {
  const orbitT = Math.max(0, Math.min(1, elapsed / ORBIT_DURATION_S));
  const spinT = easeOutCubic(orbitT);
  const zoomT = Math.max(
    0,
    Math.min(1, (orbitT - ZOOM_START_AT) / (1 - ZOOM_START_AT)),
  );
  const zoomEased = easeInOutCubic(zoomT);
  const angle = spinT * 4 * Math.PI; // 2 full circles with a softer settle at the end

  const target: [number, number, number] = [
    lerp(ORBIT_CENTER[0], CLOSE_TARGET[0], zoomEased),
    lerp(ORBIT_CENTER[1], CLOSE_TARGET[1], zoomEased),
    lerp(ORBIT_CENTER[2], CLOSE_TARGET[2], zoomEased),
  ];

  const radius = lerp(ORBIT_RADIUS, CLOSE_RADIUS, zoomEased);
  const y = lerp(ORBIT_Y, CLOSE_POS[1], zoomEased);
  const xOffset = lerp(0, CLOSE_X_OFFSET, zoomEased);

  return {
    pos: [
      target[0] + Math.sin(angle) * radius + xOffset,
      y,
      target[2] + Math.cos(angle) * radius,
    ],
    target,
    fov: lerp(ORBIT_FOV, CLOSE_FOV, zoomEased),
  };
}

export default function ArcadeRotatingPage() {
  const scrollProgressRef = useRef(0);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-black">
      <div
        style={{
          width: 1200,
          height: 630,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background:
            'radial-gradient(ellipse at 60% 40%, #2a2a2a 0%, #111111 45%, #000000 100%)',
          outline: '2px solid red',
        }}
      >
        <ArcadeShowcase
          scrollProgressRef={scrollProgressRef}
          iframeSrc="/26/arcade/ar/og/screen"
          cameraAnimFn={arcadeCameraAnim}
          showOrbitEnvironment
        />
      </div>
    </div>
  );
}
