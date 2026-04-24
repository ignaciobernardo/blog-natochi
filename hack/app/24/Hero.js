import Image from 'next/image';
import CodeTyper from './CodeTyper';
import { deadline } from './constants';
import Padding from './Padding';
import TypewriterTitle from './TypewriterTitle';

const Hero = () => {
  const isDeadlinePassed = new Date() > deadline;

  return (
    <>
      <div className="absolute inset-0 h-screen w-full overflow-hidden bg-gradient-to-b from-zinc-800 to-zinc-950">
        <div className="relative h-full w-screen text-xs">
          <CodeTyper />
        </div>
      </div>
      <div className="relative z-10 flex h-screen w-full">
        <Padding>
          <div className="flex size-full flex-col">
            <div className="mt-12 flex flex-col">
              <TypewriterTitle
                text="$ ls main-sponsors/*.svg"
                className="h-8 w-fit font-bold font-oxanium text-lg text-zinc-200"
              />

              <div className="flex">
                <Image
                  src="/hack24/hero-sponsors.svg"
                  alt="main-sponsors"
                  height={500}
                  width={200}
                />
              </div>
            </div>
            <div className="flex grow flex-col items-start justify-center pb-36">
              <div className="flex w-full flex-col justify-center gap-3 md:flex-row">
                <h1 className="relative z-10 text-center font-medium font-oxanium text-7xl tracking-tighter md:text-8xl 2xl:text-9xl">
                  platanus hack
                </h1>
                <div className="flex flex-col justify-center text-center text-lg md:mt-4 md:text-left 2xl:text-3xl">
                  <p>22-24.nov</p>
                  <p>santiago</p>
                </div>
              </div>
              <div className="mt-8 flex w-full flex-col justify-center gap-4 px-12 sm:flex-row md:px-0">
                <div className="group relative flex items-center justify-center">
                  <button
                    type="button"
                    className={`w-full rounded-full px-8 py-3 font-bold transition duration-300 ease-in-out md:w-auto ${
                      isDeadlinePassed
                        ? 'cursor-not-allowed bg-zinc-600 opacity-70'
                        : 'bg-primary text-black hover:bg-secondary'
                    }`}
                    disabled={isDeadlinePassed}
                    onClick={() =>
                      !isDeadlinePassed &&
                      window.open('https://platan.us/hack/apply', '_blank')
                    }
                  >
                    postular
                  </button>
                  {isDeadlinePassed && (
                    <div className="-top-20 -translate-x-1/2 absolute left-1/2 z-30 w-72 translate-y-1 rounded-lg bg-zinc-800 px-4 py-2 text-sm text-white opacity-0 shadow-xl transition-all duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                      <p>
                        las postulaciones cerraron el 13 de noviembre a las
                        23:59. dudas?{' '}
                        <a
                          href="mailto:rafael@platan.us"
                          className="text-primary"
                        >
                          rafael@platan.us
                        </a>
                      </p>
                    </div>
                  )}
                </div>
                <a
                  href="https://platan.us/hack/sponsor-deck"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <button
                    type="button"
                    className="w-full rounded-full border border-white px-8 py-3 font-bold text-white backdrop-blur-sm transition-all duration-300 ease-in-out hover:border-primary hover:text-primary md:w-auto"
                  >
                    quiero ser sponsor
                  </button>
                </a>
              </div>
            </div>
          </div>
        </Padding>
      </div>
    </>
  );
};

export default Hero;
