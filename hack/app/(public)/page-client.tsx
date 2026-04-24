'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, useEffect, useState } from 'react';
import ContinuousCarousel from '@/src/components/continuous-carousel';
import FullTourGlobe from '@/src/components/globe/full-tour-globe';

const tourStops = [
  {
    country: 'Argentina',
    city: 'Buenos Aires',
    globeCity: 'Buenos Aires',
    dates: '8-10 may 2026',
    href: '/26-ar',
    enabled: true,
  },
  {
    country: 'México',
    city: 'Ciudad de México',
    globeCity: 'Ciudad de México',
    dates: '19-21 jun 2026',
    enabled: false,
  },
  {
    country: 'Colombia',
    city: 'Bogotá',
    globeCity: 'Bogotá',
    dates: '11-13 sep 2026',
    enabled: false,
  },
  {
    country: 'Venezuela',
    city: 'Caracas',
    globeCity: 'Caracas',
    dates: '23-25 oct 2026',
    enabled: false,
  },
  {
    country: 'Chile',
    city: 'Santiago',
    globeCity: 'Santiago',
    dates: '20-22 nov 2026',
    enabled: false,
  },
] as const;

const footerSponsors = [
  {
    name: 'Platanus',
    src: '/assets/logos/platanus.svg',
    width: 138,
    height: 28,
  },
  {
    name: 'Anthropic',
    src: '/assets/logos/anthropic.svg',
    width: 148,
    height: 30,
  },
  {
    name: 'Profound',
    src: '/assets/logos/profound.svg',
    width: 128,
    height: 28,
  },
  {
    name: 'Supabase',
    src: '/assets/logos/supabase.svg',
    width: 146,
    height: 30,
  },
  {
    name: 'Vercel',
    src: '/assets/logos/vercel.svg',
    width: 106,
    height: 22,
  },
  {
    name: 'ElevenLabs',
    src: '/assets/logos/elevenlabs.svg',
    width: 152,
    height: 28,
  },
] as const;

const REVEAL_DURATION_MS = 700;
const REVEAL_OFFSET_PX = 10;
const REVEAL_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

function getRevealStyle(isVisible: boolean, delayMs: number): CSSProperties {
  return {
    opacity: isVisible ? 1 : 0,
    transform: isVisible
      ? 'translateY(0)'
      : `translateY(${REVEAL_OFFSET_PX}px)`,
    transition: [
      `opacity ${REVEAL_DURATION_MS}ms ${REVEAL_EASING} ${delayMs}ms`,
      `transform ${REVEAL_DURATION_MS}ms ${REVEAL_EASING} ${delayMs}ms`,
    ].join(', '),
    willChange: 'opacity, transform',
  };
}

function getLogoMaskStyle(src: string): CSSProperties {
  return {
    WebkitMaskImage: `url(${src})`,
    WebkitMaskPosition: 'center',
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskImage: `url(${src})`,
    maskPosition: 'center',
    maskRepeat: 'no-repeat',
    maskSize: 'contain',
  };
}

