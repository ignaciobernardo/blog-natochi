'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import {
  FaBitcoin,
  FaBook,
  FaBrain,
  FaBriefcase,
  FaBuilding,
  FaCamera,
  FaChartLine,
  FaChevronDown,
  FaCode,
  FaDatabase,
  FaGear,
  FaGlobe,
  FaHeartPulse,
  FaHouse,
  FaLeaf,
  FaLightbulb,
  FaMicroscope,
  FaMobileScreen,
  FaMusic,
  FaPalette,
  FaPerson,
  FaPersonDress,
  FaServer,
  FaShield,
} from 'react-icons/fa6';
import PhotoGalleryGrid from '@/app/[locale]/sponsor-deck/_components/photo-gallery-grid';

const _icons = [
  FaBrain,
  FaBook,
  FaBuilding,
  FaGear,
  FaServer,
  FaDatabase,
  FaGlobe,
  FaLightbulb,
  FaShield,
  FaChartLine,
  FaMicroscope,
  FaHeartPulse,
  FaLeaf,
  FaHouse,
  FaBriefcase,
  FaCode,
  FaPalette,
  FaMusic,
  FaCamera,
  FaMobileScreen,
];

const mentors = [
  {
    name: 'Stephanie Chau',
    title: 'Senior Software Engineer, Nirvana',
    image: '/assets/images/mentors/stephanie-chau.webp',
  },
  {
    name: 'Sebastián Hevia',
    title: 'Co-founder & CTO, AgendaPro',
    image: '/assets/images/mentors/sebastian-hevia.webp',
  },
  {
    name: 'Andrés Matte',
    title: 'Co-founder, Kapso',
    image: '/assets/images/mentors/andres-matte.webp',
  },
  {
    name: 'Cristóbal Dotte',
    title: 'Head of Engineering, Buk Finanzas',
    image: '/assets/images/mentors/cristobal-dotte.webp',
  },
  {
    name: 'Daniel Leal',
    title: 'Senior Software Engineer, Fintoc',
    image: '/assets/images/mentors/daniel-leal.webp',
  },
  {
    name: 'Enzo Tamburini',
    title: 'Co-founder, Toku',
    image: '/assets/images/mentors/enzo-tamburini.webp',
  },
  {
    name: 'Patricio López',
    title: 'Co-founder & CTO, Fraccional',
    image: '/assets/images/mentors/patricio-lopez.webp',
  },
  {
    name: 'Pedro Saratscheff',
    title: 'Co-founder & CTO, Ruuf',
    image: '/assets/images/mentors/pedro-saratscheff.webp',
  },
  {
    name: 'Tamara Lues',
    title: 'Developer, Fintual',
    image: '/assets/images/mentors/tamara-lues.webp',
  },
  {
    name: 'Andrés Cádiz',
    title: 'Senior Scientist, Uber',
    image: '/assets/images/mentors/andres-cadiz.png',
  },
  {
    name: 'Juan Ignacio Donoso',
    title: 'Infrastructure/Devops & Founder, Buda.com',
    image: '/assets/images/mentors/juan-ignacio-donoso.webp',
  },
  {
    name: 'Nicolás Teare',
    title: 'Head of Engineering, Fintoc',
    image: '/assets/images/mentors/nicolas-teare.webp',
  },
  {
    name: 'Vicente Aguilera',
    title: 'Co-founder & CTO, PartsFlow.ai',
    image: '/assets/images/mentors/vicente-aguilera.webp',
  },
  {
    name: 'Ramón Echeverría',
    title: 'Co-founder & CTO, Grupalia',
    image: '/assets/images/mentors/ramon-echeverria.webp',
  },
  {
    name: 'Nicolás Vega',
    title: 'Co-founder & CTO, Carvuk',
    image: '/assets/images/mentors/nico-vega.webp',
  },
  {
    name: 'Fernando Florenzano',
    title: 'Staff Design Engineer, Design Systems International',
    image: '/assets/images/mentors/fernando-florenzano.webp',
  },
  {
    name: 'Josefina Hidalgo',
    title: 'Engineering Manager Lead, Buk',
    image: '/assets/images/mentors/jose-hidalgo.webp',
  },
  {
    name: 'Ana Undurraga',
    title: 'Software Engineer, Buda',
    image: '/assets/images/mentors/ana-undurraga.webp',
  },
  {
    name: 'Sergio Campamá',
    title: 'CTO, Meta Food Chile',
    image: '/assets/images/mentors/sergio-campama.png',
  },
  {
    name: 'Ignacio Márquez',
    title: 'Co-founder & CTO, Plutto',
    image: '/assets/images/mentors/ignacio-marquez.webp',
  },
];

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

// Animated sponsor logo component with mask-image effect
function AnimatedSponsorLogo({
  direction = 'left',
  delay = 0,
  width,
  height,
  src,
  alt,
  className,
  scale = 1,
  highlight = false,
}: {
  direction?: 'left' | 'right';
  delay?: number;
  width: number;
  height: number;
  src: string;
  alt: string;
  className?: string;
  scale?: number;
  highlight?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const maskedDiv = e.currentTarget.querySelector(
      '.masked-logo',
    ) as HTMLDivElement;
    const colorImg = e.currentTarget.querySelector(
      '.color-logo',
    ) as HTMLImageElement;
    const logoContainer = e.currentTarget.querySelector(
      '.logo-container',
    ) as HTMLDivElement;

    if (maskedDiv && colorImg) {
      maskedDiv.style.opacity = '0';
      colorImg.style.opacity = '1';
    }

    if (highlight && logoContainer) {
      logoContainer.style.backgroundColor = 'hsl(var(--primary))';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const maskedDiv = e.currentTarget.querySelector(
      '.masked-logo',
    ) as HTMLDivElement;
    const colorImg = e.currentTarget.querySelector(
      '.color-logo',
    ) as HTMLImageElement;
    const logoContainer = e.currentTarget.querySelector(
      '.logo-container',
    ) as HTMLDivElement;

    if (maskedDiv && colorImg) {
      maskedDiv.style.opacity = '1';
      colorImg.style.opacity = '0';
    }

    if (highlight && logoContainer) {
      logoContainer.style.backgroundColor = 'transparent';
    }
  };

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  return (
    <button
      type="button"
      ref={containerRef}
      className={`relative inline-block ${highlight ? 'p-2' : ''} ${className || ''}`}
      style={{
        maxWidth: `${scaledWidth}px`,
        width: '100%',
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translateX(0)'
          : `translateX(${direction === 'left' ? '-50px' : '50px'})`,
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        background: 'none',
        border: 'none',
        padding: highlight ? undefined : 0,
        cursor: 'pointer',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-label={alt}
    >
      <div
        className="logo-container"
        style={{
          paddingBottom: `${(scaledHeight / scaledWidth) * 100}%`,
          position: 'relative',
          transition: 'background-color 0.3s ease-out',
        }}
      >
        <div
          className="masked-logo absolute inset-0 transition-opacity duration-300"
          style={{
            backgroundColor: 'hsl(var(--primary))',
            maskImage: `url(${src})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: `url(${src})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
            opacity: 1,
          }}
        />
        <Image
          src={src}
          alt={alt}
          width={scaledWidth}
          height={scaledHeight}
          className="color-logo absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: 0,
            objectFit: 'contain',
            width: '100%',
            height: '100%',
          }}
        />
      </div>
    </button>
  );
}

// Animated text component
function AnimatedText({
  children,
  className,
  direction = 'left',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'left' | 'right';
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => setIsVisible(true), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 },
    );

    if (textRef.current) {
      observer.observe(textRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <h3
      ref={textRef}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? 'translateX(0)'
          : `translateX(${direction === 'left' ? '-50px' : '50px'})`,
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
      }}
    >
      {children}
    </h3>
  );
}

