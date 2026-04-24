import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Platanus Hack 25 Arcade',
  description: 'Vibecode the hackathon arcade, get 250 usd',
};

export default function ArcadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-black">{children}</div>;
}
