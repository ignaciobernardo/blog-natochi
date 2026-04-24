'use client';

let patched = false;

export const disableFrameTicker = () => {
  if (patched) return;
  import('frame-ticker')
    .then((mod) => {
      const FrameTicker = (mod as any).default ?? mod;
      if (!FrameTicker?.prototype) return;

      const originalPause = FrameTicker.prototype.pause;
      FrameTicker.prototype.pause = function (...args: any[]) {
        return originalPause?.apply(this, args);
      };

      // Disable auto-start by making resume a no-op for future instances
      FrameTicker.prototype.resume = () => {};

      patched = true;
    })
    .catch(() => {
      // Ignore if module isn't available in this chunk
    });
};
