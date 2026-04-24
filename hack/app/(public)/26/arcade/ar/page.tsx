'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { ArcadeShowcase } from '@/app/(public)/26-ar/_components/arcade-showcase';

const ANIMATION_DELAY_MS = 100;
const ANIMATION_DURATION_S = 1.7;

export default function ArcadeIntroPage() {
  const router = useRouter();
  const progressRef = useRef(0);

  useEffect(() => {
    let rafId: number;

    const timeoutId = setTimeout(() => {
      let startTime: number | null = null;

      const tick = (now: number) => {
        if (startTime === null) startTime = now;
        const elapsed = (now - startTime) / 1000;
        progressRef.current = Math.min(1, elapsed / ANIMATION_DURATION_S);
        if (progressRef.current < 1) {
          rafId = requestAnimationFrame(tick);
        }
      };

      rafId = requestAnimationFrame(tick);
    }, ANIMATION_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      className="relative h-dvh w-full overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at 60% 40%, #2a2a2a 0%, #111111 45%, #000000 100%)',
      }}
    >
      <ArcadeShowcase
        scrollProgressRef={progressRef}
        cameraEasing={(t) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - 2 ** (-6 * t))}
        onStartPress={(player) => {
          if (player === 1)
            window.open(
              'https://github.com/platanus-hack/platanus-hack-26-argentina-arcade/fork',
              '_blank',
            );
          else router.push('/26/arcade');
        }}
      />
    </section>
  );
}
