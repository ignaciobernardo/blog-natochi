'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { submitGameAction } from '../_actions/submit-game.action';

interface SubmitGameButtonProps {
  gameId: string;
}

export function SubmitGameButton({ gameId }: SubmitGameButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    const result = await submitGameAction(gameId);

    setIsSubmitting(false);

    if (result.success) {
      setShowSuccessModal(true);
    } else {
      setError(result.message);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    router.refresh();
  };

  return (
    <>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full bg-primary px-6 py-3 font-bold text-black text-sm uppercase tracking-wider hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : '>> Submit Game <<'}
      </Button>

      {error && <p className="text-center text-red-500 text-sm">{error}</p>}

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="border-primary bg-black/95 font-mono sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="crt-glow font-bold text-2xl text-primary uppercase">
              🎮 Game Submitted!
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4 text-foreground/90">
              <p className="text-base">
                Your game has been successfully submitted to the{' '}
                <span className="font-bold text-primary">Platanus Hack 25</span>{' '}
                arcade!
              </p>
              <div className="rounded border-2 border-primary/30 bg-primary/5 p-4">
                <p className="text-sm leading-relaxed">
                  <span className="font-bold text-primary">Note:</span> If your
                  game wins, we will create an issue in your GitHub repository
                  with details about your prize and next steps.
                </p>
              </div>
              <p className="text-foreground/70 text-sm">Good luck! 🚀</p>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button
              onClick={handleCloseModal}
              className="w-full bg-primary font-bold text-black uppercase hover:bg-primary/90"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