// Easing function for smooth animation
const _easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// Animated person icons grid
function AnimatedPersonIcons() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const specialPersonIndex = useRef(Math.floor(Math.random() * 20) + 180);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const personIcons = Array.from({ length: 200 }, (_, i) => {
    const Icon = i % 2 === 0 ? FaPerson : FaPersonDress;
    const isSpecial = i === specialPersonIndex.current;

    const row = Math.floor(i / 20);
    const col = i % 20;
    const delay = (row + col) * 60;

    return (
      <div
        key={`person-${row}-${col}`}
        className="relative flex items-center justify-center"
      >
        <Icon
          className="text-2xl md:text-3xl"
          style={{
            color: isSpecial ? 'white' : 'hsl(var(--primary))',
            animation: isVisible
              ? `${isSpecial ? 'colorWaveWhite' : 'colorWave'} 400ms ease-in-out ${delay}ms`
              : 'none',
          }}
        />
        {isSpecial && (
          <span className="-translate-x-1/2 absolute top-full left-1/2 mt-1 whitespace-nowrap font-bold font-title text-white text-xs md:text-sm">
            you?
          </span>
        )}
      </div>
    );
  });

  return (
    <div ref={containerRef} className="grid grid-cols-20 gap-3 md:gap-4">
      {personIcons}
    </div>
  );
}

// Slot machine column component
function SlotMachineColumn({
  delay = 0,
  targetIcon = 0,
  spinKey = 0,
}: {
  delay?: number;
  targetIcon?: number;
  spinKey?: number;
}) {
  const [currentPosition, setCurrentPosition] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);

  // Pick 15 representative icons (same for all columns)
  const slotIcons = [
    FaBrain,
    FaCode,
    FaDatabase,
    FaServer,
    FaGlobe,
    FaLightbulb,
    FaShield,
    FaChartLine,
    FaMicroscope,
    FaHeartPulse,
    FaLeaf,
    FaBriefcase,
    FaPalette,
    FaMusic,
    FaCamera,
  ];

  // Create a very long strip for continuous animation
  const iconStrip = Array.from({ length: 6 }).flatMap((_, cycle) =>
    slotIcons.map((Icon, idx) => ({
      Icon,
      id: `${cycle}-${idx}`,
    })),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpinning(true);

      // Calculate how many full cycles + target position
      const targetInCurrentCycle = targetIcon;
      const fullCycles = 4; // Spin through 4 full cycles
      // Use actual container height from DOM
      const containerHeight =
        stripRef.current?.parentElement?.offsetHeight || 80;
      const _newPosition =
        (fullCycles * 15 + targetInCurrentCycle) * containerHeight;

      // After animation completes, reset to equivalent position in middle
      const animationDuration = 3000;
      setTimeout(() => {
        setIsSpinning(false);
        setCurrentPosition(targetInCurrentCycle * containerHeight);

        // Force instant position reset
        if (stripRef.current) {
          stripRef.current.style.transition = 'none';
          stripRef.current.style.transform = `translateY(-${targetInCurrentCycle * containerHeight}px)`;
          // Force reflow
          stripRef.current.offsetHeight;
        }
      }, animationDuration);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, spinKey, targetIcon]);

  // Use actual container height for calculations
  const containerHeight = stripRef.current?.parentElement?.offsetHeight || 80;
  const targetPosition = isSpinning
    ? (4 * 15 + targetIcon) * containerHeight
    : currentPosition;

  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-lg border-2 border-primary sm:h-24 sm:w-24 sm:border-3 md:h-32 md:w-32 md:border-4">
      <div
        ref={stripRef}
        className="flex flex-col"
        style={{
          transform: `translateY(-${currentPosition}px)`,
          transition: isSpinning
            ? 'transform 3s cubic-bezier(0.25, 0.1, 0.25, 1), filter 3s'
            : 'none',
          filter: isSpinning ? 'blur(2px)' : 'blur(0px)',
          ...(isSpinning && {
            transform: `translateY(-${targetPosition}px)`,
          }),
        }}
      >
        {iconStrip.map(({ Icon, id }) => (
          <div
            key={id}
            className="flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24 md:h-32 md:w-32"
          >
            <Icon className="text-3xl text-primary sm:text-4xl md:text-6xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Slot machine with 4 columns
function SlotMachine() {
  const [startAnimation, setStartAnimation] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [targetIcons, setTargetIcons] = useState([0, 3, 7, 11]);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSpunRef = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasSpunRef.current) {
            setStartAnimation(true);
            hasSpunRef.current = true;
            // Trigger first spin immediately
            setSpinKey(1);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!startAnimation) return;

    const interval = setInterval(() => {
      // Generate 4 unique icon indices (no duplicates)
      const availableIndices = Array.from({ length: 15 }, (_, i) => i);
      const selectedIndices: number[] = [];

      for (let i = 0; i < 4; i++) {
        const randomIndex = Math.floor(Math.random() * availableIndices.length);
        selectedIndices.push(availableIndices[randomIndex]);
        availableIndices.splice(randomIndex, 1);
      }

      setTargetIcons(selectedIndices);
      setSpinKey((prev) => prev + 1);
    }, 8000);

    return () => clearInterval(interval);
  }, [startAnimation]);

  return (
    <div ref={containerRef} className="flex gap-4 sm:gap-6 md:gap-8">
      <SlotMachineColumn
        delay={startAnimation ? 0 : 999999}
        targetIcon={targetIcons[0]}
        spinKey={spinKey}
      />
      <SlotMachineColumn
        delay={startAnimation ? 300 : 999999}
        targetIcon={targetIcons[1]}
        spinKey={spinKey}
      />
      <SlotMachineColumn
        delay={startAnimation ? 600 : 999999}
        targetIcon={targetIcons[2]}
        spinKey={spinKey}
      />
      <SlotMachineColumn
        delay={startAnimation ? 900 : 999999}
        targetIcon={targetIcons[3]}
        spinKey={spinKey}
      />
    </div>
  );
}

