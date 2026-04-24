'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

const placeholderImages = [
  { id: 1, alt: 'Platanus team' },
  { id: 2, alt: 'Demo day' },
  { id: 3, alt: 'Mentorship session' },
  { id: 4, alt: 'Startup founders' },
  { id: 5, alt: 'Office space' },
  { id: 6, alt: 'Hackathon event' },
];

interface LazyInViewProps {
  children: ReactNode;
  placeholder: ReactNode;
}

function LazyInView({ children, placeholder }: LazyInViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const initiallyVisible =
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;
    setShouldRender(initiallyVisible);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setShouldRender(entry.isIntersecting);
        });
      },
      { threshold: 0 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef}>{shouldRender ? children : placeholder}</div>;
}

function AnimatedGalleryContent() {
  return (
    <div className="grid w-full grid-cols-2 gap-4">
      {placeholderImages.map((image) => (
        <div
          key={image.id}
          className="aspect-square overflow-hidden rounded-lg bg-muted"
        >
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
            <span className="text-muted-foreground text-sm">{image.alt}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AnimatedGallery() {
  const placeholder = (
    <div className="grid w-full grid-cols-2 gap-4">
      {placeholderImages.map((image) => (
        <div
          key={image.id}
          className="aspect-square overflow-hidden rounded-lg bg-muted"
        >
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/20">
            <span className="text-muted-foreground text-sm">{image.alt}</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <LazyInView placeholder={placeholder}>
      <AnimatedGalleryContent />
    </LazyInView>
  );
}
