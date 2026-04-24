import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platanus Hack 26 Tour | Sponsors',
  description:
    'Platanus Hack 26: Latam Tour. La mejor hackatón de Latam visita Argentina, México, Colombia, Venezuela y Chile.',
};

export default function SponsorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
