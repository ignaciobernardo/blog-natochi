'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDeploymentRefresh } from '@/src/hooks/use-deployment-refresh';
import type { ArcadeGameFlat } from '@/src/queries/arcade-games';

type GameWithRank = ArcadeGameFlat & {
  rank: number | 'honorable' | null;
  isParticipant: boolean;
};

interface ArcadeMachineProps {
  games: GameWithRank[];
}

const GRID_COLS = 5;

function getRankBadge(rank: number | 'honorable' | null) {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  if (rank === 'honorable') return '⭐';
  return null;
}

function getRankLabel(rank: number | 'honorable' | null) {
  if (rank === 1) return '1st Place';
  if (rank === 2) return '2nd Place';
  if (rank === 3) return '3rd Place';
  if (rank === 'honorable') return 'Honorable Mention';
  return null;
}

function createClickSound() {
  const audioContext = new (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext
  )();

  return () => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.05,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
  };
}

// Virtual gamepad state from keyboard input
interface VirtualGamepad {
  buttons: boolean[];
  axes: number[];
}

// P1: WASD + UIOJKL + 1 (start)
// P2: Arrows + RTYFGH + 2 (start)
const KEY_MAP_P1: Record<
  string,
  { type: 'button' | 'axis'; index: number; value?: number }
> = {
  // Joystick
  w: { type: 'axis', index: 1, value: -1 },
  s: { type: 'axis', index: 1, value: 1 },
  a: { type: 'axis', index: 0, value: -1 },
  d: { type: 'axis', index: 0, value: 1 },
  // Buttons: A=0, B=1, X=2, Y=3, LB=4, RB=5, LT=6, RT=7, Select=8, Start=9
  u: { type: 'button', index: 0 }, // A
  i: { type: 'button', index: 1 }, // B
  o: { type: 'button', index: 2 }, // X (using as C)
  j: { type: 'button', index: 3 }, // Y (using as X)
  k: { type: 'button', index: 4 }, // LB (using as Y)
  l: { type: 'button', index: 5 }, // RB (using as Z)
  '1': { type: 'button', index: 9 }, // Start
};

const KEY_MAP_P2: Record<
  string,
  { type: 'button' | 'axis'; index: number; value?: number }
> = {
  // Joystick (arrows) - same axes as P1 since each player has own gamepad
  arrowup: { type: 'axis', index: 1, value: -1 },
  arrowdown: { type: 'axis', index: 1, value: 1 },
  arrowleft: { type: 'axis', index: 0, value: -1 },
  arrowright: { type: 'axis', index: 0, value: 1 },
  // Buttons
  r: { type: 'button', index: 0 }, // A
  t: { type: 'button', index: 1 }, // B
  y: { type: 'button', index: 2 }, // X (using as C)
  f: { type: 'button', index: 3 }, // Y (using as X)
  g: { type: 'button', index: 4 }, // LB (using as Y)
  h: { type: 'button', index: 5 }, // RB (using as Z)
  '2': { type: 'button', index: 9 }, // Start
};

