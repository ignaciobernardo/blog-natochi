import type { Metadata } from 'next';
import { HACK_26_AR, SITE_URL } from '@/src/lib/constants';
import DevtoolsConsoleArt from './_components/devtools-console-art';

export const metadata: Metadata = {
  title: 'Platanus Hack 26: Hackathon Buenos Aires 2026',
  description:
    '120 de los más cracks de Buenos Aires construyendo desde cero en la mejor hackathon de LATAM. 36 horas sin parar. 8 a 10 de Mayo.',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: HACK_26_AR.name,
  startDate: HACK_26_AR.startsAt,
  endDate: HACK_26_AR.endsAt,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: `${HACK_26_AR.city}, Argentina`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: HACK_26_AR.city,
      addressCountry: HACK_26_AR.country,
    },
  },
  url: `${SITE_URL}/${HACK_26_AR.slug}`,
  description:
    '120 de los más cracks de Buenos Aires construyendo desde cero en la mejor hackathon de LATAM. 36 horas sin parar. 8 a 10 de Mayo.',
  organizer: {
    '@type': 'Organization',
    name: 'Platanus',
    url: 'https://platan.us',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DevtoolsConsoleArt />
      {children}
    </>
  );
}