function ApplyButtonSection() {
  const [isExpired, setIsExpired] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkDeadline = () => {
      const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
      const now = Date.now();
      setIsExpired(now > eventDate);
    };

    checkDeadline();
    const timer = setInterval(checkDeadline, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isExpired) {
    return (
      <div className="flex w-full items-center justify-center bg-primary px-4 py-12 md:h-dvh md:py-0">
        <div
          role="status"
          className="relative inline-block cursor-not-allowed font-bold font-title text-6xl text-background/60 sm:text-7xl md:text-9xl"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          postula
          <div
            className="-translate-x-1/2 pointer-events-none absolute top-full left-1/2 mt-4 w-80 rounded-lg bg-background px-6 py-4 text-center font-title text-base text-primary shadow-lg transition-all duration-300 sm:text-lg"
            style={{
              opacity: showTooltip ? 1 : 0,
              transform: showTooltip
                ? 'translateX(-50%) translateY(0)'
                : 'translateX(-50%) translateY(-8px)',
            }}
          >
            Las postulaciones cerraron el domingo 10 de noviembre, 23:59 CLT.
            Dudas? hack@platan.us
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center bg-primary px-4 py-12 md:h-dvh md:py-0">
      <a
        href="/25/apply"
        className="inline-block cursor-pointer font-bold font-title text-6xl text-background transition-all duration-300 sm:text-7xl md:text-9xl"
        onMouseEnter={(e) => {
          e.currentTarget.style.textShadow =
            '0 2px 0px hsla(67, 100%, 35%, 1), 0 4px 0px hsla(67, 100%, 35%, 1), 0 6px 0px hsla(67, 100%, 35%, 1), 0 8px 0px hsla(67, 100%, 35%, 1), 0 10px 0px hsla(67, 100%, 35%, 1), 0 12px 0px hsla(67, 100%, 35%, 1), 0 14px 0px hsla(67, 100%, 35%, 1), 0 16px 0px hsla(67, 100%, 35%, 1)';
          e.currentTarget.style.transform = 'translate(12px, -16px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.textShadow = 'none';
          e.currentTarget.style.transform = 'translate(0, 0)';
        }}
      >
        postula
      </a>
    </div>
  );
}

function ApplyButton() {
  const [isExpired, setIsExpired] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkDeadline = () => {
      const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
      const now = Date.now();
      setIsExpired(now > eventDate);
    };

    checkDeadline();
    const timer = setInterval(checkDeadline, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isExpired) {
    return (
      <div
        role="status"
        className="relative z-10 flex flex-col items-center gap-2 border-2 border-background bg-background/20 px-4 py-3 sm:px-8 sm:py-6"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <h2 className="font-bold font-title text-2xl text-background/60 sm:text-3xl md:text-4xl">
          POSTULA
        </h2>
        <Countdown />
        <div
          className="pointer-events-none absolute top-full mt-2 w-64 rounded-lg bg-background px-4 py-3 text-center font-title text-primary text-sm shadow-lg transition-all duration-300"
          style={{
            opacity: showTooltip ? 1 : 0,
            transform: showTooltip ? 'translateY(0)' : 'translateY(-8px)',
          }}
        >
          Las postulaciones cerraron el domingo 10 de noviembre, 23:59 CLT.
          Dudas? hack@platan.us
        </div>
      </div>
    );
  }

  return (
    <a
      href="/25/apply"
      className="relative z-10 flex flex-col items-center gap-2 border-2 border-background bg-transparent px-4 py-3 transition-all hover:bg-background/10 sm:px-8 sm:py-6"
    >
      <h2 className="font-bold font-title text-2xl text-background sm:text-3xl md:text-4xl">
        POSTULA
      </h2>
      <Countdown />
    </a>
  );
}

function Countdown() {
  const calculateTimeLeft = () => {
    // Deadline: November 10, 2025 23:59 Chile time (CLT = UTC-3)
    const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
    const now = Date.now();
    const difference = eventDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.isExpired) {
    return (
      <div className="font-bold font-title text-background text-xs sm:text-sm md:text-lg">
        Postulaciones cerradas
      </div>
    );
  }

  return (
    <div className="font-bold font-title text-background text-xs sm:text-sm md:text-lg">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
    </div>
  );
}

function ArcadeCountdown() {
  const calculateTimeLeft = () => {
    // Deadline: November 10, 2025 23:59 Chile time (CLT = UTC-3)
    const eventDate = new Date('2025-11-10T23:59:00-03:00').getTime();
    const now = Date.now();
    const difference = eventDate - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false,
      };
    }
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft.isExpired) {
    return null;
  }

  return (
    <div className="font-title text-lg text-primary/90 sm:text-base md:text-lg">
      Quedan{' '}
      <span className="bg-primary px-2 py-1 font-bold font-mono text-background">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m{' '}
        {timeLeft.seconds}s
      </span>{' '}
      para cerrar el challenge
    </div>
  );
}

function PongGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    playerY: 80,
    cpuY: 80,
    ballX: 250,
    ballY: 100,
    ballVelX: 180, // pixels per second
    ballVelY: 135, // pixels per second
    playerScore: 0,
    cpuScore: 0,
  });
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
        keysPressed.current[e.key.toLowerCase()] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
        keysPressed.current[e.key.toLowerCase()] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PADDLE_HEIGHT = 50;
    const PADDLE_WIDTH = 4;
    const BALL_SIZE = 6;
    const WIDTH = 500;
    const HEIGHT = 200;

    // Speed constants (pixels per second at 60fps)
    const BALL_SPEED_X = 180; // Faster ball speed
    const BALL_SPEED_Y = 135; // Faster ball speed
    const PADDLE_SPEED = 240; // 4 pixels per frame at 60fps = 240 pixels per second
    const CPU_SPEED = 96; // 1.6 pixels per frame at 60fps = 96 pixels per second

    let animationFrameId: number;
    let lastTime = performance.now();

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      const state = gameStateRef.current;

      // Update player paddle position based on held keys
      if (keysPressed.current.w) {
        state.playerY = Math.max(0, state.playerY - PADDLE_SPEED * deltaTime);
      }
      if (keysPressed.current.s) {
        state.playerY = Math.min(
          HEIGHT - PADDLE_HEIGHT,
          state.playerY + PADDLE_SPEED * deltaTime,
        );
      }

      // Update ball position
      state.ballX += state.ballVelX * deltaTime;
      state.ballY += state.ballVelY * deltaTime;

      // Ball collision with top/bottom
      if (state.ballY <= 0 || state.ballY >= HEIGHT) {
        state.ballVelY = -state.ballVelY;
      }

      // CPU AI - follow ball (balanced difficulty)
      if (state.ballY < state.cpuY + PADDLE_HEIGHT / 2 - 20) {
        state.cpuY = Math.max(0, state.cpuY - CPU_SPEED * deltaTime);
      } else if (state.ballY > state.cpuY + PADDLE_HEIGHT / 2 + 20) {
        state.cpuY = Math.min(
          HEIGHT - PADDLE_HEIGHT,
          state.cpuY + CPU_SPEED * deltaTime,
        );
      }

      // Ball collision with player paddle
      if (
        state.ballX <= PADDLE_WIDTH &&
        state.ballY >= state.playerY &&
        state.ballY <= state.playerY + PADDLE_HEIGHT
      ) {
        state.ballVelX = -state.ballVelX;
        state.ballX = PADDLE_WIDTH;
      }

      // Ball collision with CPU paddle
      if (
        state.ballX >= WIDTH - PADDLE_WIDTH - BALL_SIZE &&
        state.ballY >= state.cpuY &&
        state.ballY <= state.cpuY + PADDLE_HEIGHT
      ) {
        state.ballVelX = -state.ballVelX;
        state.ballX = WIDTH - PADDLE_WIDTH - BALL_SIZE;
      }

      // Scoring
      if (state.ballX < 0) {
        state.cpuScore++;
        state.ballX = 250;
        state.ballY = 100;
        state.ballVelX = BALL_SPEED_X;
        state.ballVelY = BALL_SPEED_Y;
      } else if (state.ballX > WIDTH) {
        state.playerScore++;
        state.ballX = 250;
        state.ballY = 100;
        state.ballVelX = -BALL_SPEED_X;
        state.ballVelY = BALL_SPEED_Y;
      }

      // Draw
      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Get primary color from CSS variable
      const primaryColor = getComputedStyle(canvas)
        .getPropertyValue('--color-primary')
        .trim();
      ctx.fillStyle = primaryColor || '#f1c40f';

      // Player paddle
      ctx.fillRect(0, state.playerY, PADDLE_WIDTH, PADDLE_HEIGHT);

      // CPU paddle
      ctx.fillRect(
        WIDTH - PADDLE_WIDTH,
        state.cpuY,
        PADDLE_WIDTH,
        PADDLE_HEIGHT,
      );

      // Ball
      ctx.fillRect(state.ballX, state.ballY, BALL_SIZE, BALL_SIZE);

      // Center line
      for (let i = 0; i < HEIGHT; i += 15) {
        ctx.fillRect(WIDTH / 2 - 1, i, 2, 10);
      }

      // Scores
      ctx.font = '20px monospace';
      ctx.fillText(state.playerScore.toString(), WIDTH / 4, 30);
      ctx.fillText(state.cpuScore.toString(), (WIDTH * 3) / 4, 30);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="rounded-lg bg-background/80 p-2 backdrop-blur-sm">
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="h-auto w-full rounded border border-primary/40"
      />
      <p className="mt-1 text-center font-mono text-primary/70 text-xs">
        Use W & S to move
      </p>
    </div>
  );
}

function ArcadeSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rotateX = -8; // Fixed perspective angle

  return (
    <div
      ref={containerRef}
      className="flex w-full items-center justify-center overflow-hidden bg-background px-4 py-12 md:h-dvh md:py-0"
    >
      {/* Mobile Layout - Simple bordered box */}
      <div className="w-full max-w-lg px-4 sm:hidden">
        <div className="space-y-5 rounded-lg border border-primary p-6">
          <h2 className="text-center font-bold font-title text-3xl leading-tight">
            <span className="inline-block bg-primary px-3 py-1 text-background">
              arcade challenge
            </span>
          </h2>

          <p className="text-center font-title text-base text-primary/90 leading-relaxed">
            En la oficina tenemos un arcade, y queremos que el juego que esté
            ahí sea construido por los hackers.
          </p>

          <p className="text-center font-title text-base text-primary/90 leading-relaxed">
            Al primer lugar le daremos{' '}
            <span className="whitespace-nowrap bg-primary px-2 py-1 text-background">
              $250 USD
            </span>{' '}
            y un cupo asegurado en el evento, al segundo{' '}
            <span className="whitespace-nowrap bg-primary px-2 py-1 text-background">
              $100 USD
            </span>
            .
          </p>

          <div className="text-center">
            <ArcadeCountdown />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <a
              href="/25/arcade"
              className="inline-block bg-primary px-6 py-3 text-center font-bold font-title text-background text-lg transition-all hover:scale-105"
            >
              Ir al challenge
            </a>
            <a
              href="/25/arcade/games"
              className="inline-block border-2 border-primary bg-background px-6 py-3 text-center font-bold font-title text-lg text-primary transition-all hover:scale-105"
            >
              Ver juegos
            </a>
          </div>
        </div>
      </div>

      {/* Desktop Layout - SVG Arcade */}
      <div
        className="relative hidden h-[90vh] w-full max-w-7xl sm:block"
        style={{
          transform: `perspective(2000px) rotateX(${rotateX * 0.3}deg)`,
          transformOrigin: 'center center',
        }}
      >
        {/* Screen outline - trapezoid shape with perspective */}
        <svg viewBox="0 0 1000 800" className="h-full w-full">
          {/* Main screen - large trapezoid (90% of height) */}
          <defs>
            {/* Clip path for screen area */}
            <clipPath id="screenClip">
              <polygon points="110,60 890,60 860,650 140,650" />
            </clipPath>
          </defs>

          {/* Main screen border - ultra minimal */}
          <polygon
            points="80,30 920,30 880,680 120,680"
            fill="black"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1"
            className="text-primary/60"
          />

          {/* CRT screen effects inside the screen */}
          <g clipPath="url(#screenClip)">
            {/* Scanlines effect */}
            <rect
              x="110"
              y="60"
              width="780"
              height="590"
              fill="url(#scanlines)"
              opacity="0.1"
            >
              <animate
                attributeName="y"
                from="60"
                to="650"
                dur="8s"
                repeatCount="indefinite"
              />
            </rect>
          </g>

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="scanlines" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.08" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            <radialGradient id="vignette">
              <stop offset="60%" stopColor="black" stopOpacity="0" />
              <stop offset="100%" stopColor="black" stopOpacity="0.5" />
            </radialGradient>
          </defs>

          {/* Control panel area - connecting lines */}
          <line
            x1="120"
            y1="680"
            x2="80"
            y2="770"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
          />
          <line
            x1="880"
            y1="680"
            x2="920"
            y2="770"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
          />
          <line
            x1="80"
            y1="770"
            x2="920"
            y2="770"
            stroke="currentColor"
            strokeWidth="3"
            className="text-primary"
          />

          {/* Control panel surface indicator lines */}
          <line
            x1="120"
            y1="680"
            x2="80"
            y2="770"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/40"
          />
          <line
            x1="300"
            y1="680"
            x2="270"
            y2="770"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/40"
          />
          <line
            x1="500"
            y1="680"
            x2="500"
            y2="770"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/40"
          />
          <line
            x1="700"
            y1="680"
            x2="730"
            y2="770"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/40"
          />
          <line
            x1="880"
            y1="680"
            x2="920"
            y2="770"
            stroke="currentColor"
            strokeWidth="2"
            className="text-primary/40"
          />

          {/* Text content with perspective */}
          <foreignObject x="120" y="50" width="760" height="630">
            <div
              className="relative h-full w-full"
              style={{
                transform: `perspective(1200px) rotateX(${rotateX}deg) scaleY(0.95)`,
                transformOrigin: 'top center',
              }}
            >
              <div className="space-y-3 px-6 pt-4 text-center sm:space-y-4 sm:px-12">
                {/* Title with highlight */}
                <h2 className="mb-3 font-bold font-title text-4xl sm:mb-4 sm:text-4xl md:text-5xl">
                  <span className="bg-primary px-3 py-1 text-background">
                    arcade challenge
                  </span>
                </h2>

                {/* Description */}
                <p className="mx-auto max-w-xl font-title text-base text-primary/90 leading-relaxed sm:text-base md:text-lg">
                  En la oficina tenemos un arcade, y queremos que el juego que
                  esté ahí sea construido por los hackers.
                </p>

                <p className="mx-auto max-w-xl font-title text-base text-primary/90 leading-relaxed sm:text-base md:text-lg">
                  Al primer lugar le daremos{' '}
                  <span className="bg-primary px-2 py-1 text-background">
                    $250 USD
                  </span>{' '}
                  y un cupo asegurado en el evento, al segundo{' '}
                  <span className="bg-primary px-2 py-1 text-background">
                    $100 USD
                  </span>
                  .
                </p>

                {/* Countdown */}
                <div className="pt-2">
                  <ArcadeCountdown />
                </div>

                {/* Buttons */}
                <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
                  <a
                    href="/25/arcade"
                    className="inline-block bg-primary px-6 py-3 font-bold font-title text-background text-lg transition-all hover:scale-105 sm:text-lg"
                  >
                    Ir al challenge
                  </a>
                  <a
                    href="/25/arcade/games"
                    className="inline-block border-2 border-primary bg-background px-6 py-3 font-bold font-title text-lg text-primary transition-all hover:scale-105 sm:text-lg"
                  >
                    Ver juegos
                  </a>
                </div>
              </div>

              {/* Pong game at bottom of screen - absolute positioning - hidden on mobile */}
              <div className="absolute right-0 bottom-0 left-0 hidden justify-center px-12 pb-2 sm:flex">
                <div className="w-full max-w-lg">
                  <PongGame />
                </div>
              </div>
            </div>
          </foreignObject>
        </svg>
      </div>
    </div>
  );
}

