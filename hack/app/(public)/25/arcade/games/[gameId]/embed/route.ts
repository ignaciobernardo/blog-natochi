import { NextResponse } from 'next/server';
import { isDevelopmentEnvironment } from '@/src/lib/constants';
import {
  getArcadeGameFlatById,
  getArcadeGameVersionById,
} from '@/src/queries/arcade-games';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(gameId)) {
    return new NextResponse('Invalid game ID format', { status: 400 });
  }

  try {
    // gameId here can be a version ID or a game ID
    const version = await getArcadeGameVersionById(gameId);
    const game = version
      ? { codeMinified: version.codeMinified, title: version.title }
      : await getArcadeGameFlatById(gameId);

    if (!game) {
      return new NextResponse('Game not found', { status: 404 });
    }

    // Use minified code for better performance
    const gameCode = game.codeMinified;

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
    window.initGame = function() {
      console.log('Phaser loaded, initializing game...');
      try {
        ${gameCode}
        console.log('Game initialized successfully');
        
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
              const scale = Math.min(scaleX, scaleY, 1.5); // Scale to fit, max 1.5x
              
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

    const frameAncestors = isDevelopmentEnvironment
      ? 'frame-ancestors http://localhost:3000 https://hack.platan.us https://*.platan.us;'
      : 'frame-ancestors https://hack.platan.us https://*.platan.us;';

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; ${frameAncestors}`,
      },
    });
  } catch (error) {
    console.error('Error loading game:', error);
    return new NextResponse('Error loading game', { status: 500 });
  }
}
