type CardType =
  | 'hacker'
  | 'staff'
  | 'sponsor'
  | 'juez'
  | 'mentor'
  | 'invitado'
  | 'diseno';

interface SVGCredentialCardProps {
  type: CardType;
  fullName: string | null;
  company: string | null;
  github: string | null;
  qrCodeSvg: string;
  x: number;
  y: number;
  logos: {
    ph25: string;
    platanus: string;
    buk: string;
    anthropic: string;
    fintoc: string;
    agendapro: string;
    maxxa: string;
    aws: string;
    buda: string;
    runway: string;
    elevenlabs: string;
  };
}

const cardConfig: Record<
  CardType,
  {
    title: string;
    bgColor: string;
    textColor: string;
  }
> = {
  hacker: {
    title: 'hacker',
    bgColor: '#000000',
    textColor: '#FFFFFF',
  },
  staff: {
    title: 'staff',
    bgColor: '#FFFFFF',
    textColor: '#000000',
  },
  sponsor: {
    title: 'sponsor',
    bgColor: '#FFFFFF',
    textColor: '#000000',
  },
  juez: {
    title: 'juez',
    bgColor: '#FFFFFF',
    textColor: '#000000',
  },
  mentor: {
    title: 'mentor',
    bgColor: '#FFFFFF',
    textColor: '#000000',
  },
  invitado: {
    title: 'invitado',
    bgColor: '#FFFFFF',
    textColor: '#000000',
  },
  diseno: {
    title: 'diseño',
    bgColor: '#FFFFFF',
    textColor: '#000000',
  },
};

