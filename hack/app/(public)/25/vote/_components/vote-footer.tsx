import Link from 'next/link';

export function VoteFooter() {
  return (
    <div className="border-primary/20 border-t bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        {/* Left - Platanus Hack [25] link */}
        <Link
          href="/25"
          className="font-logo text-lg text-primary lowercase tracking-tighter transition-colors hover:text-primary/80 sm:text-xl md:text-2xl"
        >
          <span className="font-light">platanus hack</span>{' '}
          <span className="font-medium">[25]</span>
        </Link>

        {/* Right - Logos */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          <a
            href="https://platan.us"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
          >
            <div
              className="aspect-[576/112] h-6 w-auto sm:h-7 md:h-8"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                maskImage: 'url(/assets/logos/platanus.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
          </a>
          <a
            href="https://buk.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
          >
            <div
              className="aspect-[1124/424] h-5 w-auto sm:h-6 md:h-7"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                maskImage: 'url(/assets/logos/buk-crop.webp)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url(/assets/logos/buk-crop.webp)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
              }}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
