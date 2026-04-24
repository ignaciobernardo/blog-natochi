'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';

interface ShareLinkProps {
  slug: string;
}

export function ShareLink({ slug }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  // Get the full URL
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/25/arcade/games/${slug}`
      : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div>
      <h4 className="mb-2 font-bold text-primary text-xs uppercase">
        Share Link
      </h4>
      <div className="flex gap-2">
        <div className="flex-1 overflow-hidden rounded border border-foreground/20 bg-black/30 px-3 py-2">
          <p className="truncate font-mono text-foreground/80 text-xs">
            {shareUrl || 'Loading...'}
          </p>
        </div>
        <Button
          onClick={handleCopy}
          size="sm"
          className={`${
            copied
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-primary hover:bg-primary/90'
          } text-black transition-colors`}
        >
          {copied ? (
            <>
              <Check className="mr-1 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-1 h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
