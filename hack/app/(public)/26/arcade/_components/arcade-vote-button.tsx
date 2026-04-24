'use client';

import confetti from 'canvas-confetti';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { LogoGoogle } from '@/src/components/icons';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { signIn } from '@/src/lib/auth-client';
import { cn } from '@/src/lib/utils';
import { toggleArcadeGameVoteAction } from '../_actions/toggle-vote.action';

interface ArcadeVoteButtonProps {
  gameId: string;
  gameSlug: string;
  gameTitle: string;
  initialVoted: boolean;
  initialCount: number;
  isAuthenticated: boolean;
  hasGoogleAccount: boolean;
  votingOpen: boolean;
  compact?: boolean;
  className?: string;
}

export function ArcadeVoteButton({
  gameId,
  gameSlug,
  gameTitle,
  initialVoted,
  initialCount,
  isAuthenticated,
  hasGoogleAccount,
  votingOpen,
  compact: _compact = false,
  className,
}: ArcadeVoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);

  const handleVote = () => {
    if (!isAuthenticated || !hasGoogleAccount) {
      setShowModal(true);
      return;
    }

    if (!votingOpen) {
      toast.error('La votación no está disponible en este momento.');
      return;
    }

    const optimisticVoted = !voted;
    const optimisticCount = Math.max(0, count + (optimisticVoted ? 1 : -1));

    setVoted(optimisticVoted);
    setCount(optimisticCount);

    startTransition(async () => {
      const result = await toggleArcadeGameVoteAction(gameId);

      if (!result.success) {
        setVoted(voted);
        setCount(count);

        if (result.requiresAuth) {
          setShowModal(true);
        }

        toast.error(result.error || 'Error al votar');
        return;
      }

      setVoted(result.hasVoted);
      setCount(result.voteCount);

      if (result.hasVoted) {
        const colors = ['#e1ff00', '#a8c700', '#f7ffd8', '#ffffff', '#6b7f14'];

        // Left burst
        confetti({
          particleCount: 120,
          angle: 60,
          spread: 70,
          origin: { x: 0, y: 0.7 },
          colors,
          gravity: 0.8,
          startVelocity: 55,
          decay: 0.94,
          ticks: 250,
        });
        // Right burst
        confetti({
          particleCount: 120,
          angle: 120,
          spread: 70,
          origin: { x: 1, y: 0.7 },
          colors,
          gravity: 0.8,
          startVelocity: 55,
          decay: 0.94,
          ticks: 250,
        });
        // Delayed center shower
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 90,
            spread: 120,
            origin: { x: 0.5, y: 0.3 },
            colors,
            gravity: 1.2,
            startVelocity: 40,
            decay: 0.92,
            ticks: 100,
          });
        }, 150);
      }
    });
  };

  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: 'google',
      callbackURL: `/26/arcade/${gameSlug}`,
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleVote}
        disabled={isPending}
        className={cn(
          'flex items-center gap-2.5 rounded-md border-2 px-5 py-2.5 font-bold font-mono text-base transition-all',
          voted
            ? 'border-primary/40 bg-primary/15 text-primary'
            : 'animate-pulse-subtle border-primary/50 bg-primary/20 text-primary hover:border-primary/70 hover:bg-primary/30',
          isPending && 'opacity-60',
          className,
        )}
      >
        <span aria-hidden="true" className="text-lg">
          ▲
        </span>
        <span>{count}</span>
      </button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex items-center justify-center">
              <LogoGoogle size={48} />
            </div>
            <DialogTitle className="text-center font-title">
              Inicio de sesión con Google requerido
            </DialogTitle>
            <DialogDescription className="text-center font-title">
              Necesitas iniciar sesión con una cuenta de Google para votar por{' '}
              {gameTitle}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={handleGoogleLogin} className="w-full">
              <LogoGoogle size={20} />
              Iniciar sesión con Google
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
