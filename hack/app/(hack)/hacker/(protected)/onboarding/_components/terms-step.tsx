'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BasesContent } from '@/src/components/bases-content';
import { Button } from '@/src/components/ui/button';
import { acceptTermsAction } from '../_actions/accept-terms.action';

export function TermsStep() {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 10;

      if (scrolledToBottom && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasScrolledToBottom]);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      const result = await acceptTermsAction();

      if (result.success) {
        toast.success('Bases aceptadas correctamente');
        router.refresh();
      } else {
        toast.error(result.error || 'Error al aceptar las bases');
        setIsAccepting(false);
      }
    } catch (error) {
      toast.error('Error al aceptar las bases');
      console.error(error);
      setIsAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container relative mx-auto px-4 py-12 md:py-16">
        {/* Platanus logo in top right */}
        <div className="absolute top-4 right-4 z-20 sm:top-6 sm:right-6 md:top-8 md:right-8">
          <div
            className="aspect-[576/112] h-7 w-auto sm:h-9 md:h-10"
            style={{
              backgroundColor: 'hsl(var(--primary))',
              maskImage: 'url(/assets/logos/platanus.svg)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
            }}
          />
        </div>

        {/* Main content */}
        <div className="mx-auto w-full max-w-4xl space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              Aceptar{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Bases
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Lee y acepta las bases de participación del evento
            </p>
          </div>

          {/* Terms Container */}
          <div className="border-2 border-primary bg-background/80 backdrop-blur-sm">
            <div
              ref={containerRef}
              className="max-h-[60vh] overflow-y-auto p-6 sm:p-8 md:p-10"
            >
              <BasesContent />
            </div>

            {/* Accept Button */}
            <div className="border-primary border-t-2 p-6 sm:p-8">
              <div className="flex justify-center">
                <Button
                  onClick={handleAccept}
                  disabled={!hasScrolledToBottom || isAccepting}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {isAccepting ? 'Aceptando...' : 'Aceptar y Continuar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
