'use client';

import { Github } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';
import { authClient } from '@/src/lib/auth-client';

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.log('Error from URL:', error);
      const errorMessage = error.replace(/_/g, ' ');
      console.log('Decoded error message:', errorMessage);
      toast.error(errorMessage);
    }
  }, [error]);

  const handleGithubLogin = async () => {
    try {
      setIsLoading(true);
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/hacker',
        errorCallbackURL: '/login?error=unauthorized',
      });
    } catch (error) {
      toast.error('Error al iniciar sesión con GitHub');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="container relative mx-auto flex h-full items-center justify-center px-4">
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
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Title */}
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
              Iniciar{' '}
              <span className="bg-primary px-2 py-1 text-background">
                Sesión
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm">
              Ingresa a tu cuenta de hacker
            </p>
          </div>

          {/* Login Card */}
          <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8">
            <div className="space-y-6">
              <p className="text-center font-mono text-primary/80 text-sm">
                Para acceder a tu perfil de hacker, inicia sesión con tu cuenta
                de GitHub.
              </p>

              <Button
                onClick={handleGithubLogin}
                disabled={isLoading}
                size="lg"
                className="w-full"
              >
                <Github className="mr-2 h-5 w-5" />
                {isLoading ? 'Conectando...' : 'Iniciar sesión con GitHub'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
