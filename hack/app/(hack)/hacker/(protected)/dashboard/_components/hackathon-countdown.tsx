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

interface HackathonCountdownProps {
  startsAt: Date;
  eventName: string;
}

export function HackathonCountdown({
  startsAt,
  eventName,
}: HackathonCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(startsAt),
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(startsAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startsAt]);

  if (!mounted) {
    return (
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm">
        <h2 className="mb-4 font-bold font-title text-2xl text-primary">
          Cuenta Regresiva
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {['Días', 'Horas', 'Minutos', 'Segundos'].map((label) => (
            <div key={label} className="text-center">
              <div className="border-2 border-primary bg-background p-4">
                <div className="font-bold font-mono text-3xl text-primary">
                  00
                </div>
              </div>
              <div className="mt-2 font-mono text-primary/70 text-xs uppercase">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isStarted =
    timeRemaining.days === 0 &&
    timeRemaining.hours === 0 &&
    timeRemaining.minutes === 0 &&
    timeRemaining.seconds === 0;

  return (
    <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm">
      <h2 className="mb-4 font-bold font-title text-2xl text-primary">
        {isStarted ? '¡El hackathon ha comenzado!' : 'Cuenta Regresiva'}
      </h2>
      {!isStarted ? (
        <>
          <p className="mb-4 font-mono text-primary/70 text-sm">
            Tiempo restante para {eventName}
          </p>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="border-2 border-primary bg-background p-4">
                <div className="font-bold font-mono text-3xl text-primary">
                  {String(timeRemaining.days).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-2 font-mono text-primary/70 text-xs uppercase">
                Días
              </div>
            </div>
            <div className="text-center">
              <div className="border-2 border-primary bg-background p-4">
                <div className="font-bold font-mono text-3xl text-primary">
                  {String(timeRemaining.hours).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-2 font-mono text-primary/70 text-xs uppercase">
                Horas
              </div>
            </div>
            <div className="text-center">
              <div className="border-2 border-primary bg-background p-4">
                <div className="font-bold font-mono text-3xl text-primary">
                  {String(timeRemaining.minutes).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-2 font-mono text-primary/70 text-xs uppercase">
                Minutos
              </div>
            </div>
            <div className="text-center">
              <div className="border-2 border-primary bg-background p-4">
                <div className="font-bold font-mono text-3xl text-primary">
                  {String(timeRemaining.seconds).padStart(2, '0')}
                </div>
              </div>
              <div className="mt-2 font-mono text-primary/70 text-xs uppercase">
                Segundos
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="font-mono text-primary/70 text-sm">
          ¡Es hora de crear algo increíble!
        </p>
      )}
    </div>
  );
}
