'use client';

import { Maximize2, Minimize2 } from 'lucide-react';
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { isDevelopmentEnvironment } from '@/src/lib/constants';
import { cn } from '@/src/lib/utils';
import {
  type ArcadeControlCode,
  formatArcadeInputLabel,
  getArcadeMergedMapping,
  getArcadePlayers,
} from '@/src/lib/utils/arcade-controls';
import {
  createArcadeStorageResponseMessage,
  getArcadeStorageNamespaceKey,
  isArcadeStorageJson,
  parseArcadeStorageRequestMessage,
} from '@/src/lib/utils/arcade-storage';

const PLAY_BURST_DURATION_MS = 30_000;
const PLAY_BURST_IDLE_RESET_MS = 5_000;
const TRACKED_INPUT_MESSAGE = 'arcade:approved-input';
const TRACKED_VIRTUAL_INPUT_EVENT = 'arcade:virtual-gamepad-input';
const CONTROL_STATE_MESSAGE = 'arcade:control-state';
const VIRTUAL_CONTROL_MESSAGE = 'arcade:virtual-control';

const HACK_PRIMARY_CHANNELS = '225, 255, 0';
const HACK_PRIMARY_RGB = `rgb(${HACK_PRIMARY_CHANNELS})`;
const withHackPrimaryAlpha = (alpha: number) =>
  `rgba(${HACK_PRIMARY_CHANNELS}, ${alpha})`;
const HACK_PRIMARY_BORDER = withHackPrimaryAlpha(0.34);
const HACK_PRIMARY_BG = withHackPrimaryAlpha(0.1);
const HACK_PRIMARY_BG_ACTIVE = withHackPrimaryAlpha(0.16);
const HACK_PRIMARY_TEXT = withHackPrimaryAlpha(0.92);
const HACK_PRIMARY_TEXT_DIM = withHackPrimaryAlpha(0.74);
const HACK_PRIMARY_SHADOW = `0 0 18px ${withHackPrimaryAlpha(0.18)}`;

type PlayTrackerResponse =
  | {
      success: true;
      playCount: number;
      deduped: boolean;
    }
  | {
      success: false;
      error: string;
    };

type ApprovedInputMessage = {
  type: typeof TRACKED_INPUT_MESSAGE;
  source: 'keyboard' | 'virtual-gamepad';
  control: string;
};

type ControlStateMessage = {
  type: typeof CONTROL_STATE_MESSAGE;
  source: 'keyboard';
  controlCodes: ArcadeControlCode[];
  pressed: boolean;
};

interface GamePlayerProps {
  challengeId: string;
  embedUrl: string;
  title: string;
  gameId: string;
  initialPlayCount: number;
  playerMode: string;
  arcadeMapping: Record<string, string> | null;
}

type JoystickThumbPosition = {
  x: number;
  y: number;
};

const JOYSTICK_THUMB_REST_POSITION: JoystickThumbPosition = { x: 0, y: 0 };

function mergePressedControls(
  keyboardPressedControls: Set<ArcadeControlCode>,
  virtualPressedControls: Set<ArcadeControlCode>,
) {
  return new Set<ArcadeControlCode>([
    ...keyboardPressedControls,
    ...virtualPressedControls,
  ]);
}

