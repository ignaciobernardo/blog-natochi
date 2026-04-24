import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { arcadeGames } from '@/src/lib/db/schema';

async function patchGameWithGamepad() {
  // Fetch the game
  const game = await db
    .select()
    .from(arcadeGames)
    .where(eq(arcadeGames.slug, 'battle-arena'))
    .then((rows) => rows[0]);

  if (!game) {
    console.error('Game not found: battle-arena');
    process.exit(1);
  }

  console.log(`Found game: ${game.title} by ${game.githubUsername}`);

  // Gamepad initialization code to inject
  const gamepadInitCode = `
// ===== GAMEPAD SUPPORT =====
let gamepadP1 = null;
let gamepadP2 = null;
let gamepadDeadzone = 0.3;

// Gamepad button mappings (standard layout)
const GAMEPAD_BUTTONS = {
  A: 0,      // Bottom button (shoot)
  B: 1,      // Right button (special)
  X: 2,      // Left button
  Y: 3,      // Top button
  LB: 4,     // Left bumper
  RB: 5,     // Right bumper
  LT: 6,     // Left trigger
  RT: 7,     // Right trigger
  SELECT: 8, // Back/Select
  START: 9,  // Start
  L3: 10,    // Left stick press
  R3: 11,    // Right stick press
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15
};

// Gamepad axis mappings
const GAMEPAD_AXES = {
  LEFT_X: 0,
  LEFT_Y: 1,
  RIGHT_X: 2,
  RIGHT_Y: 3
};

function updateGamepads() {
  const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  gamepadP1 = gamepads[0] || null;
  gamepadP2 = gamepads[1] || null;
}

function getGamepadAxis(gamepad, axis) {
  if (!gamepad) return 0;
  const value = gamepad.axes[axis] || 0;
  return Math.abs(value) > gamepadDeadzone ? value : 0;
}

function isGamepadButtonDown(gamepad, buttonIndex) {
  if (!gamepad) return false;
  const button = gamepad.buttons[buttonIndex];
  return button ? button.pressed : false;
}

function isGamepadButtonJustPressed(gamepad, buttonIndex, prevState) {
  if (!gamepad) return false;
  const button = gamepad.buttons[buttonIndex];
  const isPressed = button ? button.pressed : false;
  const wasPressed = prevState[buttonIndex] || false;
  return isPressed && !wasPressed;
}

function saveGamepadState(gamepad) {
  if (!gamepad) return {};
  const state = {};
  for (let i = 0; i < gamepad.buttons.length; i++) {
    state[i] = gamepad.buttons[i].pressed;
  }
  return state;
}
`;

  // Patch MenuScene to add gamepad support
  const menuScenePatch = `
    // Gamepad state for menu
    this.prevGamepadState1 = {};
    this.prevGamepadState2 = {};
`;

  // Patch MenuScene update to handle gamepad input
  const menuUpdatePatch = `
    // Gamepad input for menu
    updateGamepads();

    if (gamepadP1 && time - this.lastInput > 150) {
      const axisY = getGamepadAxis(gamepadP1, GAMEPAD_AXES.LEFT_Y);
      const dpadUp = isGamepadButtonDown(gamepadP1, GAMEPAD_BUTTONS.DPAD_UP);
      const dpadDown = isGamepadButtonDown(gamepadP1, GAMEPAD_BUTTONS.DPAD_DOWN);

      if (axisY < -0.5 || dpadUp) {
        this.selectedOption = 0;
        this.lastInput = time;
      } else if (axisY > 0.5 || dpadDown) {
        this.selectedOption = 1;
        this.lastInput = time;
      }

      if (isGamepadButtonJustPressed(gamepadP1, GAMEPAD_BUTTONS.A, this.prevGamepadState1) ||
          isGamepadButtonJustPressed(gamepadP1, GAMEPAD_BUTTONS.START, this.prevGamepadState1)) {
        this.startGame();
        this.lastInput = time;
      }

      this.prevGamepadState1 = saveGamepadState(gamepadP1);
    }
`;

  // Patch GameScene create to initialize gamepad state
  const gameSceneCreatePatch = `
    // Initialize gamepad states
    this.prevGamepadState1 = {};
    this.prevGamepadState2 = {};
    this.gamepadShoot1Pressed = false;
    this.gamepadShoot2Pressed = false;
    this.gamepadSpecial1Pressed = false;
    this.gamepadSpecial2Pressed = false;
`;

  // Patch updatePlayer to handle gamepad input
  // Note: We need to define lastShot/shootCooldown BEFORE using them
  const updatePlayerGamepadPatch = `
    // Define cooldown variables first (needed for both gamepad and keyboard)
    const lastShot = playerNum === 1 ? this.lastShot1 : this.lastShot2;
    const shootCooldown = player.normalShotCooldown || 300;

    // Gamepad input
    updateGamepads();
    const gamepad = playerNum === 1 ? gamepadP1 : gamepadP2;

    if (gamepad) {
      // Movement from left stick
      const axisX = getGamepadAxis(gamepad, GAMEPAD_AXES.LEFT_X);
      const axisY = getGamepadAxis(gamepad, GAMEPAD_AXES.LEFT_Y);

      // D-pad movement
      const dpadUp = isGamepadButtonDown(gamepad, GAMEPAD_BUTTONS.DPAD_UP);
      const dpadDown = isGamepadButtonDown(gamepad, GAMEPAD_BUTTONS.DPAD_DOWN);
      const dpadLeft = isGamepadButtonDown(gamepad, GAMEPAD_BUTTONS.DPAD_LEFT);
      const dpadRight = isGamepadButtonDown(gamepad, GAMEPAD_BUTTONS.DPAD_RIGHT);

      if (Math.abs(axisX) > 0 || Math.abs(axisY) > 0) {
        moveX = axisX;
        moveY = axisY;
      } else {
        if (dpadUp) moveY = -1;
        if (dpadDown) moveY = 1;
        if (dpadLeft) moveX = -1;
        if (dpadRight) moveX = 1;
      }

      // Shooting with A button or Right Trigger
      const shootPressed = isGamepadButtonDown(gamepad, GAMEPAD_BUTTONS.A) ||
                          isGamepadButtonDown(gamepad, GAMEPAD_BUTTONS.RT);
      const prevShootPressed = playerNum === 1 ? this.gamepadShoot1Pressed : this.gamepadShoot2Pressed;

      if (shootPressed && !prevShootPressed && time - lastShot > shootCooldown) {
        this.shootPlayer(player, false);
        if (playerNum === 1) this.lastShot1 = time;
        else this.lastShot2 = time;
      }

      if (playerNum === 1) this.gamepadShoot1Pressed = shootPressed;
      else this.gamepadShoot2Pressed = shootPressed;

      // Special with B button or Right Bumper
      const specialPressed = isGamepadButtonDown(gamepad, GAMEPAD_BUTTONS.B) ||
                            isGamepadButtonDown(gamepad, GAMEPAD_BUTTONS.RB);
      const prevSpecialPressed = playerNum === 1 ? this.gamepadSpecial1Pressed : this.gamepadSpecial2Pressed;

      if (specialPressed && !prevSpecialPressed && player.currentSpecialCooldown <= 0) {
        this.shootPlayer(player, true);
        player.currentSpecialCooldown = player.specialCooldown;
      }

      if (playerNum === 1) this.gamepadSpecial1Pressed = specialPressed;
      else this.gamepadSpecial2Pressed = specialPressed;
    }
`;

  // Patch pause toggle to support gamepad
  const pauseGamepadPatch = `
    // Gamepad pause support
    updateGamepads();
    if (gamepadP1 && isGamepadButtonJustPressed(gamepadP1, GAMEPAD_BUTTONS.START, this.prevGamepadState1)) {
      this.togglePause();
    }
    this.prevGamepadState1 = saveGamepadState(gamepadP1);
`;

  let patchedCode = game.code;

  // 1. Add gamepad initialization at the top (after DEBUG settings)
  const debugSettingsEnd = patchedCode.indexOf('let CONTROLS_CONFIG = {};');
  if (debugSettingsEnd !== -1) {
    patchedCode =
      patchedCode.slice(0, debugSettingsEnd) +
      gamepadInitCode +
      '\n' +
      patchedCode.slice(debugSettingsEnd);
  }

  // 2. Patch MenuScene create to init gamepad state
  const menuCreateEnd = patchedCode.indexOf(
    '// Prevent multiple rapid selections',
  );
  if (menuCreateEnd !== -1) {
    patchedCode =
      patchedCode.slice(0, menuCreateEnd) +
      menuScenePatch +
      '\n    ' +
      patchedCode.slice(menuCreateEnd);
  }

  // 3. Patch MenuScene update to handle gamepad
  const menuKeyboardInput = patchedCode.indexOf(
    'if (time - this.lastInput > 100) {',
  );
  if (menuKeyboardInput !== -1) {
    // Find the closing brace of this if block
    let braceCount = 0;
    let endIndex = menuKeyboardInput;
    let foundStart = false;

    for (let i = menuKeyboardInput; i < patchedCode.length; i++) {
      if (patchedCode[i] === '{') {
        braceCount++;
        foundStart = true;
      } else if (patchedCode[i] === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          endIndex = i + 1;
          break;
        }
      }
    }

    patchedCode =
      patchedCode.slice(0, endIndex) +
      '\n\n' +
      menuUpdatePatch +
      patchedCode.slice(endIndex);
  }

  // 4. Patch GameScene create to init gamepad state
  // We need to find GameScene's keyboard init, not MenuScene's
  // GameScene has: w: 'W', a: 'A', s: 'S', d: 'D' etc
  // MenuScene has: w: Phaser.Input.Keyboard.KeyCodes.W, s:..., enter:...
  const gameSceneMarker = patchedCode.indexOf(
    'class GameScene extends Phaser.Scene',
  );
  const gameSceneControlsInit = patchedCode.indexOf(
    'this.keys = this.input.keyboard.addKeys({',
    gameSceneMarker,
  );
  if (gameSceneControlsInit !== -1) {
    // Find the end of this statement (look for }); after the keys object)
    const endIndex = patchedCode.indexOf('});', gameSceneControlsInit) + 3;
    patchedCode =
      patchedCode.slice(0, endIndex) +
      '\n\n' +
      gameSceneCreatePatch +
      patchedCode.slice(endIndex);
  }

  // 5. Patch updatePlayer to handle gamepad movement and shooting
  // Find the updatePlayer method and inject gamepad code after initial checks
  const updatePlayerMethod = patchedCode.indexOf(
    'updatePlayer(player, upKey, downKey, leftKey, rightKey, time, playerNum, shootKey, specialKey, altShootKey)',
  );
  if (updatePlayerMethod !== -1) {
    // Find "let moveX = 0, moveY = 0;"
    const moveInit = patchedCode.indexOf(
      'let moveX = 0, moveY = 0;',
      updatePlayerMethod,
    );
    if (moveInit !== -1) {
      const afterMoveInit = moveInit + 'let moveX = 0, moveY = 0;'.length;

      // Find the keyboard input section and replace/augment it
      const keyboardInputStart = patchedCode.indexOf(
        'if (upKey && upKey.isDown)',
        afterMoveInit,
      );
      if (keyboardInputStart !== -1) {
        // Insert gamepad code before keyboard code, so gamepad takes precedence when active
        patchedCode =
          patchedCode.slice(0, keyboardInputStart) +
          updatePlayerGamepadPatch +
          '\n\n    // Keyboard input (fallback)\n    ' +
          patchedCode.slice(keyboardInputStart);
      }
    }
  }

  // 5b. Remove duplicate lastShot/shootCooldown definitions from keyboard section
  // The original code has these after the keyboard movement, but we defined them above
  const duplicateLastShot = patchedCode.indexOf(
    'const lastShot = playerNum === 1 ? this.lastShot1 : this.lastShot2;',
    updatePlayerMethod,
  );
  if (duplicateLastShot !== -1) {
    // Find where this definition starts and remove it along with shootCooldown
    const lineEnd = patchedCode.indexOf('\n', duplicateLastShot);
    const shootCooldownLine = patchedCode.indexOf(
      'const shootCooldown = player.normalShotCooldown || 300;',
      lineEnd,
    );
    if (shootCooldownLine !== -1 && shootCooldownLine < lineEnd + 200) {
      const shootCooldownEnd = patchedCode.indexOf('\n', shootCooldownLine);
      // Remove both lines (keep the rest)
      patchedCode =
        patchedCode.slice(0, duplicateLastShot) +
        '// Variables moved to gamepad section above' +
        patchedCode.slice(shootCooldownEnd);
    }
  }

  // 6. Add gamepad pause check in update loop
  const pauseHandling = patchedCode.indexOf('if (this.isPaused) {');
  if (pauseHandling !== -1) {
    patchedCode =
      patchedCode.slice(0, pauseHandling) +
      pauseGamepadPatch +
      '\n\n    ' +
      patchedCode.slice(pauseHandling);
  }

  // Update the game in database
  await db
    .update(arcadeGames)
    .set({
      arcadeCode: patchedCode,
      updatedAt: new Date(),
    })
    .where(eq(arcadeGames.slug, 'battle-arena'));

  console.log('✅ Successfully patched game with gamepad support!');
  console.log(`Original code length: ${game.code.length}`);
  console.log(`Patched code length: ${patchedCode.length}`);
  console.log('\nGamepad mappings:');
  console.log('  - Left Stick / D-Pad: Movement');
  console.log('  - A Button / RT: Shoot');
  console.log('  - B Button / RB: Special');
  console.log('  - Start: Pause / Menu Select');
}

patchGameWithGamepad()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error patching game:', err);
    process.exit(1);
  });
