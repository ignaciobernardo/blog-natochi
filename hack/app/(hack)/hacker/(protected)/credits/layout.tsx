'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/src/lib/utils';

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const sponsors = [
    { name: 'Anthropic', slug: 'anthropic' },
    { name: 'Runway', slug: 'runway' },
    { name: 'ElevenLabs', slug: 'elevenlabs' },
  ];

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="space-y-6">
        <div>
          <h1 className="font-bold font-title text-3xl text-primary">
            Sponsor Credits
          </h1>
          <p className="mt-2 text-muted-foreground">
            Accede a créditos y recursos de nuestros sponsors
          </p>
        </div>

        <div className="border-primary/20 border-b-2">
          <nav className="flex gap-2">
            {sponsors.map((sponsor) => {
              const href = `/hacker/credits/${sponsor.slug}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={sponsor.slug}
                  href={href as '/hacker/credits/anthropic'}
                  className={cn(
                    'border-2 border-transparent px-4 py-2 font-mono text-sm transition-all',
                    isActive
                      ? 'border-primary/20 border-t-primary/20 border-r-primary/20 border-b-primary border-l-primary/20 bg-primary/5 text-primary'
                      : 'text-muted-foreground hover:text-primary',
                  )}
                >
                  {sponsor.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
