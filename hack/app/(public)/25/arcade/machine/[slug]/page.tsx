'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

// Virtual gamepad state from keyboard input
interface VirtualGamepad {
  buttons: boolean[];
  axes: number[];
}

const KEY_MAP_P1: Record<
  string,
  { type: 'button' | 'axis'; index: number; value?: number }
> = {
  w: { type: 'axis', index: 1, value: -1 },
  s: { type: 'axis', index: 1, value: 1 },
  a: { type: 'axis', index: 0, value: -1 },
  d: { type: 'axis', index: 0, value: 1 },
  u: { type: 'button', index: 0 },
  i: { type: 'button', index: 1 },
  o: { type: 'button', index: 2 },
  j: { type: 'button', index: 3 },
  k: { type: 'button', index: 4 },
  l: { type: 'button', index: 5 },
  '1': { type: 'button', index: 6 },
  '8': { type: 'button', index: 7 },
};

const KEY_MAP_P2: Record<
  string,
  { type: 'button' | 'axis'; index: number; value?: number }
> = {
  arrowup: { type: 'axis', index: 1, value: -1 },
  arrowdown: { type: 'axis', index: 1, value: 1 },
  arrowleft: { type: 'axis', index: 0, value: -1 },
  arrowright: { type: 'axis', index: 0, value: 1 },
  r: { type: 'button', index: 0 },
  t: { type: 'button', index: 1 },
  y: { type: 'button', index: 2 },
  f: { type: 'button', index: 3 },
  g: { type: 'button', index: 4 },
  h: { type: 'button', index: 5 },
  '2': { type: 'button', index: 6 },
  '9': { type: 'button', index: 7 },
};

function createVirtualGamepads() {
  const gamepads: [VirtualGamepad, VirtualGamepad] = [
    { buttons: Array(17).fill(false), axes: [0, 0, 0, 0] },
    { buttons: Array(17).fill(false), axes: [0, 0, 0, 0] },
  ];

  const handleKey = (e: KeyboardEvent, pressed: boolean) => {
    const key = e.key.toLowerCase();

    const p1Map = KEY_MAP_P1[key];
    if (p1Map) {
      if (p1Map.type === 'button') {
        gamepads[0].buttons[p1Map.index] = pressed;
      } else if (p1Map.type === 'axis') {
        gamepads[0].axes[p1Map.index] = pressed ? (p1Map.value ?? 0) : 0;
      }
      return;
    }

    const p2Map = KEY_MAP_P2[key];
    if (p2Map) {
      if (p2Map.type === 'button') {
        gamepads[1].buttons[p2Map.index] = pressed;
      } else if (p2Map.type === 'axis') {
        gamepads[1].axes[p2Map.index] = pressed ? (p2Map.value ?? 0) : 0;
      }
      return;
    }

    if (key === 'escape') {
      gamepads[0].buttons[1] = pressed;
    }
  };

  const onKeyDown = (e: KeyboardEvent) => handleKey(e, true);
  const onKeyUp = (e: KeyboardEvent) => handleKey(e, false);

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  return {
    getGamepads: () => gamepads,
    cleanup: () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    },
  };
}

export default function ArcadeMachineGamePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const virtualGamepadsRef = useRef<ReturnType<
    typeof createVirtualGamepads
  > | null>(null);

  const handleBack = useCallback(() => {
    router.push('/25/arcade/machine');
  }, [router]);

  useEffect(() => {
    virtualGamepadsRef.current = createVirtualGamepads();

    // Listen for messages from the game iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'arcade-back') {
        handleBack();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      virtualGamepadsRef.current?.cleanup();
      window.removeEventListener('message', handleMessage);
    };
  }, [handleBack]);

  // Poll for back button (B button or Select)
  useEffect(() => {
    let animationId: number;
    const lastButtons: [boolean[], boolean[]] = [
      Array(17).fill(false),
      Array(17).fill(false),
    ];

    const pollGamepad = () => {
      const realGamepads = navigator.getGamepads();
      const virtualGamepads = virtualGamepadsRef.current?.getGamepads() ?? [];

      for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
        const realGp = realGamepads[playerIndex];
        const virtualGp = virtualGamepads[playerIndex];

        const buttons: boolean[] = Array(17).fill(false);

        if (realGp) {
          for (let i = 0; i < realGp.buttons.length; i++) {
            buttons[i] = buttons[i] || realGp.buttons[i].pressed;
          }
        }

        if (virtualGp) {
          for (let i = 0; i < virtualGp.buttons.length; i++) {
            buttons[i] = buttons[i] || virtualGp.buttons[i];
          }
        }

        const wasPressed = (index: number) =>
          buttons[index] && !lastButtons[playerIndex][index];

        // Coin button (button 7) = Back to menu
        if (wasPressed(7)) {
          handleBack();
        }

        lastButtons[playerIndex] = [...buttons];
      }

      animationId = requestAnimationFrame(pollGamepad);
    };

    animationId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animationId);
  }, [handleBack]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div
        className="relative flex h-[768px] w-[1366px] items-center justify-center overflow-hidden bg-background"
        style={{
          boxShadow:
            'inset 0 0 0 4px hsl(var(--primary)), 0 0 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Game container - 4:3 aspect ratio centered */}
        <div className="relative aspect-[4/3] h-full">
          <iframe
            src={`/25/arcade/machine/${slug}/embed`}
            title="Arcade Game"
            className="h-full w-full"
            sandbox="allow-scripts allow-same-origin"
            loading="eager"
          />
        </div>

        {/* Side panels */}
        <div className="absolute top-0 bottom-0 left-0 w-[calc((100%-1024px)/2)] bg-black" />
        <div className="absolute top-0 right-0 bottom-0 w-[calc((100%-1024px)/2)] bg-black" />
      </div>
    </div>
  );
}
