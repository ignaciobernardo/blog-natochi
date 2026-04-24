import type { ReactNode } from 'react';

interface CredentialCardLayoutProps {
  topLeft: ReactNode;
  topRight: ReactNode;
  centerContent: ReactNode;
  bottomLogos: ReactNode;
  variant: 'hacker' | 'staff';
}

export function CredentialCardLayout({
  topLeft,
  topRight,
  centerContent,
  bottomLogos,
  variant,
}: CredentialCardLayoutProps) {
  const bgColor = variant === 'hacker' ? 'bg-black' : 'bg-white';

  return (
    <div
      className={`${bgColor} flex flex-col items-center overflow-hidden p-6`}
      style={{
        width: '535px',
        height: '847px',
        borderRadius: '30px',
      }}
    >
      <div className="mb-6 flex w-full items-center justify-between">
        {topLeft}
        {topRight}
      </div>

      <div className="flex w-full flex-1 flex-col">{centerContent}</div>

      <div className="mt-6 w-full">{bottomLogos}</div>
    </div>
  );
}
