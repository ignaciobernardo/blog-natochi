import type { Metadata } from 'next';
import './hack24.css';

export const metadata: Metadata = {
  title: 'platanus hack',
  description:
    'Los mejores techies de Chile construyendo soluciones con impacto. De cero a producto en 36 horas.',
};

export default function Hack24Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="hack24-root dark">{children}</div>;
}
