'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/src/components/ui/button';

interface ColorMeta {
  name: string;
  cssVar: string;
  tailwindClass: string;
}

interface ColorWithValue extends ColorMeta {
  hslValue: string;
  hexValue: string;
}

// Convert HSL string "H S% L%" or "H S L" to HEX
function hslToHex(hslRaw: string): string {
  const cleaned = hslRaw.trim();
  const parts = cleaned.split(/\s+/);
  if (parts.length < 3) return '#000000';

  const h = Number.parseFloat(parts[0]);
  const s = Number.parseFloat(parts[1]) / 100;
  const l = Number.parseFloat(parts[2]) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Only metadata - no hardcoded values
const colorsMeta: Record<string, ColorMeta[]> = {
  core: [
    {
      name: 'Background',
      cssVar: '--background',
      tailwindClass: 'bg-background',
    },
    {
      name: 'Foreground',
      cssVar: '--foreground',
      tailwindClass: 'text-foreground',
    },
    { name: 'Primary', cssVar: '--primary', tailwindClass: 'bg-primary' },
    {
      name: 'Primary Foreground',
      cssVar: '--primary-foreground',
      tailwindClass: 'text-primary-foreground',
    },
    { name: 'Secondary', cssVar: '--secondary', tailwindClass: 'bg-secondary' },
    {
      name: 'Secondary Foreground',
      cssVar: '--secondary-foreground',
      tailwindClass: 'text-secondary-foreground',
    },
  ],
  ui: [
    { name: 'Card', cssVar: '--card', tailwindClass: 'bg-card' },
    {
      name: 'Card Foreground',
      cssVar: '--card-foreground',
      tailwindClass: 'text-card-foreground',
    },
    { name: 'Popover', cssVar: '--popover', tailwindClass: 'bg-popover' },
    {
      name: 'Popover Foreground',
      cssVar: '--popover-foreground',
      tailwindClass: 'text-popover-foreground',
    },
    { name: 'Muted', cssVar: '--muted', tailwindClass: 'bg-muted' },
    {
      name: 'Muted Foreground',
      cssVar: '--muted-foreground',
      tailwindClass: 'text-muted-foreground',
    },
    { name: 'Accent', cssVar: '--accent', tailwindClass: 'bg-accent' },
    {
      name: 'Accent Foreground',
      cssVar: '--accent-foreground',
      tailwindClass: 'text-accent-foreground',
    },
    {
      name: 'Destructive',
      cssVar: '--destructive',
      tailwindClass: 'bg-destructive',
    },
    {
      name: 'Destructive Foreground',
      cssVar: '--destructive-foreground',
      tailwindClass: 'text-destructive-foreground',
    },
  ],
  utility: [
    { name: 'Border', cssVar: '--border', tailwindClass: 'border-border' },
    { name: 'Input', cssVar: '--input', tailwindClass: 'bg-input' },
    { name: 'Ring', cssVar: '--ring', tailwindClass: 'ring-ring' },
  ],
  sidebar: [
    {
      name: 'Sidebar Background',
      cssVar: '--sidebar-background',
      tailwindClass: 'bg-sidebar',
    },
    {
      name: 'Sidebar Foreground',
      cssVar: '--sidebar-foreground',
      tailwindClass: 'text-sidebar-foreground',
    },
    {
      name: 'Sidebar Primary',
      cssVar: '--sidebar-primary',
      tailwindClass: 'bg-sidebar-primary',
    },
    {
      name: 'Sidebar Primary Foreground',
      cssVar: '--sidebar-primary-foreground',
      tailwindClass: 'text-sidebar-primary-foreground',
    },
    {
      name: 'Sidebar Accent',
      cssVar: '--sidebar-accent',
      tailwindClass: 'bg-sidebar-accent',
    },
    {
      name: 'Sidebar Accent Foreground',
      cssVar: '--sidebar-accent-foreground',
      tailwindClass: 'text-sidebar-accent-foreground',
    },
    {
      name: 'Sidebar Border',
      cssVar: '--sidebar-border',
      tailwindClass: 'border-sidebar-border',
    },
    {
      name: 'Sidebar Ring',
      cssVar: '--sidebar-ring',
      tailwindClass: 'ring-sidebar-ring',
    },
  ],
  chart: [
    { name: 'Chart 1', cssVar: '--chart-1', tailwindClass: 'bg-chart-1' },
    { name: 'Chart 2', cssVar: '--chart-2', tailwindClass: 'bg-chart-2' },
    { name: 'Chart 3', cssVar: '--chart-3', tailwindClass: 'bg-chart-3' },
    { name: 'Chart 4', cssVar: '--chart-4', tailwindClass: 'bg-chart-4' },
    { name: 'Chart 5', cssVar: '--chart-5', tailwindClass: 'bg-chart-5' },
  ],
};

// Hook to read CSS variables from the DOM
function useColorValues(): Record<string, ColorWithValue[]> | null {
  const [colors, setColors] = useState<Record<string, ColorWithValue[]> | null>(
    null,
  );

  useEffect(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);

    const resolved: Record<string, ColorWithValue[]> = {};

    for (const [category, metas] of Object.entries(colorsMeta)) {
      resolved[category] = metas.map((meta) => {
        const rawValue = styles.getPropertyValue(meta.cssVar).trim();
        const hslValue = `hsl(${rawValue})`;
        const hexValue = hslToHex(rawValue);
        return { ...meta, hslValue, hexValue };
      });
    }

    setColors(resolved);
  }, []);

  return colors;
}

