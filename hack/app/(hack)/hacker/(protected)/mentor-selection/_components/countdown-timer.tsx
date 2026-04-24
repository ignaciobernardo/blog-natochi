'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetTime: Date;
  onCountdownComplete: () => void;
  onTimeChanged: (newTime: Date) => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

function calculateTimeRemaining(targetTime: Date): TimeRemaining {
  const total = targetTime.getTime() - Date.now();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

export function CountdownTimer({
  targetTime,
  onCountdownComplete,
  onTimeChanged,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(targetTime),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetTime);
      setTimeRemaining(remaining);

      if (remaining.total <= 0) {
        clearInterval(interval);
        onCountdownComplete();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime, onCountdownComplete]);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/mentors/availability');
        if (response.ok) {
          const data = await response.json();
          if (data.mentorSelectionStartTime) {
            const newTime = new Date(data.mentorSelectionStartTime);
            if (newTime.getTime() !== targetTime.getTime()) {
              onTimeChanged(newTime);
            }
          }
        }
      } catch (error) {
        console.error('Error polling for time changes:', error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [targetTime, onTimeChanged]);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
      <div className="space-y-6">
        <div className="border-primary/20 border-b pb-4">
          <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
            La selección de mentores comienza pronto
          </h2>
        </div>
        <div className="border-primary border-l-4 pl-4">
          <p className="font-title text-primary/70 text-sm sm:text-base">
            Podrás elegir tu mentor cuando el contador llegue a cero
          </p>
        </div>
        <div className="flex justify-center gap-4 pt-4">
          {timeRemaining.days > 0 && (
            <div className="flex flex-col items-center">
              <div className="rounded-lg bg-primary px-6 py-4 font-bold font-mono text-4xl text-primary-foreground">
                {formatNumber(timeRemaining.days)}
              </div>
              <span className="mt-2 text-muted-foreground text-sm">
                {timeRemaining.days === 1 ? 'día' : 'días'}
              </span>
            </div>
          )}

          <div className="flex flex-col items-center">
            <div className="rounded-lg bg-primary px-6 py-4 font-bold font-mono text-4xl text-primary-foreground">
              {formatNumber(timeRemaining.hours)}
            </div>
            <span className="mt-2 text-muted-foreground text-sm">horas</span>
          </div>

          <div className="flex items-center font-bold text-4xl">:</div>

          <div className="flex flex-col items-center">
            <div className="rounded-lg bg-primary px-6 py-4 font-bold font-mono text-4xl text-primary-foreground">
              {formatNumber(timeRemaining.minutes)}
            </div>
            <span className="mt-2 text-muted-foreground text-sm">minutos</span>
          </div>

          <div className="flex items-center font-bold text-4xl">:</div>

          <div className="flex flex-col items-center">
            <div className="rounded-lg bg-primary px-6 py-4 font-bold font-mono text-4xl text-primary-foreground">
              {formatNumber(timeRemaining.seconds)}
            </div>
            <span className="mt-2 text-muted-foreground text-sm">segundos</span>
          </div>
        </div>
      </div>
    </div>
  );
}
