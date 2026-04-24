'use client';

import { useEffect, useState } from 'react';

export default function LandingCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  const [isPriorityActive, setIsPriorityActive] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const priorityDeadline = new Date('2026-04-16T00:59:00-03:00');
      const generalDeadline = new Date('2025-11-20T23:59:59-03:00');

      let targetDate: Date;

      if (now < priorityDeadline) {
        targetDate = priorityDeadline;
        setIsPriorityActive(true);
      } else if (now < generalDeadline) {
        targetDate = generalDeadline;
        setIsPriorityActive(false);
      } else {
        setTimeLeft('');
        return;
      }

      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTimeLeft(
          JSON.stringify({
            days: String(days).padStart(2, '0'),
            hours: String(hours).padStart(2, '0'),
            minutes: String(minutes).padStart(2, '0'),
            seconds: String(seconds).padStart(2, '0'),
          }),
        );
      } else {
        setTimeLeft('');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted || !timeLeft) {
    return null;
  }

  return (
    <>
      <p
        className={`text-muted-foreground text-sm ${!isPriorityActive ? 'line-through' : ''}`}
      >
        priority deadline 16.apr
      </p>
      <p
        className={`text-muted-foreground text-sm ${isPriorityActive ? '' : ''}`}
      >
        general deadline 20.nov
      </p>
      {timeLeft &&
        (() => {
          const time = JSON.parse(timeLeft);
          return (
            <div className="flex items-center gap-1">
              <span className="font-mono text-muted-foreground text-sm tabular-nums">
                <span className="text-primary">{time.days}</span>d
                <span className="text-primary">{time.hours}</span>h
                <span className="text-primary">{time.minutes}</span>m
                <span className="text-primary">{time.seconds}</span>s
              </span>
              <span className="text-muted-foreground text-sm">
                for next deadline
              </span>
            </div>
          );
        })()}
    </>
  );
}