function ColorSwatch({ color }: { color: ColorWithValue }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(`Copied ${label}!`, { duration: 1500 });
    setTimeout(() => setCopied(null), 2000);
  };

  const isLightColor = () => {
    const match = color.hslValue.match(/(\d+(?:\.\d+)?)%?\)$/);
    return match ? Number.parseFloat(match[1]) > 50 : false;
  };

  return (
    <div className="group overflow-hidden rounded-lg border border-primary/20 bg-card transition-all hover:border-primary/40">
      <button
        type="button"
        className="relative h-28 w-full cursor-pointer transition-transform hover:scale-[1.02]"
        style={{ backgroundColor: color.hslValue }}
        onClick={() =>
          copyToClipboard(color.hexValue, `preview-${color.name}`, 'HEX')
        }
        aria-label={`Copy ${color.name} HEX value`}
      >
        <div
          className={`absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 ${
            isLightColor() ? 'text-black' : 'text-white'
          }`}
        >
          <span className="rounded bg-black/30 px-3 py-1.5 font-medium text-sm backdrop-blur-sm">
            {copied === `preview-${color.name}`
              ? 'Copied!'
              : 'Click to copy HEX'}
          </span>
        </div>
      </button>

      <div className="p-4">
        <h3 className="mb-3 font-bold font-title text-lg text-primary">
          {color.name}
        </h3>

        <div className="space-y-2 text-sm">
          <CopyRow
            label="CSS Var"
            value={color.cssVar}
            displayValue={`var(${color.cssVar})`}
            copied={copied === `var-${color.name}`}
            onCopy={() =>
              copyToClipboard(
                `var(${color.cssVar})`,
                `var-${color.name}`,
                'CSS Variable',
              )
            }
          />
          <CopyRow
            label="Tailwind"
            value={color.tailwindClass}
            copied={copied === `tw-${color.name}`}
            onCopy={() =>
              copyToClipboard(
                color.tailwindClass,
                `tw-${color.name}`,
                'Tailwind Class',
              )
            }
          />
          <CopyRow
            label="HSL"
            value={color.hslValue}
            copied={copied === `hsl-${color.name}`}
            onCopy={() =>
              copyToClipboard(color.hslValue, `hsl-${color.name}`, 'HSL')
            }
          />
          <CopyRow
            label="HEX"
            value={color.hexValue}
            copied={copied === `hex-${color.name}`}
            onCopy={() =>
              copyToClipboard(color.hexValue, `hex-${color.name}`, 'HEX')
            }
          />
        </div>
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  displayValue,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  displayValue?: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded bg-background/50 px-2 py-1.5 transition-colors hover:bg-primary/10">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="w-16 shrink-0 text-muted-foreground text-xs">
          {label}
        </span>
        <code className="truncate font-mono text-foreground/80 text-xs">
          {displayValue || value}
        </code>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 shrink-0 p-0"
        onClick={onCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

function ColorSection({
  title,
  description,
  colors: sectionColors,
  columns = 3,
}: {
  title: string;
  description: string;
  colors: ColorWithValue[];
  columns?: number;
}) {
  const gridCols =
    {
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    }[columns] || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="mb-16">
      <h2 className="mb-4 font-bold font-title text-3xl text-primary">
        <span className="bg-primary px-3 py-1 text-background">{title}</span>
      </h2>
      <p className="mb-8 text-muted-foreground">{description}</p>
      <div className={`grid gap-6 ${gridCols}`}>
        {sectionColors.map((color) => (
          <ColorSwatch key={color.cssVar} color={color} />
        ))}
      </div>
    </section>
  );
}

export default function BrandPage() {
  const colors = useColorValues();

  // Get primary and background for quick reference
  const primaryColor = colors?.core.find((c) => c.cssVar === '--primary');
  const backgroundColor = colors?.core.find((c) => c.cssVar === '--background');

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-primary/20 border-b bg-primary px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-logo text-5xl text-background lowercase md:text-6xl">
            <span className="font-light">platanus hack</span>{' '}
            <span className="font-medium">[25]</span>
          </h1>
          <p className="mt-4 font-title text-background/80 text-xl">
            Brand Colors Reference
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12">
        {!colors ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-muted-foreground">Loading colors...</p>
          </div>
        ) : (
          <>
            <ColorSection
              title="Core Colors"
              description="The main colors used throughout the application for backgrounds, text, and primary UI elements."
              colors={colors.core}
            />

            <ColorSection
              title="UI Colors"
              description="Colors for UI components like cards, popovers, muted elements, and interactive states."
              colors={colors.ui}
              columns={4}
            />

            <ColorSection
              title="Utility Colors"
              description="Colors for borders, inputs, and focus rings."
              colors={colors.utility}
            />

            <ColorSection
              title="Chart Colors"
              description="Colors used for data visualization and charts."
              colors={colors.chart}
              columns={5}
            />

            <ColorSection
              title="Sidebar Colors"
              description="Colors specifically for sidebar components."
              colors={colors.sidebar}
              columns={4}
            />

            <section className="rounded-lg border border-primary/20 bg-card p-8">
              <h2 className="mb-6 font-bold font-title text-2xl text-primary">
                Quick Reference
              </h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="mb-3 font-semibold font-title text-lg text-primary">
                    Primary Brand Color
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-primary" />
                    <div>
                      <code className="block font-mono text-foreground text-sm">
                        {primaryColor?.hexValue}
                      </code>
                      <code className="block font-mono text-muted-foreground text-sm">
                        {primaryColor?.hslValue}
                      </code>
                      <span className="text-muted-foreground text-xs">
                        Lime Green / Hack Yellow
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 font-semibold font-title text-lg text-primary">
                    Background Color
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg border border-primary/20 bg-background" />
                    <div>
                      <code className="block font-mono text-foreground text-sm">
                        {backgroundColor?.hexValue}
                      </code>
                      <code className="block font-mono text-muted-foreground text-sm">
                        {backgroundColor?.hslValue}
                      </code>
                      <span className="text-muted-foreground text-xs">
                        Dark Gray
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        <section className="mt-8 rounded-lg border border-primary/20 bg-card p-8">
          <h2 className="mb-6 font-bold font-title text-primary text-xl">
            Usage Guide
          </h2>
          <div className="grid gap-6 text-sm md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold text-foreground">
                CSS Variables
              </h3>
              <code className="block rounded bg-background px-3 py-2 font-mono text-foreground text-xs">
                var(--primary)
              </code>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-foreground">
                Tailwind Classes
              </h3>
              <code className="block rounded bg-background px-3 py-2 font-mono text-foreground text-xs">
                bg-primary text-primary-foreground
              </code>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-foreground">Direct HSL</h3>
              <code className="block rounded bg-background px-3 py-2 font-mono text-foreground text-xs">
                hsl(67 100% 50%)
              </code>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
