'use client';

import { ConfettiEffect } from '@/app/(hack)/hacker/[publicId]/status/_components/confetti-effect';

export function ThankYou() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 text-center">
      <ConfettiEffect />
      <div className="text-6xl">🎉</div>
      <h2 className="font-bold text-3xl">Gracias por tu feedback!</h2>
      <p className="max-w-md text-lg text-muted-foreground">
        Tu opinión es muy valiosa para nosotros y nos ayuda a mejorar Platanus
        Hack para futuras ediciones.
      </p>
      <a
        href="/25"
        className="mt-4 bg-primary px-6 py-3 font-bold text-background text-lg transition-all hover:scale-105"
      >
        Volver al inicio
      </a>
    </div>
  );
}
