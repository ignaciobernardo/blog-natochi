'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import ContinuousCarousel from '@/src/components/continuous-carousel';

const HACK25_PHOTOS = Array.from(
  { length: 29 },
  (_, index) => `/assets/images/hack-25/platanus-hack-${index + 1}.webp`,
);

const HACK24_PHOTOS = Array.from(
  { length: 31 },
  (_, index) => `/assets/images/hack-24/platanus-hack-${index + 1}.webp`,
);

function shufflePhotos(photos: string[]): string[] {
  const shuffled = [...photos];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

function PhotoCarouselRow({
  photos,
  direction,
  label,
  overlayTitle,
  overlayDetails,
  overlayLinks,
}: {
  photos: string[];
  direction: 'left' | 'right';
  label: string;
  overlayTitle: string;
  overlayDetails: string[];
  overlayLinks: Array<{ href: string; label: string }>;
}) {
  return (
    <div className="group relative h-full overflow-hidden">
      <ContinuousCarousel
        speed={40}
        gap={10}
        direction={direction}
        className="h-full grayscale transition duration-300 group-hover:grayscale-0"
        height="100%"
      >
        {photos.map((src, index) => (
          <div
            key={src}
            className="relative h-full w-[clamp(220px,30vw,520px)] shrink-0 bg-primary/10"
          >
            <Image
              src={src}
              alt={`${label} ${index + 1}`}
              fill
              sizes="(max-width: 768px) 70vw, 30vw"
              className="object-cover"
            />
          </div>
        ))}
      </ContinuousCarousel>

      <div className="absolute inset-y-0 left-0 flex items-center">
        <div className="ml-4 rounded-lg bg-primary/50 px-3 py-2 text-background shadow-[0_8px_20px_rgba(0,0,0,0.2)] backdrop-blur-md sm:ml-6 md:px-4 md:py-3">
          <p className="font-logo text-xl tracking-tight drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] sm:text-2xl md:text-3xl lg:text-4xl">
            {overlayTitle}
          </p>
          <div className="mt-1.5 flex flex-col gap-0.5 font-title text-[10px] uppercase tracking-[0.12em] sm:text-xs md:mt-2 md:text-sm">
            {overlayDetails.map((detail) => (
              <p key={detail} className="leading-tight">
                {detail}
              </p>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 font-title text-[10px] uppercase tracking-[0.14em] sm:text-xs">
            {overlayLinks.map(({ href, label: linkLabel }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="border-background/35 border-b text-background/80 transition hover:border-background hover:text-background"
              >
                {linkLabel}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DualPhotoSlide() {
  const [hack25Shuffled, setHack25Shuffled] = useState(HACK25_PHOTOS);
  const [hack24Shuffled, setHack24Shuffled] = useState(HACK24_PHOTOS);

  useEffect(() => {
    setHack25Shuffled(shufflePhotos(HACK25_PHOTOS));
    setHack24Shuffled(shufflePhotos(HACK24_PHOTOS));
  }, []);

  return (
    <section className="selection-on-light min-h-dvh w-full bg-primary text-background md:h-dvh">
      <div className="flex h-full min-h-dvh flex-col px-4 py-4 md:min-h-0 md:px-6 md:py-6">
        <h2 className="text-center font-bold font-title text-lg uppercase tracking-[0.14em] sm:text-xl md:text-2xl">
          <span className="inline-block bg-background px-3 py-1 text-primary sm:px-4">
            la mejor hackatón de latam desde 2024
          </span>
        </h2>
        <div className="mt-3 grid min-h-0 flex-1 grid-rows-2 gap-2">
          <PhotoCarouselRow
            photos={hack25Shuffled}
            direction="right"
            label="Hack 25 photo"
            overlayTitle="platanus hack [25] ft. Buk"
            overlayDetails={[
              '200 hackers',
              'Oficinas de Buk',
              'Santiago, Chile',
            ]}
            overlayLinks={[
              { href: '/25/pics', label: 'fotos' },
              { href: 'https://25.hack.platan.us/vote', label: 'proyectos' },
              { href: '/25', label: 'sitio' },
            ]}
          />
          <PhotoCarouselRow
            photos={hack24Shuffled}
            direction="left"
            label="Hack 24 photo"
            overlayTitle="platanus hack [24]"
            overlayDetails={[
              '120 hackers',
              'Oficinas de Fintual',
              'Santiago, Chile',
            ]}
            overlayLinks={[
              { href: '/24/pics', label: 'fotos' },
              { href: 'https://vote.hack.platan.us/', label: 'proyectos' },
              { href: '/24', label: 'sitio' },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
