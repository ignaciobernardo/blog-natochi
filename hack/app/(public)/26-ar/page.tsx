import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  ScheduleSlide,
  ScheduleSlideFallback,
} from './_components/schedule-slide';
import BuenosAiresPageClient from './page-client';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Platanus Hack 26 — Buenos Aires (8–10 mayo 2026)',
  description:
    '100 hackers, 36 horas, 3-5 por equipo. Primera parada del LATAM tour: Buenos Aires, Argentina. 8-10 de mayo de 2026.',
  alternates: {
    canonical: '/26-ar',
    types: {
      'text/markdown': '/26-ar.md',
    },
  },
};

export default function BuenosAiresPage() {
  return (
    <BuenosAiresPageClient
      scheduleSlide={
        <Suspense fallback={<ScheduleSlideFallback />}>
          <ScheduleSlide />
        </Suspense>
      }
    />
  );
}
