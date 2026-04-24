'use client';

export default function PostPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      {/* LinkedIn Post Container - 1200x627px */}
      <div
        className="relative h-full max-h-screen w-full max-w-4xl"
        style={{ aspectRatio: '1200/627' }}
      >
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-8 px-8 py-12"
          style={{
            backgroundImage:
              'linear-gradient(hsla(67, 100%, 50%, 0.7), hsla(67, 100%, 50%, 0.7)), url(/assets/images/hack-24/platanus-hack-29.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Platanus Hack Logo */}
          <h1
            className="text-center font-logo text-background lowercase tracking-tighter"
            style={{
              fontSize: '84px',
              opacity: 0.8,
            }}
          >
            <span className="font-light">platanus hack</span>{' '}
            <span className="font-medium">[25]</span>
          </h1>

          {/* Subtitle */}
          <div className="flex flex-col items-center gap-2">
            <h2
              className="text-center font-bold font-title text-5xl text-background leading-tight sm:text-6xl"
              style={{ opacity: 0.8 }}
            >
              21-23 nov
            </h2>
            <p
              className="text-center font-bold font-title text-2xl text-background"
              style={{ opacity: 0.8 }}
            >
              7 días para cierre de postulaciones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
