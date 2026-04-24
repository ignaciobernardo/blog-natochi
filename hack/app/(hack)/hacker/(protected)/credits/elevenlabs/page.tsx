import { eq } from 'drizzle-orm';
import { ExternalLink } from 'lucide-react';
import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

export default async function ElevenLabsCreditsPage() {
  const session = await onlyAuthenticated();

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  // Get hacker's email
  const [hacker] = await db
    .select()
    .from(hackers)
    .where(eq(hackers.id, session.user.linkedId))
    .limit(1);

  if (!hacker) {
    redirect('/login?error=hacker_not_found');
  }

  return (
    <div className="space-y-6">
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
        <div className="space-y-6">
          {/* Header with logos */}
          <div className="border-primary/20 border-b pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
                  <span className="bg-primary px-2 py-1 text-background">
                    ELEVENLABS
                  </span>{' '}
                  CREDITS
                </h2>
                <p className="mt-2 text-primary/70 text-sm">
                  3 meses gratis del{' '}
                  <a
                    href="https://elevenlabs.io/pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80"
                  >
                    tier Creator
                  </a>
                </p>
              </div>
              <div
                className="h-8 w-32"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  maskImage: 'url(/assets/logos/elevenlabs-crop.svg)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: 'url(/assets/logos/elevenlabs-crop.svg)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            {/* Email Information */}
            <div className="border-primary border-l-4 pl-4">
              <h3 className="font-bold font-title text-primary/70 text-sm uppercase">
                Tu email
              </h3>
              <p className="font-mono text-lg text-primary">{hacker.email}</p>
              <p className="mt-2 font-mono text-primary/70 text-sm">
                Este email tiene acceso a 3 meses gratis del{' '}
                <a
                  href="https://elevenlabs.io/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline hover:text-primary/80"
                >
                  tier Creator
                </a>{' '}
                de ElevenLabs
              </p>
            </div>

            {/* CTA Button */}
            <a
              href="https://elevenlabs.io/?coupon=PLTNHCK25"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border-2 border-primary bg-primary px-6 py-3 font-bold font-title text-background transition-all hover:bg-background hover:text-primary"
            >
              <ExternalLink className="h-5 w-5" />
              Canjear Créditos de ElevenLabs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
