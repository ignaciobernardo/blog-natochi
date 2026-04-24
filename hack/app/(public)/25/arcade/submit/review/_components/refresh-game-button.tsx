'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { refreshGameAction } from '../_actions/refresh-game.action';

interface RefreshGameButtonProps {
  gameId: string;
}

function RefreshGameButtonContent({ gameId }: RefreshGameButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const result = await refreshGameAction(gameId);

      if (result.success) {
        setMessage({
          text: 'Game refreshed successfully! Latest commit and code updated.',
          type: 'success',
        });
      } else {
        setMessage({
          text: result.message || 'Failed to refresh game',
          type: 'error',
        });
      }
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : 'An error occurred',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleRefresh}
        disabled={isLoading}
        variant="outline"
        className="w-full border-primary text-primary hover:bg-primary/10"
      >
        {isLoading ? 'Refreshing...' : '🔄 Refresh from Repository'}
      </Button>
      {message && (
        <div
          className={`rounded border-2 px-3 py-2 text-center text-xs ${
            message.type === 'success'
              ? 'border-green-500/50 bg-green-500/5'
              : 'border-red-500/50 bg-red-500/5'
          }`}
        >
          <p
            className={`${
              message.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {message.text}
          </p>
        </div>
      )}
    </div>
  );
}

export function RefreshGameButton({ gameId }: RefreshGameButtonProps) {
  return <RefreshGameButtonContent gameId={gameId} />;
}
