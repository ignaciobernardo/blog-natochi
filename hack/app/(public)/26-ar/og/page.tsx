import { RotatingMate } from '../_components/rotating-mate';

export default function BuenosAiresOGPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-8">
      <div
        className="relative overflow-hidden border border-background/20 bg-primary"
        style={{
          width: '1200px',
          height: '630px',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.16) 0px, rgba(255, 255, 255, 0.16) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(135deg, rgba(0, 0, 0, 0.08) 0px, rgba(0, 0, 0, 0.08) 1px, transparent 1px, transparent 12px)',
            backgroundPosition: '0 0, 1px 1px',
            opacity: 0.7,
          }}
        />

        <div className="relative z-10 grid h-full grid-cols-2">
          <div className="flex h-full flex-col justify-center pl-20 text-background">
            <div className="whitespace-nowrap font-logo text-[72px] lowercase leading-[0.95] tracking-tight">
              <span className="font-light">platanus hack</span>{' '}
              <span className="font-medium">[26]</span>
            </div>
            <div className="mt-8 font-bold font-title text-4xl uppercase tracking-[0.2em]">
              buenos aires
            </div>
            <div className="mt-4 font-title text-3xl uppercase tracking-[0.22em]">
              8-10 mayo
            </div>
          </div>

          <div className="relative h-full">
            <RotatingMate className="-top-6 right-0 bottom-6 left-[-14%]" />
          </div>
        </div>
      </div>
    </div>
  );
}
