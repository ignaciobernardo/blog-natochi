'use client';

import { useEffect, useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

const CELL_SIZE = 12;
const INITIAL_SPEED = 100;

interface BackgroundSnakeProps {
  startPosition?: { x: number; y: number };
}

export function BackgroundSnake({ startPosition }: BackgroundSnakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for position to be calculated
    if (!startPosition) {
      console.log('No startPosition yet');
      return;
    }

    console.log('Start position received:', startPosition);
    setIsReady(true);
  }, [startPosition]);

  useEffect(() => {
    if (!isReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const cols = Math.floor(canvas.width / CELL_SIZE);
    const rows = Math.floor(canvas.height / CELL_SIZE);

    // Use provided position
    const initialX = startPosition
      ? Math.floor(startPosition.x / CELL_SIZE)
      : Math.floor(cols / 2);
    const initialY = startPosition
      ? Math.floor(startPosition.y / CELL_SIZE)
      : Math.floor(180 / CELL_SIZE);

    const snake: Position[] = [{ x: initialX, y: initialY }];
    let direction: Position = { x: 1, y: 0 }; // Start moving right
    let nextDirection: Position = { x: 1, y: 0 };
    let bug: Position = {
      x: Math.floor(Math.random() * cols),
      y: Math.floor(Math.random() * rows),
    };
    let currentScore = 0;

    const spawnBug = () => {
      bug = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key === 'arrowup' && direction.y === 0) {
        nextDirection = { x: 0, y: -1 };
        e.preventDefault();
      } else if (key === 'arrowdown' && direction.y === 0) {
        nextDirection = { x: 0, y: 1 };
        e.preventDefault();
      } else if (key === 'arrowleft' && direction.x === 0) {
        nextDirection = { x: -1, y: 0 };
        e.preventDefault();
      } else if (key === 'arrowright' && direction.x === 0) {
        nextDirection = { x: 1, y: 0 };
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    // Get primary color from CSS variable
    const getPrimaryColor = () => {
      const computedStyle = getComputedStyle(canvas);
      const primaryHsl = computedStyle.getPropertyValue('--primary').trim();
      return primaryHsl;
    };

    const gameLoop = setInterval(() => {
      direction = nextDirection;

      const head = snake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      // Wrap around edges
      if (newHead.x < 0) newHead.x = cols - 1;
      if (newHead.x >= cols) newHead.x = 0;
      if (newHead.y < 0) newHead.y = rows - 1;
      if (newHead.y >= rows) newHead.y = 0;

      snake.unshift(newHead);

      // Check if bug is caught
      if (newHead.x === bug.x && newHead.y === bug.y) {
        currentScore++;
        setScore(currentScore);
        spawnBug();
      } else {
        snake.pop();
      }

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const primaryColor = getPrimaryColor();

      // Draw snake
      snake.forEach((segment, index) => {
        const opacity = 1 - index * 0.05;
        ctx.fillStyle = `hsl(${primaryColor} / ${Math.max(opacity, 0.3)})`;
        ctx.fillRect(
          segment.x * CELL_SIZE,
          segment.y * CELL_SIZE,
          CELL_SIZE - 1,
          CELL_SIZE - 1,
        );
      });

      // Draw bug as white square
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        bug.x * CELL_SIZE,
        bug.y * CELL_SIZE,
        CELL_SIZE - 1,
        CELL_SIZE - 1,
      );
    }, INITIAL_SPEED);

    return () => {
      clearInterval(gameLoop);
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [isReady, startPosition]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0"
        style={{ zIndex: 15 }}
      />
      {score > 0 && (
        <div
          className="fixed top-8 left-8 z-20 rounded bg-black/80 px-4 py-2 font-mono text-primary text-sm"
          style={{ textShadow: '0 0 10px currentColor' }}
        >
          Score: {score}
        </div>
      )}
    </>
  );
}
