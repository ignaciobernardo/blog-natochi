'use client';

import { useEffect, useRef, useState } from 'react';

interface ContinuousCarouselProps {
  children: React.ReactNode[];
  speed?: number; // pixels per second
  gap?: number; // gap in pixels
  pauseOnHover?: boolean;
  direction?: 'left' | 'right';
  className?: string;
  height?: string; // fixed height for all items
}

export default function ContinuousCarousel({
  children,
  speed = 50,
  gap = 12,
  pauseOnHover = true,
  direction = 'left',
  className = '',
  height,
}: ContinuousCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

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

  // Measure content width on mount and resize
  useEffect(() => {
    const measureContent = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }

      if (contentRef.current) {
        const allItems = Array.from(contentRef.current.children);
        const firstOriginal = allItems[0] as HTMLElement | undefined;
        const firstDuplicate = allItems[children.length] as
          | HTMLElement
          | undefined;
        if (!firstOriginal || !firstDuplicate) return;

        const distance = firstDuplicate.offsetLeft - firstOriginal.offsetLeft;
        if (distance > 0) {
          setContentWidth(distance);
        }
      }
    };

    measureContent();

    const resizeObserver = new ResizeObserver(measureContent);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
      Array.from(contentRef.current.children).forEach((child) =>
        resizeObserver.observe(child),
      );
    }

    // Remeasure on viewport resize
    window.addEventListener('resize', measureContent);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureContent);
    };
  }, [children.length]);

  const shouldAnimate = contentWidth > 0 && isVisible && isPageVisible;
  const animationDuration =
    contentWidth > 0 ? `${contentWidth / Math.max(speed, 1)}s` : '0s';
  const copiesToRender =
    contentWidth > 0 && containerWidth > 0
      ? Math.max(2, Math.ceil(containerWidth / contentWidth) + 2)
      : 2;

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsHovered(false);
    }
  };

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Continuous carousel"
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={contentRef}
        className="marquee-track flex h-full"
        style={{
          gap: `${gap}px`,
          width: 'max-content',
          ['--marquee-distance' as string]: `${contentWidth}px`,
          ['--marquee-duration' as string]: animationDuration,
          ['--marquee-direction' as string]:
            direction === 'right' ? 'reverse' : 'normal',
          animationPlayState:
            shouldAnimate && !isHovered ? 'running' : 'paused',
        }}
      >
        {Array.from({ length: copiesToRender }).map((_, copyIndex) =>
          children.map((child, index) => (
            <div
              key={`copy-${copyIndex}-item-${index}-${typeof child === 'object' && child && 'key' in child ? child.key : index}`}
              className="flex-shrink-0"
              style={height ? { height } : undefined}
            >
              {child}
            </div>
          )),
        )}
      </div>
      <style jsx>{`
        .marquee-track {
          transform: translate3d(0, 0, 0);
          animation: marquee var(--marquee-duration) linear infinite;
          animation-direction: var(--marquee-direction, normal);
        }
        @keyframes marquee {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(calc(-1 * var(--marquee-distance)), 0, 0);
          }
        }
      `}</style>
    </div>
  );
}
