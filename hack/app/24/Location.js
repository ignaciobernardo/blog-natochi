import dynamic from 'next/dynamic';
import Image from 'next/image';
import React from 'react';
import { FaMapMarkerAlt, FaPlay, FaStop, FaWaze } from 'react-icons/fa';
import { SiGooglemaps } from 'react-icons/si';
import Padding from './Padding';
import Tilt from './Tilt';
import TypewriterTitle from './TypewriterTitle';

const DynamicMap = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

const Location = () => {
  const position = [-33.43586850387162, -70.6302271011865];

  return (
    <section className="flex min-h-screen flex-col items-center justify-center">
      <Padding>
        <div className="flex flex-col items-center">
          <TypewriterTitle
            text="$ curl ipinfo.io/geo"
            className="mb-12 text-center font-bold font-oxanium text-2xl md:text-5xl"
          />

          <Tilt
            className="parallax-effect w-full md:w-[34rem]"
            tiltMaxAngleX={5}
            tiltMaxAngleY={5}
            perspective={1000}
            transitionSpeed={1500}
            scale={1.02}
            gyroscope={true}
          >
            <div className="group mb-8 w-full overflow-hidden rounded-lg border border-zinc-400 transition-all duration-300 hover:border-primary">
              <div className="flex flex-col md:flex-row">
                <div className="relative h-64 grayscale transition-all duration-300 group-hover:grayscale-0 md:h-auto md:w-1/3">
                  <Image
                    src="/hack24/oficina-fintual-resize.jpg"
                    alt="Event Location"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="flex flex-col justify-between bg-transparent p-4 md:w-2/3">
                  <div>
                    <h2 className="mb-2 font-bold text-2xl text-zinc-300 group-hover:text-primary">
                      platanus hack
                    </h2>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-zinc-300 group-hover:text-primary">
                      <FaPlay className="mr-2" />
                      <span>2024-11-22T18:45:00-03:00</span>
                    </div>
                    <div className="flex items-center text-zinc-300 group-hover:text-primary">
                      <FaStop className="mr-2" />
                      <span>2024-11-24T17:00:00-03:00</span>
                    </div>
                    <div className="flex items-center text-zinc-300 group-hover:text-primary">
                      <FaMapMarkerAlt className="mr-2" />
                      <span>fintual hq, providencia 229 🇨🇱</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Tilt>

          <div className="flex w-full items-center justify-center">
            <Tilt
              className="parallax-effect h-96 w-full max-w-full md:size-[34rem]"
              tiltMaxAngleX={5}
              tiltMaxAngleY={5}
              perspective={1000}
              transitionSpeed={1500}
              scale={1.05}
              gyroscope={true}
            >
              <div className="relative size-full overflow-hidden rounded-lg shadow-2xl">
                <DynamicMap position={position} />
                <div className="absolute bottom-4 left-4 z-30 flex space-x-2">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Providencia+229,+Santiago,+Chile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-zinc-950 p-2 shadow-md transition duration-300 hover:bg-zinc-700"
                  >
                    <SiGooglemaps className="h-6 w-6 text-primary" />
                  </a>
                  <a
                    href={`https://www.waze.com/ul?ll=${position[0]},${position[1]}&navigate=yes`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-zinc-950 p-2 shadow-md transition duration-300 hover:bg-zinc-700"
                  >
                    <FaWaze className="h-6 w-6 text-primary" />
                  </a>
                </div>
              </div>
            </Tilt>
          </div>
        </div>
      </Padding>
    </section>
  );
};

export default Location;
