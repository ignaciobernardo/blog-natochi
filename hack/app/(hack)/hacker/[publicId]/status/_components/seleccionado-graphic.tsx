'use client';

import { toPng } from 'html-to-image';
import { Download } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/src/components/ui/button';

interface SeleccionadoGraphicProps {
  fullName: string;
  githubUsername: string;
}

export function SeleccionadoGraphic({
  fullName,
  githubUsername,
}: SeleccionadoGraphicProps) {
  const graphicRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const updateScale = () => {
      const width = window.innerWidth;
      if (width < 400) {
        setScale(0.25);
      } else if (width < 600) {
        setScale(0.3);
      } else if (width < 800) {
        setScale(0.35);
      } else {
        setScale(0.4);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handleDownload = async () => {
    if (!graphicRef.current) return;

    try {
      const dataUrl = await toPng(graphicRef.current, {
        width: 1080,
        height: 1350,
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });

      const link = document.createElement('a');
      link.download = `platanus-hack-25-${githubUsername}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  const containerWidth = 1080 * scale;
  const containerHeight = 1350 * scale;

  return (
    <div className="flex w-full flex-col items-center space-y-4">
      {/* Preview container - scales down to fit */}
      <div
        className="overflow-hidden rounded-lg border-2 border-primary"
        style={{
          width: `${containerWidth}px`,
          height: `${containerHeight}px`,
          maxWidth: '100%',
        }}
      >
        <div
          ref={graphicRef}
          className="relative origin-top-left"
          style={{
            width: '1080px',
            height: '1350px',
            backgroundColor: 'hsl(var(--background))',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Header - Platanus Logo and Date */}
          <div className="flex items-center justify-between px-12 pt-10">
            <div
              className="h-16 w-64"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                maskImage: 'url(/assets/logos/platanus.svg)',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'left center',
                WebkitMaskImage: 'url(/assets/logos/platanus.svg)',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'left center',
              }}
            />
            <div
              className="px-6 py-3 font-bold font-mono text-2xl uppercase"
              style={{
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--background))',
              }}
            >
              hack.platan.us | 21-23 nov
            </div>
          </div>

          {/* Main Content - Centered */}
          <div className="flex min-h-[900px] flex-col items-center justify-center px-12">
            {/* SELECCIONAD@ Label */}
            <div
              className="mb-12 border-2 px-8 py-3 font-bold font-mono text-2xl uppercase"
              style={{
                borderColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary))',
              }}
            >
              SELECCIONAD@
            </div>

            {/* Full Name - Larger for portrait */}
            <h1
              className="text-center font-bold font-title text-[110px] leading-tight"
              style={{ color: 'hsl(var(--primary))' }}
            >
              {fullName}
            </h1>

            {/* Username and command - Center section */}
            <div className="mt-12 space-y-4 text-center">
              <p
                className="font-logo text-7xl lowercase tracking-tight"
                style={{ color: 'hsl(var(--primary))' }}
              >
                @{githubUsername}
              </p>
              <p
                className="font-logo text-5xl lowercase tracking-tight"
                style={{ color: 'hsl(var(--primary))' }}
              >
                hacker <span style={{ color: 'hsl(var(--primary))' }}>@</span>{' '}
                <span className="font-light">platanus hack</span>{' '}
                <span className="font-medium">[25]</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="absolute right-0 bottom-0 left-0 border-t-2 px-12 py-8"
            style={{ borderColor: 'hsl(var(--primary))' }}
          >
            {/* Sponsor logos - Buk | Grid of 4 | Grid of 4 */}
            <div className="flex items-center justify-between gap-8">
              {/* Buk - Bigger on the left */}
              <div className="flex-shrink-0">
                <div
                  className="h-16 w-32"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/buk-crop.webp)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/buk-crop.webp)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
              </div>

              {/* Vertical separator */}
              <div
                className="h-20 w-px flex-shrink-0"
                style={{ backgroundColor: 'hsl(var(--primary))' }}
              />

              {/* Grid of 4: Anthropic, AgendaPro, Fintoc, Maxxa */}
              <div className="grid grid-cols-2 gap-6">
                <div
                  className="h-16 w-36"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/anthropic-crop.svg)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/anthropic-crop.svg)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
                <div
                  className="h-16 w-36"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/agendapro-crop.svg)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/agendapro-crop.svg)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
                <div
                  className="h-10 w-24"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/fintoc-crop.png)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/fintoc-crop.png)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
                <div
                  className="h-10 w-24"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/maxxa-crop.png)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/maxxa-crop.png)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
              </div>

              {/* Vertical separator */}
              <div
                className="h-20 w-px flex-shrink-0"
                style={{ backgroundColor: 'hsl(var(--primary))' }}
              />

              {/* Grid of 4: AWS, Buda, Runway, ElevenLabs */}
              <div className="grid grid-cols-2 gap-6">
                <div
                  className="h-8 w-16"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/aws-crop.svg)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/aws-crop.svg)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
                <div
                  className="h-10 w-20"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/buda-crop.png)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/buda-crop.png)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
                <div
                  className="h-10 w-20"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/runway-crop.png)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/runway-crop.png)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
                <div
                  className="h-10 w-24"
                  style={{
                    backgroundColor: 'hsl(var(--primary))',
                    maskImage: 'url(/assets/logos/elevenlabs-crop.svg)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    WebkitMaskImage: 'url(/assets/logos/elevenlabs-crop.svg)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center">
        <Button
          onClick={handleDownload}
          size="lg"
          className="gap-2 bg-primary text-background hover:bg-primary/90"
        >
          <Download className="h-5 w-5" />
          Descargar imagen
        </Button>
      </div>
    </div>
  );
}
