import { NextResponse } from 'next/server';
import { isDevelopmentEnvironment } from '@/src/lib/constants';
import {
  getArcadeControlCodesForInput,
  getArcadeMergedMapping,
  normalizeArcadeInputValue,
} from '@/src/lib/utils/arcade-controls';
import {
  ARCADE_STORAGE_MAX_PAYLOAD_BYTES,
  ARCADE_STORAGE_REQUEST_MESSAGE,
  ARCADE_STORAGE_RESPONSE_MESSAGE,
} from '@/src/lib/utils/arcade-storage';
import { resolveArcadeGameSelectionByVersionSlug } from '@/src/queries/arcade-games';

function isMouseAction(control: string | null) {
  return (
    control === 'click' ||
    control === 'leftclick' ||
    control === 'rightclick' ||
    control === 'middleclick'
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const versionParam = url.searchParams.get('version');
  const preserveDrawingBuffer = url.searchParams.get('preserveBuffer') === '1';
  const result = await resolveArcadeGameSelectionByVersionSlug(
    slug,
    versionParam,
  );
  if (!result) {
    return new NextResponse('Game version not found', { status: 404 });
  }

  const { version } = result;
  const gameCode = version.codeMinified;
  const mergedMapping = getArcadeMergedMapping(version.arcadeMapping);
  const approvedKeyboardControls = [
    ...new Set(
      Object.values(mergedMapping)
        .map(normalizeArcadeInputValue)
        .filter(
          (control): control is string => !!control && !isMouseAction(control),
        ),
    ),
  ];
  const controlCodesByInput = Object.fromEntries(
    approvedKeyboardControls
      .map((control) => [
        control,
        getArcadeControlCodesForInput(mergedMapping, control),
      ])
      .filter(([, controlCodes]) => controlCodes.length > 0),
  );

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${version.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    #game-root {
      width: 100%;
      height: 100%;
      margin: 0;
    }
  </style>
  ${
    preserveDrawingBuffer
      ? `<script>
    (function patchCanvasForTextureCapture() {
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, options) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
          options = options || {};
          options.preserveDrawingBuffer = true;
        }
        return originalGetContext.call(this, type, options);
      };
      console.log('[arcade-embed] Canvas getContext patched for preserveDrawingBuffer');
    })();
  <\/script>`
      : ''
  }
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js"><\/script>
  <script>
    const approvedGameplayControls = new Set(${JSON.stringify(approvedKeyboardControls)});
    const arcadeMapping = ${JSON.stringify(mergedMapping)};
    const controlCodesByInput = ${JSON.stringify(controlCodesByInput)};
    const storageRequestMessageType = ${JSON.stringify(ARCADE_STORAGE_REQUEST_MESSAGE)};
    const storageResponseMessageType = ${JSON.stringify(ARCADE_STORAGE_RESPONSE_MESSAGE)};
    const gameReadyMessageType = 'arcade:game-ready';
    const storageMaxPayloadBytes = ${ARCADE_STORAGE_MAX_PAYLOAD_BYTES};
    const parentOrigin = (() => {
      try {
        return document.referrer ? new URL(document.referrer).origin : null;
      } catch {
        return null;
      }
    })();
    const pendingStorageRequests = new Map();
    let storageRequestSequence = 0;

    function getSerializedPayloadSize(value) {
      try {
        const serialized = JSON.stringify(value);
        if (typeof serialized !== 'string') {
          return null;
        }

        return new TextEncoder().encode(serialized).length;
      } catch {
        return null;
      }
    }

    function isValidStorageKey(key) {
      return typeof key === 'string' && /^[A-Za-z0-9._:/-]{1,128}$/.test(key);
    }

    function isStoragePayloadValid(value, depth = 0) {
      if (depth > 32) {
        return false;
      }

      if (
        value === null ||
        typeof value === 'boolean' ||
        typeof value === 'string'
      ) {
        return true;
      }

      if (typeof value === 'number') {
        return Number.isFinite(value);
      }

      if (Array.isArray(value)) {
        return value.every((item) => isStoragePayloadValid(item, depth + 1));
      }

      if (typeof value !== 'object') {
        return false;
      }

      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        return false;
      }

      return Object.values(value).every((item) =>
        isStoragePayloadValid(item, depth + 1)
      );
    }

    function createStorageRequest(method, key, value) {
      if (!isValidStorageKey(key)) {
        throw new Error('Arcade storage keys must match [A-Za-z0-9._:/-] and be 1-128 characters long.');
      }

      if (method === 'storage:set' && !isStoragePayloadValid(value)) {
        throw new Error('Arcade storage only accepts JSON-compatible values.');
      }

      const request = {
        type: storageRequestMessageType,
        requestId: 'arcade-storage-' + Date.now() + '-' + (++storageRequestSequence),
        method,
        key,
        ...(method === 'storage:set' ? { value } : {}),
      };

      const payloadSize = getSerializedPayloadSize(request);
      if (payloadSize === null || payloadSize > storageMaxPayloadBytes) {
        throw new Error('Arcade storage payload exceeds the 64 KiB bridge limit.');
      }

      return request;
    }

    function sendStorageRequest(method, key, value) {
      if (!window.parent || window.parent === window) {
        return Promise.reject(new Error('Arcade storage bridge is only available inside the arcade iframe.'));
      }

      if (!parentOrigin) {
        return Promise.reject(new Error('Arcade storage bridge could not verify the parent origin.'));
      }

      const request = createStorageRequest(method, key, value);

      return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          pendingStorageRequests.delete(request.requestId);
          reject(new Error('Arcade storage bridge timed out.'));
        }, 3000);

        pendingStorageRequests.set(request.requestId, { resolve, reject, timeoutId });
        window.parent.postMessage(request, parentOrigin);
      });
    }

    function getKeyCode(key) {
      const keyLower = key.toLowerCase();
      const keyCodeMap = {
        'arrowup': { code: 'ArrowUp', keyCode: 38, which: 38 },
        'arrowdown': { code: 'ArrowDown', keyCode: 40, which: 40 },
        'arrowleft': { code: 'ArrowLeft', keyCode: 37, which: 37 },
        'arrowright': { code: 'ArrowRight', keyCode: 39, which: 39 },
        ' ': { code: 'Space', keyCode: 32, which: 32 },
        'enter': { code: 'Enter', keyCode: 13, which: 13 },
        'escape': { code: 'Escape', keyCode: 27, which: 27 },
      };

      if (keyCodeMap[keyLower]) {
        return keyCodeMap[keyLower];
      }

      if (keyLower.length === 1) {
        if (keyLower >= 'a' && keyLower <= 'z') {
          const upperKey = keyLower.toUpperCase();
          return {
            code: 'Key' + upperKey,
            keyCode: upperKey.charCodeAt(0),
            which: upperKey.charCodeAt(0),
          };
        }

        if (keyLower >= '0' && keyLower <= '9') {
          return {
            code: 'Digit' + keyLower,
            keyCode: keyLower.charCodeAt(0),
            which: keyLower.charCodeAt(0),
          };
        }
      }

      return {
        code: 'Key' + key.toUpperCase(),
        keyCode: key.charCodeAt(0),
        which: key.charCodeAt(0),
      };
    }

    function postApprovedGameplayInput(control) {
      if (!window.parent) {
        return;
      }

      window.parent.postMessage(
        {
          type: 'arcade:approved-input',
          source: 'keyboard',
          control,
        },
        parentOrigin ?? '*'
      );
    }

    function postGameReady() {
      if (!window.parent) {
        return;
      }

      window.parent.postMessage(
        {
          type: gameReadyMessageType,
        },
        parentOrigin ?? '*'
      );
    }

    function postKeyboardControlState(control, pressed) {
      if (!window.parent) {
        return;
      }

      const controlCodes = controlCodesByInput[control];
      if (!controlCodes || controlCodes.length === 0) {
        return;
      }

      window.parent.postMessage(
        {
          type: 'arcade:control-state',
          source: 'keyboard',
          controlCodes,
          pressed,
        },
        parentOrigin ?? '*'
      );
    }

    function emitMouseEvent(action, pressed) {
      const canvas = document.querySelector('canvas');
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      let button = 0;
      if (action === 'rightclick') {
        button = 2;
      } else if (action === 'middleclick') {
        button = 1;
      }

      const eventType = pressed ? 'mousedown' : 'mouseup';
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button,
        buttons: pressed ? 1 << button : 0,
      });

      canvas.dispatchEvent(event);
      document.dispatchEvent(event);
      window.dispatchEvent(event);

      if (!pressed && (action === 'click' || action === 'leftclick')) {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y,
          button,
        });

        canvas.dispatchEvent(clickEvent);
        document.dispatchEvent(clickEvent);
        window.dispatchEvent(clickEvent);
      }
    }

    function emitKeyboardEvent(key, pressed) {
      if (!key) {
        return;
      }

      if (
        key === 'click' ||
        key === 'leftclick' ||
        key === 'rightclick' ||
        key === 'middleclick'
      ) {
        emitMouseEvent(key, pressed);
        return;
      }

      const { code, keyCode, which } = getKeyCode(key);
      const keyboardEvent = new KeyboardEvent(
        pressed ? 'keydown' : 'keyup',
        {
          key,
          code,
          keyCode,
          which,
          bubbles: true,
          cancelable: true,
        }
      );

      document.dispatchEvent(keyboardEvent);
      window.dispatchEvent(keyboardEvent);
    }

    function handlePhysicalKeyboardEvent(event) {
      const control = typeof event.key === 'string' ? event.key.toLowerCase() : '';

      if (event.type === 'keydown' && event.repeat) {
        return;
      }

      if (approvedGameplayControls.has(control) && event.type === 'keydown') {
        postApprovedGameplayInput(control);
      }

      postKeyboardControlState(control, event.type === 'keydown');
    }

    function handleVirtualControlMessage(event) {
      if (
        event.source !== window.parent ||
        (parentOrigin && event.origin !== parentOrigin) ||
        !event.data ||
        event.data.type !== 'arcade:virtual-control'
      ) {
        return;
      }

      const { controlCode, pressed } = event.data;
      if (typeof controlCode !== 'string' || typeof pressed !== 'boolean') {
        return;
      }

      const mappedControl = arcadeMapping[controlCode];
      if (!mappedControl) {
        return;
      }

      const normalizedControl = mappedControl.trim().toLowerCase() === 'space'
        ? ' '
        : mappedControl.trim().toLowerCase();

      emitKeyboardEvent(normalizedControl, pressed);
    }

    function handleStorageResponseMessage(event) {
      if (
        event.source !== window.parent ||
        (parentOrigin && event.origin !== parentOrigin)
      ) {
        return;
      }

      const data = event.data;
      const payloadSize = getSerializedPayloadSize(data);
      if (
        !data ||
        typeof data !== 'object' ||
        payloadSize === null ||
        payloadSize > storageMaxPayloadBytes ||
        data.type !== storageResponseMessageType ||
        typeof data.requestId !== 'string' ||
        !pendingStorageRequests.has(data.requestId)
      ) {
        return;
      }

      const pendingRequest = pendingStorageRequests.get(data.requestId);
      pendingStorageRequests.delete(data.requestId);
      window.clearTimeout(pendingRequest.timeoutId);

      if (data.ok !== true) {
        pendingRequest.reject(
          new Error(
            typeof data.error === 'string'
              ? data.error
              : 'Arcade storage request failed.'
          )
        );
        return;
      }

      if (data.method === 'storage:get') {
        pendingRequest.resolve({
          found: data.found === true,
          value: data.value ?? null,
        });
        return;
      }

      pendingRequest.resolve();
    }

    window.platanusArcadeStorage = {
      get(key) {
        return sendStorageRequest('storage:get', key, undefined);
      },
      set(key, value) {
        return sendStorageRequest('storage:set', key, value);
      },
      remove(key) {
        return sendStorageRequest('storage:remove', key, undefined);
      },
    };

    window.addEventListener('keydown', handlePhysicalKeyboardEvent);
    window.addEventListener('keyup', handlePhysicalKeyboardEvent);
    window.addEventListener('message', handleVirtualControlMessage);
    window.addEventListener('message', handleStorageResponseMessage);

    function waitForCanvasAndPostReady(attempt = 0) {
      const canvas = document.querySelector('#game-root canvas');
      if (canvas) {
        postGameReady();
        return;
      }

      if (attempt < 60) {
        window.requestAnimationFrame(() => waitForCanvasAndPostReady(attempt + 1));
      } else {
        postGameReady();
      }
    }

    function renderGameError(error) {
      console.error('Game initialization error:', error);
      document.body.innerHTML = '<div style="color: white; padding: 20px; font-family: monospace;">Error loading game: ' + error.message + '</div>';
    }

    function startGame() {
      if (window.__arcadeGameStarted) {
        return;
      }

      window.__arcadeGameStarted = true;

      try {
        ${gameCode}
        waitForCanvasAndPostReady();
      } catch (error) {
        renderGameError(error);
      }
    }

    function bootGame() {
      if (!document.getElementById('game-root')) {
        window.requestAnimationFrame(bootGame);
        return;
      }

      if (!window.Phaser?.Game) {
        renderGameError(new Error('Failed to load Phaser runtime.'));
        return;
      }

      startGame();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootGame, { once: true });
    } else {
      bootGame();
    }
  <\/script>
</head>
<body>
  <div id="game-root"></div>
</body>
</html>`;

  const frameAncestors = isDevelopmentEnvironment
    ? 'frame-ancestors http://localhost:3000 https://hack.platan.us https://*.platan.us;'
    : 'frame-ancestors https://hack.platan.us https://*.platan.us;';

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; ${frameAncestors}`,
    },
  });
}
