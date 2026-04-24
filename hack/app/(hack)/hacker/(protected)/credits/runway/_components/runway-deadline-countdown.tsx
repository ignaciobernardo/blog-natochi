'use client';

import { useEffect, useState } from 'react';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = Date.now();
  const target = new Date(targetDate).getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export function RunwayDeadlineCountdown() {
  // November 21, 2025 at 15:00 Chile time (UTC-3)
  // Converting to UTC: 15:00 UTC-3 = 18:00 UTC
  const deadlineDate = new Date('2025-11-21T18:00:00Z');

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(deadlineDate),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadlineDate));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return (
      <div className="border-2 border-primary/20 bg-background p-4">
        <p className="mb-3 font-bold font-title text-primary text-sm">
          ⏰ PLAZO LÍMITE PARA REGISTRO
        </p>
        <p className="mb-3 font-mono text-primary/70 text-xs">
          21 de Noviembre, 15:00 (Chile)
        </p>
        <div className="grid grid-cols-4 gap-2">
          {['Días', 'Hrs', 'Min', 'Seg'].map((label) => (
            <div key={label} className="text-center">
              <div className="border-2 border-primary/20 bg-background p-2">
                <div className="font-bold font-mono text-lg text-primary">
                  00
                </div>
              </div>
              <div className="mt-1 font-mono text-primary/70 text-xs">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isExpired =
    timeRemaining.days === 0 &&
    timeRemaining.hours === 0 &&
    timeRemaining.minutes === 0 &&
    timeRemaining.seconds === 0;

  return (
    <div className="border-2 border-primary/20 bg-background p-4">
      <p className="mb-3 font-bold font-title text-primary text-sm">
        {isExpired ? '⏰ PLAZO EXPIRADO' : '⏰ PLAZO LÍMITE PARA REGISTRO'}
      </p>
      {!isExpired ? (
        <>
          <p className="mb-3 font-mono text-primary/70 text-xs">
            21 de Noviembre, 15:00 (Chile)
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center">
              <div className="border-2 border-primary/20 bg-background p-2">
                <div className="font-bold font-mono text-lg text-primary">
                  {String(timeRemaining.days).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-1 font-mono text-primary/70 text-xs">Días</div>
            </div>
            <div className="text-center">
              <div className="border-2 border-primary/20 bg-background p-2">
                <div className="font-bold font-mono text-lg text-primary">
                  {String(timeRemaining.hours).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-1 font-mono text-primary/70 text-xs">Hrs</div>
            </div>
            <div className="text-center">
              <div className="border-2 border-primary/20 bg-background p-2">
                <div className="font-bold font-mono text-lg text-primary">
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-1 font-mono text-primary/70 text-xs">Min</div>
            </div>
            <div className="text-center">
              <div className="border-2 border-primary/20 bg-background p-2">
                <div className="font-bold font-mono text-lg text-primary">
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-1 font-mono text-primary/70 text-xs">Seg</div>
            </div>
          </div>
        </>
      ) : (
        <p className="font-mono text-primary/70 text-xs">
          El plazo para registrar tu email ha expirado
        </p>
      )}
    </div>
  );
}