export function SVGCredentialCard({
  type,
  fullName,
  company,
  github,
  qrCodeSvg,
  x,
  y,
  logos,
}: SVGCredentialCardProps) {
  const config = cardConfig[type];
  const githubUsername = github ? github.split('/').pop() : null;

  const cardWidth = 151.67;
  const cardHeight = 240.12;
  const padding = 6.8;

  const moderatMonoFamily = 'Moderat Mono, monospace';
  const oxaniumFamily = 'Oxanium, sans-serif';
  const stolzlFamily = 'Stolzl Display, serif';

  // Extract viewBox from QR code SVG
  const viewBoxMatch = qrCodeSvg.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 100';

  // Extract inner content of SVG
  const qrContent = qrCodeSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Card background with rounded corners */}
      <rect
        width={cardWidth}
        height={cardHeight}
        rx={8.5}
        ry={8.5}
        fill={config.bgColor}
      />

      {/* Top section - Date and Logo */}
      <g transform={`translate(${padding}, ${padding})`}>
        {/* Date */}
        <text
          x="0"
          y="8.5"
          fontSize="8.5"
          fontFamily={moderatMonoFamily}
          fontWeight="500"
          fill={config.textColor}
          letterSpacing="0.05em"
        >
          21→23 <tspan style={{ textTransform: 'lowercase' }}>nov</tspan>
        </text>

        {/* Platanus Hack logo */}
        <text
          x={cardWidth - padding * 2}
          y="8.5"
          fontSize="10.21"
          fontFamily={oxaniumFamily}
          fill={config.textColor}
          textAnchor="end"
          letterSpacing="-0.05em"
          style={{ textTransform: 'lowercase' }}
        >
          <tspan fontWeight="300">platanus hack</tspan>{' '}
          <tspan fontWeight="500">[25]</tspan>
        </text>
      </g>

      {/* Center content section */}
      <g transform={`translate(${cardWidth / 2}, ${padding + 16.12})`}>
        {/* Title (hacker, staff, etc.) */}
        <text
          x="0"
          y="20.41"
          fontSize="20.41"
          fontFamily={stolzlFamily}
          fontWeight="500"
          fill={config.textColor}
          textAnchor="middle"
          letterSpacing="0.05em"
          style={{ textTransform: 'lowercase' }}
        >
          {config.title}
        </text>

        {/* Full Name */}
        {fullName &&
          (() => {
            const splitName = (name: string) => {
              if (name.length <= 18) return [name];

              const words = name.trim().split(' ');
              if (words.length === 1) return [name];

              const mid = Math.floor(words.length / 2);
              const firstLine = words.slice(0, mid).join(' ');
              const secondLine = words.slice(mid).join(' ');

              return [firstLine, secondLine];
            };

            const lines = splitName(fullName);
            const isMultiLine = lines.length > 1;

            return (
              <g transform="translate(0, 32.5)">
                <text
                  x="0"
                  y={isMultiLine ? '5' : '10.21'}
                  fontSize="10.21"
                  fontFamily={stolzlFamily}
                  fontWeight="500"
                  fill={config.textColor}
                  textAnchor="middle"
                  letterSpacing="0.1em"
                  style={{ textTransform: 'uppercase' }}
                >
                  {isMultiLine ? (
                    <>
                      <tspan x="0" dy="0">
                        {lines[0]}
                      </tspan>
                      <tspan x="0" dy="11.5">
                        {lines[1]}
                      </tspan>
                    </>
                  ) : (
                    fullName
                  )}
                </text>

                {/* Company - Always reserve space */}
                <text
                  x="0"
                  y={isMultiLine ? '26' : '22.34'}
                  fontSize="6.8"
                  fontFamily={stolzlFamily}
                  fontWeight="500"
                  fill={config.textColor}
                  textAnchor="middle"
                >
                  {company || ' '}
                </text>
              </g>
            );
          })()}

        {/* QR Code */}
        <svg
          x={-51.03 / 2}
          y={fullName ? 58 : 36}
          width="51.03"
          height="51.03"
          viewBox={viewBox}
          dangerouslySetInnerHTML={{
            __html: qrContent,
          }}
        />

        {/* GitHub username - Always reserve space */}
        <text
          x="0"
          y={fullName ? 119 : 97}
          fontSize="8.5"
          fontFamily={stolzlFamily}
          fill={config.textColor}
          textAnchor="middle"
        >
          {githubUsername ? `@${githubUsername}` : ' '}
        </text>

        {/* P/H(25) Logo */}
        {(() => {
          const centerSectionTop = padding + 16.12;
          const ph25Height = 28;
          const lastRowY = 33;
          const lastRowMaxHeight = 9.36;
          const fixedBottomPadding = 6.8;
          const fixedGapBetweenPh25AndLogos = 8;

          const bottomLogosTop =
            cardHeight - fixedBottomPadding - lastRowY - lastRowMaxHeight;
          const ph25Bottom = bottomLogosTop - fixedGapBetweenPh25AndLogos;
          const ph25Top = ph25Bottom - ph25Height;
          const ph25YRelativeToCenter = ph25Top - centerSectionTop;

          return (
            <g
              transform={`translate(${-cardWidth / 2 + padding + 2.27}, ${ph25YRelativeToCenter})`}
            >
              <image
                href={logos.ph25}
                width={cardWidth - padding * 2 - 4.54}
                height="28"
                style={
                  type === 'hacker' ? { filter: 'invert(1) brightness(2)' } : {}
                }
              />
            </g>
          );
        })()}
      </g>

      {/* Bottom logos section */}
      {(() => {
        const lastRowY = 33;
        const lastRowMaxHeight = 9.36;
        const fixedBottomPadding = 6.8;
        const bottomLogosTop =
          cardHeight - fixedBottomPadding - lastRowY - lastRowMaxHeight;

        return (
          <g transform={`translate(${padding}, ${bottomLogosTop})`}>
            {/* Row 1: Platanus and Buk */}
            <g transform="translate(0, 0)">
              <g
                transform={`translate(${(cardWidth - padding * 2 - 56 - 9.07 - 31) / 2}, 0)`}
              >
                <image
                  href={logos.platanus}
                  width="56"
                  height="15.5"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
                <image
                  href={logos.buk}
                  x="65.1"
                  width="31"
                  height="12.5"
                  y="1.4"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
              </g>
            </g>

            {/* Row 2: Anthropic, Fintoc, AgendaPro, Maxxa */}
            <g transform="translate(0, 18)">
              <g
                transform={`translate(${(cardWidth - padding * 2 - 28.35 * 3 - 32.6 - 6.8 * 3) / 2}, 0)`}
              >
                <image
                  href={logos.anthropic}
                  width="28.35"
                  height="9.36"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
                <image
                  href={logos.fintoc}
                  x="35.15"
                  width="28.35"
                  height="9.36"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
                <image
                  href={logos.agendapro}
                  x="70.3"
                  width="32.6"
                  height="10.21"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
                <image
                  href={logos.maxxa}
                  x="109.7"
                  width="28.35"
                  height="9.36"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
              </g>
            </g>

            {/* Row 3: AWS, Buda, Runway, ElevenLabs */}
            <g transform="translate(0, 33)">
              <g
                transform={`translate(${(cardWidth - padding * 2 - 14.17 - 21.26 - 26.93 - 28.35 - 6.8 * 3) / 2}, 0)`}
              >
                <image
                  href={logos.aws}
                  width="14.17"
                  height="7.09"
                  y="1"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
                <image
                  href={logos.buda}
                  x="20.97"
                  width="21.26"
                  height="7.09"
                  y="1"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
                <image
                  href={logos.runway}
                  x="49.03"
                  y="0.5"
                  width="24"
                  height="8.1"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
                <image
                  href={logos.elevenlabs}
                  x="82.76"
                  y="-0.5"
                  width="28.35"
                  height="9.36"
                  style={
                    type === 'hacker'
                      ? { filter: 'brightness(0) invert(1)' }
                      : { filter: 'brightness(0)' }
                  }
                />
              </g>
            </g>
          </g>
        );
      })()}
    </g>
  );
}
