'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';

function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

interface OnelinerTextProps {
  text: string;
  projectName: string;
  projectLogoUrl: string | null;
  projectTrackName: string | null;
  isDefaultLogo: boolean;
  maxLength?: number;
}

export function OnelinerText({
  text,
  projectName,
  projectLogoUrl,
  projectTrackName,
  isDefaultLogo: isDefaultLogoValue,
  maxLength = 100,
}: OnelinerTextProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { displayText, needsTruncation } = useMemo(() => {
    if (text.length <= maxLength) {
      return { displayText: text, needsTruncation: false };
    }

    // Find the last space before maxLength to avoid cutting words
    const truncateAt = text.lastIndexOf(' ', maxLength);
    const cutPoint = truncateAt > 0 ? truncateAt : maxLength;

    return {
      displayText: `${text.slice(0, cutPoint)}...`,
      needsTruncation: true,
    };
  }, [text, maxLength]);

  return (
    <>
      <div className="font-title text-base text-primary/80">
        <span>{displayText}</span>
        {needsTruncation && (
          <>
            {' '}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-block font-title text-primary underline transition-colors hover:text-primary/70"
            >
              ver más
            </button>
          </>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4">
              <DialogTitle className="font-bold font-title text-3xl text-primary sm:text-4xl">
                {projectName}
              </DialogTitle>
              {projectLogoUrl && !isDefaultLogoValue ? (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-primary/20 bg-primary/5">
                  <Image
                    src={projectLogoUrl}
                    alt={projectName}
                    width={96}
                    height={96}
                    className="h-full w-full object-contain p-2"
                  />
                </div>
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border-2 border-primary/20 bg-primary/10">
                  <span className="font-bold font-title text-4xl text-primary">
                    {getInitials(projectName)}
                  </span>
                </div>
              )}
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="font-title text-base text-primary/80">{text}</p>
                {projectTrackName && (
                  <span className="inline-block w-fit bg-primary/10 px-3 py-1 font-title text-primary text-sm">
                    {projectTrackName}
                  </span>
                )}
              </div>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
