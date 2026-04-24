import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platanus Hack 26 Arcade Challenge ft. Paisanos',
  description:
    'Vibecodea el juego de arcade más cool para Platanus Hack 26 Buenos Aires (8 al 10 de Mayo). Gana hasta 300 USD en BTC.',
  keywords: [
    'game jam',
    'hackathon',
    'games',
    'platanus',
    'paisanos',
    'arcade',
  ],
};

export default function ArcadeArLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
