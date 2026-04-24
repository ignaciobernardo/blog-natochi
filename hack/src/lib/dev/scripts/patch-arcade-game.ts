import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { arcadeGames } from '@/src/lib/db/schema';

async function patchArcadeGame() {
  // Get aberguecio's game
  const game = await db.query.arcadeGames.findFirst({
    where: eq(arcadeGames.githubUsername, 'aberguecio'),
  });

  if (!game) {
    console.error('Game not found');
    process.exit(1);
  }

  console.log(`Found game: ${game.title} by ${game.githubUsername}`);

  let patchedCode = game.code;

  // 1. Set ARCADE_MODE to true
  patchedCode = patchedCode.replace(
    'const ARCADE_MODE = false;',
    'const ARCADE_MODE = true;',
  );

  // 2. Add gamepad support in GameScene create() method
  // Find the end of the create() method's control setup and add gamepad initialization
  const gamepadInitCode = `
    // Gamepad support for arcade cabinets
    this.gamepad1 = null;
    this.gamepad2 = null;

    // Listen for gamepad connections
    this.input.gamepad.once('connected', (pad) => {
      console.log('Gamepad connected:', pad.index, pad.id);
      if (pad.index === 0) {
        this.gamepad1 = pad;
      } else if (pad.index === 1) {
        this.gamepad2 = pad;
      }
    });

    // Check for already connected gamepads
    if (this.input.gamepad.total > 0) {
      const pads = this.input.gamepad.getAll();
      pads.forEach(pad => {
        if (pad.index === 0) this.gamepad1 = pad;
        else if (pad.index === 1) this.gamepad2 = pad;
      });
    }

    // Track previous button states for JustDown detection
    this.prevGamepadState = {
      p1A: false, p1B: false, p1Start: false,
      p2A: false, p2B: false, p2Start: false
    };
`;

  // Insert after the pause system setup
  patchedCode = patchedCode.replace(
    "this.input.keyboard.on('keydown-ENTER', () => {\n      this.togglePause();\n    });",
    `this.input.keyboard.on('keydown-ENTER', () => {
      this.togglePause();
    });
${gamepadInitCode}`,
  );

  // 3. Modify updatePlayer to also check gamepad input
  // We need to modify the movement and shooting logic

  // Add helper function for gamepad button "just pressed" detection
  const gamepadHelperCode = `
  // Helper: Check if gamepad button was just pressed (rising edge)
  isGamepadButtonJustDown(gamepad, buttonName, prevStateKey) {
    if (!gamepad) return false;
    const isDown = gamepad[buttonName];
    const wasDown = this.prevGamepadState[prevStateKey];
    this.prevGamepadState[prevStateKey] = isDown;
    return isDown && !wasDown;
  }
`;

  // Insert before updatePlayer method
  patchedCode = patchedCode.replace(
    '  updatePlayer(player, upKey, downKey, leftKey, rightKey, time, playerNum, shootKey, specialKey, altShootKey) {',
    `${gamepadHelperCode}
  updatePlayer(player, upKey, downKey, leftKey, rightKey, time, playerNum, shootKey, specialKey, altShootKey) {`,
  );

  // 4. Modify the movement section in updatePlayer to include gamepad
  const originalMovement = `    let moveX = 0, moveY = 0;
    if (upKey && upKey.isDown) moveY = -1;
    if (downKey && downKey.isDown) moveY = 1;
    if (leftKey && leftKey.isDown) moveX = -1;
    if (rightKey && rightKey.isDown) moveX = 1;`;

  const patchedMovement = `    let moveX = 0, moveY = 0;

    // Keyboard input
    if (upKey && upKey.isDown) moveY = -1;
    if (downKey && downKey.isDown) moveY = 1;
    if (leftKey && leftKey.isDown) moveX = -1;
    if (rightKey && rightKey.isDown) moveX = 1;

    // Gamepad input (override if gamepad is connected and being used)
    const gamepad = playerNum === 1 ? this.gamepad1 : this.gamepad2;
    if (gamepad) {
      // D-pad
      if (gamepad.up) moveY = -1;
      if (gamepad.down) moveY = 1;
      if (gamepad.left) moveX = -1;
      if (gamepad.right) moveX = 1;

      // Left stick (with deadzone of 0.2)
      const deadzone = 0.2;
      if (gamepad.leftStick) {
        if (Math.abs(gamepad.leftStick.x) > deadzone) {
          moveX = gamepad.leftStick.x > 0 ? 1 : -1;
        }
        if (Math.abs(gamepad.leftStick.y) > deadzone) {
          moveY = gamepad.leftStick.y > 0 ? 1 : -1;
        }
      }
    }`;

  patchedCode = patchedCode.replace(originalMovement, patchedMovement);

  // 5. Modify shooting to include gamepad A button
  const originalShooting = `    // Shooting (Q or R for P1, U or P for P2)
    const lastShot = playerNum === 1 ? this.lastShot1 : this.lastShot2;
    const shootCooldown = player.normalShotCooldown || 300;
    if ((Phaser.Input.Keyboard.JustDown(shootKey) || (altShootKey && Phaser.Input.Keyboard.JustDown(altShootKey))) && time - lastShot > shootCooldown) {
      this.shootPlayer(player, false);
      if (playerNum === 1) this.lastShot1 = time;
      else this.lastShot2 = time;
    }

    if (Phaser.Input.Keyboard.JustDown(specialKey) && player.currentSpecialCooldown <= 0) {
      this.shootPlayer(player, true);
      player.currentSpecialCooldown = player.specialCooldown;
    }`;

  const patchedShooting = `    // Shooting (Q or R for P1, U or P for P2, or Gamepad A)
    const lastShot = playerNum === 1 ? this.lastShot1 : this.lastShot2;
    const shootCooldown = player.normalShotCooldown || 300;
    const gamepadShoot = playerNum === 1
      ? this.isGamepadButtonJustDown(this.gamepad1, 'A', 'p1A')
      : this.isGamepadButtonJustDown(this.gamepad2, 'A', 'p2A');

    if ((Phaser.Input.Keyboard.JustDown(shootKey) || (altShootKey && Phaser.Input.Keyboard.JustDown(altShootKey)) || gamepadShoot) && time - lastShot > shootCooldown) {
      this.shootPlayer(player, false);
      if (playerNum === 1) this.lastShot1 = time;
      else this.lastShot2 = time;
    }

    // Special (E for P1, O for P2, or Gamepad B)
    const gamepadSpecial = playerNum === 1
      ? this.isGamepadButtonJustDown(this.gamepad1, 'B', 'p1B')
      : this.isGamepadButtonJustDown(this.gamepad2, 'B', 'p2B');

    if ((Phaser.Input.Keyboard.JustDown(specialKey) || gamepadSpecial) && player.currentSpecialCooldown <= 0) {
      this.shootPlayer(player, true);
      player.currentSpecialCooldown = player.specialCooldown;
    }`;

  patchedCode = patchedCode.replace(originalShooting, patchedShooting);

  // 6. Add gamepad start button for pause in update loop
  // Find the pause check in update and add gamepad support
  const originalPauseCheck = `    // Handle pause menu
    if (this.isPaused) {
      this.drawPauseMenu();
      return;
    }`;

  const patchedPauseCheck = `    // Check gamepad start buttons for pause
    if (this.gamepad1 && this.isGamepadButtonJustDown(this.gamepad1, 'start', 'p1Start')) {
      this.togglePause();
    }
    if (this.gamepad2 && this.isGamepadButtonJustDown(this.gamepad2, 'start', 'p2Start')) {
      this.togglePause();
    }

    // Handle pause menu
    if (this.isPaused) {
      this.drawPauseMenu();
      return;
    }`;

  // Note: The 'start' button might be accessed differently, let's use the index
  // Actually in Phaser, it's gamepad.buttons[9] for start. Let me fix this.

  // Actually, looking at the Phaser API, we should use:
  // gamepad.buttons[9].pressed for Start button
  // Let me update the helper and the check

  // Update the patched code to use proper button indices
  patchedCode = patchedCode.replace(
    `  // Helper: Check if gamepad button was just pressed (rising edge)
  isGamepadButtonJustDown(gamepad, buttonName, prevStateKey) {
    if (!gamepad) return false;
    const isDown = gamepad[buttonName];
    const wasDown = this.prevGamepadState[prevStateKey];
    this.prevGamepadState[prevStateKey] = isDown;
    return isDown && !wasDown;
  }`,
    `  // Helper: Check if gamepad button was just pressed (rising edge)
  isGamepadButtonJustDown(gamepad, buttonName, prevStateKey) {
    if (!gamepad) return false;
    let isDown = false;

    // Handle named buttons (A, B, X, Y, L1, R1, etc.)
    if (buttonName === 'A') isDown = gamepad.A;
    else if (buttonName === 'B') isDown = gamepad.B;
    else if (buttonName === 'X') isDown = gamepad.X;
    else if (buttonName === 'Y') isDown = gamepad.Y;
    else if (buttonName === 'start') isDown = gamepad.buttons[9] && gamepad.buttons[9].pressed;
    else isDown = gamepad[buttonName];

    const wasDown = this.prevGamepadState[prevStateKey];
    this.prevGamepadState[prevStateKey] = isDown;
    return isDown && !wasDown;
  }`,
  );

  patchedCode = patchedCode.replace(originalPauseCheck, patchedPauseCheck);

  // 7. Also add gamepad support for menu navigation in MenuScene
  const menuGamepadInit = `
    // Gamepad support for menu
    this.menuGamepad = null;
    this.input.gamepad.once('connected', (pad) => {
      if (pad.index === 0) this.menuGamepad = pad;
    });
    if (this.input.gamepad.total > 0) {
      this.menuGamepad = this.input.gamepad.getPad(0);
    }
    this.prevMenuState = { up: false, down: false, start: false };
`;

  // Insert in MenuScene create after keyboard setup
  patchedCode = patchedCode.replace(
    `    // Prevent multiple rapid selections
    this.lastInput = 0;
  }

  update(time) {`,
    `    // Prevent multiple rapid selections
    this.lastInput = 0;
${menuGamepadInit}  }

  update(time) {`,
  );

  // Add gamepad navigation in menu update
  const menuNavOriginal = `    // Selection
    if (time - this.lastInput > 100) {
      if (this.keys.w.isDown) {
        this.selectedOption = 0;
        this.lastInput = time;
      } else if (this.keys.s.isDown) {
        this.selectedOption = 1;
        this.lastInput = time;
      } else if (this.keys.enter.isDown) {
        this.startGame();
        this.lastInput = time;
      }
    }`;

  const menuNavPatched = `    // Selection (keyboard + gamepad)
    if (time - this.lastInput > 100) {
      // Gamepad input
      let gpUp = false, gpDown = false, gpStart = false;
      if (this.menuGamepad) {
        gpUp = this.menuGamepad.up || (this.menuGamepad.leftStick && this.menuGamepad.leftStick.y < -0.5);
        gpDown = this.menuGamepad.down || (this.menuGamepad.leftStick && this.menuGamepad.leftStick.y > 0.5);
        gpStart = this.menuGamepad.A || (this.menuGamepad.buttons[9] && this.menuGamepad.buttons[9].pressed);
      }

      if (this.keys.w.isDown || gpUp) {
        this.selectedOption = 0;
        this.lastInput = time;
      } else if (this.keys.s.isDown || gpDown) {
        this.selectedOption = 1;
        this.lastInput = time;
      } else if (this.keys.enter.isDown || gpStart) {
        this.startGame();
        this.lastInput = time;
      }
    }`;

  patchedCode = patchedCode.replace(menuNavOriginal, menuNavPatched);

  // Update the game in the database
  await db
    .update(arcadeGames)
    .set({ arcadeCode: patchedCode })
    .where(eq(arcadeGames.id, game.id));

  console.log(`Successfully patched and stored arcade code for: ${game.title}`);
  console.log(`Code size: ${patchedCode.length} characters`);
}

patchArcadeGame()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
