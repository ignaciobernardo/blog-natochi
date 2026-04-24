'use client';

import { Button } from '@/src/components/ui/button';

interface ExportSVGButtonProps {
  containerId: number;
}

export function ExportSVGButton({ containerId }: ExportSVGButtonProps) {
  const handleExport = async () => {
    const svg = document.querySelector('svg');
    if (!svg) {
      alert('SVG not found');
      return;
    }

    // Clone the SVG to avoid modifying the original
    const clonedSvg = svg.cloneNode(true) as SVGElement;

    // Remove any background color or style attributes
    clonedSvg.removeAttribute('style');
    clonedSvg.style.backgroundColor = '';

    // Ensure all image elements have their data properly set
    const images = clonedSvg.querySelectorAll('image');
    await Promise.all(
      Array.from(images).map(async (img) => {
        const href = img.getAttribute('href') || img.getAttribute('xlink:href');
        if (href?.startsWith('data:')) {
          // Data URL is already embedded, ensure both href and xlink:href are set
          img.setAttribute('href', href);
          img.setAttributeNS(
            'http://www.w3.org/1999/xlink',
            'xlink:href',
            href,
          );
        }
      }),
    );

    const svgData = new XMLSerializer().serializeToString(clonedSvg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `credentials-container-${containerId}.svg`;
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Button onClick={handleExport} className="fixed top-4 right-4">
      Export SVG
    </Button>
  );
}
