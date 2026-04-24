export default function BuenosAiresEmailHeaderPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 md:p-10">
      <div
        className="relative w-full max-w-[600px] overflow-hidden border border-background/30 bg-primary"
        style={{ aspectRatio: '3 / 1' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0px, rgba(255, 255, 255, 0.14) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.08) 0px, rgba(0, 0, 0, 0.08) 1px, transparent 1px, transparent 12px)',
            backgroundPosition: '0 0, 1px 1px',
            opacity: 0.8,
          }}
        />

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-3 md:px-4">
          <h1 className="whitespace-nowrap text-center font-logo text-[clamp(30px,6.2vw,50px)] text-background lowercase leading-[0.9] tracking-[-0.03em]">
            <span className="font-light">platanus hack</span>{' '}
            <span className="font-medium">[26]</span>
          </h1>
          <p className="mt-2 font-title text-[clamp(10px,1.8vw,14px)] text-background uppercase tracking-[0.22em]">
            LATAM Tour
          </p>
          <p className="mt-1 text-center font-title text-[clamp(11px,1.9vw,14px)] text-background uppercase tracking-[0.15em]">
            <span className="font-bold">buenos aires</span>{' '}
            <span className="font-normal">- 8 a 10 de mayo</span>
          </p>
        </div>
      </div>
    </div>
  );
}