function ScrollRevealText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startTypewriter, setStartTypewriter] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'text1' | 'text2' | 'done'>(
    'text1',
  );
  const indexRef = useRef(0);

  const text1 = 'tenemos herramientas que hace 3 años ';
  const text1Highlight = 'ni imaginábamos.';
  const text2 = 'aún no sabemos hasta donde podemos llegar con ellas, y ';
  const text2Highlight = 'queremos averiguarlo.';

  const fullText1 = text1 + text1Highlight;
  const fullText2 = text2 + text2Highlight;

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || startTypewriter) return;

      const rect = containerRef.current.getBoundingClientRect();
      const screenHeight = window.innerHeight;

      const elementFitsInViewport =
        rect.top >= 0 && rect.bottom <= screenHeight;

      if (elementFitsInViewport) {
        setStartTypewriter(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [startTypewriter]);

  useEffect(() => {
    if (!startTypewriter || currentPhase === 'done') return;

    const typeSpeed = 25;
    const delayBetweenTexts = 300;
    const targetText = currentPhase === 'text1' ? fullText1 : fullText2;

    const timer = setInterval(() => {
      if (indexRef.current < targetText.length) {
        setDisplayedText(targetText.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        clearInterval(timer);
        if (currentPhase === 'text1') {
          setTimeout(() => {
            indexRef.current = 0;
            setDisplayedText('');
            setCurrentPhase('text2');
          }, delayBetweenTexts);
        } else {
          setCurrentPhase('done');
        }
      }
    }, typeSpeed);

    return () => clearInterval(timer);
  }, [startTypewriter, currentPhase, fullText1, fullText2]);

  const renderTextWithHighlight = (
    text: string,
    normalPart: string,
    _highlightPart: string,
  ) => {
    if (text.length <= normalPart.length) {
      return <span className="text-background">{text}</span>;
    }
    const highlightText = text.substring(normalPart.length);
    return (
      <>
        <span className="text-background">{normalPart}</span>
        <span className="bg-background px-2 py-1 text-primary">
          {highlightText}
        </span>
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className="mx-auto max-w-2xl px-4 sm:max-w-3xl md:max-w-4xl"
    >
      <div className="space-y-8 sm:space-y-12 md:space-y-16">
        {/* Left paragraph */}
        <div className="min-h-[4em] font-bold font-title text-2xl leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
          {currentPhase === 'text1' &&
            startTypewriter &&
            renderTextWithHighlight(displayedText, text1, text1Highlight)}
          {(currentPhase === 'text2' || currentPhase === 'done') && (
            <>
              <span className="text-background">{text1}</span>
              <span className="bg-background px-2 py-1 text-primary">
                {text1Highlight}
              </span>
            </>
          )}
        </div>

        {/* Right paragraph */}
        <div className="min-h-[4em] font-bold font-title text-2xl leading-tight sm:text-3xl md:text-4xl lg:text-5xl">
          {currentPhase === 'text2' &&
            startTypewriter &&
            renderTextWithHighlight(displayedText, text2, text2Highlight)}
          {currentPhase === 'done' && (
            <>
              <span className="text-background">{text2}</span>
              <span className="bg-background px-2 py-1 text-primary">
                {text2Highlight}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <div className="relative flex h-screen w-full flex-col items-center justify-center gap-12 overflow-hidden bg-primary md:h-dvh">
        {/* Gradient pattern background with grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%),
              repeating-linear-gradient(0deg, transparent, transparent 2em, hsl(var(--background)) 2em, hsl(var(--background)) 2.05em),
              repeating-linear-gradient(90deg, transparent, transparent 1.25em, hsl(var(--background)) 1.25em, hsl(var(--background)) 1.3em)
            `,
            maskImage: 'linear-gradient(to bottom, white 0%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, white 0%, transparent 100%)',
          }}
        ></div>

        {/* Logos in top right corner */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3 sm:top-6 sm:right-6 sm:gap-4 md:top-8 md:right-8 md:gap-6">
          <div
            className="aspect-[576/112] h-7 w-auto sm:h-9 md:h-10"
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
          <div
            className="aspect-[1124/424] h-7 w-auto sm:h-9 md:h-10"
            style={{
              backgroundColor: 'hsl(var(--background))',
              maskImage: 'url(/assets/logos/buk-crop.webp)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/assets/logos/buk-crop.webp)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4">
          <h1 className="text-center font-logo text-5xl text-background lowercase tracking-tighter sm:text-6xl md:text-8xl lg:text-9xl">
            <span className="font-light">platanus hack</span>{' '}
            <span className="font-medium">[25]</span>
          </h1>
        </div>
        <div className="relative z-10 border-4 border-background/20 bg-background px-6 py-4 sm:px-10 sm:py-5">
          <p className="font-bold font-mono text-primary text-xs tracking-widest sm:text-sm md:text-base lg:text-xl">
            21 → 23 DE NOV | SANTIAGO, CL
          </p>
          <div className="-m-1 absolute inset-0 border-2 border-background"></div>
        </div>

        {/* CTA Button with Countdown */}
        <ApplyButton />

        {/* Scroll indicator - desktop only */}
        <div className="-translate-x-1/2 absolute bottom-8 left-1/2 z-10 hidden md:block">
          <FaChevronDown
            className="text-2xl text-background/40"
            style={{
              animation: 'bounce 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Epic Title Screen with Scroll Effect - Yellow */}
      <div className="relative flex w-full items-center justify-center overflow-hidden bg-primary px-4 py-12 sm:px-8 md:h-dvh md:px-12 md:py-0">
        <ScrollRevealText />
      </div>

      {/* Hackers Section - Opaque */}
      <div className="flex w-full bg-background py-12 md:h-dvh md:py-0">
        {/* Left half - Text */}
        <div className="flex w-full items-center justify-center px-6 sm:px-12 md:w-1/2 md:px-16">
          <p className="font-bold font-title text-3xl text-primary leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
            buscamos a{' '}
            <span className="bg-primary px-3 py-1 text-background">200</span> de
            l@s mejores hackers de latam para ir de cero a producto en{' '}
            <span className="bg-primary px-3 py-1 text-background">
              36 horas
            </span>
          </p>
        </div>

        {/* Right half - Person icons (desktop only) */}
        <div className="hidden w-1/2 items-center justify-center px-8 py-12 md:flex">
          <AnimatedPersonIcons />
        </div>
      </div>

      {/* Third screen - Slot Machine Icons - Opaque */}
      <div className="flex w-full overflow-hidden bg-background py-12 md:h-dvh md:py-0">
        {/* Desktop Layout */}
        <div className="hidden h-full w-full items-center justify-center px-4 md:flex">
          <div className="relative grid max-w-7xl grid-cols-[1fr_auto_1fr] grid-rows-[auto_auto_auto] items-center gap-y-6 lg:gap-y-8">
            {/* Row 1: Titles */}
            <div className="flex items-center justify-center px-4 lg:px-6">
              <h2 className="text-center font-bold font-title text-4xl lg:text-6xl xl:text-7xl">
                <span className="bg-primary px-4 py-2 text-background">
                  equipo
                </span>
              </h2>
            </div>

            <div className="row-span-3 px-4 lg:px-6">
              {/* Stylish divider */}
              <div className="flex h-full items-center justify-center">
                <div className="relative h-80 w-1 bg-primary lg:h-96">
                  {/* Top decoration */}
                  <div className="-top-4 -translate-x-1/2 absolute left-1/2 h-3 w-3 bg-primary"></div>
                  {/* Middle decorations */}
                  <div className="-translate-x-1/2 absolute top-1/3 left-1/2 h-2 w-2 bg-primary"></div>
                  <div className="-translate-x-1/2 absolute top-2/3 left-1/2 h-2 w-2 bg-primary"></div>
                  {/* Bottom decoration */}
                  <div className="-bottom-4 -translate-x-1/2 absolute left-1/2 h-3 w-3 bg-primary"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center px-4 lg:px-6">
              <h2 className="text-center font-bold font-title text-4xl lg:text-6xl xl:text-7xl">
                <span className="bg-primary px-4 py-2 text-background">
                  4 tracks
                </span>
              </h2>
            </div>

            {/* Row 2: Icons/Slot Machine */}
            <div className="flex items-center justify-center gap-4 px-4 lg:gap-8 lg:px-6">
              <FaPerson className="text-5xl text-primary lg:text-7xl" />
              <FaPersonDress className="text-5xl text-primary lg:text-7xl" />
              <FaPerson className="text-5xl text-primary lg:text-7xl" />
              <FaPersonDress
                className="text-5xl lg:text-7xl"
                style={{ animation: 'colorPulse 2s ease-in-out infinite' }}
              />
              <FaPerson
                className="text-5xl lg:text-7xl"
                style={{ animation: 'colorPulse 2s ease-in-out infinite' }}
              />
            </div>

            <div className="flex items-center justify-center px-4 lg:px-6">
              <SlotMachine />
            </div>

            {/* Row 3: Paragraphs */}
            <div className="flex flex-col items-center gap-2 px-4 lg:px-6">
              <p className="text-center font-bold font-title text-lg text-primary lg:text-xl xl:text-2xl">
                postula con tu equipo de entre 3 a 5 personas
              </p>
              <p className="text-center font-bold font-title text-primary text-xs lg:text-sm xl:text-base">
                o participa{' '}
                <span className="bg-primary px-2 py-1 text-background">
                  solo
                </span>
                , con cupos muy limitados
              </p>
            </div>

            <p className="px-4 text-center font-bold font-title text-lg text-primary lg:px-6 lg:text-2xl xl:text-3xl">
              revelados al inicio del evento
            </p>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="flex w-full flex-col items-center justify-center gap-16 px-4 py-8 sm:gap-20 md:hidden">
          {/* Team section */}
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-center font-bold font-title text-4xl sm:text-5xl">
              <span className="bg-primary px-4 py-2 text-background">
                equipo
              </span>
            </h2>
            <div className="flex gap-4 sm:gap-6">
              <FaPerson className="text-4xl text-primary sm:text-5xl" />
              <FaPersonDress className="text-4xl text-primary sm:text-5xl" />
              <FaPerson className="text-4xl text-primary sm:text-5xl" />
              <FaPersonDress
                className="text-4xl sm:text-5xl"
                style={{ animation: 'colorPulse 2s ease-in-out infinite' }}
              />
              <FaPerson
                className="text-4xl sm:text-5xl"
                style={{ animation: 'colorPulse 2s ease-in-out infinite' }}
              />
            </div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-center font-bold font-title text-base text-primary sm:text-lg">
                postula con tu equipo de entre 3 a 5 personas
              </p>
              <p className="text-center font-bold font-title text-primary text-sm">
                o participa{' '}
                <span className="bg-primary px-2 py-1 text-background">
                  solo
                </span>
                , con cupos muy limitados
              </p>
            </div>
          </div>

          {/* Tracks section */}
          <div className="flex flex-col items-center gap-6">
            <h2 className="text-center font-bold font-title text-4xl sm:text-5xl">
              <span className="bg-primary px-4 py-2 text-background">
                4 tracks
              </span>
            </h2>
            <SlotMachine />
            <p className="text-center font-bold font-title text-base text-primary sm:text-lg">
              revelados al inicio del evento
            </p>
          </div>
        </div>
      </div>

      {/* Second screen - Prizes - Primary */}
      <div className="flex w-full flex-col items-center justify-center gap-4 bg-primary px-4 py-12 sm:gap-6 md:h-dvh md:gap-8 md:py-0">
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center gap-1 bg-background px-4 py-2 sm:gap-2">
            <h2 className="text-center font-bold font-title text-5xl text-primary sm:text-6xl md:text-7xl lg:text-8xl">
              premios
            </h2>
            <p className="text-center font-bold font-title text-base text-primary sm:text-lg md:text-xl lg:text-2xl">
              a repartir entre los ganadores
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          <h3 className="flex items-center gap-2 font-bold font-title text-4xl text-background sm:gap-3 sm:text-5xl md:gap-4 md:text-7xl lg:gap-6 lg:text-9xl">
            <button
              type="button"
              className="cursor-pointer border-0 bg-transparent p-0 font-bold font-title text-4xl text-background transition-all duration-300 sm:text-5xl md:text-7xl lg:text-9xl"
              onMouseEnter={(e) => {
                e.currentTarget.style.textShadow =
                  '0 2px 0px hsla(67, 100%, 35%, 1), 0 4px 0px hsla(67, 100%, 35%, 1), 0 6px 0px hsla(67, 100%, 35%, 1), 0 8px 0px hsla(67, 100%, 35%, 1), 0 10px 0px hsla(67, 100%, 35%, 1), 0 12px 0px hsla(67, 100%, 35%, 1), 0 14px 0px hsla(67, 100%, 35%, 1), 0 16px 0px hsla(67, 100%, 35%, 1)';
                e.currentTarget.style.transform = 'translate(12px, -16px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textShadow = 'none';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }}
              aria-label="Prize amount 6000 USD"
            >
              6.000 usd
            </button>
            <span>en</span>
          </h3>
          <div
            className="coin-container"
            style={{
              perspective: '1000px',
              display: 'inline-block',
            }}
          >
            <div
              className="coin-flipper"
              style={{
                animation: 'coinFlip 6s linear infinite',
                transformStyle: 'preserve-3d',
                position: 'relative',
              }}
            >
              {/* Front face */}
              <div
                style={{
                  position: 'relative',
                  width: '1em',
                  height: '1em',
                  borderRadius: '50%',
                  backgroundColor: 'hsl(var(--background))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'translateZ(4px)',
                  boxShadow: `
                    0 0 0 2px hsl(0, 0%, 15%),
                    0 0 0 4px hsl(0, 0%, 12%),
                    0 0 0 6px hsl(0, 0%, 10%),
                    0 0 0 8px hsl(0, 0%, 8%),
                    4px 4px 12px rgba(0, 0, 0, 0.4)
                  `,
                }}
                className="coin-front-face text-4xl sm:text-5xl md:text-7xl lg:text-9xl"
              >
                <FaBitcoin
                  className="text-primary"
                  style={{ fontSize: '0.7em' }}
                />
              </div>

              {/* Edge circles - positioned around the perimeter with depth */}
              {Array.from({ length: 32 }).map((_, angleIndex) => {
                const angle = (angleIndex / 32) * 360;
                const radians = (angle * Math.PI) / 180;
                const radius = 0.5; // em units
                const x = Math.cos(radians) * radius;
                const y = Math.sin(radians) * radius;

                return Array.from({ length: 12 }).map((_, depthIndex) => {
                  const z = 3.5 - depthIndex * 0.3;
                  return (
                    <div
                      key={`coin-edge-${angleIndex * 12 + depthIndex}`}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '0.08em',
                        height: '0.08em',
                        backgroundColor: 'hsl(0, 0%, 10%)',
                        transform: `translate(-50%, -50%) translate(${x}em, ${y}em) translateZ(${z}px)`,
                        borderRadius: '50%',
                      }}
                      className="coin-edge-circle text-4xl sm:text-5xl md:text-7xl lg:text-9xl"
                    />
                  );
                });
              })}

              {/* Back face */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '1em',
                  height: '1em',
                  borderRadius: '50%',
                  backgroundColor: 'hsl(var(--background))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'translateZ(-4px) rotateY(180deg)',
                  boxShadow: `
                    0 0 0 2px hsl(0, 0%, 15%),
                    0 0 0 4px hsl(0, 0%, 12%),
                    0 0 0 6px hsl(0, 0%, 10%),
                    0 0 0 8px hsl(0, 0%, 8%)
                  `,
                }}
                className="coin-back-face text-4xl sm:text-5xl md:text-7xl lg:text-9xl"
              >
                <FaBitcoin
                  className="text-primary"
                  style={{ fontSize: '0.7em', transform: 'scaleX(-1)' }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <p className="flex flex-wrap items-center justify-center gap-2 text-center font-bold font-title text-background text-base sm:text-lg md:text-xl lg:text-2xl">
            en cuentas de{' '}
            <span
              className="inline-block h-5 sm:h-6 md:h-8 lg:h-10"
              style={{
                width: '100px',
                backgroundColor: 'hsl(var(--background))',
                maskImage: 'url(/assets/logos/buda-crop.png)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/assets/logos/buda-crop.png)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
          </p>
        </div>
        <div className="font-bold font-title text-3xl text-background sm:text-4xl md:text-5xl">
          +
        </div>
        <div className="flex flex-col items-center">
          <h3 className="font-bold font-title text-4xl text-background sm:text-5xl md:text-7xl lg:text-9xl">
            <button
              type="button"
              className="inline-block cursor-pointer border-0 bg-transparent p-0 font-bold font-title text-4xl text-background transition-all duration-300 sm:text-5xl md:text-7xl lg:text-9xl"
              style={{ display: 'inline-block' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textShadow =
                  '0 2px 0px hsla(67, 100%, 35%, 1), 0 4px 0px hsla(67, 100%, 35%, 1), 0 6px 0px hsla(67, 100%, 35%, 1), 0 8px 0px hsla(67, 100%, 35%, 1), 0 10px 0px hsla(67, 100%, 35%, 1), 0 12px 0px hsla(67, 100%, 35%, 1), 0 14px 0px hsla(67, 100%, 35%, 1), 0 16px 0px hsla(67, 100%, 35%, 1)';
                e.currentTarget.style.transform = 'translate(12px, -16px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textShadow = 'none';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }}
              aria-label="Prize amount 60000 USD"
            >
              60.000 usd
            </button>
          </h3>
          <p className="flex flex-wrap items-center justify-center gap-2 text-center font-bold font-title text-background text-base sm:text-lg md:text-xl lg:text-2xl">
            en créditos de{' '}
            <span
              className="inline-block h-5 sm:h-6 md:h-8 lg:h-10"
              style={{
                width: '120px',
                backgroundColor: 'hsl(var(--background))',
                maskImage: 'url(/assets/logos/elevenlabs-crop.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/assets/logos/elevenlabs-crop.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />{' '}
            y{' '}
            <span
              className="inline-block h-5 sm:h-6 md:h-8 lg:h-10"
              style={{
                width: '80px',
                backgroundColor: 'hsl(var(--background))',
                maskImage: 'url(/assets/logos/aws-crop.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/assets/logos/aws-crop.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
          </p>
        </div>
      </div>

      {/* Mentors Screen - Yellow */}
      <div className="flex w-full flex-col items-center justify-center bg-primary px-4 py-8 md:py-12">
        <div className="mb-6 text-center md:mb-8">
          <h2 className="font-bold font-title text-5xl text-background sm:text-6xl md:text-7xl lg:text-8xl">
            <span className="bg-background px-3 py-1 text-primary">
              mentores
            </span>
          </h2>
          <p className="mt-3 font-bold font-title text-background text-lg sm:mt-4 sm:text-xl md:mt-5 md:text-2xl">
            techies con experiencia construyendo productos desde cero
          </p>
        </div>

        {/* Mentors Grid */}
        <div className="grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:gap-8 lg:grid-cols-4">
          {mentors.map((mentor) => (
            <div key={mentor.name} className="flex flex-col items-center gap-2">
              <button
                type="button"
                className="relative h-32 w-32 cursor-pointer overflow-hidden border-0 bg-transparent p-0 transition-all duration-300 sm:h-40 sm:w-40 md:h-48 md:w-48 lg:h-56 lg:w-56"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(6px, -6px)';
                  e.currentTarget.style.boxShadow =
                    '-2px 2px 0px hsla(67, 100%, 35%, 1), -4px 4px 0px hsla(67, 100%, 35%, 1), -6px 6px 0px hsla(67, 100%, 35%, 1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                aria-label={`Mentor ${mentor.name}`}
              >
                <Image
                  src={mentor.image}
                  alt={mentor.name}
                  width={224}
                  height={224}
                  className="h-full w-full object-cover grayscale"
                />
              </button>
              <div className="text-center">
                <h3 className="font-bold font-title text-background text-sm sm:text-base md:text-lg">
                  {mentor.name}
                </h3>
                <p className="font-title text-background/80 text-xs sm:text-sm md:text-base">
                  {mentor.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsors Screen - Background */}
      <div className="hidden w-full flex-col overflow-hidden bg-background py-12 md:flex lg:h-dvh lg:py-0">
        {/* Top section - Buk and Partners */}
        <div className="flex flex-1 flex-row">
          {/* Left section - Buk */}
          <div className="flex w-1/2 flex-col p-12">
            <div className="flex items-center justify-center pt-4">
              <AnimatedText
                className="bg-primary px-8 py-4 font-bold font-title text-5xl text-background md:text-6xl lg:text-7xl"
                direction="left"
                delay={0}
              >
                cool sponsors
              </AnimatedText>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <AnimatedSponsorLogo
                src="/assets/logos/buk-crop.webp"
                alt="Buk"
                width={1124}
                height={424}
                scale={1.05}
                direction="left"
                delay={0}
              />
            </div>
          </div>

          {/* Right section - Partner Sponsors */}
          <div className="flex w-1/2 flex-col items-start justify-center gap-4 overflow-y-auto px-8 py-12 lg:gap-8 lg:px-12">
            <AnimatedSponsorLogo
              src="/assets/logos/anthropic-crop.svg"
              alt="Anthropic"
              width={1197}
              height={204}
              direction="right"
              delay={100}
              highlight
            />
            <AnimatedSponsorLogo
              src="/assets/logos/agendapro-crop.svg"
              alt="AgendaPro"
              width={1197}
              height={204}
              direction="right"
              delay={200}
              highlight
            />
            <AnimatedSponsorLogo
              src="/assets/logos/fintoc-crop.png"
              alt="Fintoc"
              width={700}
              height={151}
              scale={0.9}
              direction="right"
              delay={300}
            />
            <AnimatedSponsorLogo
              src="/assets/logos/maxxa-crop.png"
              alt="Maxxa"
              width={1197}
              height={204}
              scale={0.6}
              direction="right"
              delay={400}
            />
          </div>
        </div>

        {/* Bottom section - Basic Sponsors - Full Width */}
        <div className="flex w-full items-center justify-between gap-4 px-8 py-8 lg:gap-6 lg:px-32 lg:py-12">
          <AnimatedSponsorLogo
            src="/assets/logos/buda-crop.png"
            alt="Buda.com"
            width={180}
            height={60}
            direction="left"
            delay={0}
            highlight
          />
          <AnimatedSponsorLogo
            src="/assets/logos/elevenlabs-crop.svg"
            alt="ElevenLabs"
            width={250}
            height={83}
            direction="left"
            delay={100}
          />
          <AnimatedSponsorLogo
            src="/assets/logos/aws-crop.svg"
            alt="AWS"
            width={180}
            height={60}
            direction="right"
            delay={200}
            highlight
          />
          <AnimatedSponsorLogo
            src="/assets/logos/runway-crop.png"
            alt="Runway"
            width={250}
            height={83}
            direction="right"
            delay={300}
            highlight
          />
        </div>
      </div>

      {/* Mobile Sponsors Section */}
      <div className="flex w-full flex-col overflow-x-hidden bg-background md:hidden">
        {/* Cool Sponsors Title */}
        <div className="flex items-center justify-center pt-8 pb-4">
          <AnimatedText
            className="bg-primary px-6 py-3 font-bold font-title text-4xl text-background sm:text-5xl"
            direction="left"
            delay={0}
          >
            cool sponsors
          </AnimatedText>
        </div>
        {/* All Sponsors */}
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-8">
          <AnimatedSponsorLogo
            src="/assets/logos/buk-crop.webp"
            alt="Buk"
            width={300}
            height={200}
            direction="left"
            delay={0}
          />
          <AnimatedSponsorLogo
            src="/assets/logos/anthropic-crop.svg"
            alt="Anthropic"
            width={600}
            height={102}
            direction="right"
            delay={100}
            highlight
          />
          <AnimatedSponsorLogo
            src="/assets/logos/agendapro-crop.svg"
            alt="AgendaPro"
            width={600}
            height={102}
            direction="left"
            delay={200}
            highlight
          />
          <AnimatedSponsorLogo
            src="/assets/logos/fintoc-crop.png"
            alt="Fintoc"
            width={350}
            height={59}
            direction="right"
            delay={300}
          />
          <AnimatedSponsorLogo
            src="/assets/logos/maxxa-crop.png"
            alt="Maxxa"
            width={350}
            height={59}
            direction="left"
            delay={400}
          />
        </div>

        {/* Basic Sponsors Mobile */}
        <div className="flex flex-col items-center justify-center gap-4 px-4 py-6">
          <AnimatedSponsorLogo
            src="/assets/logos/buda-crop.png"
            alt="Buda.com"
            width={130}
            height={43}
            direction="left"
            delay={0}
            highlight
          />
          <AnimatedSponsorLogo
            src="/assets/logos/elevenlabs-crop.svg"
            alt="ElevenLabs"
            width={170}
            height={57}
            direction="right"
            delay={100}
          />
          <AnimatedSponsorLogo
            src="/assets/logos/aws-crop.svg"
            alt="AWS"
            width={130}
            height={43}
            direction="left"
            delay={200}
            highlight
          />
          <AnimatedSponsorLogo
            src="/assets/logos/runway-crop.png"
            alt="Runway"
            width={170}
            height={57}
            direction="right"
            delay={300}
            highlight
          />
        </div>
      </div>

      {/* Last Year Photos Screen - Opaque */}
      <div className="relative flex w-full bg-background py-12 md:h-dvh md:py-0">
        <div className="absolute inset-0 w-full">
          <PhotoGalleryGrid
            photos={photos}
            speed={30}
            className="w-full"
            columns={4}
          />
        </div>
        <div className="relative z-10 flex w-full items-center justify-center px-4">
          <div className="rounded-lg bg-background/80 px-8 py-12 text-center backdrop-blur-sm sm:px-12 sm:py-16">
            <h2 className="font-bold font-logo text-4xl lowercase sm:text-5xl md:text-6xl">
              <span className="bg-primary px-3 py-1 text-background">
                platanus hack 24
              </span>
            </h2>
            <p className="mt-3 font-title text-foreground text-lg sm:mt-4 sm:text-xl md:mt-6 md:text-2xl">
              la primera edición del evento
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
              <a
                href="https://platan.us/hack/pics"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 font-title text-base text-primary transition-all hover:bg-primary hover:text-background sm:text-lg"
              >
                fotos oficiales
              </a>
              <a
                href="https://platan.us/hack/live"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 font-title text-base text-primary transition-all hover:bg-primary hover:text-background sm:text-lg"
              >
                transmisión
              </a>
              <a
                href="https://vote.hack.platan.us"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 font-title text-base text-primary transition-all hover:bg-primary hover:text-background sm:text-lg"
              >
                proyectos
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Arcade Challenge Screen - Opaque */}
      <ArcadeSection />

      {/* Apply Button Screen - Yellow */}
      <ApplyButtonSection />
    </>
  );
}
