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
import { voteForProjectAction } from '../_actions/vote.action';

interface UpvoteButtonProps {
  projectId: string;
  projectSlug: string;
  projectName: string;
  initialVoted: boolean;
  initialCount: number;
  isAuthenticated: boolean;
  hasGoogleAccount: boolean;
  isBelowThreshold: boolean;
}

export function UpvoteButton({
  projectId,
  projectSlug,
  projectName,
  initialVoted,
  initialCount,
  isAuthenticated,
  hasGoogleAccount,
  isBelowThreshold,
}: UpvoteButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleVote = async () => {
    if (!isAuthenticated || !hasGoogleAccount) {
      setShowModal(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await voteForProjectAction(projectId, projectSlug);
      if (result.success) {
        const newVoted = result.action === 'added';
        setVoted(newVoted);
        setCount((prev) => (newVoted ? prev + 1 : prev - 1));

        // Trigger confetti and toast when vote is added
        if (newVoted) {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 70,
            origin: { x: 0, y: 0.6 },
            colors: ['#e0ff00', '#000000', '#ffffff'],
            gravity: 0.5,
            startVelocity: 45,
            decay: 0.9,
          });
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 70,
            origin: { x: 1, y: 0.6 },
            colors: ['#e0ff00', '#000000', '#ffffff'],
            gravity: 0.5,
            startVelocity: 45,
            decay: 0.9,
          });
          toast.success(`Votaste por ${projectName}`);
        }
      } else {
        // Show toast for limit errors (no UI text)
        if (result.isLimitError) {
          toast.error(result.error || 'Error al votar');
          return;
        }

        // Show toast for period errors (no UI text)
        if (result.isPeriodError) {
          toast.error(result.error || 'Fuera del período de votación');
          return;
        }

        const errorMessage = result.error || 'Error al votar';
        setError(errorMessage);

        // If requires auth, show modal
        if (result.requiresAuth) {
          setShowModal(true);
        }
      }
    });
  };

  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: 'google',
      callbackURL: `/25/vote/${projectSlug}`,
    });
  };

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        {/* Mobile Layout - Rectangular Button */}
        <button
          type="button"
          onClick={handleVote}
          disabled={isPending}
          className={`group flex w-full items-center justify-between border-2 bg-background px-6 py-3 transition-all hover:border-primary disabled:opacity-50 sm:hidden ${
            voted ? 'border-primary' : 'border-primary/30'
          } ${
            !voted &&
            (
              !isAuthenticated ||
                (isAuthenticated && hasGoogleAccount && isBelowThreshold)
            )
              ? 'animate-button-breathe-subtle'
              : ''
          }`}
        >
          <span className="font-bold font-title text-lg text-primary">
            votar
          </span>
          <div className="flex items-center gap-3">
            <span className="font-bold font-mono text-lg text-primary">
              {count}
            </span>
            <span className="text-2xl text-primary">▲</span>
          </div>
        </button>

        {/* Desktop Layout - Square Button */}
        <button
          type="button"
          onClick={handleVote}
          disabled={isPending}
          className={`group hidden h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 border-2 bg-background transition-all hover:border-primary disabled:opacity-50 sm:flex lg:h-24 lg:w-24 ${
            voted ? 'border-primary' : 'border-primary/30'
          } ${
            !voted &&
            (
              !isAuthenticated ||
                (isAuthenticated && hasGoogleAccount && isBelowThreshold)
            )
              ? 'animate-button-breathe'
              : ''
          }`}
        >
          <div className="text-3xl text-primary transition-all lg:text-4xl">
            ▲
          </div>
          <div className="font-bold font-mono text-primary text-xl transition-all lg:text-2xl">
            {count}
          </div>
        </button>

        {error && (
          <p className="max-w-[200px] text-center font-title text-primary/60 text-xs">
            {error}
          </p>
        )}
      </div>

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
              Necesitas iniciar sesión con una cuenta de Google para votar por
              proyectos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={handleGoogleLogin}
              className="w-full border-2 border-primary bg-primary font-title text-background transition-all hover:bg-primary/90"
            >
              <div className="mr-2">
                <LogoGoogle size={20} />
              </div>
              Iniciar sesión con Google
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full font-title"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
