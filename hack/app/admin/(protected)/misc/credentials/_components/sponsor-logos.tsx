interface SponsorLogosProps {
  variant: 'hacker' | 'staff';
}

export function SponsorLogos({ variant }: SponsorLogosProps) {
  const logoColor = variant === 'hacker' ? 'bg-white' : 'bg-black';

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-center gap-8">
        <div
          className={logoColor}
          style={{
            width: '180px',
            height: '50px',
            maskImage: 'url(/assets/logos/platanus.svg)',
            WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        <div
          className={logoColor}
          style={{
            width: '100px',
            height: '40px',
            maskImage: 'url(/assets/logos/buk-crop.webp)',
            WebkitMaskImage: 'url(/assets/logos/buk-crop.webp)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-6">
        <div
          className={logoColor}
          style={{
            width: '100px',
            height: '33px',
            maskImage: 'url(/assets/logos/anthropic-crop.svg)',
            WebkitMaskImage: 'url(/assets/logos/anthropic-crop.svg)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        <div
          className={logoColor}
          style={{
            width: '100px',
            height: '33px',
            maskImage: 'url(/assets/logos/fintoc-crop.png)',
            WebkitMaskImage: 'url(/assets/logos/fintoc-crop.png)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        <div
          className={logoColor}
          style={{
            width: '115px',
            height: '36px',
            maskImage: 'url(/assets/logos/agendapro-crop.svg)',
            WebkitMaskImage: 'url(/assets/logos/agendapro-crop.svg)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        <div
          className={logoColor}
          style={{
            width: '100px',
            height: '33px',
            maskImage: 'url(/assets/logos/maxxa-crop.png)',
            WebkitMaskImage: 'url(/assets/logos/maxxa-crop.png)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-6">
        <div
          className={logoColor}
          style={{
            width: '50px',
            height: '25px',
            maskImage: 'url(/assets/logos/aws-crop.svg)',
            WebkitMaskImage: 'url(/assets/logos/aws-crop.svg)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        <div
          className={logoColor}
          style={{
            width: '75px',
            height: '25px',
            maskImage: 'url(/assets/logos/buda-crop.png)',
            WebkitMaskImage: 'url(/assets/logos/buda-crop.png)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        <div
          className={logoColor}
          style={{
            width: '95px',
            height: '32px',
            maskImage: 'url(/assets/logos/runway-crop.png)',
            WebkitMaskImage: 'url(/assets/logos/runway-crop.png)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
        <div
          className={logoColor}
          style={{
            width: '100px',
            height: '33px',
            maskImage: 'url(/assets/logos/elevenlabs-crop.svg)',
            WebkitMaskImage: 'url(/assets/logos/elevenlabs-crop.svg)',
            maskSize: 'contain',
            WebkitMaskSize: 'contain',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskPosition: 'center',
          }}
        />
      </div>
    </div>
  );
}
