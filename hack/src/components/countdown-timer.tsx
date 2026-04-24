'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
}

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now();
      const target = targetDate.getTime();
      const difference = target - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="flex gap-2">
        {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
          <div
            key={unit}
            className="flex flex-col items-center rounded-lg border bg-background/50 p-3 backdrop-blur-sm"
          >
            <span className="font-bold text-2xl">--</span>
            <span className="text-muted-foreground text-xs">--</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <div className="flex flex-col items-center rounded-lg border bg-background/50 p-3 backdrop-blur-sm">
        <span className="font-bold text-2xl tabular-nums">{timeLeft.days}</span>
        <span className="text-muted-foreground text-xs">
          {timeLeft.days === 1 ? 'day' : 'days'}
        </span>
      </div>
      <div className="flex flex-col items-center rounded-lg border bg-background/50 p-3 backdrop-blur-sm">
        <span className="font-bold text-2xl tabular-nums">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-muted-foreground text-xs">
          {timeLeft.hours === 1 ? 'hour' : 'hours'}
        </span>
      </div>
      <div className="flex flex-col items-center rounded-lg border bg-background/50 p-3 backdrop-blur-sm">
        <span className="font-bold text-2xl tabular-nums">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-muted-foreground text-xs">min</span>
      </div>
      <div className="flex flex-col items-center rounded-lg border bg-background/50 p-3 backdrop-blur-sm">
        <span className="font-bold text-2xl tabular-nums">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-muted-foreground text-xs">sec</span>
      </div>
    </div>
  );
}
