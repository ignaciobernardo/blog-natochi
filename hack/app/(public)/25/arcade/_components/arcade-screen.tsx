'use client';

import { cloneElement, isValidElement, useState } from 'react';
import './arcade-effects.css';
import { BackgroundSnake } from './background-snake';

interface ArcadeScreenProps {
  children: React.ReactNode;
  intensity?: 'low' | 'medium' | 'high';
}

export function ArcadeScreen({
  children,
  intensity = 'medium',
}: ArcadeScreenProps) {
  const flickerClass = intensity === 'high' ? 'crt-flicker' : '';
  const [snakePos, setSnakePos] = useState<
    { x: number; y: number } | undefined
  >(undefined);

  return (
    <div
      className={`crt-screen ${flickerClass} relative flex min-h-screen items-center justify-center overflow-hidden`}
    >
      <BackgroundSnake startPosition={snakePos} />
      <div className="relative z-20 mx-auto max-w-4xl">
        {isValidElement(children)
          ? cloneElement(children, { onBoxPosition: setSnakePos } as any)
          : children}
      </div>
    </div>
  );
}
