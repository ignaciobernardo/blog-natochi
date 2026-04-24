import FullTourGlobe from '@/src/components/globe/full-tour-globe';

export default function MainOGPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary p-8">
      <div
        className="relative overflow-hidden border border-background/20 bg-primary"
        style={{
          width: '1200px',
          height: '630px',
        }}
      >
        <div className="grid h-full grid-cols-[1.05fr_0.95fr]">
          <div className="flex h-full flex-col justify-center pl-20 text-background">
            <h1 className="whitespace-nowrap font-logo text-[72px] lowercase leading-[0.95] tracking-tight">
              <span className="font-light">platanus hack</span>{' '}
              <span className="font-medium">[26]</span>
            </h1>
            <p className="mt-8 font-bold font-title text-4xl uppercase tracking-[0.2em]">
              latam tour
            </p>
            <p className="mt-5 whitespace-nowrap font-title text-xl uppercase tracking-[0.06em]">
              argentina - mexico - colombia - chile
            </p>
          </div>

          <div className="relative h-full">
            <FullTourGlobe
              className="absolute inset-0 h-full w-full scale-[0.9]"
              globeOpacity={0.82}
              hexOpacity={0.9}
              atmosphereOpacity={0.72}
              canvasOpacity={1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
