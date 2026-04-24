import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-primary px-6">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 100%),
            repeating-linear-gradient(0deg, transparent, transparent 2em, hsl(var(--background)) 2em, hsl(var(--background)) 2.05em),
            repeating-linear-gradient(90deg, transparent, transparent 1.25em, hsl(var(--background)) 1.25em, hsl(var(--background)) 1.3em)
          `,
          maskImage: 'linear-gradient(to bottom, white 0%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, white 0%, transparent 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="font-bold font-title text-8xl text-background leading-none sm:text-9xl">
          404
        </h1>
        <Link
          href="/"
          className="mt-6 border-2 border-background bg-background px-5 py-2 font-bold font-title text-primary transition-all hover:scale-105"
        >
          Back to landing
        </Link>
      </div>
    </div>
  );
}
