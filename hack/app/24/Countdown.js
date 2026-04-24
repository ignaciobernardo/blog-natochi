'use client';

import React, { useEffect, useState } from 'react';
import { deadline } from './constants';
import Tilt from './Tilt';
import TypewriterTitle from './TypewriterTitle';

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function calculateTimeLeft() {
    const difference = +deadline - Date.now();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        días: Math.floor(difference / (1000 * 60 * 60 * 24)),
        horas: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((difference / 1000 / 60) % 60),
        segundos: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  const timeComponents = Object.entries(timeLeft).map(([unit, value]) => (
    <div key={unit} className="flex flex-col items-center">
      <span className="font-bold text-6xl transition-colors duration-300 group-hover:text-primary md:text-[11rem]">
        {value}
      </span>
      <span className="text-xl text-zinc-400 md:text-2xl">{unit}</span>
    </div>
  ));

  return (
    <section className="flex min-h-screen flex-col items-center justify-center gap-8 p-4">
      <TypewriterTitle
        text="$ apply_countdown.tick()"
        className="mb-4 text-center font-bold font-oxanium text-2xl md:text-5xl"
      />
      <p className="text-center text-xl">
        se te acaba el tiempo para postular. deadline @{' '}
        {deadline.toLocaleString()}
      </p>
      <Tilt
        className="parallax-effect"
        tiltMaxAngleX={5}
        tiltMaxAngleY={5}
        perspective={1000}
        transitionSpeed={1500}
        scale={1.02}
        gyroscope={true}
      >
        <div className="group rounded-lg border border-zinc-950 p-8 shadow-2xl transition-colors duration-300 hover:border-primary">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {isClient && timeComponents}
          </div>
        </div>
      </Tilt>
      <a
        href="https://platan.us/hack/apply"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-block transform rounded-lg bg-primary px-6 py-3 font-bold text-3xl text-black transition duration-300 ease-in-out hover:scale-105 hover:bg-secondary"
      >
        lets go
      </a>
    </section>
  );
}
