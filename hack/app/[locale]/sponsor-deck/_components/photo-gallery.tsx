'use client';

import { Loader2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

interface PhotoGalleryProps {
  photos: string[];
  speed?: number;
  className?: string;
  height?: string;
}

export default function PhotoGallery({
  photos,
  speed = 30,
  className = '',
  height = 'h-80',
}: PhotoGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const [offset, setOffset] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Arrange photos in 2 rows of 3 columns each (6 photos per set)
  const photosPerSet = 6;
  const photoSets = useMemo(() => {
    const sets = [];
    for (let i = 0; i < photos.length; i += photosPerSet) {
      const photoSet = photos.slice(i, i + photosPerSet);
      const setId = `set-${Math.floor(i / photosPerSet)}`;
      sets.push({
        photos: photoSet.map((photo, idx) => ({
          photo,
          photoId: `${setId}-photo-${idx}`,
        })),
        setId,
      });
    }
    return sets;
  }, [photos]);

  // Measure content height on mount and resize
  useEffect(() => {
    const measureContent = () => {
      if (containerRef.current) {
        // Only measure the main sets, not including buffer
        const mainSets =
          containerRef.current.querySelectorAll('[data-type="main"]');
        if (mainSets.length > 0) {
          let totalHeight = 0;
          mainSets.forEach((set) => {
            totalHeight += (set as HTMLElement).offsetHeight;
          });
          // Add gaps between sets (gap-3 = 12px)
          const gap = 12;
          totalHeight += gap * (mainSets.length - 1);
          // Reset after exactly one full loop of main content
          setContentHeight(totalHeight);
        }
      }
    };

    // Use timeout to ensure DOM is fully rendered
    setTimeout(measureContent, 100);

    // Remeasure on window resize
    window.addEventListener('resize', measureContent);
    return () => window.removeEventListener('resize', measureContent);
  }, [photoSets.length]);

  // Animation loop with throttled state updates
  useEffect(() => {
    if (!contentHeight) return;

    let lastTime = 0;
    let accumulatedOffset = 0;
    let frameCount = 0;

    const animate = (currentTime: number) => {
      if (lastTime === 0) lastTime = currentTime;

      if (!isHovered) {
        const deltaTime = currentTime - lastTime;
        const pixelsToMove = (speed * deltaTime) / 1000;

        accumulatedOffset += pixelsToMove;

        // Reset when we've moved one full set of content
        if (accumulatedOffset >= contentHeight) {
          accumulatedOffset -= contentHeight;
        }

        // Only update state every 2 frames to reduce re-renders
        frameCount++;
        if (frameCount % 2 === 0) {
          setOffset(accumulatedOffset);
        }
      }

      lastTime = currentTime;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, isHovered, contentHeight]);

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
      document.body.style.overflow = 'hidden'; // Prevent background scroll
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
        className={`relative ${height} overflow-hidden rounded-lg ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top gradient fade */}
        <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-16 bg-gradient-to-b from-background to-transparent" />

        {/* Bottom gradient fade */}
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-16 bg-gradient-to-t from-background to-transparent" />

        <div
          className="flex flex-col gap-3"
          style={{
            transform: `translate3d(0, -${offset}px, 0)`,
            height: 'max-content',
            willChange: 'transform',
          }}
        >
          {/* Main loop - all photos */}
          {photoSets.map(({ photos: photoSet, setId }) => (
            <div
              key={`main-${setId}`}
              data-type="main"
              className="photo-set grid grid-cols-3 gap-2"
              style={{
                gridTemplateRows: 'repeat(2, 1fr)',
                contain: 'layout style paint',
              }}
            >
              {photoSet.map(({ photo, photoId }) => (
                <button
                  key={photoId}
                  type="button"
                  className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-md border-0 bg-transparent p-0 grayscale filter hover:scale-105 hover:grayscale-0"
                  onClick={() => openModal(photo)}
                  aria-label={`View photo in full size`}
                  style={{
                    transition: 'transform 0.3s ease, filter 0.3s ease',
                    contain: 'layout style paint',
                  }}
                >
                  <Image
                    src={photo}
                    alt={`Platanus Hack photo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 128px, 200px"
                    quality={75}
                    loading="eager"
                  />
                </button>
              ))}
            </div>
          ))}

          {/* Buffer - just first 2 sets to fill gaps during reset */}
          {photoSets.slice(0, 2).map(({ photos: photoSet, setId }) => (
            <div
              key={`buffer-${setId}`}
              className="photo-set grid grid-cols-3 gap-2"
              style={{
                gridTemplateRows: 'repeat(2, 1fr)',
                contain: 'layout style paint',
              }}
            >
              {photoSet.map(({ photo, photoId }) => (
                <button
                  key={`buffer-${photoId}`}
                  type="button"
                  className="relative aspect-[4/3] cursor-pointer overflow-hidden rounded-md border-0 bg-transparent p-0 grayscale filter hover:scale-105 hover:grayscale-0"
                  onClick={() => openModal(photo)}
                  aria-label={`View photo in full size`}
                  style={{
                    transition: 'transform 0.3s ease, filter 0.3s ease',
                    contain: 'layout style paint',
                  }}
                >
                  <Image
                    src={photo}
                    alt={`Platanus Hack photo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 128px, 200px"
                    quality={75}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ))}
        </div>
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

            {/* Loading Spinner */}
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
