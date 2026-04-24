'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import ContinuousCarousel from '@/src/components/continuous-carousel';
import { toast } from '@/src/components/toast';
import { submitSponsorInquiryAction } from './_actions/submit-sponsor-inquiry.action';

type TierType = 'exclusive' | 'partner' | 'sponsor' | 'host' | null;

import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import PhotoGalleryGrid from '@/app/[locale]/sponsor-deck/_components/photo-gallery-grid';
import { Dialog, DialogContent, DialogTitle } from '@/src/components/ui/dialog';
import InteractiveTourGlobe from './_components/interactive-tour-globe';
import LinkedInPostCard from './_components/linkedin-post-card';
import { linkedinPosts } from './linkedin-posts';

const platanusPhotos = [
  '/assets/images/platanus/platanus-1.webp',
  '/assets/images/platanus/platanus-2.webp',
  '/assets/images/platanus/platanus-3.webp',
  '/assets/images/platanus/platanus-4.webp',
  '/assets/images/platanus/platanus-5.webp',
  '/assets/images/platanus/platanus-6.webp',
  '/assets/images/platanus/platanus-7.webp',
  '/assets/images/platanus/platanus-8.webp',
  '/assets/images/platanus/platanus-9.webp',
  '/assets/images/platanus/platanus-10.webp',
  '/assets/images/platanus/platanus-11.webp',
  '/assets/images/platanus/platanus-12.webp',
  '/assets/images/platanus/platanus-13.webp',
  '/assets/images/platanus/platanus-14.webp',
  '/assets/images/platanus/platanus-15.webp',
  '/assets/images/platanus/platanus-16.webp',
  '/assets/images/platanus/platanus-17.webp',
  '/assets/images/platanus/platanus-18.webp',
];

const hackPhotos = [
  '/assets/images/hack-24/platanus-hack-1.webp',
  '/assets/images/hack-24/platanus-hack-2.webp',
  '/assets/images/hack-24/platanus-hack-3.webp',
  '/assets/images/hack-24/platanus-hack-4.webp',
  '/assets/images/hack-24/platanus-hack-5.webp',
  '/assets/images/hack-24/platanus-hack-6.webp',
  '/assets/images/hack-24/platanus-hack-7.webp',
  '/assets/images/hack-24/platanus-hack-8.webp',
  '/assets/images/hack-24/platanus-hack-9.webp',
  '/assets/images/hack-24/platanus-hack-10.webp',
  '/assets/images/hack-24/platanus-hack-11.webp',
  '/assets/images/hack-24/platanus-hack-12.webp',
  '/assets/images/hack-24/platanus-hack-13.webp',
  '/assets/images/hack-24/platanus-hack-14.webp',
  '/assets/images/hack-24/platanus-hack-15.webp',
  '/assets/images/hack-24/platanus-hack-16.webp',
];

const hack25Photos = Array.from(
  { length: 29 },
  (_, i) => `/assets/images/hack-25/platanus-hack-${i + 1}.webp`,
);
const hack24Sponsors = [
  {
    src: '/assets/logos/hack-24-sponsors/fintual-logo-white.png',
    alt: 'Fintual',
    width: 220,
    height: 80,
  },
  {
    src: '/assets/logos/aws.svg',
    alt: 'AWS',
    width: 140,
    height: 60,
  },
  {
    src: '/assets/logos/buk.webp',
    alt: 'Buk',
    width: 160,
    height: 70,
  },
  {
    src: '/assets/logos/hack-24-sponsors/ria-logo.png',
    alt: 'RIA',
    width: 160,
    height: 60,
  },
  {
    src: '/assets/logos/hack-24-sponsors/ey-logo.svg',
    alt: 'EY',
    width: 120,
    height: 60,
  },
  {
    src: '/assets/logos/hack-24-sponsors/shinkansen-logo-white.svg',
    alt: 'Shinkansen',
    width: 260,
    height: 80,
  },
  {
    src: '/assets/logos/hack-24-sponsors/pullpo-logo-white.svg',
    alt: 'Pullpo',
    width: 160,
    height: 70,
  },
  {
    src: '/assets/logos/hack-24-sponsors/fingo-logo-white.svg',
    alt: 'Fingo',
    width: 160,
    height: 70,
  },
  {
    src: '/assets/logos/hack-24-sponsors/oragus-logo-white.svg',
    alt: 'Oragus',
    width: 160,
    height: 70,
  },
  {
    src: '/assets/logos/hack-24-sponsors/soyio-logo-white.png',
    alt: 'Soyio',
    width: 200,
    height: 80,
  },
  {
    src: '/assets/logos/hack-24-sponsors/mok-logo-white.png',
    alt: 'Mok',
    width: 160,
    height: 70,
  },
];

