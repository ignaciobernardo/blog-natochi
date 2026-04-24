'use client';
import React, { useEffect, useState } from 'react';
import Countdown from './Countdown';
import { deadline } from './constants';
import Description from './Description';
import Features from './Features';
import Footer from './Footer';
import Hero from './Hero';
import Location from './Location';
import Prize from './Prize';
import Sponsors from './Sponsors';

export default function Home() {
  const [hasLoggedMessage, setHasLoggedMessage] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || hasLoggedMessage) return;

    console.log(
      '%chey, you look like a hacker. we have a cool hackathon for you. apply at https://platan.us/hack/apply/devtools',
      'font-size: 30px; color: #FFEC40; font-weight: bold;',
    );
    setHasLoggedMessage(true);
  }, [hasLoggedMessage]);

  return (
    <main className="relative">
      <Hero />
      <Description />
      <Prize />
      <Features />
      {deadline > new Date() && <Countdown />}
      <Location />
      <Sponsors />
      <Footer />
    </main>
  );
}
