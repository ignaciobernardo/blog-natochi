import Image from 'next/image';
import QRCode from 'qrcode';
import { CredentialCardLayout } from './credential-card-layout';
import { SponsorLogos } from './sponsor-logos';

type CredentialType =
  | 'hacker'
  | 'staff'
  | 'sponsor'
  | 'mentor'
  | 'juez'
  | 'invitado'
  | 'diseno';

interface UnifiedCredentialCardProps {
  type: CredentialType;
  fullName: string | null;
  company?: string | null;
  github?: string | null;
  hackerId?: string;
  customQrId?: string | null;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const ROLE_LABELS: Record<CredentialType, string> = {
  hacker: 'hacker',
  staff: 'staff',
  sponsor: 'sponsor',
  mentor: 'mentor',
  juez: 'juez',
  invitado: 'invitado',
  diseno: 'diseño',
};

export async function UnifiedCredentialCard({
  type,
  fullName,
  company,
  github,
  hackerId,
  customQrId,
}: UnifiedCredentialCardProps) {
  const isHacker = type === 'hacker';
  const textColor = isHacker ? 'text-white' : 'text-black';
  const qrColor = isHacker ? '#FFFFFF' : '#000000';
  const qrBgColor = isHacker ? '#00000000' : '#FFFFFF';

  // Generate QR code URL
  const githubUsername = github ? github.split('/').pop() : null;
  let identifier: string;

  if (isHacker) {
    identifier = githubUsername || hackerId || 'hacker';
    if (githubUsername) {
      identifier = `hacker/${githubUsername}`;
    }
  } else {
    identifier =
      customQrId || githubUsername || (fullName ? slugify(fullName) : type);
  }

  const qrCodeUrl = `https://25.hack.platan.us/25/id/${identifier}`;

  const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
    width: 180,
    margin: 1,
    color: {
      dark: qrColor,
      light: qrBgColor,
    },
  });

  const topLeft = (
    <p className={`font-medium font-mono text-3xl ${textColor} tracking-wider`}>
      21→23 <span className="lowercase">nov</span>
    </p>
  );

  const topRight = (
    <h1
      className={`font-logo text-4xl ${textColor} lowercase tracking-tighter`}
    >
      <span className="font-light">platanus hack</span>{' '}
      <span className="font-medium">[25]</span>
    </h1>
  );

  const centerContent = (
    <>
      <h2
        className={`text-center font-medium font-title text-7xl ${textColor} lowercase tracking-wide`}
      >
        {ROLE_LABELS[type]}
      </h2>

      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        {fullName && (
          <div className="w-full px-2 text-center">
            <p
              className={`font-medium font-title ${textColor} uppercase tracking-wider ${
                fullName.length >
                (type === 'hacker' ? 18 : type === 'mentor' ? 17 : 20)
                  ? 'text-3xl'
                  : 'text-4xl'
              }`}
            >
              {fullName}
            </p>
            {company && (
              <p
                className={`mt-1 font-medium font-title text-2xl ${textColor}`}
              >
                {company}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col items-center gap-3">
          <div className="p-0">
            <Image
              src={qrCodeDataUrl}
              alt={`QR Code for ${fullName || ROLE_LABELS[type]}`}
              width={180}
              height={180}
              className="h-[180px] w-[180px]"
              style={{ imageRendering: 'crisp-edges' }}
            />
          </div>

          <p
            className={`font-title text-3xl ${textColor}`}
            style={{ height: '42px' }}
          >
            {githubUsername && `@${githubUsername}`}
          </p>
        </div>
      </div>

      <div className="w-full px-2">
        <Image
          src="/assets/logos/ph25.svg"
          alt="P/H(25)"
          width={600}
          height={120}
          className="h-auto w-full"
          style={isHacker ? { filter: 'invert(1) brightness(2)' } : undefined}
        />
      </div>
    </>
  );

  const bottomLogos = <SponsorLogos variant={isHacker ? 'hacker' : 'staff'} />;

  return (
    <CredentialCardLayout
      topLeft={topLeft}
      topRight={topRight}
      centerContent={centerContent}
      bottomLogos={bottomLogos}
      variant={isHacker ? 'hacker' : 'staff'}
    />
  );
}
