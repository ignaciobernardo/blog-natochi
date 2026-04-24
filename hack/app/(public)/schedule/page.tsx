import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Schedule } from '@/src/components/schedule';
import { getDefaultEvent } from '@/src/queries/events';
import { getTimeSlotsByEvent } from '@/src/queries/time-slots';

export const metadata: Metadata = {
  title: 'Platanus Hack 25 - Cronograma',
};

export default async function SchedulePage() {
  const event = await getDefaultEvent();

  if (!event) {
    notFound();
  }

  const timeSlots = await getTimeSlotsByEvent(event.id);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="absolute top-4 right-4 z-20 hidden md:top-8 md:right-8 md:block">
          <div
            className="aspect-[576/112] h-10 w-auto"
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
        </div>

        <div className="mx-auto max-w-7xl space-y-6">
          <div className="text-center">
            <h1 className="inline-block font-bold font-title text-3xl text-primary sm:text-4xl md:text-5xl">
              <span className="bg-primary px-3 py-2 text-background">
                Cronograma
              </span>
            </h1>
            <p className="mt-4 font-mono text-primary/70 text-sm md:text-base">
              21-23 de Noviembre, 2025 • Santiago, Chile
            </p>
          </div>

          <Schedule timeSlots={timeSlots} />
        </div>
      </div>
    </div>
  );
}