export default function HomePageClient() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [activeGlobeCity, setActiveGlobeCity] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    setIsVisible(false);

    let firstFrame = 0;
    let secondFrame = 0;

    firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  return (
    <section className="selection-on-light min-h-screen bg-primary text-background">
      <div className="mx-auto flex h-[100svh] w-full max-w-[1400px] flex-col overflow-hidden px-4 pt-3 pb-2 md:h-screen md:px-8 md:pt-8 md:pb-3">
        <header className="shrink-0" style={getRevealStyle(isVisible, 80)}>
          <h1 className="text-center font-logo text-4xl lowercase tracking-tighter md:text-7xl">
            <span className="font-light">platanus hack</span>{' '}
            <span className="font-medium">[26]</span>
          </h1>
          <p className="mt-1 text-center font-title text-xs uppercase tracking-[0.18em] md:mt-2 md:text-xl">
            LATAM TOUR
          </p>
        </header>

        <div className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-hidden md:mt-8 md:grid md:grid-cols-2 md:gap-10">
          <div className="flex min-h-0 flex-1 items-center justify-center md:flex-1">
            <div
              className="relative h-full max-h-full w-full max-w-[760px] overflow-hidden md:max-h-[700px] md:max-w-[700px]"
              style={getRevealStyle(isVisible, 220)}
            >
              <FullTourGlobe
                className="absolute inset-0 h-full w-full"
                activeMarkerName={activeGlobeCity}
                mobileCameraDistance={228}
                mobileCameraFov={58}
                globeOpacity={0.82}
                hexOpacity={0.9}
                atmosphereOpacity={0.72}
                canvasOpacity={1}
              />
            </div>
          </div>

          <div className="flex flex-none shrink-0 flex-col justify-start gap-1 md:flex-1 md:justify-center md:gap-4">
            {tourStops.map((stop, index) => {
              const buttonDelay = 340 + index * 120;

              if (stop.enabled && stop.href) {
                return (
                  <Link
                    key={stop.country}
                    href={stop.href}
                    className="rounded-none border-2 border-background bg-background px-2.5 py-1 text-left text-primary transition hover:scale-[1.01] md:px-5 md:py-4"
                    style={getRevealStyle(isVisible, buttonDelay)}
                    onMouseEnter={() => setActiveGlobeCity(stop.globeCity)}
                    onMouseLeave={() => setActiveGlobeCity(null)}
                    onFocus={() => setActiveGlobeCity(stop.globeCity)}
                    onBlur={() => setActiveGlobeCity(null)}
                  >
                    <p className="font-title text-[12px] uppercase leading-none tracking-[0.05em] md:text-xl">
                      {stop.city}
                    </p>
                    <p className="font-medium text-xs opacity-80 md:text-sm">
                      {stop.country}
                    </p>
                    <p className="mt-0.5 font-bold text-[10px] leading-none md:mt-1 md:text-base">
                      {stop.dates}
                    </p>
                  </Link>
                );
              }

              return (
                <button
                  key={stop.country}
                  type="button"
                  aria-disabled="true"
                  tabIndex={-1}
                  className="cursor-not-allowed rounded-none border-2 border-background/35 bg-background/15 px-2.5 py-1 text-left text-background/70 md:px-5 md:py-4"
                  style={getRevealStyle(isVisible, buttonDelay)}
                  onMouseEnter={() => setActiveGlobeCity(stop.globeCity)}
                  onMouseLeave={() => setActiveGlobeCity(null)}
                >
                  <p className="font-title text-[12px] uppercase leading-none tracking-[0.05em] md:text-xl">
                    {stop.city}
                  </p>
                  <p className="font-medium text-xs md:text-sm">
                    {stop.country}
                  </p>
                  <p className="mt-0.5 font-bold text-[10px] leading-none md:mt-1 md:text-base">
                    {stop.dates}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <footer
          className="relative mt-1 shrink-0 border-background/30 border-t pt-2 md:mt-3 md:pt-4"
          style={getRevealStyle(isVisible, 520)}
        >
          <ContinuousCarousel
            speed={28}
            gap={20}
            pauseOnHover={false}
            height="2.25rem"
            className="relative z-0 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
          >
            {footerSponsors.map((sponsor) => (
              <div
                key={sponsor.name}
                className="flex h-9 items-center justify-center"
                style={{
                  width: `${sponsor.width.toString()}px`,
                }}
              >
                <div
                  role="img"
                  aria-label={sponsor.name}
                  className="h-full w-full bg-background"
                  style={{
                    ...getLogoMaskStyle(sponsor.src),
                    width: `${sponsor.width.toString()}px`,
                    height: `${sponsor.height.toString()}px`,
                  }}
                />
              </div>
            ))}
          </ContinuousCarousel>
          <div className="-translate-x-1/2 pointer-events-none absolute top-3 left-1/2 z-20 h-9 w-[280px] bg-gradient-to-r from-primary/0 via-primary/85 to-primary/0 md:top-4 md:w-[380px]" />
          <div className="pointer-events-none absolute top-3 right-0 left-0 z-30 flex h-9 items-center justify-center md:top-4">
            <Link
              href={'/tour/sponsor' as any}
              className="pointer-events-auto inline-flex min-h-10 items-center justify-center border-2 border-background bg-background/95 px-5 py-2 text-center font-title text-primary text-sm tracking-[0.08em] transition hover:scale-[1.02] md:min-h-11 md:px-8 md:text-base"
              style={getRevealStyle(isVisible, 640)}
            >
              sé sponsor
            </Link>
          </div>
        </footer>
      </div>
    </section>
  );
}