function createVirtualGamepads() {
  const gamepads: [VirtualGamepad, VirtualGamepad] = [
    { buttons: Array(17).fill(false), axes: [0, 0, 0, 0] },
    { buttons: Array(17).fill(false), axes: [0, 0, 0, 0] },
  ];

  const handleKey = (e: KeyboardEvent, pressed: boolean) => {
    const key = e.key.toLowerCase();

    // Check P1 mapping
    const p1Map = KEY_MAP_P1[key];
    if (p1Map) {
      e.preventDefault();
      if (p1Map.type === 'button') {
        gamepads[0].buttons[p1Map.index] = pressed;
      } else if (p1Map.type === 'axis') {
        gamepads[0].axes[p1Map.index] = pressed ? (p1Map.value ?? 0) : 0;
      }
      return;
    }

    // Check P2 mapping
    const p2Map = KEY_MAP_P2[key];
    if (p2Map) {
      e.preventDefault();
      if (p2Map.type === 'button') {
        gamepads[1].buttons[p2Map.index] = pressed;
      } else if (p2Map.type === 'axis') {
        gamepads[1].axes[p2Map.index] = pressed ? (p2Map.value ?? 0) : 0;
      }
      return;
    }

    // Escape as universal back
    if (key === 'escape') {
      e.preventDefault();
      gamepads[0].buttons[1] = pressed; // B button
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

const STORAGE_KEY = 'arcade-machine-selected-index';

export function ArcadeMachine({ games }: ArcadeMachineProps) {
  const router = useRouter();
  useDeploymentRefresh(5000);

  const [selectedIndex, setSelectedIndex] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const index = parseInt(stored, 10);
      if (!Number.isNaN(index) && index >= 0 && index < games.length) {
        return index;
      }
    }
    return 0;
  });
  const [showFullDescription, setShowFullDescription] = useState(false);
  const playClickRef = useRef<(() => void) | null>(null);
  const virtualGamepadsRef = useRef<ReturnType<
    typeof createVirtualGamepads
  > | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use refs for callbacks to avoid effect re-running
  const gamesLengthRef = useRef(games.length);
  const selectedGameRef = useRef(games[selectedIndex]);

  gamesLengthRef.current = games.length;
  selectedGameRef.current = games[selectedIndex];

  const selectedGame = games[selectedIndex];
  const MAX_DESCRIPTION_LENGTH = 150;

  // Save selected index to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedIndex.toString());
  }, [selectedIndex]);

  // Calculate which row the selected game is in
  const selectedRow = Math.floor(selectedIndex / GRID_COLS);
  const _totalRows = Math.ceil(games.length / GRID_COLS);

  useEffect(() => {
    playClickRef.current = createClickSound();
    virtualGamepadsRef.current = createVirtualGamepads();

    return () => {
      virtualGamepadsRef.current?.cleanup();
    };
  }, []);

  const playClickSound = useCallback(() => {
    playClickRef.current?.();
  }, []);

  // Stable callbacks that read from refs
  const navigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      setSelectedIndex((prev) => {
        let newIndex = prev;
        const row = Math.floor(prev / GRID_COLS);
        const col = prev % GRID_COLS;
        const totalRows = Math.ceil(gamesLengthRef.current / GRID_COLS);

        switch (direction) {
          case 'up':
            if (row > 0) {
              newIndex = prev - GRID_COLS;
            }
            break;
          case 'down':
            if (row < totalRows - 1) {
              const nextIndex = prev + GRID_COLS;
              if (nextIndex < gamesLengthRef.current) {
                newIndex = nextIndex;
              }
            }
            break;
          case 'left':
            if (col > 0) {
              newIndex = prev - 1;
            }
            break;
          case 'right':
            if (col < GRID_COLS - 1 && prev + 1 < gamesLengthRef.current) {
              newIndex = prev + 1;
            }
            break;
        }

        if (newIndex !== prev) {
          playClickRef.current?.();
          setShowFullDescription(false);
        }
        return newIndex;
      });
    },
    [],
  );

  const toggleDescription = useCallback(() => {
    setShowFullDescription((prev) => !prev);
  }, []);

  const handleSelect = useCallback(() => {
    if (selectedGameRef.current) {
      router.push(`/25/arcade/machine/${selectedGameRef.current.slug}`);
    }
  }, [router]);

  useEffect(() => {
    let animationId: number;
    const lastButtons: [boolean[], boolean[]] = [
      Array(17).fill(false),
      Array(17).fill(false),
    ];
    const lastAxes: [boolean[], boolean[]] = [
      [false, false, false, false],
      [false, false, false, false],
    ];
    const DEADZONE = 0.5;

    const pollGamepad = () => {
      // Get real gamepads
      const realGamepads = navigator.getGamepads();
      // Get virtual gamepads from keyboard
      const virtualGamepads = virtualGamepadsRef.current?.getGamepads() ?? [];

      // Process both P1 and P2
      for (let playerIndex = 0; playerIndex < 2; playerIndex++) {
        const realGp = realGamepads[playerIndex];
        const virtualGp = virtualGamepads[playerIndex];

        // Merge real and virtual gamepad state
        const buttons: boolean[] = Array(17).fill(false);
        const axes: number[] = [0, 0, 0, 0];

        // Apply real gamepad if present
        if (realGp) {
          for (let i = 0; i < realGp.buttons.length; i++) {
            buttons[i] = buttons[i] || realGp.buttons[i].pressed;
          }
          for (let i = 0; i < realGp.axes.length; i++) {
            if (Math.abs(realGp.axes[i]) > Math.abs(axes[i])) {
              axes[i] = realGp.axes[i];
            }
          }
        }

        // Apply virtual gamepad
        if (virtualGp) {
          for (let i = 0; i < virtualGp.buttons.length; i++) {
            buttons[i] = buttons[i] || virtualGp.buttons[i];
          }
          for (let i = 0; i < virtualGp.axes.length; i++) {
            if (Math.abs(virtualGp.axes[i]) > Math.abs(axes[i])) {
              axes[i] = virtualGp.axes[i];
            }
          }
        }

        // Check for button press (transition from not pressed to pressed)
        const wasPressed = (index: number) =>
          buttons[index] && !lastButtons[playerIndex][index];

        // Convert axes to directional states
        const axisStates: [boolean, boolean, boolean, boolean] = [
          axes[1] < -DEADZONE, // up
          axes[1] > DEADZONE, // down
          axes[0] < -DEADZONE, // left
          axes[0] > DEADZONE, // right
        ];

        // Check for axis activation (transition from not active to active)
        const axisPressed = (index: number) =>
          axisStates[index] && !lastAxes[playerIndex][index];

        // Navigation (both players can navigate menu)
        if (wasPressed(12) || axisPressed(0)) navigate('up');
        if (wasPressed(13) || axisPressed(1)) navigate('down');
        if (wasPressed(14) || axisPressed(2)) navigate('left');
        if (wasPressed(15) || axisPressed(3)) navigate('right');

        // A button = Select
        if (wasPressed(0)) handleSelect();

        // Start button = Select
        if (wasPressed(9)) handleSelect();

        // B button = Toggle description
        if (wasPressed(1)) {
          toggleDescription();
        }

        // Update last state - must copy arrays
        lastButtons[playerIndex] = [...buttons];
        lastAxes[playerIndex] = [...axisStates];
      }

      animationId = requestAnimationFrame(pollGamepad);
    };

    animationId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animationId);
  }, [navigate, handleSelect, toggleDescription]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div
        ref={containerRef}
        className="relative h-[768px] w-[1366px] overflow-hidden bg-background"
        style={{
          boxShadow:
            'inset 0 0 0 4px hsl(var(--primary)), 0 0 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="flex h-full">
          <div className="flex flex-1 flex-col p-6">
            <div className="mb-6">
              <h1 className="font-bold font-title text-2xl text-primary">
                <span className="text-primary">platanus hack</span>{' '}
                <span className="bg-primary px-2 py-1 text-background">
                  arcade challenge
                </span>
              </h1>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div
                className="grid auto-rows-min grid-cols-5 gap-4 p-2 transition-transform duration-300 ease-out"
                style={{
                  transform: `translateY(-${Math.max(0, selectedRow - 1) * 140}px)`,
                }}
              >
                {games.map((game, index) => {
                  const isSelected = index === selectedIndex;
                  const badge = getRankBadge(game.rank);

                  return (
                    <button
                      key={game.id}
                      type="button"
                      onClick={() => {
                        setSelectedIndex(index);
                        playClickSound();
                      }}
                      onDoubleClick={handleSelect}
                      className={`relative aspect-[4/3] overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'animate-pulse-zoom border-primary bg-primary/10 shadow-[0_0_20px_hsl(var(--primary)/0.5)]'
                          : 'border-primary/30 bg-background hover:border-primary/60'
                      }`}
                    >
                      {badge && (
                        <div className="absolute top-1 left-1 z-10 text-lg">
                          {badge}
                        </div>
                      )}

                      <div className="absolute inset-0 overflow-hidden bg-primary/10">
                        {game.coverUrl ? (
                          <Image
                            src={game.coverUrl}
                            alt={game.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="px-1 text-center font-bold font-title text-primary text-xs">
                              {game.title}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <h3 className="truncate font-bold font-title text-white text-xs">
                          {game.title}
                        </h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-6 border-primary/30 border-t pt-4 font-mono text-primary/60 text-xs">
              <span>A/START: Play</span>
              <span>B: Description</span>
            </div>
          </div>

          <div className="flex min-h-0 w-80 flex-col border-primary border-l-4 bg-background">
            {selectedGame && (
              <>
                <div className="shrink-0 border-primary border-b-2 p-4">
                  <h2 className="font-bold font-title text-primary text-xl">
                    {selectedGame.title}
                  </h2>
                  {selectedGame.rank && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-lg">
                        {getRankBadge(selectedGame.rank)}
                      </span>
                      <span className="font-title text-primary/80 text-sm">
                        {getRankLabel(selectedGame.rank)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {selectedGame.coverUrl && (
                      <div className="relative aspect-[4/3] w-full overflow-hidden border-2 border-primary">
                        <Image
                          src={selectedGame.coverUrl}
                          alt={selectedGame.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div>
                      <h3 className="mb-1 font-semibold text-primary text-sm">
                        Author
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm">{selectedGame.githubUsername}</p>
                        {selectedGame.isParticipant && (
                          <span className="rounded bg-primary/20 px-1.5 py-0.5 font-mono text-primary text-xs">
                            Hack Participant
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedGame.description && (
                      <div>
                        <h3 className="mb-1 font-semibold text-primary text-sm">
                          Description
                        </h3>
                        <p className="text-sm leading-relaxed">
                          {showFullDescription ||
                          selectedGame.description.length <=
                            MAX_DESCRIPTION_LENGTH
                            ? selectedGame.description
                            : `${selectedGame.description.slice(0, MAX_DESCRIPTION_LENGTH)}...`}
                        </p>
                        {selectedGame.description.length >
                          MAX_DESCRIPTION_LENGTH && (
                          <button
                            type="button"
                            onClick={toggleDescription}
                            className="mt-2 font-mono text-primary/60 text-xs hover:text-primary"
                          >
                            {showFullDescription
                              ? '[B] Show less'
                              : '[B] Show full description'}
                          </button>
                        )}
                      </div>
                    )}

                    <div>
                      <h3 className="mb-1 font-semibold text-primary text-sm">
                        Code Size
                      </h3>
                      <p className="font-mono text-sm">
                        {(selectedGame.codeMinified.length / 1024).toFixed(2)}{' '}
                        KB
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
