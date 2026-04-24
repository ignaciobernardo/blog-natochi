'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';

interface LazyGlobeWrapperProps {
  children: ReactNode;
  className?: string;
  /** Placeholder content shown when globe is not mounted */
  placeholder?: ReactNode;
  /** How much of the element must be visible to mount (0-1) */
  threshold?: number;
  /** Extra margin around the viewport to pre-mount earlier */
  rootMargin?: string;
}

/**
 * Wrapper that only mounts children (Globe components) when visible.
 * This completely unmounts the three-globe instance when not visible,
 * which guarantees all internal animations (frame-ticker) are stopped.
 */
export default function LazyGlobeWrapper({
  children,
  className,
  placeholder,
  threshold = 0.05,
  rootMargin = '100px', // Pre-mount slightly before visible
}: LazyGlobeWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          console.log(
            '[LazyGlobeWrapper] Visibility:',
            entry.isIntersecting ? 'MOUNT' : 'UNMOUNT',
          );
          setShouldMount(entry.isIntersecting);
        });
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin]);

  return (
    <div ref={containerRef} className={className}>
      {shouldMount ? children : placeholder}
    </div>
  );
}
