import React, { useEffect, useRef, useState } from 'react';
import Padding from './Padding';
import Tilt from './Tilt';
import TypewriterTitle from './TypewriterTitle';

const Prize = () => {
  const [amount, setAmount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const animationRef = useRef(null);
  const startRef = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const end = 3000;
    const duration = 3000;
    const startTime = performance.now();

    const easeOutQuad = (t) => t * (2 - t);

    const animate = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.max(0, Math.min(elapsedTime / duration, 1));
      const easedProgress = easeOutQuad(progress);

      startRef.current = easedProgress * end;
      setAmount(Math.floor(startRef.current));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationRef.current);
  }, [isVisible]);

  return (
    <section className="flex min-h-screen w-full flex-col items-center justify-center">
      <Padding>
        <div ref={containerRef}>
          <TypewriterTitle
            text="$$$ more prizes.csv"
            className="mb-12 text-center font-bold font-oxanium text-2xl md:text-5xl"
          />

          <div className="flex flex-col items-center gap-12">
            <Tilt
              className="group parallax-effect"
              tiltMaxAngleX={5}
              tiltMaxAngleY={5}
              perspective={1000}
              transitionSpeed={1500}
              scale={1.02}
              gyroscope={true}
            >
              <div className="font-bold text-6xl transition-colors duration-300 group-hover:text-primary md:text-[11rem]">
                ${amount}
                <span className="text-3xl md:text-[8rem]"> USD</span>
              </div>
            </Tilt>
            <p className="text-center text-lg md:text-xl">
              en
              <a
                href="https://fintual.cl/acciones/"
                className="transition-colors hover:text-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                {' '}
                fintual acciones
              </a>
              . además mentorías platanus + ✨
            </p>
          </div>
        </div>
      </Padding>
    </section>
  );
};

export default Prize;
