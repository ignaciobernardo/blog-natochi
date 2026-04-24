import Image from 'next/image';
import { CredentialCardLayout } from './credential-card-layout';
import { SponsorLogos } from './sponsor-logos';

type CardType =
  | 'hacker'
  | 'staff'
  | 'sponsor'
  | 'juez'
  | 'mentor'
  | 'invitado'
  | 'diseno';

interface UnifiedCredentialCardProps {
  type: CardType;
  fullName: string | null;
  company: string | null;
  github: string | null;
  qrCodeDataUrl: string;
  customQrId?: string | null;
}

const cardConfig: Record<
  CardType,
  {
    title: string;
    bgVariant: 'hacker' | 'staff';
    textColor: string;
  }
> = {
  hacker: {
    title: 'hacker',
    bgVariant: 'hacker',
    textColor: 'text-white',
  },
  staff: {
    title: 'staff',
    bgVariant: 'staff',
    textColor: 'text-black',
  },
  sponsor: {
    title: 'sponsor',
    bgVariant: 'staff',
    textColor: 'text-black',
  },
  juez: {
    title: 'juez',
    bgVariant: 'staff',
    textColor: 'text-black',
  },
  mentor: {
    title: 'mentor',
    bgVariant: 'staff',
    textColor: 'text-black',
  },
  invitado: {
    title: 'invitado',
    bgVariant: 'staff',
    textColor: 'text-black',
  },
  diseno: {
    title: 'diseño',
    bgVariant: 'staff',
    textColor: 'text-black',
  },
};

export async function UnifiedCredentialCard({
  type,
  fullName,
  company,
  github,
  qrCodeDataUrl,
}: UnifiedCredentialCardProps) {
  const config = cardConfig[type];

  // Strip URL from github if it's a full URL
  const githubUsername = github ? github.split('/').pop() : null;

  const topLeft = (
    <p
      className={`font-medium font-mono tracking-wider ${config.textColor}`}
      style={{ fontSize: '8.5px' }}
    >
      21→23 <span className="lowercase">nov</span>
    </p>
  );

  const topRight = (
    <h1
      className={`font-logo lowercase tracking-tighter ${config.textColor}`}
      style={{ fontSize: '10.21px' }}
    >
      <span className="font-light">platanus hack</span>{' '}
      <span className="font-medium">[25]</span>
    </h1>
  );

  const centerContent = (
    <>
      <h2
        className={`text-center font-medium font-title lowercase tracking-wide ${config.textColor}`}
        style={{ fontSize: '20.41px', flexShrink: 0 }}
      >
        {config.title}
      </h2>

      <div
        className="flex flex-1 flex-col items-center justify-center"
        style={{ gap: '2.27px' }}
      >
        {fullName && (
          <div
            className="w-full text-center"
            style={{
              paddingLeft: '2.27px',
              paddingRight: '2.27px',
            }}
          >
            <p
              className={`font-medium font-title uppercase tracking-wider ${config.textColor}`}
              style={{ fontSize: fullName.length > 18 ? '8.5px' : '10.21px' }}
            >
              {fullName}
            </p>
            {company && (
              <p
                className={`font-medium font-title ${config.textColor}`}
                style={{ marginTop: '1.13px', fontSize: '6.8px' }}
              >
                {company}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col items-center" style={{ gap: '3.4px' }}>
          <div style={{ padding: 0 }}>
            <Image
              src={qrCodeDataUrl}
              alt={`QR Code for ${fullName || type}`}
              width={102}
              height={102}
              style={{
                width: '51.03px',
                height: '51.03px',
                imageRendering: 'crisp-edges',
              }}
            />
          </div>

          <p
            className={`font-title ${config.textColor}`}
            style={{ fontSize: '8.5px', height: '11.92px' }}
          >
            {githubUsername && `@${githubUsername}`}
          </p>
        </div>
      </div>

      <div
        className="w-full"
        style={{
          paddingLeft: '2.27px',
          paddingRight: '2.27px',
          flexShrink: 0,
        }}
      >
        <Image
          src="/assets/logos/ph25.svg"
          alt="P/H(25)"
          width={170}
          height={34}
          className="h-auto w-full"
          style={
            type === 'hacker'
              ? { filter: 'invert(1) brightness(2)' }
              : undefined
          }
        />
      </div>
    </>
  );

  const logoVariant = type === 'hacker' ? 'hacker' : 'staff';
  const bottomLogos = <SponsorLogos variant={logoVariant} />;

  return (
    <CredentialCardLayout
      topLeft={topLeft}
      topRight={topRight}
      centerContent={centerContent}
      bottomLogos={bottomLogos}
      variant={config.bgVariant}
    />
  );
}