function areSetsEqual<T>(left: Set<T>, right: Set<T>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function setControlPressed(
  controls: Set<ArcadeControlCode>,
  controlCode: ArcadeControlCode,
  pressed: boolean,
) {
  if (pressed) {
    controls.add(controlCode);
    return;
  }

  controls.delete(controlCode);
}

export function GamePlayer({
  challengeId,
  embedUrl,
  title,
  gameId,
  initialPlayCount,
  playerMode,
  arcadeMapping,
}: GamePlayerProps) {
  const [_playCount, setPlayCount] = useState(initialPlayCount);
  const [pressedControls, setPressedControls] = useState<
    Set<ArcadeControlCode>
  >(() => new Set());
  const [joystickThumbPositions, setJoystickThumbPositions] = useState<
    Record<number, JoystickThumbPosition>
  >({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasSubmittedRef = useRef(false);
  const burstStartedAtRef = useRef<number | null>(null);
  const lastInteractionAtRef = useRef<number | null>(null);
  const keyboardPressedControlsRef = useRef<Set<ArcadeControlCode>>(new Set());
  const virtualPressedControlsRef = useRef<Set<ArcadeControlCode>>(new Set());

  const mergedMapping = useMemo(
    () => getArcadeMergedMapping(arcadeMapping),
    [arcadeMapping],
  );
  const players = useMemo(() => getArcadePlayers(playerMode), [playerMode]);
  const iframeOrigin = useMemo(() => new URL(embedUrl).origin, [embedUrl]);
  // Sandboxed iframes without allow-same-origin have a null (opaque) origin,
  // so postMessage must use '*' as target — specifying the real origin drops the message.
  const iframePostTarget = isDevelopmentEnvironment ? iframeOrigin : '*';
  const iframeSandbox = isDevelopmentEnvironment
    ? 'allow-scripts allow-same-origin'
    : 'allow-scripts';

  function syncPressedControls() {
    const nextPressedControls = mergePressedControls(
      keyboardPressedControlsRef.current,
      virtualPressedControlsRef.current,
    );

    setPressedControls((currentPressedControls) => {
      return areSetsEqual(currentPressedControls, nextPressedControls)
        ? currentPressedControls
        : nextPressedControls;
    });
  }

  function setVirtualControlState(
    controlCode: ArcadeControlCode,
    pressed: boolean,
  ) {
    const wasPressed = virtualPressedControlsRef.current.has(controlCode);
    if (wasPressed === pressed) {
      return;
    }

    setControlPressed(virtualPressedControlsRef.current, controlCode, pressed);
    syncPressedControls();

    if (pressed) {
      window.dispatchEvent(new CustomEvent(TRACKED_VIRTUAL_INPUT_EVENT));
    }

    iframeRef.current?.contentWindow?.postMessage(
      {
        type: VIRTUAL_CONTROL_MESSAGE,
        controlCode,
        pressed,
      },
      iframePostTarget,
    );

    // Restore focus to the iframe so games don't lose audio when the virtual
    // controller button briefly steals focus from the iframe.
    iframeRef.current?.focus();
  }

  useEffect(() => {
    setPlayCount(initialPlayCount);
  }, [initialPlayCount]);

  useEffect(() => {
    hasSubmittedRef.current = false;
    burstStartedAtRef.current = null;
    lastInteractionAtRef.current = null;
    keyboardPressedControlsRef.current.clear();
    virtualPressedControlsRef.current.clear();
    setPressedControls(new Set());
    setJoystickThumbPositions({});
  }, [gameId, embedUrl]);

  function setJoystickThumbPosition(
    playerId: number,
    position: JoystickThumbPosition,
  ) {
    setJoystickThumbPositions((current) => {
      const previous = current[playerId] ?? JOYSTICK_THUMB_REST_POSITION;
      if (previous.x === position.x && previous.y === position.y) {
        return current;
      }

      return {
        ...current,
        [playerId]: position,
      };
    });
  }

  useEffect(() => {
    let isMounted = true;

    function postStorageResponse(
      response: ReturnType<typeof createArcadeStorageResponseMessage>,
    ) {
      iframeRef.current?.contentWindow?.postMessage(response, iframePostTarget);
    }

    async function submitPlay() {
      hasSubmittedRef.current = true;

      try {
        const response = await fetch('/api/26/arcade/plays', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ gameId }),
        });
        const result = (await response.json()) as PlayTrackerResponse;

        if (!response.ok || !result.success) {
          hasSubmittedRef.current = false;
          return;
        }

        if (isMounted) {
          setPlayCount(result.playCount);
        }
      } catch {
        hasSubmittedRef.current = false;
      }
    }

    function registerApprovedInput() {
      if (hasSubmittedRef.current) {
        return;
      }

      const now = Date.now();
      const lastInteractionAt = lastInteractionAtRef.current;

      if (
        !burstStartedAtRef.current ||
        !lastInteractionAt ||
        now - lastInteractionAt > PLAY_BURST_IDLE_RESET_MS
      ) {
        burstStartedAtRef.current = now;
      }

      lastInteractionAtRef.current = now;
    }

    function handleApprovedInputMessage(
      event: MessageEvent<ApprovedInputMessage>,
    ) {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.type !== TRACKED_INPUT_MESSAGE
      ) {
        return;
      }

      registerApprovedInput();
    }

    function handleControlStateMessage(
      event: MessageEvent<ControlStateMessage>,
    ) {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        event.data?.type !== CONTROL_STATE_MESSAGE
      ) {
        return;
      }

      for (const controlCode of event.data.controlCodes) {
        setControlPressed(
          keyboardPressedControlsRef.current,
          controlCode,
          event.data.pressed,
        );
      }

      syncPressedControls();
    }

    function handleStorageRequestMessage(event: MessageEvent<unknown>) {
      const isAllowedIframeOrigin =
        event.origin === iframeOrigin ||
        (!isDevelopmentEnvironment && event.origin === 'null');

      if (
        event.source !== iframeRef.current?.contentWindow ||
        !isAllowedIframeOrigin
      ) {
        return;
      }

      const request = parseArcadeStorageRequestMessage(event.data);
      if (!request) {
        return;
      }

      const storageKey = getArcadeStorageNamespaceKey({
        challengeId,
        gameId,
        key: request.key,
      });

      try {
        switch (request.method) {
          case 'storage:get': {
            const storedValue = window.localStorage.getItem(storageKey);
            if (storedValue === null) {
              postStorageResponse(
                createArcadeStorageResponseMessage({
                  type: 'arcade:storage-response',
                  requestId: request.requestId,
                  method: request.method,
                  ok: true,
                  found: false,
                }),
              );
              return;
            }

            postStorageResponse(
              createArcadeStorageResponseMessage({
                type: 'arcade:storage-response',
                requestId: request.requestId,
                method: request.method,
                ok: true,
                found: true,
                value: (() => {
                  const parsedValue = JSON.parse(storedValue);
                  if (!isArcadeStorageJson(parsedValue)) {
                    throw new Error('Stored value is not valid JSON');
                  }

                  return parsedValue;
                })(),
              }),
            );
            return;
          }
          case 'storage:set': {
            window.localStorage.setItem(
              storageKey,
              JSON.stringify(request.value),
            );
            postStorageResponse(
              createArcadeStorageResponseMessage({
                type: 'arcade:storage-response',
                requestId: request.requestId,
                method: request.method,
                ok: true,
              }),
            );
            return;
          }
          case 'storage:remove': {
            window.localStorage.removeItem(storageKey);
            postStorageResponse(
              createArcadeStorageResponseMessage({
                type: 'arcade:storage-response',
                requestId: request.requestId,
                method: request.method,
                ok: true,
              }),
            );
          }
        }
      } catch {
        postStorageResponse(
          createArcadeStorageResponseMessage({
            type: 'arcade:storage-response',
            requestId: request.requestId,
            method: request.method,
            ok: false,
            error: 'storage-unavailable',
          }),
        );
      }
    }

    function tickBurstTimer() {
      if (hasSubmittedRef.current) {
        return;
      }

      const burstStartedAt = burstStartedAtRef.current;
      const lastInteractionAt = lastInteractionAtRef.current;

      if (!burstStartedAt || !lastInteractionAt) {
        return;
      }

      const now = Date.now();

      if (now - lastInteractionAt > PLAY_BURST_IDLE_RESET_MS) {
        burstStartedAtRef.current = null;
        lastInteractionAtRef.current = null;
        return;
      }

      if (now - burstStartedAt >= PLAY_BURST_DURATION_MS) {
        void submitPlay();
      }
    }

    function handleVirtualGamepadInput() {
      registerApprovedInput();
    }

    function releaseAllVirtualControls() {
      if (virtualPressedControlsRef.current.size === 0) {
        return;
      }

      for (const controlCode of Array.from(virtualPressedControlsRef.current)) {
        setVirtualControlState(controlCode, false);
      }
    }

    window.addEventListener('message', handleApprovedInputMessage);
    window.addEventListener('message', handleControlStateMessage);
    window.addEventListener('message', handleStorageRequestMessage);
    window.addEventListener(
      TRACKED_VIRTUAL_INPUT_EVENT,
      handleVirtualGamepadInput,
    );
    window.addEventListener('pointerup', releaseAllVirtualControls);
    window.addEventListener('blur', releaseAllVirtualControls);
    const timerId = window.setInterval(tickBurstTimer, 1000);

    return () => {
      isMounted = false;
      window.removeEventListener('message', handleApprovedInputMessage);
      window.removeEventListener('message', handleControlStateMessage);
      window.removeEventListener('message', handleStorageRequestMessage);
      window.removeEventListener(
        TRACKED_VIRTUAL_INPUT_EVENT,
        handleVirtualGamepadInput,
      );
      window.removeEventListener('pointerup', releaseAllVirtualControls);
      window.removeEventListener('blur', releaseAllVirtualControls);
      window.clearInterval(timerId);
    };
  }, [challengeId, gameId, iframeOrigin]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenScale, setFullscreenScale] = useState(1);

  useEffect(() => {
    if (!isFullscreen) {
      return;
    }

    function computeScale() {
      const pad = 32;
      const scaleX = (window.innerWidth - pad) / 800;
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      const scaleY = (viewportHeight - pad) / 600;
      setFullscreenScale(Math.min(scaleX, scaleY));
    }

    computeScale();
    window.addEventListener('resize', computeScale);
    window.visualViewport?.addEventListener('resize', computeScale);

    return () => {
      window.removeEventListener('resize', computeScale);
      window.visualViewport?.removeEventListener('resize', computeScale);
    };
  }, [isFullscreen]);

  useEffect(() => {
    requestAnimationFrame(() => {
      iframeRef.current?.focus();
    });
  }, [isFullscreen]);

  const isTwoPlayer = players.length === 2;
  const player1 = players[0];
  const player2 = isTwoPlayer ? players[1] : undefined;

  function renderControllerPanel(player: (typeof players)[number]) {
    const directionByLabel: Record<string, (typeof player.controls)[number]> =
      {};
    const actionControls: typeof player.controls = [];
    const systemControls: typeof player.controls = [];

    for (const control of player.controls) {
      if (control.kind === 'direction') {
        directionByLabel[control.label] = control;
      } else if (control.kind === 'action') {
        actionControls.push(control);
      } else if (control.kind === 'system') {
        systemControls.push(control);
      }
    }

    const directionLayout: Array<{
      label: 'Up' | 'Left' | 'Right' | 'Down';
      short: string;
      position: string;
    }> = [
      { label: 'Up', short: 'U', position: 'col-start-2 row-start-1' },
      { label: 'Left', short: 'L', position: 'col-start-1 row-start-2' },
      { label: 'Right', short: 'R', position: 'col-start-3 row-start-2' },
      { label: 'Down', short: 'D', position: 'col-start-2 row-start-3' },
    ];

    return (
      <div
        className="w-[236px] shrink-0 rounded-[1.5rem] p-3 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur"
        style={{ backgroundColor: withHackPrimaryAlpha(0.03) }}
      >
        <div
          className="rounded-[1.25rem] border border-white/[0.06] p-3"
          style={{ backgroundColor: withHackPrimaryAlpha(0.04) }}
        >
          <div className="mb-3 text-center text-[11px] text-white/40 uppercase tracking-[0.28em]">
            {player.id === 1 ? 'P1' : 'P2'} Controller
          </div>

          <div
            className="mx-auto grid h-32 w-32 grid-cols-3 grid-rows-3 gap-1.5 rounded-full border border-white/[0.08] p-1.5"
            style={{
              backgroundColor: withHackPrimaryAlpha(0.03),
              boxShadow: `inset 0 0 20px ${withHackPrimaryAlpha(0.05)}`,
            }}
          >
            {directionLayout.map(({ label, short, position }) => {
              const control = directionByLabel[label];
              if (!control) {
                return null;
              }

              const pressed = pressedControls.has(control.code);

              return (
                <VirtualControlButton
                  key={control.code}
                  controlCode={control.code}
                  pressed={pressed}
                  onPressedChange={setVirtualControlState}
                  className={cn(
                    position,
                    'flex flex-col items-center justify-center rounded-full border font-semibold text-xs transition-all',
                    pressed
                      ? 'text-white'
                      : 'border-primary/10 bg-transparent text-primary/50 hover:border-primary/25 hover:bg-primary/[0.06] hover:text-primary/70',
                  )}
                  style={
                    pressed
                      ? {
                          borderColor: HACK_PRIMARY_BORDER,
                          backgroundColor: HACK_PRIMARY_BG_ACTIVE,
                          boxShadow: HACK_PRIMARY_SHADOW,
                        }
                      : undefined
                  }
                >
                  <span className="text-[10px] text-white/50 uppercase tracking-[0.16em]">
                    {short}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{
                      color: pressed ? HACK_PRIMARY_RGB : HACK_PRIMARY_TEXT_DIM,
                    }}
                  >
                    {formatArcadeInputLabel(
                      mergedMapping[control.code],
                    ).replace(/\s*Arrow$/i, '')}
                  </span>
                </VirtualControlButton>
              );
            })}
          </div>

          <div className="mx-auto mt-3 grid max-w-[180px] grid-cols-3 gap-2">
            {actionControls.map((control) => {
              const pressed = pressedControls.has(control.code);

              return (
                <VirtualControlButton
                  key={control.code}
                  controlCode={control.code}
                  pressed={pressed}
                  onPressedChange={setVirtualControlState}
                  className={cn(
                    'aspect-square w-full rounded-full border transition-all',
                    pressed
                      ? 'text-white'
                      : 'border-primary/[0.08] bg-primary/[0.05] text-primary/70 hover:border-primary/20 hover:bg-primary/[0.10] hover:text-primary/90',
                  )}
                  style={
                    pressed
                      ? {
                          borderColor: HACK_PRIMARY_BORDER,
                          backgroundColor: HACK_PRIMARY_BG_ACTIVE,
                          boxShadow: HACK_PRIMARY_SHADOW,
                        }
                      : undefined
                  }
                >
                  <span className="flex h-full flex-col items-center justify-center gap-0.5">
                    <span className="font-semibold text-[10px] text-white/50 uppercase tracking-[0.14em]">
                      {control.label}
                    </span>
                    <span
                      className="font-semibold text-[11px] uppercase tracking-[0.16em]"
                      style={{
                        color: pressed ? HACK_PRIMARY_RGB : HACK_PRIMARY_TEXT,
                      }}
                    >
                      {formatArcadeInputLabel(mergedMapping[control.code])}
                    </span>
                  </span>
                </VirtualControlButton>
              );
            })}
          </div>

          <div className="mx-auto mt-3 grid max-w-[180px] grid-cols-1 gap-2">
            {systemControls.map((control) => {
              const pressed = pressedControls.has(control.code);

              return (
                <VirtualControlButton
                  key={control.code}
                  controlCode={control.code}
                  pressed={pressed}
                  onPressedChange={setVirtualControlState}
                  className={cn(
                    'rounded-xl border px-3 py-2 transition-all',
                    pressed
                      ? 'text-white'
                      : 'border-primary/[0.08] bg-primary/[0.04] text-primary/65 hover:border-primary/20 hover:bg-primary/[0.08] hover:text-primary/85',
                  )}
                  style={
                    pressed
                      ? {
                          borderColor: HACK_PRIMARY_BORDER,
                          backgroundColor: HACK_PRIMARY_BG_ACTIVE,
                          boxShadow: HACK_PRIMARY_SHADOW,
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[10px] text-white/50 uppercase tracking-[0.2em]">
                      {control.label}
                    </span>
                    <span
                      className="rounded-full border px-2 py-1 font-semibold text-[10px] uppercase tracking-[0.14em]"
                      style={{
                        borderColor: HACK_PRIMARY_BORDER,
                        backgroundColor: pressed
                          ? HACK_PRIMARY_BG_ACTIVE
                          : HACK_PRIMARY_BG,
                        color: pressed ? HACK_PRIMARY_RGB : HACK_PRIMARY_TEXT,
                      }}
                    >
                      {formatArcadeInputLabel(mergedMapping[control.code])}
                    </span>
                  </span>
                </VirtualControlButton>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function renderHorizontalControllerPanel(player: (typeof players)[number]) {
    const directionByLabel: Record<string, (typeof player.controls)[number]> =
      {};
    const actionControls: typeof player.controls = [];
    const systemControls: typeof player.controls = [];

    for (const control of player.controls) {
      if (control.kind === 'direction') {
        directionByLabel[control.label] = control;
      } else if (control.kind === 'action') {
        actionControls.push(control);
      } else if (control.kind === 'system') {
        systemControls.push(control);
      }
    }

    const upCode = directionByLabel.Up?.code;
    const downCode = directionByLabel.Down?.code;
    const leftCode = directionByLabel.Left?.code;
    const rightCode = directionByLabel.Right?.code;

    function getJoystickDirection(
      clientX: number,
      clientY: number,
      rect: DOMRect,
    ): ArcadeControlCode[] {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const deadzone = rect.width * 0.12;

      if (dist < deadzone) {
        return [];
      }

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      const codes: ArcadeControlCode[] = [];

      // 8 sectors: each 45°, centered on the cardinal/diagonal
      if (angle > -112.5 && angle < -67.5 && upCode) codes.push(upCode);
      else if (angle > -67.5 && angle < -22.5) {
        if (upCode) codes.push(upCode);
        if (rightCode) codes.push(rightCode);
      } else if (angle > -22.5 && angle < 22.5 && rightCode)
        codes.push(rightCode);
      else if (angle > 22.5 && angle < 67.5) {
        if (downCode) codes.push(downCode);
        if (rightCode) codes.push(rightCode);
      } else if (angle > 67.5 && angle < 112.5 && downCode)
        codes.push(downCode);
      else if (angle > 112.5 && angle < 157.5) {
        if (downCode) codes.push(downCode);
        if (leftCode) codes.push(leftCode);
      } else if ((angle > 157.5 || angle < -157.5) && leftCode)
        codes.push(leftCode);
      else if (angle > -157.5 && angle < -112.5) {
        if (upCode) codes.push(upCode);
        if (leftCode) codes.push(leftCode);
      }

      return codes;
    }

    function getJoystickThumbPosition(
      clientX: number,
      clientY: number,
      rect: DOMRect,
    ): JoystickThumbPosition {
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;
      const maxRadius = rect.width * 0.28;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance === 0) {
        return JOYSTICK_THUMB_REST_POSITION;
      }

      const scale = Math.min(1, maxRadius / distance);

      return {
        x: Math.round(dx * scale),
        y: Math.round(dy * scale),
      };
    }

    const activeJoystickCodes = [upCode, downCode, leftCode, rightCode].filter(
      (c): c is ArcadeControlCode => !!c && pressedControls.has(c),
    );
    const joystickThumbPosition =
      joystickThumbPositions[player.id] ?? JOYSTICK_THUMB_REST_POSITION;

    return (
      <div
        className="relative w-full shrink-0 rounded-xl border border-white/[0.06] px-3 pt-6 pb-2"
        style={{ backgroundColor: withHackPrimaryAlpha(0.04) }}
      >
        <span className="absolute top-2 left-2 rounded-full border border-white/[0.08] px-2 py-0.5 font-bold text-[9px] text-white/35 uppercase tracking-widest">
          {player.id === 1 ? 'P1' : 'P2'}
        </span>

        <div className="flex items-center justify-center gap-3">
          {/* Touch joystick */}
          <div
            role="application"
            className="relative h-32 w-32 shrink-0 touch-none select-none rounded-full border border-white/[0.08]"
            style={{
              backgroundColor: withHackPrimaryAlpha(0.03),
              boxShadow: `inset 0 0 20px ${withHackPrimaryAlpha(0.05)}`,
            }}
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = e.currentTarget.getBoundingClientRect();
              const codes = getJoystickDirection(e.clientX, e.clientY, rect);
              const thumbPosition = getJoystickThumbPosition(
                e.clientX,
                e.clientY,
                rect,
              );
              const allDirs = [upCode, downCode, leftCode, rightCode];
              for (const code of allDirs) {
                if (code) setVirtualControlState(code, codes.includes(code));
              }
              setJoystickThumbPosition(player.id, thumbPosition);
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const codes = getJoystickDirection(e.clientX, e.clientY, rect);
              const thumbPosition = getJoystickThumbPosition(
                e.clientX,
                e.clientY,
                rect,
              );
              const allDirs = [upCode, downCode, leftCode, rightCode];
              for (const code of allDirs) {
                if (code) setVirtualControlState(code, codes.includes(code));
              }
              setJoystickThumbPosition(player.id, thumbPosition);
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              const allDirs = [upCode, downCode, leftCode, rightCode];
              for (const code of allDirs) {
                if (code) setVirtualControlState(code, false);
              }
              setJoystickThumbPosition(player.id, JOYSTICK_THUMB_REST_POSITION);
            }}
            onPointerCancel={() => {
              const allDirs = [upCode, downCode, leftCode, rightCode];
              for (const code of allDirs) {
                if (code) setVirtualControlState(code, false);
              }
              setJoystickThumbPosition(player.id, JOYSTICK_THUMB_REST_POSITION);
            }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Direction indicators */}
            <span
              className={cn(
                '-translate-x-1/2 absolute top-1.5 left-1/2 font-bold text-[9px] uppercase',
                upCode && activeJoystickCodes.includes(upCode)
                  ? 'text-primary'
                  : 'text-white/25',
              )}
            >
              U
            </span>
            <span
              className={cn(
                '-translate-x-1/2 absolute bottom-1.5 left-1/2 font-bold text-[9px] uppercase',
                downCode && activeJoystickCodes.includes(downCode)
                  ? 'text-primary'
                  : 'text-white/25',
              )}
            >
              D
            </span>
            <span
              className={cn(
                '-translate-y-1/2 absolute top-1/2 left-2 font-bold text-[9px] uppercase',
                leftCode && activeJoystickCodes.includes(leftCode)
                  ? 'text-primary'
                  : 'text-white/25',
              )}
            >
              L
            </span>
            <span
              className={cn(
                '-translate-y-1/2 absolute top-1/2 right-2 font-bold text-[9px] uppercase',
                rightCode && activeJoystickCodes.includes(rightCode)
                  ? 'text-primary'
                  : 'text-white/25',
              )}
            >
              R
            </span>
            {/* Draggable thumb */}
            <div
              className="absolute top-1/2 left-1/2 h-5 w-5 rounded-full border"
              style={{
                borderColor:
                  activeJoystickCodes.length > 0
                    ? HACK_PRIMARY_BORDER
                    : withHackPrimaryAlpha(0.12),
                backgroundColor:
                  activeJoystickCodes.length > 0
                    ? HACK_PRIMARY_BG_ACTIVE
                    : withHackPrimaryAlpha(0.06),
                boxShadow:
                  activeJoystickCodes.length > 0 ? HACK_PRIMARY_SHADOW : 'none',
                transform: `translate(calc(-50% + ${joystickThumbPosition.x}px), calc(-50% + ${joystickThumbPosition.y}px))`,
                transition:
                  activeJoystickCodes.length > 0
                    ? 'none'
                    : 'transform 140ms ease-out, background-color 140ms ease-out, border-color 140ms ease-out',
              }}
            />
          </div>

          <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
            {actionControls.map((control) => {
              const pressed = pressedControls.has(control.code);

              return (
                <VirtualControlButton
                  key={control.code}
                  controlCode={control.code}
                  pressed={pressed}
                  onPressedChange={setVirtualControlState}
                  className={cn(
                    'aspect-square min-h-10 rounded-full border transition-all',
                    pressed
                      ? 'text-white'
                      : 'border-primary/[0.08] bg-primary/[0.05] text-primary/70',
                  )}
                  style={
                    pressed
                      ? {
                          borderColor: HACK_PRIMARY_BORDER,
                          backgroundColor: HACK_PRIMARY_BG_ACTIVE,
                          boxShadow: HACK_PRIMARY_SHADOW,
                        }
                      : undefined
                  }
                >
                  <span className="flex h-full items-center justify-center">
                    <span className="font-bold text-[13px] text-white/50 uppercase">
                      {control.label}
                    </span>
                  </span>
                </VirtualControlButton>
              );
            })}
          </div>

          {systemControls.map((control) => {
            const pressed = pressedControls.has(control.code);

            return (
              <VirtualControlButton
                key={control.code}
                controlCode={control.code}
                pressed={pressed}
                onPressedChange={setVirtualControlState}
                className={cn(
                  'shrink-0 rounded-xl border px-3 py-5 transition-all',
                  pressed
                    ? 'text-white'
                    : 'border-primary/[0.08] bg-primary/[0.04] text-primary/65',
                )}
                style={
                  pressed
                    ? {
                        borderColor: HACK_PRIMARY_BORDER,
                        backgroundColor: HACK_PRIMARY_BG_ACTIVE,
                        boxShadow: HACK_PRIMARY_SHADOW,
                      }
                    : undefined
                }
              >
                <span className="font-bold text-[11px] text-white/50 uppercase tracking-wider">
                  {control.label}
                </span>
              </VirtualControlButton>
            );
          })}
        </div>
      </div>
    );
  }

  const gameFrame = (
    <iframe
      ref={iframeRef}
      src={embedUrl}
      title={title}
      width={800}
      height={600}
      className="block h-full w-full"
      sandbox={iframeSandbox}
    />
  );

  return (
    <>
      {isFullscreen && (
        <button
          type="button"
          onClick={() => setIsFullscreen(false)}
          className="fixed top-4 right-4 z-[60] flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[11px] text-white/70 uppercase tracking-wider backdrop-blur transition-all hover:border-white/30 hover:bg-white/15 hover:text-white"
        >
          <Minimize2 className="h-3.5 w-3.5" />
          Exit
        </button>
      )}
      <div className="relative flex h-full min-h-0 w-full flex-col items-center justify-center gap-1.5 lg:flex-row lg:gap-2">
        {/* Fullscreen button — desktop only */}
        <button
          type="button"
          onClick={() => setIsFullscreen(true)}
          className={cn(
            'absolute top-0 right-0 z-10 hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] text-white/50 uppercase tracking-wider transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary lg:flex',
            isFullscreen && 'lg:hidden',
          )}
        >
          <Maximize2 className="h-3 w-3" />
          Fullscreen
        </button>

        {/* Top controller (mobile P2) / Left controller (desktop) */}
        {!isFullscreen && (
          <>
            <div className="w-full shrink-0 lg:hidden">
              {isTwoPlayer
                ? player2
                  ? renderHorizontalControllerPanel(player2)
                  : renderHorizontalControllerPanel(player1)
                : null}
            </div>
            <div className="hidden shrink-0 lg:block">
              {isTwoPlayer ? (
                renderControllerPanel(player1)
              ) : (
                <div className="w-[236px]" aria-hidden="true" />
              )}
            </div>
          </>
        )}

        {/* Game iframe */}
        <div
          className={cn(
            isFullscreen
              ? 'fixed inset-0 z-50 flex items-center justify-center bg-black'
              : 'flex min-h-0 w-full min-w-0 flex-1 items-center justify-center',
          )}
        >
          <div
            className={cn(
              'overflow-hidden rounded bg-black',
              isFullscreen
                ? 'border border-white/20'
                : 'aspect-[4/3] max-h-full w-full border-2 border-white/30 lg:mx-auto lg:max-w-[800px]',
            )}
            style={
              isFullscreen
                ? {
                    width: 800,
                    height: 600,
                    transform: `scale(${fullscreenScale})`,
                  }
                : undefined
            }
          >
            {gameFrame}
          </div>
        </div>

        {/* Bottom controller (mobile) / Right controller (desktop) */}
        {!isFullscreen && (
          <>
            <div className="w-full shrink-0 lg:hidden">
              {renderHorizontalControllerPanel(player1)}
            </div>
            <div className="hidden shrink-0 lg:block">
              {player2
                ? renderControllerPanel(player2)
                : renderControllerPanel(player1)}
            </div>
          </>
        )}
      </div>
    </>
  );
}

interface VirtualControlButtonProps {
  controlCode: ArcadeControlCode;
  pressed: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  onPressedChange: (controlCode: ArcadeControlCode, pressed: boolean) => void;
}

function VirtualControlButton({
  controlCode,
  pressed,
  className,
  style,
  children,
  onPressedChange,
}: VirtualControlButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn('touch-none', className)}
      style={style}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPressedChange(controlCode, true);
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        onPressedChange(controlCode, false);
      }}
      onPointerCancel={() => onPressedChange(controlCode, false)}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') {
          onPressedChange(controlCode, false);
        }
      }}
    >
      {children}
    </button>
  );
}
