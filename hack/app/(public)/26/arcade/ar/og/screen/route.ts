import { NextResponse } from 'next/server';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Platanus Hack 26 – Arcade Challenge</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .screen {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0;
      padding: 48px 32px 32px;
      background: radial-gradient(ellipse at 50% 40%, #1a1a2e 0%, #0a0a0f 60%, #000 100%);
      font-family: 'Press Start 2P', monospace;
      position: relative;
    }

    .scanlines {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 3px,
        rgba(0,0,0,0.15) 3px,
        rgba(0,0,0,0.15) 6px
      );
      pointer-events: none;
      z-index: 10;
    }

    .top-text {
      font-size: 18px;
      color: #e1ff00;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      margin-bottom: 24px;
      text-shadow: 0 0 16px #e1ff00bb;
    }

    .title {
      font-size: 72px;
      color: #ffffff;
      letter-spacing: 0.04em;
      line-height: 1.1;
      text-align: center;
      text-shadow:
        0 0 30px rgba(255,255,255,0.5),
        0 0 60px rgba(225,255,0,0.15);
      margin-bottom: 16px;
    }

    .title span {
      color: #e1ff00;
      text-shadow:
        0 0 20px #e1ff00cc,
        0 0 40px #e1ff0066;
    }

    .subtitle {
      font-size: 22px;
      color: #888888;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      margin-bottom: 48px;
      text-shadow: 0 0 10px rgba(136,136,136,0.3);
    }

    .arcade-label {
      font-size: 32px;
      color: #e1ff00;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      text-shadow:
        0 0 20px #e1ff00cc,
        0 0 40px #e1ff0077;
      border: 3px solid #e1ff00;
      padding: 16px 32px;
      margin-bottom: 24px;
      box-shadow: 0 0 18px #e1ff0055, inset 0 0 18px #e1ff0011;
    }

    .submit-text {
      font-size: 20px;
      color: #ff6a00;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 36px;
      text-shadow: 0 0 16px #ff6a00cc, 0 0 32px #ff6a0066;
    }

    .logos {
      display: flex;
      align-items: center;
      gap: 40px;
      opacity: 0.95;
    }

    .logos img {
      height: 44px;
    }

    .logos img:first-child {
      height: 60px;
    }

    .logo-sep {
      width: 2px;
      height: 36px;
      background: rgba(255,255,255,0.2);
    }
  </style>
</head>
<body>
  <div class="screen">
    <div class="scanlines"></div>
    <div class="top-text">Buenos Aires &nbsp;·&nbsp; 8–10 MAY</div>
    <div class="title">PLATANUS<br><span>HACK&thinsp;26</span></div>
    <div class="arcade-label">Arcade Challenge</div>
    <div class="submit-text">Submit until Apr 26</div>
    <div class="logos">
      <img src="/assets/logos/platanus.svg" alt="Platanus" />
      <div class="logo-sep"></div>
      <img src="/assets/logos/paisanos.svg" alt="Paisanos" />
    </div>
  </div>
</body>
</html>`;

export async function GET() {
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy':
        "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self'; frame-ancestors *;",
    },
  });
}
