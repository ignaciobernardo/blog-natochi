'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import ContinuousCarousel from '@/src/components/continuous-carousel';
import CountdownTimer from '@/src/components/countdown-timer';
import HackathonVideo from '@/src/components/hackathon-video';
import RotatingBanana from '@/src/components/rotating-banana';
import { posts } from '../posts';
import LinkedInPost from './linkedin-post';
import PhotoGallery from './photo-gallery';

export default function SponsorDeckClient() {
  const t = useTranslations('sponsorDeck');
  const locale = useLocale();
  const [activeSection, setActiveSection] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);

  const [shuffledPosts, setShuffledPosts] = useState(posts);
  useEffect(() => {
    const postsArray = [...posts];
    for (let i = postsArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [postsArray[i], postsArray[j]] = [postsArray[j], postsArray[i]];
    }
    setShuffledPosts(postsArray);
  }, []);

  const firstDeadline = new Date('2025-10-17T23:59:59-03:00');
  const secondDeadline = new Date('2025-10-31T23:59:59-03:00');
  const [deadlinePhase, setDeadlinePhase] = useState<
    'before-first' | 'between' | 'after-second'
  >('after-second');
  useEffect(() => {
    const compute = () => {
      const now = new Date();
      if (now < firstDeadline) setDeadlinePhase('before-first');
      else if (now < secondDeadline) setDeadlinePhase('between');
      else setDeadlinePhase('after-second');
    };
    compute();
    const id = setInterval(compute, 60_000);
    return () => clearInterval(id);
  }, []);
  const isBeforeFirst = deadlinePhase === 'before-first';
  const isBetween = deadlinePhase === 'between';
  const isAfterFirst = deadlinePhase !== 'before-first';
  const isAfterSecond = deadlinePhase === 'after-second';

  const photos = [
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
    '/assets/images/hack-24/platanus-hack-17.webp',
    '/assets/images/hack-24/platanus-hack-18.webp',
    '/assets/images/hack-24/platanus-hack-19.webp',
    '/assets/images/hack-24/platanus-hack-20.webp',
    '/assets/images/hack-24/platanus-hack-21.webp',
    '/assets/images/hack-24/platanus-hack-22.webp',
    '/assets/images/hack-24/platanus-hack-23.webp',
    '/assets/images/hack-24/platanus-hack-24.webp',
    '/assets/images/hack-24/platanus-hack-25.webp',
    '/assets/images/hack-24/platanus-hack-26.webp',
    '/assets/images/hack-24/platanus-hack-27.webp',
    '/assets/images/hack-24/platanus-hack-28.webp',
    '/assets/images/hack-24/platanus-hack-29.webp',
    '/assets/images/hack-24/platanus-hack-30.webp',
    '/assets/images/hack-24/platanus-hack-31.webp',
  ];

  const sections = useMemo(
    () => [
      { id: 'platanus', label: t('navigation.platanus'), level: 0 },
      { id: 'evento', label: t('navigation.evento'), level: 0 },
      { id: 'coordenadas', label: t('navigation.coordenadas'), level: 0 },
      { id: 'asistentes', label: t('navigation.asistentes'), level: 0 },
      { id: '2024', label: t('navigation.2024'), level: 0 },
      { id: 'fotos', label: t('navigation.fotos'), level: 1 },
      { id: 'impacto', label: t('navigation.impacto'), level: 1 },
      { id: 'linkedin', label: t('navigation.linkedin'), level: 2 },
      {
        id: 'instagram-youtube',
        label: t('navigation.instagramYoutube'),
        level: 2,
      },
      { id: 'blogposts', label: t('navigation.blogposts'), level: 2 },
      { id: 'diario', label: t('navigation.diario'), level: 2 },
      { id: 'paquetes', label: t('navigation.paquetes'), level: 0 },
      { id: 'basic', label: t('navigation.basic'), level: 1 },
      { id: 'partner', label: t('navigation.partner'), level: 1 },
      { id: 'exclusive', label: t('navigation.exclusive'), level: 1 },
      { id: 'deadlines', label: t('navigation.deadlines'), level: 0 },
      { id: 'contacto', label: t('navigation.contacto'), level: 0 },
    ],
    [t],
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Set initial active section

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const nextPost = () => {
    setCurrentPostIndex((prev) => (prev + 1) % shuffledPosts.length);
  };

  const prevPost = () => {
    setCurrentPostIndex(
      (prev) => (prev - 1 + shuffledPosts.length) % shuffledPosts.length,
    );
  };

  return (
    <div className="relative mx-auto flex max-w-6xl">
      {/* Rotating banana background */}
      <div className="-z-10 fixed inset-0 opacity-20">
        <RotatingBanana />
      </div>
      {/* Sidebar Navigation */}
      <aside className="sticky top-0 hidden h-screen w-64 font-geist lg:flex lg:flex-col">
        <div className="flex flex-1 flex-col pt-8">
          <div className="mb-8 space-y-4 text-center">
            <h1 className="font-bold text-2xl">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>

          <nav className="flex-1 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSectionClick(section.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${section.level === 1 ? 'ml-4 pl-6' : section.level === 2 ? 'ml-8 pl-10' : ''}
                  ${
                    activeSection === section.id
                      ? 'border-primary border-l-2 bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex justify-center pb-8">
          {locale === 'es' ? (
            <Link
              href="/en/sponsor-deck"
              className="group flex items-center justify-center text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              <span className="grayscale transition-all duration-200 group-hover:grayscale-0">
                🇺🇸
              </span>
              <span className="ml-2">Versión en inglés</span>
            </Link>
          ) : (
            <Link
              href={'/sponsor-deck' as any}
              className="group flex items-center justify-center text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              <span className="grayscale transition-all duration-200 group-hover:grayscale-0">
                🇪🇸
              </span>
              <span className="ml-2">Spanish version</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full max-w-2xl space-y-12 px-6 py-8 font-geist lg:ml-8">
        {/* Header for mobile */}
        <div className="space-y-4 text-center lg:hidden">
          <h1 className="font-bold text-4xl">{t('title')}</h1>
          <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
          {locale === 'es' ? (
            <Link
              href="/en/sponsor-deck"
              className="group flex items-center justify-center text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              <span className="grayscale transition-all duration-200 group-hover:grayscale-0">
                🇺🇸
              </span>
              <span className="ml-2">Versión en inglés</span>
            </Link>
          ) : (
            <Link
              href={'/sponsor-deck' as any}
              className="group flex items-center justify-center text-muted-foreground text-sm transition-colors hover:text-foreground"
            >
              <span className="grayscale transition-all duration-200 group-hover:grayscale-0">
                🇪🇸
              </span>
              <span className="ml-2">Spanish version</span>
            </Link>
          )}
        </div>

        {/* Platanus Section */}
        <section id="platanus" className="space-y-4">
          <h2 className="flex items-center gap-2 font-bold text-3xl">
            <span>🍌</span>
            Platanus
          </h2>
          <div className="space-y-4 text-lg">
            <p>{t('platanus.description1')}</p>
            <p>{t('platanus.description2')}</p>
            <p>{t('platanus.description3')}</p>
            <p>
              <Link
                href="https://platan.us/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('platanus.moreInfo')}
              </Link>
            </p>
          </div>
        </section>

        {/* El Evento Section */}
        <section id="evento" className="space-y-4">
          <h2 className="flex items-center gap-2 font-bold text-3xl">
            <span>🧑‍💻</span>
            {t('navigation.evento').replace('🧑‍💻 ', '')}
          </h2>

          <div className="space-y-4 text-lg">
            <p>{t('evento.description1')}</p>
            <p>
              {t('evento.description2Part1')}
              <Link
                href="https://www.treehacks.com/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('evento.description2LinkText')}
              </Link>
              {t('evento.description2Part2')}
            </p>
            <p>{t('evento.description3')}</p>

            <p className="text-lg">
              {t('evento.eventDatesPart1')}
              <strong>{t('evento.eventDatesStart')}</strong>
              {t('evento.eventDatesPart2')}
              <strong>{t('evento.eventDatesEnd')}</strong>
              {t('evento.eventDatesPart3')}
            </p>
          </div>
        </section>

        {/* Coordenadas Section */}
        <section id="coordenadas" className="space-y-6">
          <h2 className="flex items-center gap-2 font-bold text-3xl">
            <span>📍</span>
            {t('coordenadas.title')}
          </h2>

          <div className="space-y-6">
            <div className="rounded-lg border bg-transparent p-6 backdrop-blur-sm">
              <div className="space-y-4 text-center">
                <div>
                  <h3 className="font-semibold text-primary text-xl">
                    {t('coordenadas.location')}
                  </h3>
                  <Link
                    href="https://maps.app.goo.gl/qAiKBieLfqyM6VKM7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-primary hover:underline"
                  >
                    {t('coordenadas.address')}
                  </Link>
                </div>

                {/* Office Image */}
                <div className="mt-4">
                  <Link
                    href="https://maps.app.goo.gl/qAiKBieLfqyM6VKM7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block cursor-pointer overflow-hidden rounded-lg"
                  >
                    <Image
                      src="/assets/images/misc/mut.jpg"
                      alt="MUT Tobalaba - Buk Offices"
                      width={400}
                      height={200}
                      className="h-full w-full object-cover grayscale transition-all duration-300 hover:scale-105 hover:grayscale-0"
                    />
                  </Link>
                </div>

                {/* Date/Time Widget */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-md border bg-background/50 p-4">
                    <div className="text-left">
                      <p className="font-medium text-muted-foreground text-sm">
                        Inicio
                      </p>
                      <p className="font-semibold text-foreground text-lg">
                        {t('coordenadas.startDate')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-muted-foreground text-sm">
                        Final
                      </p>
                      <p className="font-semibold text-foreground text-lg">
                        {t('coordenadas.endDate')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Asistentes Section */}
        <section id="asistentes" className="space-y-4">
          <h2 className="font-bold text-3xl">{t('navigation.asistentes')}</h2>
          <div className="space-y-4 text-lg">
            <p>{t('asistentes.description')}</p>
          </div>
        </section>

        {/* 2024 Section */}
        <section id="2024" className="space-y-4">
          <h2 className="font-bold text-3xl">{t('navigation.2024')}</h2>
          <div className="space-y-4 text-lg">
            <p>
              <Link
                href="https://24.hack.platan.us/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('2024.description1LinkText')}
              </Link>
              {t('2024.description1Part2')}
            </p>
            <p>{t('2024.description2')}</p>
            <p>{t('2024.description3')}</p>
            <p>
              {t('2024.description4Part1')}
              <Link
                href="https://vote.hack.platan.us/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('2024.description4LinkText')}
              </Link>
              {t('2024.description4Part2')}
            </p>
            <p>
              {t('2024.description5Part1')}
              <strong>{t('2024.description5Part2')}</strong>
              {t('2024.description5Part3')}
            </p>
          </div>

          {/* Fotos Subsection */}
          <div id="fotos" className="space-y-4">
            <h3 className="font-semibold text-2xl">📸 Fotos</h3>
            <PhotoGallery photos={photos} speed={30} className="mb-4" />
            <p className="text-lg">
              {t('2024.photosLinkPart1')}
              <Link
                href="https://platan.us/hack/24/pics"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('2024.photosLinkText')}
              </Link>
              {t('2024.photosLinkPart2')}
            </p>
          </div>
        </section>

        {/* Impacto Section */}
        <section id="impacto" className="space-y-6">
          <h3 className="font-semibold text-2xl">{t('navigation.impacto')}</h3>
          <p className="text-lg">{t('impacto.description')}</p>

          {/* LinkedIn Subsection */}
          <div id="linkedin" className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-xl">LinkedIn</h4>

              {/* Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  onClick={prevPost}
                  className="rounded-full border border-border bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
                  type="button"
                  disabled={shuffledPosts.length <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  onClick={nextPost}
                  className="rounded-full border border-border bg-background/80 p-2 backdrop-blur-sm transition-colors hover:bg-background"
                  type="button"
                  disabled={shuffledPosts.length <= 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <p className="text-lg">{t('impacto.linkedinDescription')}</p>

            <div className="relative">
              {/* Posts Container with smooth transition */}
              <div className="transition-all duration-500 ease-in-out">
                {shuffledPosts.length > 0 && (
                  <LinkedInPost
                    key={`${shuffledPosts[currentPostIndex].url}-${currentPostIndex}`}
                    authorName={
                      shuffledPosts[currentPostIndex].postData.authorName
                    }
                    authorJobTitle={
                      shuffledPosts[currentPostIndex].postData.authorJobTitle
                    }
                    authorProfilePicture={
                      shuffledPosts[currentPostIndex].postData
                        .authorProfilePicture
                    }
                    timePosted={
                      shuffledPosts[currentPostIndex].postData.timePosted
                    }
                    postContent={
                      shuffledPosts[currentPostIndex].postData.postContent
                    }
                    reactionsCount={
                      shuffledPosts[currentPostIndex].postData.reactionsCount
                    }
                    commentsCount={
                      shuffledPosts[currentPostIndex].postData.commentsCount
                    }
                    postImages={
                      shuffledPosts[
                        currentPostIndex
                      ].postData.newImageFilenames?.map(
                        (filename) => `/assets/images/linkedin/${filename}`,
                      ) || []
                    }
                    url={shuffledPosts[currentPostIndex].url}
                  />
                )}
              </div>
            </div>

            <p className="text-lg">
              {t('impacto.linkedinMorePart1')}
              <Link
                href="/sponsor-deck/linkedin"
                className="text-primary hover:underline"
              >
                {t('impacto.linkedinMoreLinkText')}
              </Link>
              {t('impacto.linkedinMorePart2')}
            </p>
          </div>

          {/* Instagram y Youtube Subsection */}
          <div id="instagram-youtube" className="space-y-2">
            <h4 className="font-medium text-xl">
              {t('navigation.instagramYoutube')}
            </h4>
            <ContinuousCarousel speed={40} gap={12} height="12rem">
              <HackathonVideo
                src="/videos/blessedux-random.mp4"
                className="h-full w-32 object-cover md:w-48"
              />
              <HackathonVideo
                src="/videos/sergio-appel-random.mp4"
                className="h-full w-32 object-cover md:w-48"
              />
              <HackathonVideo
                src="/videos/piru-cisternas-random.mp4"
                className="h-full w-48 object-cover md:w-72"
              />
              <HackathonVideo
                src="/videos/phack_720p_compressed_rotated_matched.mp4"
                className="h-full w-48 object-cover md:w-72"
              />
            </ContinuousCarousel>
            <p className="mt-4 text-lg">
              {t('impacto.youtubeDescriptionPart1')}
              <Link
                href="/sponsor-deck/youtube"
                className="text-primary hover:underline"
              >
                {t('impacto.youtubeDescriptionLinkText')}
              </Link>
              {t('impacto.youtubeDescriptionPart2')}
            </p>
          </div>

          {/* Blogposts Subsection */}
          <div id="blogposts" className="space-y-2">
            <h4 className="font-medium text-xl">{t('navigation.blogposts')}</h4>
            <p className="text-lg">
              <Link
                href="https://medium.com/@matiascoxed/mi-primera-hackathon-c%C3%B3mo-cagarla-f%C3%A1cil-tips-y-un-poco-m%C3%A1s-82b462c5d78e"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Matías
              </Link>{' '}
              y{' '}
              <Link
                href="https://huss.substack.com/p/ganamos-la-hackaton-de-platanus"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Husam
              </Link>{' '}
              {t('impacto.blogpostsDescriptionPart2')}
            </p>
          </div>

          {/* Diario Subsection */}
          <div id="diario" className="space-y-2">
            <h4 className="font-medium text-xl">{t('navigation.diario')}</h4>
            <p className="text-lg">{t('impacto.diarioDescription')}</p>
            <button
              className="relative block h-96 w-full max-w-md cursor-pointer overflow-hidden rounded-md grayscale filter transition-all duration-300 hover:scale-105 hover:grayscale-0"
              onClick={() =>
                setSelectedImage('/assets/images/hack-24/dfmas-crop.jpg')
              }
              type="button"
            >
              <Image
                src="/assets/images/hack-24/dfmas-crop.jpg"
                alt="DF Mas newspaper article"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 300px, 400px"
              />
            </button>
            <p className="text-lg">
              {t('impacto.diarioLinkPart1')}
              <Link
                href="https://www.df.cl/df-mas/punto-de-partida/36-horas-de-programacion-nonstop-asi-fue-la-primera-platanus-hack"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('impacto.diarioLinkText')}
              </Link>
              {t('impacto.diarioLinkPart2')}
            </p>
          </div>
        </section>

        {/* Deadlines Section */}
        <section id="deadlines" className="space-y-6">
          <h2 className="flex items-center gap-2 font-bold text-3xl">
            <span>⏰</span>
            {t('deadlines.title')}
          </h2>

          <div className="space-y-6">
            {/* First Deadline - Oct 17 */}
            <div
              className={`rounded-lg border p-6 ${isBeforeFirst ? 'border-primary/50 bg-primary/5' : 'bg-background/50 opacity-60'}`}
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-xl">
                      {t('deadlines.first.title')}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t('deadlines.first.date')}
                    </p>
                  </div>
                  {isBeforeFirst && (
                    <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 font-medium text-primary text-xs">
                      {t('deadlines.upcoming')}
                    </span>
                  )}
                  {isAfterFirst && (
                    <span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground text-xs">
                      {t('deadlines.passed')}
                    </span>
                  )}
                </div>
                <ul className="space-y-2 text-lg">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{t('deadlines.first.benefits.0')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{t('deadlines.first.benefits.1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{t('deadlines.first.benefits.2')}</span>
                  </li>
                </ul>

                {isBeforeFirst && (
                  <div className="mt-6">
                    <p className="mb-3 text-center font-medium text-muted-foreground text-sm">
                      {t('deadlines.timeLeft')}
                    </p>
                    <div className="flex justify-center">
                      <CountdownTimer targetDate={firstDeadline} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Second Deadline - Oct 31 */}
            <div
              className={`rounded-lg border p-6 ${isBetween ? 'border-orange-500/50 bg-orange-500/5' : isAfterSecond ? 'bg-background/50 opacity-60' : 'bg-background/50'}`}
            >
              <div className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-xl">
                      {t('deadlines.second.title')}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {t('deadlines.second.date')}
                    </p>
                  </div>
                  {isBetween && (
                    <span className="inline-flex w-fit rounded-full bg-orange-500/10 px-3 py-1 font-medium text-orange-600 text-xs">
                      {t('deadlines.lastCall')}
                    </span>
                  )}
                  {isAfterSecond && (
                    <span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 font-medium text-muted-foreground text-xs">
                      {t('deadlines.passed')}
                    </span>
                  )}
                </div>
                <p className="text-lg">{t('deadlines.second.description')}</p>

                {isBetween && (
                  <div className="mt-6">
                    <p className="mb-3 text-center font-medium text-muted-foreground text-sm">
                      {t('deadlines.timeLeft')}
                    </p>
                    <div className="flex justify-center">
                      <CountdownTimer targetDate={secondDeadline} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Paquetes para sponsors Section */}
        <section id="paquetes" className="space-y-8">
          <h2 className="flex items-center gap-2 font-bold text-3xl">
            <span>📦</span>
            {t('navigation.paquetes').replace('📦 ', '')}
          </h2>

          {/* Basic Package */}
          <div id="basic" className="space-y-4 rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-2xl">
                <span>🫶</span>
                Basic
              </h3>
              <p className="font-bold text-2xl text-primary">$5,000 USD</p>
            </div>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.basic.item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.basic.item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.basic.item3')}</span>
              </li>
            </ul>

            {/* Confirmed Sponsors */}
            <div className="mt-6 border-border border-t pt-4">
              <p className="mb-3 text-muted-foreground text-sm">
                {t('packages.basic.confirmedSponsors')}
              </p>
              <div className="flex flex-col items-center justify-center gap-6">
                <div className="flex items-center justify-center gap-8">
                  <Image
                    src="/assets/logos/buda.png"
                    alt="Buda.com"
                    width={140}
                    height={42}
                    className="brightness-0 invert filter"
                  />
                  <Image
                    src="/assets/logos/elevenlabs.svg"
                    alt="ElevenLabs"
                    width={140}
                    height={70}
                    className="brightness-0 invert filter"
                  />
                  <Image
                    src="/assets/logos/aws.svg"
                    alt="AWS"
                    width={64}
                    height={32}
                    className="brightness-0 invert filter"
                  />
                </div>
                <div className="flex items-center justify-center gap-8">
                  <Image
                    src="/assets/logos/runway.png"
                    alt="Runway"
                    width={5000}
                    height={975}
                    className="h-auto w-[140px] brightness-0 invert filter"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Partner Package */}
          <div id="partner" className="space-y-4 rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-2xl">
                <span>🚀</span>
                Partner
              </h3>
              <p className="rounded-md bg-primary/10 px-3 py-1 font-bold text-primary text-xl">
                SOLD OUT!
              </p>
            </div>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.partner.item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.partner.item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.partner.item3')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.partner.item4')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.partner.item5')}</span>
              </li>
            </ul>

            {/* Confirmed Sponsors */}
            <div className="mt-6 border-border border-t pt-4">
              <p className="mb-3 text-muted-foreground text-sm">
                {t('packages.basic.confirmedSponsors')}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8">
                <div className="flex h-16 items-center">
                  <Image
                    src="/assets/logos/agendapro.svg"
                    alt="AgendaPro"
                    width={160}
                    height={80}
                    className="brightness-0 invert filter"
                  />
                </div>
                <div className="flex h-16 items-center">
                  <Image
                    src="/assets/logos/fintoc.png"
                    alt="Fintoc"
                    width={180}
                    height={42}
                    className="brightness-0 invert filter"
                  />
                </div>
                <div className="flex h-16 items-center">
                  <Image
                    src="/assets/logos/maxxa.png"
                    alt="Maxxa"
                    width={1197}
                    height={204}
                    className="h-auto w-[80px] brightness-0 invert filter"
                  />
                </div>
                <div className="flex h-16 items-center">
                  <Image
                    src="/assets/logos/anthropic.svg"
                    alt="Anthropic"
                    width={180}
                    height={54}
                    className="brightness-0 invert filter"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Exclusive Partner Package */}
          <div id="exclusive" className="space-y-4 rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-semibold text-2xl">
                <span>👑</span>
                Exclusive partner
              </h3>
              <p className="rounded-md bg-primary/10 px-3 py-1 font-bold text-primary text-xl">
                SOLD OUT!
              </p>
            </div>
            <ul className="space-y-2 text-lg">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.exclusive.item1')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.exclusive.item2')}</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>{t('packages.exclusive.item3')}</span>
              </li>
            </ul>

            {/* Confirmed Sponsor */}
            <div className="mt-6 border-border border-t pt-4">
              <p className="mb-3 text-muted-foreground text-sm">
                {t('packages.exclusive.confirmedSponsor')}
              </p>
              <div className="flex justify-center">
                <Image
                  src="/assets/logos/buk.webp"
                  alt="Buk"
                  width={120}
                  height={60}
                  className="brightness-0 invert filter"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          <div className="space-y-2 text-center text-sm italic">
            <p>{t('packages.disclaimer')}</p>
            <p>{t('packages.vatDisclaimer')}</p>
          </div>
        </section>

        {/* Contacto Section */}
        <section id="contacto" className="space-y-4">
          <h2 className="flex items-center gap-2 font-bold text-3xl">
            <span>💬</span>
            {t('navigation.contacto').replace('💬 ', '')}
          </h2>
          <p className="text-lg">
            {t('contacto.descriptionPart1')}
            <Link
              href="mailto:rafael@platan.us"
              className="text-primary hover:underline"
            >
              {t('contacto.email')}
            </Link>
          </p>
        </section>
      </main>

      {/* Image Modal */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedImage(null);
            }
          }}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setSelectedImage(null)}
              className="-top-12 absolute right-0 z-10 text-white transition-colors hover:text-gray-300"
              aria-label="Close modal"
              type="button"
            >
              <X className="h-8 w-8" />
            </button>

            <div
              role="img"
              aria-label="Newspaper article image"
              className="relative h-[80vh] w-[80vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage}
                alt="DF Mas newspaper article"
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
