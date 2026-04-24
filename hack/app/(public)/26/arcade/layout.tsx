import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platanus Hack 26 Arcade',
  description: 'Play arcade games from Platanus Hack 26',
};

export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-black">{children}</div>;
}
