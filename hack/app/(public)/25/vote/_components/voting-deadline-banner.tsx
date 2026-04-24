'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface VotingDeadlineBannerProps {
  votingStartsAt: Date | null;
  votingEndsAt: Date | null;
}

export function VotingDeadlineBanner({
  votingStartsAt,
  votingEndsAt,
}: VotingDeadlineBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [status, setStatus] = useState<'not-started' | 'active' | 'ended'>(
    'active',
  );

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();

      if (votingStartsAt && now < votingStartsAt) {
        setStatus('not-started');
        const diff = votingStartsAt.getTime() - now.getTime();
        setTimeRemaining(formatTimeDifference(diff));
      } else if (votingEndsAt && now < votingEndsAt) {
        setStatus('active');
        const diff = votingEndsAt.getTime() - now.getTime();
        setTimeRemaining(formatTimeDifference(diff));
      } else {
        setStatus('ended');
        setTimeRemaining('');
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [votingStartsAt, votingEndsAt]);

  if (!votingStartsAt && !votingEndsAt) {
    return null;
  }

  if (status === 'ended') {
    return null;
  }

  if (status === 'not-started') {
    return (
      <div className="mb-6 flex items-center gap-3 border-2 border-yellow-500/20 bg-yellow-500/10 p-4">
        <Clock className="h-5 w-5 text-yellow-500" />
        <div>
          <p className="font-bold font-title text-lg text-yellow-500">
            La votación comienza en {timeRemaining}
          </p>
          <p className="text-sm text-yellow-500/80">
            Podrás votar cuando se abra el período de votación
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 flex items-center gap-3 border-2 border-primary/20 bg-primary/10 p-4">
      <Clock className="h-5 w-5 text-primary" />
      <div>
        <p className="font-bold font-title text-lg text-primary">
          La votación termina en {timeRemaining}
        </p>
        <p className="text-primary/80 text-sm">
          Vota por tu proyecto favorito antes de que se acabe el tiempo
        </p>
      </div>
    </div>
  );
}

function formatTimeDifference(diff: number): string {
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
