'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const ARCADE_AR_DEADLINE = new Date('2026-04-26T23:59:59-03:00');

function formatCountdown(now: Date) {
  const diff = ARCADE_AR_DEADLINE.getTime() - now.getTime();

  if (diff <= 0) {
    return '0D 0H 0M 0S';
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return `${days}D ${hours}H ${minutes}M ${seconds}S`;
}

export function SubmitGameButton() {
  const [countdown, setCountdown] = useState(() => formatCountdown(new Date()));

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(formatCountdown(new Date()));
    };

    updateCountdown();

    const intervalId = window.setInterval(updateCountdown, 1_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <Link
      href="/26/arcade/ar"
      className="hover:-translate-y-0.5 inline-flex min-w-40 items-center justify-between gap-3 border border-primary/35 bg-primary px-4 py-3 text-left text-background shadow-[4px_4px_0px_rgba(0,0,0,0.45),0_0_0_0_rgba(217,255,0,0.32)] transition-all duration-200 ease-out [animation:arcadeSubmitPulse_1.8s_ease-in-out_infinite] hover:translate-x-0.5 hover:scale-[1.02] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.55),0_0_0_8px_rgba(217,255,0,0.14)]"
    >
      <span className="font-title text-sm uppercase tracking-[0.16em]">
        Sube tu juego
      </span>
      <span
        suppressHydrationWarning
        className="font-mono text-[11px] text-background/75 uppercase tracking-[0.08em]"
      >
        {countdown}
      </span>
    </Link>
  );
}
