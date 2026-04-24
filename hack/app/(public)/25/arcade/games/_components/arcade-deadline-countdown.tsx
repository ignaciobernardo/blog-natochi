'use client';

import { useEffect, useState } from 'react';

export function ArcadeDeadlineCountdown() {
  const calculateTimeLeft = () => {
    // Deadline: November 10, 2025 23:59 Chile time (CLT = UTC-3)
    const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
    const now = Date.now();
    const difference = eventDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.isExpired) {
    return (
      <div className="font-bold font-mono text-red-500 text-xs sm:text-sm md:text-base">
        plazo expirado
      </div>
    );
  }

  return (
    <div className="font-bold font-mono text-primary text-xs sm:text-sm md:text-base">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </div>
  );
}
