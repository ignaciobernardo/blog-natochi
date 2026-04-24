import { desc, eq } from 'drizzle-orm';
import { CheckCircle2 } from 'lucide-react';
import { redirect } from 'next/navigation';
import { onlyAuthenticated } from '@/src/lib/auth/server';
import { db } from '@/src/lib/db';
import { hackerProfiles } from '@/src/lib/db/schema';

export default async function AnthropicCreditsPage() {
  const session = await onlyAuthenticated();

  if (!session.user.linkedId) {
    redirect('/login?error=no_hacker_linked');
  }

  // Search for Anthropic data across all hacker profiles for this user
  const allProfiles = await db
    .select()
    .from(hackerProfiles)
    .where(eq(hackerProfiles.hackerId, session.user.linkedId))
    .orderBy(desc(hackerProfiles.createdAt));

  // Find the first profile with Anthropic data
  const profileWithAnthropicData = allProfiles.find(
    (p) => p.anthropicOrgId || p.anthropicAccountEmail,
  );

  const hasAnthropicData = !!profileWithAnthropicData;

  return (
    <div className="space-y-6">
      <div className="border-2 border-primary bg-background/80 p-6 backdrop-blur-sm sm:p-8 md:p-10">
        <div className="space-y-6">
          <div className="border-primary/20 border-b pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold font-title text-2xl text-primary sm:text-3xl md:text-4xl">
                  <span className="bg-primary px-2 py-1 text-background">
                    ANTHROPIC
                  </span>{' '}
                  CREDITS
                </h2>
                <p className="mt-2 text-primary/70 text-sm">
                  Recibe $50 USD en créditos de API de Anthropic
                </p>
              </div>
              <div
                className="h-8 w-32"
                style={{
                  backgroundColor: 'hsl(var(--primary))',
                  maskImage: 'url(/assets/logos/anthropic-crop.svg)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: 'url(/assets/logos/anthropic-crop.svg)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            {hasAnthropicData && profileWithAnthropicData ? (
              <>
                <div className="flex items-center gap-3 border-2 border-primary bg-primary/5 p-4">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-bold font-title text-primary">
                      Petición enviada a Anthropic
                    </p>
                    <p className="font-mono text-primary/70 text-sm">
                      {profileWithAnthropicData.anthropicInfoSentAt
                        ? `Enviado el ${new Date(profileWithAnthropicData.anthropicInfoSentAt).toLocaleDateString('es-ES')}`
                        : 'Tu información ha sido registrada'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold font-title text-primary text-xl uppercase">
                    Información enviada
                  </h3>

                  <div className="space-y-3">
                    {profileWithAnthropicData.anthropicAccountEmail && (
                      <div className="border-primary border-l-4 pl-4">
                        <p className="font-bold font-title text-primary/70 text-sm uppercase">
                          Email
                        </p>
                        <p className="font-mono text-primary">
                          {profileWithAnthropicData.anthropicAccountEmail}
                        </p>
                      </div>
                    )}

                    {profileWithAnthropicData.anthropicOrgId && (
                      <div className="border-primary border-l-4 pl-4">
                        <p className="font-bold font-title text-primary/70 text-sm uppercase">
                          Organization ID
                        </p>
                        <p className="break-all font-mono text-primary text-sm">
                          {profileWithAnthropicData.anthropicOrgId}
                        </p>
                      </div>
                    )}

                    {profileWithAnthropicData.anthropicUsedProducts &&
                      profileWithAnthropicData.anthropicUsedProducts.length >
                        0 && (
                        <div className="border-primary border-l-4 pl-4">
                          <p className="font-bold font-title text-primary/70 text-sm uppercase">
                            Productos usados
                          </p>
                          <ul className="mt-2 space-y-1">
                            {profileWithAnthropicData.anthropicUsedProducts.map(
                              (product) => (
                                <li
                                  key={product}
                                  className="font-mono text-primary text-sm"
                                >
                                  • {product}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}

                    {profileWithAnthropicData.anthropicUpdates !== null && (
                      <div className="border-primary border-l-4 pl-4">
                        <p className="font-bold font-title text-primary/70 text-sm uppercase">
                          Actualizaciones de producto
                        </p>
                        <p className="font-mono text-primary">
                          {profileWithAnthropicData.anthropicUpdates
                            ? 'Sí'
                            : 'No'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="border-2 border-primary/20 bg-background p-6 text-center">
                <p className="font-bold font-title text-primary">
                  No has enviado tu información de Anthropic aún.
                </p>
                <p className="mt-2 font-mono text-primary/70 text-sm">
                  Esta información debería haberse completado durante el
                  onboarding.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
