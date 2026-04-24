'use client';

import confetti from 'canvas-confetti';
import { useEffect } from 'react';

export function ContinuousConfetti() {
  useEffect(() => {
    const duration = 1500;
    const animationEnd = Date.now() + duration;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#e0ff00', '#000000', '#ffffff'],
      });

      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#e0ff00', '#000000', '#ffffff'],
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return null;
}