const hack25Sponsors = [
  {
    src: '/assets/logos/buk-crop.webp',
    alt: 'Buk',
    width: 280,
    height: 106,
  },
  {
    src: '/assets/logos/anthropic-crop.svg',
    alt: 'Anthropic',
    width: 240,
    height: 41,
  },
  {
    src: '/assets/logos/agendapro-crop.svg',
    alt: 'AgendaPro',
    width: 240,
    height: 41,
  },
  {
    src: '/assets/logos/fintoc-crop.png',
    alt: 'Fintoc',
    width: 180,
    height: 39,
  },
  {
    src: '/assets/logos/maxxa-crop.png',
    alt: 'Maxxa',
    width: 200,
    height: 34,
  },
  {
    src: '/assets/logos/buda-crop.png',
    alt: 'Buda.com',
    width: 180,
    height: 60,
  },
  {
    src: '/assets/logos/elevenlabs-crop.svg',
    alt: 'ElevenLabs',
    width: 200,
    height: 67,
  },
  {
    src: '/assets/logos/aws-crop.svg',
    alt: 'AWS',
    width: 140,
    height: 47,
  },
  {
    src: '/assets/logos/runway-crop.png',
    alt: 'Runway',
    width: 200,
    height: 67,
  },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function _Hack25VideoContent({
  t,
}: {
  t: ReturnType<typeof useTranslations<'tourSponsor'>>;
}) {
  return (
    <div className="space-y-4">
      <h2 className="font-logo text-4xl text-background lowercase tracking-tighter md:text-5xl lg:text-6xl">
        <span className="font-light">{t('hack25.title')}</span>{' '}
        <span className="font-medium">{t('hack25.year')}</span>
      </h2>
      <div className="space-y-3 text-background/90 text-lg">
        <p>
          {t('hack25.description1Part1')}{' '}
          <strong>{t('hack25.description1Bold1')}</strong>
          {t('hack25.description1Part2')}{' '}
          <strong>{t('hack25.description1Bold2')}</strong>
          {t('hack25.description1Part3')}{' '}
          <strong>{t('hack25.description1Bold3')}</strong>,{' '}
          <strong>{t('hack25.description1Bold4')}</strong>,{' '}
          <strong>{t('hack25.description1Bold5')}</strong> y{' '}
          <strong>{t('hack25.description1Bold6')}</strong>.
        </p>
        <p>
          {t('hack25.description2Part1')}{' '}
          <strong>{t('hack25.description2Bold1')}</strong>{' '}
          {t('hack25.description2Part2')}{' '}
          <strong>{t('hack25.description2Bold2')}</strong>.
        </p>
        <p>
          {t('hack25.description3Part1')}{' '}
          <strong>{t('hack25.description3Bold1')}</strong>,{' '}
          <strong>{t('hack25.description3Bold2')}</strong> y{' '}
          <strong>{t('hack25.description3Bold3')}</strong>
          {t('hack25.description3Part2')}{' '}
          <strong>{t('hack25.description3Bold4')}</strong>.
        </p>
        <p>
          {t('hack25.description4Part1')}{' '}
          <strong>{t('hack25.description4Bold1')}</strong>,{' '}
          <strong>{t('hack25.description4Bold2')}</strong>,{' '}
          <strong>{t('hack25.description4Bold3')}</strong> y{' '}
          <strong>{t('hack25.description4Bold4')}</strong>.
        </p>
        <p>{t('hack25.description5')}</p>
        <p>
          {t('hack25.description6Part1')}{' '}
          <strong>{t('hack25.description6Bold')}</strong>.
        </p>
      </div>
    </div>
  );
}

export default function TourSponsorPage() {
  const t = useTranslations('tourSponsor');
  const locale = useLocale();
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [citySelections, setCitySelections] = useState<
    Record<string, TierType[]>
  >({});
  const [emailTags, setEmailTags] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [shuffledPlatanusPhotos, setShuffledPlatanusPhotos] =
    useState(platanusPhotos);
  const [shuffledLinkedinPosts, setShuffledLinkedinPosts] =
    useState(linkedinPosts);
  const [mediaImageOpen, setMediaImageOpen] = useState(false);
  const [media25ImageOpen, setMedia25ImageOpen] = useState(false);
  useEffect(() => {
    setShuffledPlatanusPhotos(shuffleArray(platanusPhotos));
    setShuffledLinkedinPosts(shuffleArray(linkedinPosts));
  }, []);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  const heroPreviewRef = useRef<HTMLVideoElement>(null);
  const [isHeroVideoMode, setIsHeroVideoMode] = useState(false);
  const [heroFullLoaded, setHeroFullLoaded] = useState(false);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;

    const onReady = () => {
      const preview = heroPreviewRef.current;
      if (preview) video.currentTime = preview.currentTime;
      setHeroFullLoaded(true);
    };

    if (video.readyState >= 4) {
      onReady();
      return;
    }

    video.addEventListener('canplaythrough', onReady, { once: true });
    return () => video.removeEventListener('canplaythrough', onReady);
  }, []);

  useEffect(() => {
    const full = heroVideoRef.current;
    const preview = heroPreviewRef.current;
    if (!full) return;
    if (isHeroVideoMode) {
      const activeVideo = heroFullLoaded ? full : preview;
      if (activeVideo) {
        activeVideo.currentTime = 0;
        activeVideo.muted = false;
        activeVideo.play();
      }
      for (let i = 0; i < full.textTracks.length; i++) {
        const track = full.textTracks[i];
        track.mode = track.language === locale ? 'showing' : 'hidden';
      }
    } else {
      full.muted = true;
      if (preview) preview.muted = true;
      for (let i = 0; i < full.textTracks.length; i++) {
        full.textTracks[i].mode = 'hidden';
      }
    }
  }, [isHeroVideoMode, heroFullLoaded, locale]);

  const tourCities = [
    {
      id: 'buenos-aires',
      name: t('cities.buenosAires.name'),
      country: t('cities.buenosAires.country'),
    },
    {
      id: 'cdmx',
      name: t('cities.cdmx.name'),
      country: t('cities.cdmx.country'),
    },
    {
      id: 'colombia',
      name: t('cities.bogota.name'),
      country: t('cities.bogota.country'),
    },
    {
      id: 'santiago',
      name: t('cities.santiago.name'),
      country: t('cities.santiago.country'),
    },
  ];

  const getDiscount = (
    selectedCount: number,
  ): { percent: number; label: string } => {
    switch (selectedCount) {
      case 1:
        return { percent: 10, label: t('discounts.off10') };
      case 2:
        return { percent: 20, label: t('discounts.off20') };
      case 3:
        return { percent: 25, label: t('discounts.off25') };
      default:
        return { percent: 0, label: '' };
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmailTag = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && isValidEmail(trimmed) && !emailTags.includes(trimmed)) {
      setEmailTags((prev) => [...prev, trimmed]);
      setEmailInput('');
    }
  };

  const handleEmailKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      if (emailInput.trim()) {
        addEmailTag(emailInput);
      }
    } else if (e.key === 'Backspace' && !emailInput && emailTags.length > 0) {
      setEmailTags((prev) => prev.slice(0, -1));
    }
  };

  const handleEmailBlur = () => {
    if (emailInput.trim()) {
      addEmailTag(emailInput);
    }
  };

  const removeEmailTag = (emailToRemove: string) => {
    setEmailTags((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const [companyName, setCompanyName] = useState('');
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const citySelectionsArray = Object.entries(citySelections)
      .filter(([_, tiers]) => tiers.length > 0)
      .flatMap(([cityId, tiers]) => {
        const city = tourCities.find((c) => c.id === cityId);
        return tiers
          .filter((tier): tier is Exclude<TierType, null> => tier !== null)
          .map((tier) => ({
            cityId,
            cityName: city?.name || cityId,
            country: city?.country || '',
            tier: tier as 'exclusive' | 'partner' | 'sponsor' | 'host',
          }));
      });

    startTransition(async () => {
      const result = await submitSponsorInquiryAction({
        companyName,
        emails: emailTags,
        message: message || undefined,
        citySelections: citySelectionsArray,
      });

      if (result.success) {
        toast({
          type: 'success',
          description: t('toast.success'),
        });
        setCompanyName('');
        setEmailTags([]);
        setMessage('');
        setCitySelections({});
      } else {
        toast({
          type: 'error',
          description: result.error || t('toast.error'),
        });
      }
    });
  };

  const selectedCitiesCount = Object.values(citySelections).filter((tiers) =>
    tiers.some((t) => t === 'partner' || t === 'sponsor' || t === 'exclusive'),
  ).length;
  const hasExclusiveSelected = Object.values(citySelections).some((tiers) =>
    tiers.includes('exclusive'),
  );

  const getExclusiveBundleDiscount = (cityId: string) => {
    const selections = citySelections[cityId] || [];
    const hasHost = selections.includes('host');
    if (!hasHost) return null;
    return { label: t('discounts.bundleSave6k') };
  };

  const handleTierSelect = (cityId: string, tier: TierType) => {
    if (!tier) return;

    setCitySelections((prev) => {
      const current = prev[cityId] || [];

      if (current.includes(tier)) {
        const newSelections = current.filter((t) => t !== tier);
        if (newSelections.length === 0) {
          const { [cityId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [cityId]: newSelections };
      }

      if (tier === 'host') {
        const compatible = current.filter(
          (t) => t === 'exclusive' || t === 'partner',
        );
        return { ...prev, [cityId]: ['host', ...compatible] };
      }

      const hasHost = current.includes('host');

      if (tier === 'sponsor') {
        if (hasHost) return prev;
        return { ...prev, [cityId]: ['sponsor'] };
      }

      if (tier === 'exclusive' || tier === 'partner') {
        if (hasHost) {
          return {
            ...prev,
            [cityId]: ['host', tier],
          };
        }
        return { ...prev, [cityId]: [tier] };
      }

      return prev;
    });
  };

  const getTierDisplayName = (tier: TierType) => {
    switch (tier) {
      case 'host':
        return t('tierNames.host');
      case 'exclusive':
        return t('tierNames.exclusive');
      case 'partner':
        return t('tierNames.partner');
      case 'sponsor':
        return t('tierNames.sponsor');
      default:
        return '';
    }
  };

  return (
    <>
      {/* Slide 1: Hero with Video */}
      <div className="relative h-screen w-full overflow-hidden bg-background">
        {/* Top bar — desktop: hover to enter video mode */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: intentional hover-only trigger, no click interaction */}
        <div
          className={`absolute inset-x-0 top-0 z-20 hidden cursor-default items-center justify-center bg-background/20 py-2 backdrop-blur-md transition-[transform,opacity] duration-500 ease-out hover:bg-background/10 md:flex ${heroFullLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full pointer-events-none opacity-0'}`}
          onMouseEnter={() => setIsHeroVideoMode(true)}
          onMouseLeave={() => setIsHeroVideoMode(false)}
        >
          <span className="font-medium font-sans text-foreground/70 text-xs uppercase tracking-widest">
            {t('hero.watchVideo')}
          </span>
        </div>

        {/* Top bar — mobile: link to YouTube */}
        <a
          href="https://hack.platan.us/25/aftermovie"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-x-0 top-0 z-20 flex items-center justify-center bg-background/20 py-2 backdrop-blur-md md:hidden"
        >
          <span className="font-medium font-sans text-foreground/70 text-xs uppercase tracking-widest">
            {t('hero.watchVideo')}
          </span>
        </a>

        {/* Full quality video (loads in background, fades in when ready) */}
        <video
          ref={heroVideoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-[filter,opacity] duration-700 ${isHeroVideoMode ? '' : 'grayscale'} ${heroFullLoaded ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source
            src="/assets/videos/hack-25/hack-afermovie-compressed.mp4"
            type="video/mp4"
          />
          <track
            kind="subtitles"
            src="/assets/misc/hack-25/subtitles-es.vtt"
            srcLang="es"
            label="Español"
            default={locale === 'es'}
          />
          <track
            kind="subtitles"
            src="/assets/misc/hack-25/subtitles-en.vtt"
            srcLang="en"
            label="English"
            default={locale === 'en'}
          />
        </video>

        {/* Preview video (tiny, loads instantly, hidden once full is ready) */}
        <video
          ref={heroPreviewRef}
          className={`absolute inset-0 h-full w-full object-cover transition-[filter,opacity] duration-700 ${isHeroVideoMode ? '' : 'grayscale'} ${heroFullLoaded ? 'opacity-0' : 'opacity-100'}`}
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="/assets/videos/hack-25/hack-afermovie-preview.mp4"
            type="video/mp4"
          />
        </video>

        {/* Aesthetic blur overlay */}
        <div
          className={`pointer-events-none absolute inset-0 z-10 backdrop-blur-md transition-opacity duration-700 ${isHeroVideoMode || heroFullLoaded ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Bottom gradient: background-color to transparent upward */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[75%] bg-gradient-to-t from-background to-transparent transition-opacity duration-700 ${isHeroVideoMode ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Bouncing scroll caret */}
        <div
          className={`-translate-x-1/2 pointer-events-none absolute bottom-6 left-1/2 z-20 text-foreground/60 transition-opacity duration-500 ${isHeroVideoMode ? 'opacity-0' : 'opacity-100'}`}
        >
          <div className="animate-bounce">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>

        {/* Title + subtitles over gradient */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-20 animate-landing-fade-in px-6 pb-10 md:px-12 md:pb-14 ${isHeroVideoMode ? '!opacity-0' : ''}`}
          style={{ animationDelay: '200ms', transition: 'opacity 500ms' }}
        >
          <h1
            className="font-logo text-[clamp(1.6rem,7.5vw,3rem)] text-foreground lowercase tracking-tighter md:text-[clamp(3rem,12vw,10rem)]"
            style={{ lineHeight: 1, marginLeft: '-0.05em' }}
          >
            <span className="font-light">{t('hero.title')}</span>{' '}
            <span className="font-medium">{t('hero.year')}</span>
          </h1>
          <p
            className="font-sans text-base text-foreground/80 sm:text-lg md:text-xl"
            style={{ marginTop: '0.4em' }}
          >
            <span className="font-bold">{t('hero.subtitle')}</span>
            {': '}
            {t('hero.countries')}
          </p>
        </div>
      </div>

      {/* Slide 2: Platanus */}
      <div className="relative min-h-screen w-full bg-background">
        <div className="mx-auto grid h-full min-h-screen max-w-7xl grid-cols-1 gap-8 px-6 py-16 md:grid-cols-2 md:gap-12 md:py-0">
          <div className="flex flex-col justify-center">
            <div className="mb-2 inline-flex w-fit bg-primary px-3 py-1">
              <div
                className="aspect-[576/112] h-8 w-auto md:h-10 lg:h-12"
                style={{
                  backgroundColor: 'hsl(var(--background))',
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
            <div className="mt-6 space-y-4 font-medium text-lg text-muted-foreground">
              <p>{t('platanus.description1')}</p>
              <p>{t('platanus.description2')}</p>
              <p>{t('platanus.description3')}</p>
              <p>{t('platanus.description4')}</p>
              <p>
                {t('platanus.moreInfoPart1')}{' '}
                <a
                  href="https://platan.us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                  {t('platanus.moreInfoLink')}
                </a>
                .
              </p>
            </div>
          </div>

          <div className="relative h-[60vh] md:h-screen">
            <PhotoGalleryGrid
              photos={shuffledPlatanusPhotos}
              speed={50}
              columns={1}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Slide 3: Platanus Hack */}
      <div className="selection-on-light relative min-h-screen w-full bg-primary">
        <div className="mx-auto grid h-full max-w-7xl grid-cols-1 gap-8 px-6 py-16 md:grid-cols-2 md:gap-12 md:py-24">
          <div className="hidden flex-col items-center justify-center gap-6 md:flex">
            <div className="group relative w-full overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/assets/images/hack-24/hack-24-showcase.webp"
                alt="Platanus Hack 24 Showcase"
                width={600}
                height={400}
                className="w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
              />
              <div className="absolute right-0 bottom-0 w-1/3 translate-y-full bg-background/95 px-4 py-3 backdrop-blur-sm transition-transform duration-500 group-hover:translate-y-0">
                <p className="font-logo text-lg text-primary lowercase tracking-tighter">
                  <span className="font-light">{t('hack24.title')}</span>{' '}
                  <span className="font-medium">{t('hack24.year')}</span>
                </p>
                <p className="mt-2 text-primary/80 text-xs">
                  {t('hack24.showcaseDate')}
                </p>
                <p className="text-primary/70 text-xs">
                  {t('hack24.showcaseLocation')}
                </p>
              </div>
            </div>

            <div className="group relative w-full overflow-hidden rounded-lg shadow-lg">
              <Image
                src="/assets/images/hack-25/hack-25-showcase.webp"
                alt="Platanus Hack 25 Showcase"
                width={600}
                height={400}
                className="w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
              />
              <div className="absolute right-0 bottom-0 w-1/3 translate-y-full bg-background/95 px-4 py-3 backdrop-blur-sm transition-transform duration-500 group-hover:translate-y-0">
                <p className="font-logo text-lg text-primary lowercase tracking-tighter">
                  <span className="font-light">{t('hack25.title')}</span>{' '}
                  <span className="font-medium">{t('hack25.year')}</span>
                </p>
                <p className="mt-2 text-primary/80 text-xs">
                  {t('hack25.showcaseDate')}
                </p>
                <p className="text-primary/70 text-xs">
                  {t('hack25.showcaseLocation')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="font-bold font-title text-4xl md:text-5xl lg:text-6xl">
              <span className="bg-background px-3 py-1 text-primary">
                {t('platanusHack.title')}
              </span>
            </h2>
            <div className="mt-6 space-y-4 font-medium text-background/90 text-lg">
              <p>
                {t('platanusHack.description1Part1')}{' '}
                <strong>{t('platanusHack.description1Bold1')}</strong>{' '}
                {t('platanusHack.description1Part2')}{' '}
                <strong>{t('platanusHack.description1Bold2')}</strong>
              </p>
              <p>
                {t('platanusHack.description2Part1')}{' '}
                <strong>{t('platanusHack.description2Bold')}</strong>
                {t('platanusHack.description2Part2')}
              </p>
              <p>
                {t('platanusHack.description3Part1')}{' '}
                <strong>{t('platanusHack.description3Bold1')}</strong>{' '}
                {t('platanusHack.description3Part2')}{' '}
                <strong>{t('platanusHack.description3Bold2')}</strong>.
              </p>
              <p>
                {t('platanusHack.description4Part1')}{' '}
                <strong>{t('platanusHack.description4Bold1')}</strong>{' '}
                {t('platanusHack.description4Part2')}{' '}
                <strong>{t('platanusHack.description4Bold2')}</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 4: Platanus Hack 25 */}
      <div className="selection-on-light relative min-h-screen w-full bg-primary">
        <div className="mx-auto grid h-full min-h-screen max-w-7xl grid-cols-1 gap-8 px-6 py-16 md:grid-cols-2 md:gap-12 md:py-0">
          <div className="relative h-[60vh] md:h-screen">
            <PhotoGalleryGrid
              photos={hack25Photos}
              speed={30}
              columns={2}
              className="h-full"
              fadeFrom="from-primary"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="font-logo text-4xl lowercase tracking-tighter md:text-5xl lg:text-6xl">
              <span className="bg-background px-3 py-1 text-primary">
                <span className="font-light">{t('hack25.title')}</span>{' '}
                <span className="font-medium">{t('hack25.year')}</span>
              </span>
            </h2>
            <div className="mt-6 space-y-4 font-medium text-background/90 text-lg">
              <p>
                {t('hack25.description1Part1')}{' '}
                <strong>{t('hack25.description1Bold1')}</strong>
                {t('hack25.description1Part2')}{' '}
                <strong>{t('hack25.description1Bold2')}</strong>
                {t('hack25.description1Part3')}{' '}
                <strong>{t('hack25.description1Bold3')}</strong>,{' '}
                <strong>{t('hack25.description1Bold4')}</strong>,{' '}
                <strong>{t('hack25.description1Bold5')}</strong> y{' '}
                <strong>{t('hack25.description1Bold6')}</strong>.
              </p>
              <p>
                {t('hack25.description2Part1')}{' '}
                <strong>{t('hack25.description2Bold1')}</strong>{' '}
                {t('hack25.description2Part2')}{' '}
                <strong>{t('hack25.description2Bold2')}</strong>.
              </p>
              <p>
                {t('hack25.description3Part1')}{' '}
                <strong>{t('hack25.description3Bold1')}</strong>,{' '}
                <strong>{t('hack25.description3Bold2')}</strong> y{' '}
                <strong>{t('hack25.description3Bold3')}</strong>
                {t('hack25.description3Part2')}{' '}
                <strong>{t('hack25.description3Bold4')}</strong>.
              </p>
              <p>
                {t('hack25.description4Part1')}{' '}
                <strong>{t('hack25.description4Bold1')}</strong>,{' '}
                <strong>{t('hack25.description4Bold2')}</strong>,{' '}
                <strong>{t('hack25.description4Bold3')}</strong> y{' '}
                <strong>{t('hack25.description4Bold4')}</strong>.
              </p>
              <p>{t('hack25.description5')}</p>
              <div className="flex gap-3 pt-2">
                <a
                  href="https://25.hack.platan.us/pics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-background px-4 py-2 font-semibold text-primary text-sm transition-colors hover:bg-background/90"
                >
                  {t('hack25.viewPhotos')}
                </a>
                <a
                  href="https://25.hack.platan.us/25/vote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-background bg-transparent px-4 py-2 font-semibold text-background text-sm transition-colors hover:bg-background/10"
                >
                  {t('hack25.viewProjects')}
                </a>
              </div>
              <div className="pt-4">
                <p className="mb-3 font-semibold text-background text-sm uppercase tracking-[0.2em]">
                  {t('hack25.sponsors')}
                </p>
                <ContinuousCarousel speed={32} gap={8} height="4rem">
                  {hack25Sponsors.map((sponsor) => (
                    <div
                      key={sponsor.alt}
                      className="flex h-14 items-center justify-center px-2"
                    >
                      <div
                        className="h-10 w-auto opacity-90"
                        style={{
                          maxWidth: '160px',
                          width: `${sponsor.width}px`,
                          aspectRatio: `${sponsor.width} / ${sponsor.height}`,
                          backgroundColor: 'hsl(var(--background))',
                          maskImage: `url(${sponsor.src})`,
                          maskSize: 'contain',
                          maskRepeat: 'no-repeat',
                          maskPosition: 'center',
                          WebkitMaskImage: `url(${sponsor.src})`,
                          WebkitMaskSize: 'contain',
                          WebkitMaskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                        }}
                      />
                    </div>
                  ))}
                </ContinuousCarousel>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide 5: Hack 24 Gallery */}
      <div className="relative min-h-screen w-full bg-background">
        <div className="mx-auto grid h-full min-h-screen max-w-7xl grid-cols-1 gap-8 px-6 py-16 md:grid-cols-2 md:gap-12 md:py-0">
          <div className="flex flex-col justify-center">
            <h2 className="font-logo text-4xl lowercase tracking-tighter md:text-5xl lg:text-6xl">
              <span className="bg-primary px-3 py-1 text-background">
                <span className="font-light">{t('hack24.title')}</span>{' '}
                <span className="font-medium">{t('hack24.year')}</span>
              </span>
            </h2>
            <div className="mt-6 space-y-4 font-medium text-lg text-muted-foreground">
              <p>
                {t('hack24.description1Part1')}{' '}
                <strong>{t('hack24.description1Bold1')}</strong>{' '}
                {t('hack24.description1Part2')}{' '}
                <strong>{t('hack24.description1Bold2')}</strong>
                {t('hack24.description1Part3')}{' '}
                <strong>{t('hack24.description1Bold3')}</strong>
                {t('hack24.description1Part4')}
              </p>
              <p>{t('hack24.description2')}</p>
              <p>
                {t('hack24.description3Part1')}{' '}
                <strong>{t('hack24.description3Bold1')}</strong>,{' '}
                <strong>{t('hack24.description3Bold2')}</strong>,{' '}
                <strong>{t('hack24.description3Bold3')}</strong> y{' '}
                <strong>{t('hack24.description3Bold4')}</strong>
                {t('hack24.description3Part2')}
              </p>
              <p>
                {t('hack24.description4Part1')}{' '}
                <strong>{t('hack24.description4Bold')}</strong>.
              </p>
              <div className="flex gap-3 pt-2">
                <a
                  href="https://platan.us/hack/pics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-primary px-4 py-2 font-semibold text-background text-sm transition-colors hover:bg-primary/90"
                >
                  {t('hack24.viewPhotos')}
                </a>
                <a
                  href="https://vote.hack.platan.us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-primary bg-transparent px-4 py-2 font-semibold text-primary text-sm transition-colors hover:bg-primary/10"
                >
                  {t('hack24.viewProjects')}
                </a>
              </div>
              <div className="pt-4">
                <p className="mb-3 font-semibold text-primary text-sm uppercase tracking-[0.2em]">
                  {t('hack24.sponsors')}
                </p>
                <ContinuousCarousel speed={32} gap={8} height="4rem">
                  {hack24Sponsors.map((sponsor) => (
                    <div
                      key={sponsor.alt}
                      className="flex h-14 items-center justify-center px-2"
                    >
                      <Image
                        src={sponsor.src}
                        alt={sponsor.alt}
                        width={sponsor.width}
                        height={sponsor.height}
                        className="h-10 w-auto max-w-[140px] brightness-0 invert filter md:max-w-[160px]"
                      />
                    </div>
                  ))}
                </ContinuousCarousel>
              </div>
            </div>
          </div>

          <div className="relative h-[60vh] md:h-screen">
            <PhotoGalleryGrid
              photos={hackPhotos}
              speed={30}
              columns={2}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Slide 5b: LinkedIn Posts */}
      <div className="selection-on-light flex min-h-screen w-full flex-col justify-center overflow-hidden bg-background py-16">
        <div className="mx-auto mb-8 w-full max-w-7xl px-6">
          <h2 className="font-bold font-title text-3xl md:text-4xl">
            <Link
              href={`/${locale}/tour/sponsor/media`}
              className="inline-flex items-center gap-2 bg-primary px-3 py-1 text-background transition-opacity hover:opacity-80"
            >
              {t('linkedin.title')}
              <ArrowUpRight className="h-6 w-6 shrink-0" />
            </Link>
          </h2>
        </div>
        <ContinuousCarousel speed={35} gap={16} pauseOnHover height="560px">
          {shuffledLinkedinPosts.map((post) => (
            <LinkedInPostCard
              key={post.url}
              post={post}
              viewOriginalLabel={t('linkedin.viewOriginal')}
              locale={locale}
              viewInEnglishLabel={
                locale === 'en' ? t('linkedin.viewInEnglish') : undefined
              }
              viewInSpanishLabel={
                locale === 'en' ? t('linkedin.viewInSpanish') : undefined
              }
            />
          ))}
        </ContinuousCarousel>
      </div>

      {/* Slide 5c: Media */}
      <div className="selection-on-dark flex min-h-screen w-full flex-col justify-center overflow-hidden bg-primary py-16">
        <div className="mx-auto mb-8 w-full max-w-7xl px-6">
          <h2 className="font-bold font-title text-3xl md:text-4xl">
            <span className="bg-background px-3 py-1 text-primary">
              {t('media.title')}
            </span>
          </h2>
        </div>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 md:flex-row">
          {/* Hack 24 news image */}
          <div className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              className="relative h-72 w-full cursor-pointer overflow-hidden rounded-lg md:h-[600px]"
              onClick={() => setMediaImageOpen(true)}
            >
              <Image
                src="/assets/images/hack-24/dfmas-crop.jpg"
                alt="DF Más — Hack 24"
                fill
                className="object-contain grayscale transition-all duration-300 hover:grayscale-0"
              />
            </button>
            <p className="text-center font-bold text-background/60 text-lg">
              {t('media.hack24Caption')}
            </p>
          </div>

          <Dialog open={mediaImageOpen} onOpenChange={setMediaImageOpen}>
            <DialogContent className="h-[95vh] w-[95vw] max-w-none gap-0 bg-background p-2 sm:max-w-none">
              <DialogTitle className="sr-only">DF Más — Hack 24</DialogTitle>
              <div className="relative h-full w-full">
                <Image
                  src="/assets/images/hack-24/dfmas-crop.jpg"
                  alt="DF Más — Hack 24"
                  fill
                  className="object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
          {/* Hack 25 news image */}
          <div className="flex flex-1 flex-col gap-2">
            <button
              type="button"
              className="relative h-72 w-full cursor-pointer overflow-hidden rounded-lg md:h-[600px]"
              onClick={() => setMedia25ImageOpen(true)}
            >
              <Image
                src="/assets/images/hack-25/mercurio-crop.webp"
                alt="El Mercurio — Hack 25"
                fill
                className="object-contain grayscale transition-all duration-300 hover:grayscale-0"
              />
            </button>
            <p className="text-center font-bold text-background/60 text-lg">
              {t('media.hack25Caption')}
            </p>
          </div>

          <Dialog open={media25ImageOpen} onOpenChange={setMedia25ImageOpen}>
            <DialogContent className="h-[95vh] w-[95vw] max-w-none gap-0 bg-background p-2 sm:max-w-none">
              <DialogTitle className="sr-only">
                El Mercurio — Hack 25
              </DialogTitle>
              <div className="relative h-full w-full">
                <Image
                  src="/assets/images/hack-25/mercurio-crop.webp"
                  alt="El Mercurio — Hack 25"
                  fill
                  className="object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Slide 6: LATAM Tour Globe */}
      <div className="relative h-screen w-full overflow-hidden bg-background">
        <div className="absolute inset-x-0 top-10 bottom-0 z-[5] md:inset-0">
          <InteractiveTourGlobe
            className="h-full w-full"
            activeCity={activeCity}
          />
        </div>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Hover zone for visual feedback only */}
        <div
          className="absolute top-20 left-8 z-10 md:top-12 md:left-12"
          onMouseEnter={() => setActiveCity('Buenos Aires')}
          onMouseLeave={() => setActiveCity(null)}
          role="presentation"
        >
          <div
            className={`relative cursor-pointer px-3 py-2 shadow-lg transition-all duration-300 md:px-6 md:py-4 ${activeCity === 'Buenos Aires' ? 'scale-105 bg-background' : 'bg-primary'}`}
          >
            <h3
              className={`font-bold font-title text-sm md:text-xl ${activeCity === 'Buenos Aires' ? 'text-primary' : 'text-background'}`}
            >
              {t('cities.buenosAires.name')}
            </h3>
            <p
              className={`font-medium text-xs md:text-base ${activeCity === 'Buenos Aires' ? 'text-primary/80' : 'text-background/80'}`}
            >
              {t('cities.buenosAires.country')}
            </p>
            <p
              className={`font-medium text-[10px] md:text-sm ${activeCity === 'Buenos Aires' ? 'text-primary/70' : 'text-background/70'}`}
            >
              {t('cities.buenosAires.dates')}
            </p>
          </div>
        </div>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Hover zone for visual feedback only */}
        <div
          className="absolute top-20 right-8 z-10 md:top-12 md:right-12"
          onMouseEnter={() => setActiveCity('Ciudad de México')}
          onMouseLeave={() => setActiveCity(null)}
          role="presentation"
        >
          <div
            className={`relative cursor-pointer px-3 py-2 shadow-lg transition-all duration-300 md:px-6 md:py-4 ${activeCity === 'Ciudad de México' ? 'scale-105 bg-background' : 'bg-primary'}`}
          >
            <h3
              className={`font-bold font-title text-sm md:text-xl ${activeCity === 'Ciudad de México' ? 'text-primary' : 'text-background'}`}
            >
              {t('cities.cdmx.name')}
            </h3>
            <p
              className={`font-medium text-xs md:text-base ${activeCity === 'Ciudad de México' ? 'text-primary/80' : 'text-background/80'}`}
            >
              {t('cities.cdmx.country')}
            </p>
            <p
              className={`font-medium text-[10px] md:text-sm ${activeCity === 'Ciudad de México' ? 'text-primary/70' : 'text-background/70'}`}
            >
              {t('cities.cdmx.dates')}
            </p>
          </div>
        </div>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Hover zone for visual feedback only */}
        <div
          className="absolute bottom-8 left-8 z-10 md:bottom-12 md:left-12"
          onMouseEnter={() => setActiveCity('Bogotá')}
          onMouseLeave={() => setActiveCity(null)}
          role="presentation"
        >
          <div
            className={`relative cursor-pointer px-3 py-2 shadow-lg transition-all duration-300 md:px-6 md:py-4 ${activeCity === 'Bogotá' ? 'scale-105 bg-background' : 'bg-primary'}`}
          >
            <h3
              className={`font-bold font-title text-sm md:text-xl ${activeCity === 'Bogotá' ? 'text-primary' : 'text-background'}`}
            >
              {t('cities.bogota.shortName')}
            </h3>
            <p
              className={`font-medium text-xs md:text-base ${activeCity === 'Bogotá' ? 'text-primary/80' : 'text-background/80'}`}
            >
              {t('cities.bogota.country')}
            </p>
            <p
              className={`font-medium text-[10px] md:text-sm ${activeCity === 'Bogotá' ? 'text-primary/70' : 'text-background/70'}`}
            >
              {t('cities.bogota.dates')}
            </p>
          </div>
        </div>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Hover zone for visual feedback only */}
        <div
          className="-translate-x-1/2 absolute bottom-8 left-1/2 z-10 md:bottom-12"
          onMouseEnter={() => setActiveCity('Caracas')}
          onMouseLeave={() => setActiveCity(null)}
          role="presentation"
        >
          <div
            className={`relative cursor-pointer px-3 py-2 shadow-lg transition-all duration-300 md:px-6 md:py-4 ${activeCity === 'Caracas' ? 'scale-105 bg-background' : 'bg-primary'}`}
          >
            <h3
              className={`font-bold font-title text-sm md:text-xl ${activeCity === 'Caracas' ? 'text-primary' : 'text-background'}`}
            >
              {t('cities.caracas.name')}
            </h3>
            <p
              className={`font-medium text-xs md:text-base ${activeCity === 'Caracas' ? 'text-primary/80' : 'text-background/80'}`}
            >
              {t('cities.caracas.country')}
            </p>
            <p
              className={`font-medium text-[10px] md:text-sm ${activeCity === 'Caracas' ? 'text-primary/70' : 'text-background/70'}`}
            >
              {t('cities.caracas.dates')}
            </p>
          </div>
        </div>

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Hover zone for visual feedback only */}
        <div
          className="absolute right-8 bottom-8 z-10 md:right-12 md:bottom-12"
          onMouseEnter={() => setActiveCity('Santiago')}
          onMouseLeave={() => setActiveCity(null)}
          role="presentation"
        >
          <div
            className={`relative cursor-pointer px-3 py-2 shadow-lg transition-all duration-300 md:px-6 md:py-4 ${activeCity === 'Santiago' ? 'scale-105 bg-background' : 'bg-primary'}`}
          >
            <h3
              className={`font-bold font-title text-sm md:text-xl ${activeCity === 'Santiago' ? 'text-primary' : 'text-background'}`}
            >
              {t('cities.santiago.name')}
            </h3>
            <p
              className={`font-medium text-xs md:text-base ${activeCity === 'Santiago' ? 'text-primary/80' : 'text-background/80'}`}
            >
              {t('cities.santiago.country')}
            </p>
            <p
              className={`font-medium text-[10px] md:text-sm ${activeCity === 'Santiago' ? 'text-primary/70' : 'text-background/70'}`}
            >
              {t('cities.santiago.dates')}
            </p>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-2 z-0 text-center md:top-12">
          <h2 className="font-logo text-3xl text-primary lowercase tracking-tighter md:text-4xl lg:text-5xl">
            <span className="font-light">{t('globeSection.title')}</span>{' '}
            <span className="font-medium">{t('globeSection.year')}</span>
          </h2>
          <p className="mt-1 font-logo text-primary/60 text-xl lowercase tracking-tighter md:text-2xl lg:text-3xl">
            {t('globeSection.subtitle')}
          </p>
        </div>
      </div>

      {/* Slide 7: Sponsor Packages */}
      <div className="selection-on-light relative w-full bg-primary">
        <div className="mx-auto flex h-full max-w-6xl flex-col px-6 py-16 md:py-24">
          <h2 className="mb-12 text-center font-bold font-title text-4xl text-background md:text-5xl lg:text-6xl">
            {t('packages.title')}
          </h2>

          {/* Host Package - Top Section */}
          <div className="mb-8">
            <div className="mx-auto max-w-2xl rounded-lg bg-background p-6 shadow-lg">
              <div className="mb-4 text-center">
                <span className="text-4xl">🏢</span>
                <h3 className="mt-2 font-bold font-title text-2xl text-primary">
                  {t('packages.host.title')}
                </h3>
              </div>
              <ul className="grid grid-cols-1 gap-3 text-foreground/80 md:grid-cols-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.host.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.host.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.host.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.host.item4')}</span>
                </li>
              </ul>
              <div className="mt-4 border-border border-t pt-4">
                <p className="mb-2 text-muted-foreground text-xs uppercase tracking-wide">
                  {t('packages.confirmed')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Image
                    src="/assets/logos/hack-24-sponsors/fintual-logo-white.png"
                    alt="Fintual"
                    width={120}
                    height={20}
                    className="opacity-70 brightness-0 invert"
                  />
                  <Image
                    src="/assets/logos/buk.webp"
                    alt="Buk"
                    width={80}
                    height={28}
                    className="opacity-70 brightness-0 invert"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sponsor, Partner, Exclusive - Bottom Row */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Sponsor Package */}
            <div className="flex flex-col rounded-lg bg-background p-6 shadow-lg">
              <div className="mb-4">
                <span className="text-3xl">🫶</span>
                <h3 className="mt-2 font-bold font-title text-2xl text-primary">
                  {t('packages.sponsor.title')}
                </h3>
              </div>
              <ul className="flex-1 space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.sponsor.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.sponsor.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.sponsor.item3')}</span>
                </li>
              </ul>
              <div className="mt-4 border-border border-t pt-4">
                <p className="mb-2 text-muted-foreground text-xs uppercase tracking-wide">
                  {t('packages.confirmed')}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Image
                    src="/assets/logos/supabase.svg"
                    alt="Supabase"
                    width={140}
                    height={24}
                    className="opacity-70 brightness-0 invert"
                  />
                </div>
              </div>
            </div>

            {/* Partner Package */}
            <div className="flex flex-col rounded-lg bg-background p-6 shadow-lg">
              <div className="mb-4">
                <span className="text-3xl">🚀</span>
                <h3 className="mt-2 font-bold font-title text-2xl text-primary">
                  {t('packages.partner.title')}
                </h3>
              </div>
              <ul className="flex-1 space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.partner.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.partner.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.partner.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.partner.item4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.partner.item5')}</span>
                </li>
              </ul>
              <div className="mt-4 border-border border-t pt-4">
                <p className="mb-2 text-muted-foreground text-xs uppercase tracking-wide">
                  {t('packages.confirmed')}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Image
                    src="/assets/logos/anthropic-crop.svg"
                    alt="Anthropic"
                    width={120}
                    height={20}
                    className="opacity-70 brightness-0 invert"
                  />
                  <Image
                    src="/assets/logos/profound.svg"
                    alt="Profound"
                    width={120}
                    height={23}
                    className="opacity-70"
                  />
                </div>
              </div>
            </div>

            {/* Exclusive Partner Package */}
            <div className="flex flex-col rounded-lg bg-background p-6 shadow-lg ring-2 ring-background">
              <div className="mb-4">
                <span className="text-3xl">👑</span>
                <h3 className="mt-2 font-bold font-title text-2xl text-primary">
                  {t('packages.exclusive.title')}
                </h3>
              </div>
              <ul className="flex-1 space-y-3 text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.exclusive.item1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.exclusive.item2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.exclusive.item3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{t('packages.exclusive.item4')}</span>
                </li>
              </ul>
              <div className="mt-4 border-border border-t pt-4">
                <p className="mb-2 text-muted-foreground text-xs uppercase tracking-wide">
                  {t('packages.confirmed')}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Image
                    src="/assets/logos/buk.webp"
                    alt="Buk"
                    width={80}
                    height={28}
                    className="opacity-70 brightness-0 invert"
                  />
                </div>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-background/60 text-sm">
            {t('packages.disclaimer')}
          </p>

          {/* City Selection Cards */}
          <h3 className="mt-16 mb-8 text-center font-bold font-title text-2xl text-background md:text-3xl">
            {t('citySelection.title')}
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tourCities.map((city) => {
              const selections = citySelections[city.id] || [];
              const hasHost = selections.includes('host');
              const hasExclusive = selections.includes('exclusive');
              const isExclusiveDisabled =
                hasExclusiveSelected && !selections.includes('exclusive');
              const claimedDiscount = getDiscount(
                Math.max(selectedCitiesCount - 1, 0),
              );
              const upcomingDiscount = getDiscount(selectedCitiesCount);
              const exclusiveDiscount = !isExclusiveDisabled
                ? getExclusiveBundleDiscount(city.id)
                : null;
              const hostDiscount =
                hasExclusive && !isExclusiveDisabled
                  ? { label: t('discounts.bundleSave6k') }
                  : null;
              const shouldShowClaimedDiscount =
                !hasHost && claimedDiscount.percent > 0;
              const shouldShowUpcomingDiscount =
                !hasHost && upcomingDiscount.percent > 0;

              return (
                <div
                  key={city.id}
                  className={`rounded-lg bg-background p-5 shadow-lg transition-all ${
                    selections.length > 0 ? 'ring-2 ring-background' : ''
                  }`}
                >
                  <div className="mb-4">
                    <h4 className="font-bold font-title text-lg text-primary">
                      {city.name}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {city.country}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        !['santiago', 'colombia', 'cdmx'].includes(city.id) &&
                        handleTierSelect(city.id, 'host')
                      }
                      disabled={['santiago', 'colombia', 'cdmx'].includes(
                        city.id,
                      )}
                      className={`relative rounded-md px-3 py-2 font-medium text-sm transition-all ${
                        ['santiago', 'colombia', 'cdmx'].includes(city.id)
                          ? 'cursor-not-allowed bg-muted/40 text-muted-foreground/50 opacity-50'
                          : selections.includes('host')
                            ? 'bg-primary text-background'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <span>🏢 {t('tierNames.host')}</span>
                      {['santiago', 'colombia'].includes(city.id) && (
                        <Image
                          src="/assets/logos/buk.webp"
                          alt="Buk"
                          width={40}
                          height={16}
                          className="ml-2 inline-block brightness-0 invert"
                        />
                      )}
                      {city.id === 'cdmx' && (
                        <Image
                          src="/assets/logos/hack-24-sponsors/fintual-logo-white.png"
                          alt="Fintual"
                          width={60}
                          height={20}
                          className="ml-2 inline-block brightness-0 invert"
                        />
                      )}
                      {hostDiscount &&
                        !['santiago', 'colombia', 'cdmx'].includes(city.id) && (
                          <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
                            {hostDiscount.label}
                          </span>
                        )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTierSelect(city.id, 'exclusive')}
                      disabled={isExclusiveDisabled}
                      className={`relative rounded-md px-3 py-2 font-medium text-sm transition-all ${
                        selections.includes('exclusive')
                          ? 'bg-primary text-background'
                          : isExclusiveDisabled
                            ? 'cursor-not-allowed bg-muted text-muted-foreground opacity-50'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <span>👑 {t('tierNames.exclusive')}</span>
                      {exclusiveDiscount && (
                        <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
                          {exclusiveDiscount.label}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTierSelect(city.id, 'partner')}
                      className={`relative rounded-md px-3 py-2 font-medium text-sm transition-all ${
                        selections.includes('partner')
                          ? 'bg-primary text-background'
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <span>🚀 {t('tierNames.partner')}</span>
                      {city.id === 'buenos-aires' && (
                        <Image
                          src="/assets/logos/profound.svg"
                          alt="Profound"
                          width={50}
                          height={10}
                          className={`ml-2 inline-block ${selections.includes('partner') ? 'opacity-90' : 'opacity-70'}`}
                        />
                      )}
                      {((selections.includes('partner') &&
                        shouldShowClaimedDiscount) ||
                        (selections.length === 0 &&
                          shouldShowUpcomingDiscount)) && (
                        <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
                          {selections.includes('partner')
                            ? claimedDiscount.label
                            : upcomingDiscount.label}
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTierSelect(city.id, 'sponsor')}
                      disabled={hasHost}
                      className={`relative rounded-md px-3 py-2 font-medium text-sm transition-all ${
                        selections.includes('sponsor')
                          ? 'bg-primary text-background'
                          : hasHost
                            ? 'cursor-not-allowed bg-muted text-muted-foreground opacity-50'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}
                    >
                      <span>🫶 {t('tierNames.sponsor')}</span>
                      {((selections.includes('sponsor') &&
                        shouldShowClaimedDiscount) ||
                        (selections.length === 0 &&
                          shouldShowUpcomingDiscount)) && (
                        <span className="ml-2 rounded bg-primary px-1.5 py-0.5 text-primary-foreground text-xs">
                          {selections.includes('sponsor')
                            ? claimedDiscount.label
                            : upcomingDiscount.label}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Form */}
          {Object.keys(citySelections).length > 0 && (
            <div className="mt-12 rounded-lg bg-background p-6">
              <h3 className="mb-6 font-bold font-title text-primary text-xl">
                {t('form.title')}
              </h3>

              <div className="mb-6">
                <p className="mb-2 text-muted-foreground text-sm">
                  {t('form.selectedPackages')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(citySelections).flatMap(([cityId, tiers]) => {
                    const city = tourCities.find((c) => c.id === cityId);
                    return tiers.map((tier) => {
                      return (
                        <span
                          key={`${cityId}-${tier}`}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-sm"
                        >
                          {city?.name} — {getTierDisplayName(tier)}
                        </span>
                      );
                    });
                  })}
                </div>
                {selectedCitiesCount > 1 && (
                  <p className="mt-2 text-primary text-sm">
                    🎉{' '}
                    {t('form.discountApplied', {
                      percent: getDiscount(selectedCitiesCount - 1).percent,
                    })}
                  </p>
                )}
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="company"
                    className="mb-1 block font-medium text-foreground text-sm"
                  >
                    {t('form.companyName')}
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isPending}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    placeholder={t('form.companyPlaceholder')}
                  />
                </div>

                <div>
                  <label
                    htmlFor="emails"
                    className="mb-1 block font-medium text-foreground text-sm"
                  >
                    {t('form.emails')}
                  </label>
                  <div
                    className="flex min-h-[42px] w-full flex-wrap items-center gap-2 rounded-md border border-border bg-background px-3 py-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
                    onClick={() => emailInputRef.current?.focus()}
                    onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        emailInputRef.current?.focus();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {emailTags.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-sm"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEmailTag(email);
                          }}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-3.5 w-3.5"
                          >
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      </span>
                    ))}
                    <input
                      ref={emailInputRef}
                      type="text"
                      id="emails"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={handleEmailKeyDown}
                      onBlur={handleEmailBlur}
                      disabled={isPending}
                      className="min-w-[150px] flex-1 border-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
                      placeholder={
                        emailTags.length === 0 ? t('form.emailPlaceholder') : ''
                      }
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-1 block font-medium text-foreground text-sm"
                  >
                    {t('form.message')}
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isPending}
                    className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    placeholder={t('form.messagePlaceholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full rounded-md bg-primary py-3 font-semibold text-background transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? t('form.submitting') : t('form.submit')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-background/20 border-t bg-primary">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="https://platan.us"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
          >
            <div
              className="aspect-[576/112] h-6 w-auto"
              style={{
                backgroundColor: 'hsl(var(--background))',
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
          </a>
          <span className="font-logo text-background text-lg lowercase tracking-tighter">
            <span className="font-light">{t('hero.title')}</span>{' '}
            <span className="font-medium">{t('hero.year')}</span>
          </span>
        </div>
      </footer>
    </>
  );
}
