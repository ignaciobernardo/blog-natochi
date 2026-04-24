import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/src/lib/auth';
import { getHackerById } from '@/src/queries/hackers';
import { LoginForm } from './login-form';

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export default async function LoginPage() {
  const session = await getSession();

  if (session?.user?.linkedId) {
    const hacker = await getHackerById(session.user.linkedId);

    if (hacker) {
      redirect('/hacker');
    }
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="container relative mx-auto flex h-full items-center justify-center px-4">
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

            <div className="mx-auto w-full max-w-md space-y-8">
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

              <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8">
                <div className="space-y-6">
                  <p className="text-center font-mono text-primary/80 text-sm">
                    Para acceder a tu perfil de hacker, inicia sesión con tu
                    cuenta de GitHub.
                  </p>

                  <div className="flex h-10 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
