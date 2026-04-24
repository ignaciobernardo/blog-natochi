import { NextResponse } from 'next/server';
import { DEFAULT_ARCADE_MAPPING } from '@/src/lib/constants';
import { getArcadeGameFlatBySlug } from '@/src/queries/arcade-games';

function createGamepadInjection(mapping: Record<string, string>) {
  return `
// Arcade Virtual Gamepad System
// Converts keyboard input to gamepad API and Phaser gamepad events
(function() {
  'use strict';
  
  const ARCADE_MAPPING = ${JSON.stringify(mapping)};
  const DEADZONE = 0.5;
  const MAX_PLAYERS = 2;
  const BUTTON_COUNT = 17;
  const AXIS_COUNT = 4;
  
  const KEYBOARD_MAP = {
    0: {
    'w': { type: 'axis', index: 1, value: -1 },
    's': { type: 'axis', index: 1, value: 1 },
    'a': { type: 'axis', index: 0, value: -1 },
    'd': { type: 'axis', index: 0, value: 1 },
    'u': { type: 'button', index: 0 },
    'i': { type: 'button', index: 1 },
    'o': { type: 'button', index: 2 },
    'j': { type: 'button', index: 3 },
    'k': { type: 'button', index: 4 },
    'l': { type: 'button', index: 5 },
    '1': { type: 'button', index: 6 },
    },
    1: {
    'arrowup': { type: 'axis', index: 1, value: -1 },
    'arrowdown': { type: 'axis', index: 1, value: 1 },
    'arrowleft': { type: 'axis', index: 0, value: -1 },
    'arrowright': { type: 'axis', index: 0, value: 1 },
    'r': { type: 'button', index: 0 },
    't': { type: 'button', index: 1 },
    'y': { type: 'button', index: 2 },
    'f': { type: 'button', index: 3 },
    'g': { type: 'button', index: 4 },
    'h': { type: 'button', index: 5 },
    '2': { type: 'button', index: 6 },
    },
  };

  const GAMEPAD_TO_ARCADE = {
    0: {
      buttons: { 0: 'P1_1', 1: 'P1_2', 2: 'P1_3', 3: 'P1_4', 4: 'P1_5', 5: 'P1_6', 6: 'START1' },
      axes: { 0: ['P1_L', 'P1_R'], 1: ['P1_U', 'P1_D'] },
    },
    1: {
      buttons: { 0: 'P2_1', 1: 'P2_2', 2: 'P2_3', 3: 'P2_4', 4: 'P2_5', 5: 'P2_6', 6: 'START2' },
      axes: { 0: ['P2_L', 'P2_R'], 1: ['P2_U', 'P2_D'] },
    },
  };
  
  const virtualGamepads = Array(MAX_PLAYERS).fill(null).map(() => ({
    buttons: Array(BUTTON_COUNT).fill(false),
    axes: Array(AXIS_COUNT).fill(0),
  }));
  
  const virtualGamepadConnected = Array(MAX_PLAYERS).fill(false);
  const axisKeyStates = Array(MAX_PLAYERS).fill(null).map(() => 
    Array(AXIS_COUNT).fill(null).map(() => new Map())
  );

  function updateVirtualGamepad(playerIndex, mapping, pressed, key) {
    const gamepad = virtualGamepads[playerIndex];
    const config = GAMEPAD_TO_ARCADE[playerIndex];
    
    if (mapping.type === 'button') {
      gamepad.buttons[mapping.index] = pressed;
      const arcadeCode = config.buttons[mapping.index];
      if (arcadeCode && ARCADE_MAPPING[arcadeCode]) {
        emitKeyboardEvent(ARCADE_MAPPING[arcadeCode], pressed);
      }
    } else if (mapping.type === 'axis') {
      const axisIndex = mapping.index;
      const keyStates = axisKeyStates[playerIndex][axisIndex];
      
      if (pressed) {
        keyStates.set(key, mapping.value || 0);
      } else {
        keyStates.delete(key);
      }
      
      let newValue = 0;
      keyStates.forEach(value => {
        newValue += value;
      });
      newValue = Math.max(-1, Math.min(1, newValue));
      
      const oldValue = gamepad.axes[axisIndex];
      gamepad.axes[axisIndex] = newValue;
      
      const axisCodes = config.axes[axisIndex];
      if (axisCodes) {
        const [negCode, posCode] = axisCodes;
        const wasNegPressed = oldValue < -DEADZONE;
        const wasPosPressed = oldValue > DEADZONE;
        const negPressed = newValue < -DEADZONE;
        const posPressed = newValue > DEADZONE;
        
        if (negPressed !== wasNegPressed && ARCADE_MAPPING[negCode]) {
          emitKeyboardEvent(ARCADE_MAPPING[negCode], negPressed);
        }
        if (posPressed !== wasPosPressed && ARCADE_MAPPING[posCode]) {
          emitKeyboardEvent(ARCADE_MAPPING[posCode], posPressed);
        }
      }
    }
  }
  
  function handleKeyboardInput(event, pressed) {
    const key = event.key.toLowerCase();
    
    for (let playerIndex = 0; playerIndex < MAX_PLAYERS; playerIndex++) {
      const mapping = KEYBOARD_MAP[playerIndex][key];
      if (mapping) {
        updateVirtualGamepad(playerIndex, mapping, pressed, key);
        return true;
      }
    }
    
    return false;
  }

  function getKeyCode(key) {
    const keyLower = key.toLowerCase();
    const keyCodeMap = {
      'arrowup': { code: 'ArrowUp', keyCode: 38, which: 38 },
      'arrowdown': { code: 'ArrowDown', keyCode: 40, which: 40 },
      'arrowleft': { code: 'ArrowLeft', keyCode: 37, which: 37 },
      'arrowright': { code: 'ArrowRight', keyCode: 39, which: 39 },
      'space': { code: 'Space', keyCode: 32, which: 32 },
      'enter': { code: 'Enter', keyCode: 13, which: 13 },
      'escape': { code: 'Escape', keyCode: 27, which: 27 },
    };
    
    if (keyCodeMap[keyLower]) {
      return keyCodeMap[keyLower];
    }
    
    if (keyLower.length === 1) {
      if (keyLower >= 'a' && keyLower <= 'z') {
        return { code: 'Key' + keyLower.toUpperCase(), keyCode: keyLower.charCodeAt(0) - 32, which: keyLower.charCodeAt(0) - 32 };
      }
      if (keyLower >= '0' && keyLower <= '9') {
        return { code: 'Digit' + keyLower, keyCode: keyLower.charCodeAt(0), which: keyLower.charCodeAt(0) };
      }
    }
    
    return { code: 'Key' + key.toUpperCase(), keyCode: key.charCodeAt(0), which: key.charCodeAt(0) };
  }
  
  function emitMouseEvent(action, pressed) {
    if (!action) return;
    
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    let button = 0;
    let eventType = 'click';
    
    if (action === 'click' || action === 'leftclick') {
      button = 0;
      eventType = pressed ? 'mousedown' : 'mouseup';
    } else if (action === 'rightclick') {
      button = 2;
      eventType = pressed ? 'mousedown' : 'mouseup';
    } else if (action === 'middleclick') {
      button = 1;
      eventType = pressed ? 'mousedown' : 'mouseup';
    }
    
    let event;
    try {
      event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
        button: button,
        buttons: pressed ? (1 << button) : 0,
      });
    } catch (e) {
      event = document.createEvent('MouseEvent');
      event.initMouseEvent(
        eventType,
        true,
        true,
        window,
        1,
        x,
        y,
        x,
        y,
        false,
        false,
        false,
        false,
        button,
        null
      );
    }
    
    event.__arcadeEmitted = true;
    canvas.dispatchEvent(event);
    document.dispatchEvent(event);
    window.dispatchEvent(event);
    
    // For click action, also emit a click event after mouseup
    if (!pressed && (action === 'click' || action === 'leftclick')) {
      setTimeout(() => {
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: y,
          button: button,
        });
        clickEvent.__arcadeEmitted = true;
        canvas.dispatchEvent(clickEvent);
        document.dispatchEvent(clickEvent);
        window.dispatchEvent(clickEvent);
      }, 0);
    }
  }
  
  function emitKeyboardEvent(key, pressed) {
    if (!key) return;
    
    // Check if this is a mouse action
    const mouseActions = ['click', 'leftclick', 'rightclick', 'middleclick'];
    if (mouseActions.includes(key.toLowerCase())) {
      emitMouseEvent(key.toLowerCase(), pressed);
      return;
    }
    
    const normalizedKey = key.toLowerCase() === 'space' ? ' ' : key;
    const { code, keyCode, which } = getKeyCode(key);
    
    let event;
    try {
      event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
        key: normalizedKey,
        code: code,
        keyCode: keyCode,
        which: which,
        bubbles: true,
        cancelable: true,
        view: window,
      });
    } catch (e) {
      event = document.createEvent('KeyboardEvent');
      event.initKeyboardEvent(pressed ? 'keydown' : 'keyup', true, true, window, false, false, false, false, keyCode, 0);
    }
    
    try {
      if (event.key !== normalizedKey) Object.defineProperty(event, 'key', { value: normalizedKey, writable: false, configurable: true });
      if (event.code !== code) Object.defineProperty(event, 'code', { value: code, writable: false, configurable: true });
      if (event.keyCode !== keyCode) Object.defineProperty(event, 'keyCode', { value: keyCode, writable: false, configurable: true });
      if (event.which !== which) Object.defineProperty(event, 'which', { value: which, writable: false, configurable: true });
    } catch (e) {}
    
    
    event.__arcadeEmitted = true;
    document.dispatchEvent(event);
    window.dispatchEvent(event);
    const canvas = document.querySelector('canvas');
    if (canvas) canvas.dispatchEvent(event);
    if (document.activeElement && document.activeElement !== document.body && document.activeElement !== document.documentElement) {
      document.activeElement.dispatchEvent(event);
    }
  }
  
  function blockKeyboardEvent(event) {
    if (event.__arcadeEmitted) {
      if (event.type === 'keydown' && (event.key === '8' || event.key === '9' || event.key === 'Escape')) {
        window.parent.postMessage({ type: 'arcade-back' }, '*');
      }
      return;
    }
    
    handleKeyboardInput(event, event.type === 'keydown');
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  
  ['keydown', 'keyup', 'keypress'].forEach(type => {
    document.addEventListener(type, blockKeyboardEvent, true);
    window.addEventListener(type, blockKeyboardEvent, true);
  });
  
  function createGamepadObject(playerIndex, virtualState, realGamepad = null) {
    const buttons = virtualState.buttons.map((pressed, i) => {
      if (realGamepad && realGamepad.buttons[i]) {
        const realBtn = realGamepad.buttons[i];
        return {
          pressed: pressed || realBtn.pressed,
          touched: pressed || realBtn.touched,
          value: pressed ? 1.0 : realBtn.value,
        };
      }
      return {
        pressed: pressed,
        touched: pressed,
        value: pressed ? 1.0 : 0.0,
      };
    });
    
    const axes = Array(AXIS_COUNT).fill(0).map((_, i) => {
      const virtualAxis = virtualState.axes[i] || 0;
      if (realGamepad && realGamepad.axes[i] !== undefined) {
        const realAxis = realGamepad.axes[i];
        return Math.abs(virtualAxis) > Math.abs(realAxis) ? virtualAxis : realAxis;
      }
      return virtualAxis;
    });
    
    return {
      id: realGamepad ? realGamepad.id : 'Virtual Keyboard Gamepad (Player ' + (playerIndex + 1) + ')',
      index: playerIndex,
      connected: true,
      mapping: 'standard',
      timestamp: performance.now(),
      buttons: buttons,
      axes: axes,
    };
  }
  
  const lastRealGamepadState = Array(MAX_PLAYERS).fill(null).map(() => ({
    buttons: Array(BUTTON_COUNT).fill(false),
    axes: Array(AXIS_COUNT).fill(0),
  }));
  
  function pollRealGamepadsForKeyboardEvents() {
    const realGamepads = originalGetGamepads();
    
    for (let playerIndex = 0; playerIndex < MAX_PLAYERS; playerIndex++) {
      const realGamepad = realGamepads[playerIndex];
      if (!realGamepad) continue;
      
      const config = GAMEPAD_TO_ARCADE[playerIndex];
      const lastState = lastRealGamepadState[playerIndex];
      
      for (let btnIdx = 0; btnIdx < Math.min(realGamepad.buttons.length, BUTTON_COUNT); btnIdx++) {
        const pressed = realGamepad.buttons[btnIdx].pressed;
        const wasPressed = lastState.buttons[btnIdx];
        
        if (pressed !== wasPressed) {
          const arcadeCode = config.buttons[btnIdx];
          if (arcadeCode && ARCADE_MAPPING[arcadeCode]) {
            emitKeyboardEvent(ARCADE_MAPPING[arcadeCode], pressed);
          }
          lastState.buttons[btnIdx] = pressed;
        }
      }
      
      for (let axisIdx = 0; axisIdx < Math.min(realGamepad.axes.length, AXIS_COUNT); axisIdx++) {
        const value = realGamepad.axes[axisIdx];
        const lastValue = lastState.axes[axisIdx];
        
        const axisCodes = config.axes[axisIdx];
        if (!axisCodes) continue;
        
        const [negCode, posCode] = axisCodes;
        const negPressed = value < -DEADZONE;
        const wasNegPressed = lastValue < -DEADZONE;
        if (negPressed !== wasNegPressed && ARCADE_MAPPING[negCode]) {
          emitKeyboardEvent(ARCADE_MAPPING[negCode], negPressed);
        }
        
        const posPressed = value > DEADZONE;
        const wasPosPressed = lastValue > DEADZONE;
        if (posPressed !== wasPosPressed && ARCADE_MAPPING[posCode]) {
          emitKeyboardEvent(ARCADE_MAPPING[posCode], posPressed);
        }
        
        lastState.axes[axisIdx] = value;
      }
    }
    
    requestAnimationFrame(pollRealGamepadsForKeyboardEvents);
  }
  
  const originalGetGamepads = navigator.getGamepads.bind(navigator);
  navigator.getGamepads = function() {
    const realGamepads = originalGetGamepads();
    const result = Array.from(realGamepads);
    
    for (let i = 0; i < MAX_PLAYERS; i++) {
      // Dispatch connection event on first access
      if (!virtualGamepadConnected[i]) {
        virtualGamepadConnected[i] = true;
        const gamepadObj = createGamepadObject(i, virtualGamepads[i]);
        const connectEvent = new CustomEvent('gamepadconnected', {
          detail: { gamepad: gamepadObj },
        });
        connectEvent.gamepad = gamepadObj;
        window.dispatchEvent(connectEvent);
      }
      
      // Inject or merge virtual gamepad
      result[i] = createGamepadObject(i, virtualGamepads[i], realGamepads[i]);
    }
    
    return result;
  };
  
  // Start polling real gamepads for keyboard event conversion
  requestAnimationFrame(pollRealGamepadsForKeyboardEvents);

  // ============================================================================
  // PHASER GAMEPAD PLUGIN INTEGRATION
  // ============================================================================
  function injectPhaserGamepadEvents() {
    if (typeof window.Phaser === 'undefined') {
      setTimeout(injectPhaserGamepadEvents, 100);
      return;
    }

    const hookedPlugins = new Set();
    const lastStates = new Map();

    function hookPhaserGamepadPlugin(gamepadPlugin) {
      if (hookedPlugins.has(gamepadPlugin)) return;
      hookedPlugins.add(gamepadPlugin);

      const originalUpdate = gamepadPlugin.update;
      if (originalUpdate) {
        gamepadPlugin.update = function(time, delta) {
          originalUpdate.call(this, time, delta);

          // Inject virtual gamepad events
          for (let i = 0; i < MAX_PLAYERS; i++) {
            const phaserGamepad = this.getPad(i);
            if (!phaserGamepad) continue;

            const padKey = phaserGamepad.id || i;
            if (!lastStates.has(padKey)) {
              lastStates.set(padKey, {
                buttons: Array(BUTTON_COUNT).fill(false),
                axes: Array(AXIS_COUNT).fill(0),
              });
            }
            const lastState = lastStates.get(padKey);
            const virtualState = virtualGamepads[i];

            // Check button changes
            for (let btnIdx = 0; btnIdx < BUTTON_COUNT; btnIdx++) {
              const pressed = virtualState.buttons[btnIdx];
              const wasPressed = lastState.buttons[btnIdx];

              if (pressed !== wasPressed) {
                const button = {
                  value: pressed ? 1.0 : 0.0,
                  pressed: pressed,
                  touched: pressed,
                };

                if (pressed) {
                  this.emit('down', phaserGamepad, btnIdx, button);
                  this.emit('button\\/down\\/' + btnIdx, phaserGamepad, btnIdx, button);
                  phaserGamepad.emit('down', btnIdx, button);
                } else {
                  this.emit('up', phaserGamepad, btnIdx, button);
                  this.emit('button\\/up\\/' + btnIdx, phaserGamepad, btnIdx, button);
                  phaserGamepad.emit('up', btnIdx, button);
                }
                lastState.buttons[btnIdx] = pressed;
              }
            }

            // Check axis changes
            for (let axisIdx = 0; axisIdx < AXIS_COUNT; axisIdx++) {
              const value = virtualState.axes[axisIdx];
              const lastValue = lastState.axes[axisIdx];

              if (Math.abs(value - lastValue) > 0.01) {
                this.emit('axis', phaserGamepad, axisIdx, value);
                phaserGamepad.emit('axis', axisIdx, value);
                lastState.axes[axisIdx] = value;
              }
            }
          }
        };
      }
    }

    // Hook into Phaser.Game constructor
    const OriginalPhaserGame = window.Phaser.Game;
    window.Phaser.Game = function(...args) {
      const game = new OriginalPhaserGame(...args);
      
      game.events.once('ready', () => {
        if (game.input && game.input.gamepad) {
          hookPhaserGamepadPlugin(game.input.gamepad);
        }
      });

      if (game.input && game.input.gamepad) {
        hookPhaserGamepadPlugin(game.input.gamepad);
      }

      return game;
    };

    // Check for existing games
    const checkInterval = setInterval(() => {
      if (window.Phaser && window.Phaser.GAMES) {
        window.Phaser.GAMES.forEach((game) => {
          if (game.input && game.input.gamepad) {
            hookPhaserGamepadPlugin(game.input.gamepad);
          }
        });
      }
    }, 500);
    
    setTimeout(() => clearInterval(checkInterval), 5000);
  }

  // Expose Phaser injection globally
  window.__arcadeInjectPhaserGamepad = injectPhaserGamepadEvents;

  // Initialize Phaser injection
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(injectPhaserGamepadEvents, 100);
    });
  } else {
    setTimeout(injectPhaserGamepadEvents, 100);
  }
})();
`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const game = await getArcadeGameFlatBySlug(slug);

    if (!game) {
      return new NextResponse('Game not found', { status: 404 });
    }

    const gameCode = game.codeMinified;

    // Use custom mapping if available, otherwise use default
    const mapping = game.arcadeMapping || DEFAULT_ARCADE_MAPPING;
    const gamepadInjection = createGamepadInjection(mapping);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${game.title}</title>
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
    #game-container {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    canvas {
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
    }
  </style>
  <script>
    // Inject gamepad to keyboard event emitter
    ${gamepadInjection}

    window.initGame = function() {
      console.log('Phaser loaded, initializing game...');
      
      // Trigger Phaser gamepad injection after Phaser is loaded
      if (window.__arcadeInjectPhaserGamepad) {
        setTimeout(() => {
          window.__arcadeInjectPhaserGamepad();
        }, 100);
      }
      
      try {
        ${gameCode}
        console.log('Game initialized successfully');
        
        // Also trigger Phaser injection after game code runs
        setTimeout(() => {
          if (window.__arcadeInjectPhaserGamepad) {
            window.__arcadeInjectPhaserGamepad();
          }
        }, 500);

        // After game initialization, ensure canvas scaling
        setTimeout(() => {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const container = document.getElementById('game-container');
            const scaleCanvas = () => {
              const containerWidth = container.clientWidth;
              const containerHeight = container.clientHeight;
              const canvasWidth = canvas.width;
              const canvasHeight = canvas.height;

              const scaleX = containerWidth / canvasWidth;
              const scaleY = containerHeight / canvasHeight;
              const scale = Math.min(scaleX, scaleY, 1.5);

              canvas.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
            };

            scaleCanvas();
            window.addEventListener('resize', scaleCanvas);
          }
        }, 100);
      } catch (error) {
        console.error('Game initialization error:', error);
        document.body.innerHTML = '<div style="color: white; padding: 20px; font-family: monospace;">Error loading game: ' + error.message + '</div>';
      }
    };
  <\/script>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.87.0/dist/phaser.min.js" onload="initGame()"><\/script>
</head>
<body>
  <div id="game-container"></div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; frame-ancestors 'self';`,
      },
    });
  } catch (error) {
    console.error('Error loading game:', error);
    return new NextResponse('Error loading game', { status: 500 });
  }
}
