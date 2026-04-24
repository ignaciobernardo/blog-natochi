'use client';

import { useRef } from 'react';
import { ArcadeShowcase } from '@/app/(public)/26-ar/_components/arcade-showcase';

export default function ArcadeOgPage() {
  const progressRef = useRef(1);

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
            'radial-gradient(ellipse at 60% 40%, #555555 0%, #333333 45%, #1a1a1a 100%)',
          outline: '2px solid red',
        }}
      >
        <ArcadeShowcase
          scrollProgressRef={progressRef}
          iframeSrc="/26/arcade/ar/og/screen"
          cameraEasing={(t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - 2 ** (-6 * t))}
          camEndYOffset={0.15}
        />
      </div>
    </div>
  );
}
