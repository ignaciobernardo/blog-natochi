'use client';

import '../_components/arcade-effects.css';
import { BackgroundSnake } from '../_components/background-snake';

export default function ArcadeOGPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div
        className="crt-screen crt-flicker relative flex items-center justify-center overflow-hidden border border-white/20"
        style={{
          width: '1200px',
          height: '630px',
        }}
      >
        <BackgroundSnake startPosition={{ x: 300, y: 250 }} />
        <div className="relative z-20 flex flex-col items-center justify-center gap-6 px-12">
          <div
            className="text-center font-bold font-logo text-8xl text-foreground/90 uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-logo)' }}
          >
            Platanus Hack 25
          </div>
          <div
            className="crt-glow text-center font-bold font-logo text-6xl text-primary uppercase tracking-wider"
            style={{ fontFamily: 'var(--font-logo)' }}
          >
            Arcade Challenge
          </div>
          <div className="mt-2 text-center font-mono text-2xl text-foreground/70 uppercase tracking-wide">
            Vibecode the hackathon arcade, get 100 usd
          </div>
        </div>

        {/* Corner markers for screenshot guidance */}
        <div className="pointer-events-none absolute inset-0 z-50">
          <div className="absolute top-0 left-0 h-12 w-12 border-2 border-white/30 border-r-0 border-b-0" />
          <div className="absolute top-0 right-0 h-12 w-12 border-2 border-white/30 border-b-0 border-l-0" />
          <div className="absolute bottom-0 left-0 h-12 w-12 border-2 border-white/30 border-t-0 border-r-0" />
          <div className="absolute right-0 bottom-0 h-12 w-12 border-2 border-white/30 border-t-0 border-l-0" />
        </div>
      </div>
    </div>
  );
}
