'use client';

import { toPng } from 'html-to-image';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);

  const exportAllContainers = async () => {
    setIsExporting(true);
    try {
      const containers = document.querySelectorAll('[data-container-id]');

      for (let i = 0; i < containers.length; i++) {
        const container = containers[i] as HTMLElement;
        const containerId = container.getAttribute('data-container-id');

        await new Promise((resolve) => setTimeout(resolve, 100));

        const dataUrl = await toPng(container, {
          cacheBust: true,
          pixelRatio: 2,
        });

        const link = document.createElement('a');
        link.download = `credentials-container-${containerId}.png`;
        link.href = dataUrl;
        link.click();

        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Error exporting containers:', error);
      alert('Error exporting containers. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={exportAllContainers} disabled={isExporting}>
      {isExporting ? 'Exporting...' : 'Export All Containers as PNG'}
    </Button>
  );
}
