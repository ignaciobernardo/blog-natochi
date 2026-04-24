import type { Metadata } from 'next';
import HomePageClient from './page-client';

export const metadata: Metadata = {
  title: 'Platanus Hack 26: Latam Tour',
  description:
    'De cero a producto en 36 horas con los mejores hackers de Latam. Argentina - México - Colombia - Venezuela - Chile.',
  alternates: {
    canonical: '/',
    types: {
      'text/markdown': '/index.md',
    },
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
