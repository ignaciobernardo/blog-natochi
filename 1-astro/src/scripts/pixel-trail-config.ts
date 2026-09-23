export type PixelTrailPalette = 'original' | 'violet';

export interface PixelTrailSettings {
  size: number;
  duration: number;
  branches: number;
  maxBlocks: number;
}

// Approved landing preset. Shared by the component, renderer and playground controls.
export const pixelTrailDefaults: Readonly<PixelTrailSettings> = {
  size: 24,
  duration: 500,
  branches: 0.45,
  maxBlocks: 40,
};
