'use client';

import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

interface PhotoGalleryGridProps {
  photos: string[];
  speed?: number;
  className?: string;
  columns?: number;
  fadeFrom?: string;
}

export default function PhotoGalleryGrid({
  photos,
  speed = 30,
  className = '',
  columns = 4,
  fadeFrom = 'from-background',
}: PhotoGalleryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const _offsetRef = useRef(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const gridHeightRef = useRef(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [cycleHeight, setCycleHeight] = useState(0);

  // Calculate how many times to duplicate photos for seamless loop
  // We need enough photos to fill at least 2 screens worth
  const duplicatePhotos = () => {
    const minPhotos = columns * 10; // At least 10 rows
    const copies = Math.ceil(minPhotos / photos.length);
    const result: Array<{ photo: string; id: string }> = [];
    for (let i = 0; i < copies + 1; i++) {
      photos.forEach((photo, idx) => {
        result.push({ photo, id: `${i}-${idx}` });
      });
    }
    return result;
  };

  const allPhotos = duplicatePhotos();

  // Intersection Observer to detect visibility
  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const initiallyVisible =
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;
    setIsVisible(initiallyVisible);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0 },
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      setIsPageVisible(!document.hidden);
    };
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Measure grid height
  useEffect(() => {
    const measureGrid = () => {
      if (containerRef.current) {
        const grid = containerRef.current.querySelector('[data-grid="main"]');
        if (grid) {
          gridHeightRef.current = (grid as HTMLElement).offsetHeight;
          const fullCycleHeight =
            (photos.length / allPhotos.length) * gridHeightRef.current;
          setCycleHeight(fullCycleHeight);
        }
      }
    };

    setTimeout(measureGrid, 100);
    window.addEventListener('resize', measureGrid);
    return () => window.removeEventListener('resize', measureGrid);
  }, []);

  const shouldAnimate = cycleHeight > 0 && isVisible && isPageVisible;
  const animationDuration =
    cycleHeight > 0 ? `${cycleHeight / Math.max(speed, 1)}s` : '0s';

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  const openModal = (photo: string) => {
    setSelectedPhoto(photo);
    setIsImageLoading(true);
  };

  const closeModal = () => {
    setSelectedPhoto(null);
    setIsImageLoading(false);
  };

  const handleImageLoad = () => setIsImageLoading(false);
  const handleImageError = () => setIsImageLoading(false);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  return (
    <>
      <div
        ref={containerRef}
        role="region"
        aria-label="Photo gallery"
        className={`relative h-full overflow-hidden ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top gradient fade */}
        <div
          className={`pointer-events-none absolute top-0 right-0 left-0 z-10 h-24 bg-gradient-to-b ${fadeFrom} to-transparent`}
        />

        {/* Bottom gradient fade */}
        <div
          className={`pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-24 bg-gradient-to-t ${fadeFrom} to-transparent`}
        />

        <div
          data-grid="main"
          className={`grid gap-2 sm:gap-3`}
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            willChange: 'transform',
            contain: 'layout style paint',
            ['--marquee-distance' as string]: `${cycleHeight}px`,
            ['--marquee-duration' as string]: animationDuration,
            animation:
              'gallery-marquee var(--marquee-duration) linear infinite',
            animationPlayState:
              shouldAnimate && !isHovered ? 'running' : 'paused',
          }}
        >
          {allPhotos.map(({ photo, id }, index) => (
            <button
              key={id}
              type="button"
              className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-md border-0 bg-transparent p-0 grayscale filter hover:scale-105 hover:grayscale-0"
              onClick={() => openModal(photo)}
              aria-label="View photo in full size"
              style={{
                transition: 'transform 0.3s ease, filter 0.3s ease',
                contain: 'layout style paint',
              }}
            >
              <Image
                src={photo}
                alt="Platanus Hack photo"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                quality={75}
                loading={index < columns * 3 ? 'eager' : 'lazy'}
              />
            </button>
          ))}
        </div>
        <style jsx>{`
          @keyframes gallery-marquee {
            from {
              transform: translate3d(0, 0, 0);
            }
            to {
              transform: translate3d(0, calc(-1 * var(--marquee-distance)), 0);
            }
          }
        `}</style>
      </div>

      {/* Fullscreen Modal */}
      {selectedPhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeModal}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              closeModal();
            }
          }}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={closeModal}
              className="-top-12 absolute right-0 z-10 text-white transition-colors hover:text-gray-300"
              aria-label="Close modal"
            >
              <X className="h-8 w-8" />
            </button>

            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
              </div>
            )}

            <div
              role="img"
              aria-label="Full size photo"
              className="relative h-[80vh] w-[80vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedPhoto}
                alt="Platanus Hack photo"
                fill
                className={`object-contain transition-opacity duration-300 ${
                  isImageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                sizes="90vw"
                priority
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
