'use client';

import { ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/src/components/ui/dialog';
import { cn } from '@/src/lib/utils';
import type { LinkedInPost } from '../linkedin-posts';
import { linkedinPostsEn } from '../linkedin-posts-en';

interface LinkedInPostCardProps {
  post: LinkedInPost;
  viewOriginalLabel: string;
  locale?: string;
  viewInEnglishLabel?: string;
  viewInSpanishLabel?: string;
  className?: string;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Santiago',
  });
}

function ImageGrid({
  images,
  grayscale,
}: {
  images: string[];
  grayscale?: boolean;
}) {
  if (images.length === 0) return null;
  const imgClass = `object-cover transition-all duration-300 ${grayscale ? 'grayscale group-hover:grayscale-0' : ''}`;

  if (images.length === 1) {
    return (
      <div className="relative mb-3 h-44 w-full flex-shrink-0 overflow-hidden rounded-lg">
        <Image src={images[0]} alt="Post image" fill className={imgClass} />
      </div>
    );
  }

  return (
    <div className="mb-3 grid h-44 flex-shrink-0 grid-cols-2 grid-rows-2 gap-1">
      {images.slice(0, 4).map((img, i) => (
        <div key={img} className="relative overflow-hidden rounded-lg">
          <Image
            src={img}
            alt={`Post image ${i + 1}`}
            fill
            className={imgClass}
          />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="font-semibold text-white">
                +{images.length - 4}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// text-sm leading-relaxed: 14px * 1.625 = 22.75px per line
const LINE_HEIGHT_PX = 14 * 1.625;

function TruncatedText({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [clampLines, setClampLines] = useState<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const h = containerRef.current.clientHeight;
    setClampLines(Math.max(1, Math.floor(h / LINE_HEIGHT_PX)));
  }, []);

  return (
    <div ref={containerRef} className="mb-3 min-h-0 flex-1">
      <p
        style={
          clampLines !== null
            ? {
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: clampLines,
                overflow: 'hidden',
              }
            : { overflow: 'hidden', height: '100%' }
        }
        className="whitespace-pre-line text-foreground text-sm leading-relaxed"
      >
        {content}
      </p>
    </div>
  );
}

export default function LinkedInPostCard({
  post,
  viewOriginalLabel,
  locale,
  viewInEnglishLabel,
  viewInSpanishLabel,
  className,
}: LinkedInPostCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [showingOriginal, setShowingOriginal] = useState(false);

  const englishContent = linkedinPostsEn[post.url];
  const isEnglish = locale === 'en';
  const hasTranslation = isEnglish && !!englishContent;

  const cardContent =
    hasTranslation && !showingOriginal ? englishContent : post.content;
  const modalContent =
    hasTranslation && !showingOriginal ? englishContent : post.content;

  return (
    <>
      <div
        className={cn(
          'group flex h-[560px] w-[360px] flex-shrink-0 cursor-pointer flex-col overflow-hidden rounded-lg border border-border p-4 backdrop-blur-xs transition-all duration-300 hover:border-border/80 hover:shadow-md',
          className,
        )}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setModalOpen(true)}
        role="button"
        tabIndex={0}
        aria-label={`LinkedIn post by ${post.authorName}`}
      >
        {/* Header */}
        <div className="mb-3 flex flex-shrink-0 items-start gap-3">
          {post.authorProfilePicture && (
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
              <Image
                src={post.authorProfilePicture}
                alt={`${post.authorName} profile picture`}
                fill
                className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground text-sm">
              {post.authorName}
            </p>
            <p className="line-clamp-1 text-muted-foreground text-xs">
              {post.authorSubtitle}
            </p>
            <p className="text-muted-foreground text-xs">
              {formatDate(post.datePublished)}
            </p>
          </div>
        </div>

        {/* Text fills remaining space, ellipsis at the cut point */}
        <TruncatedText content={cardContent} />

        {/* Images + Reactions pinned to bottom */}
        <div className="mt-auto flex-shrink-0">
          <ImageGrid images={post.images} grayscale />
          <div className="flex items-center justify-between border-border/50 border-t pt-2">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {post.reactionCount}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">
              {post.commentCount} comments
            </span>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogTitle className="sr-only">{post.authorName}</DialogTitle>
          <div className="mb-4 flex items-center gap-2">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              {viewOriginalLabel} ↗
            </a>
            {hasTranslation && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowingOriginal((prev) => !prev);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-muted-foreground text-xs transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {showingOriginal
                  ? (viewInEnglishLabel ?? 'View in English')
                  : (viewInSpanishLabel ?? 'View in Spanish')}
              </button>
            )}
          </div>
          {/* Header */}
          <div className="mb-3 flex items-start gap-3">
            {post.authorProfilePicture && (
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                <Image
                  src={post.authorProfilePicture}
                  alt={`${post.authorName} profile picture`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground text-sm">
                {post.authorName}
              </p>
              <p className="line-clamp-1 text-muted-foreground text-xs">
                {post.authorSubtitle}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDate(post.datePublished)}
              </p>
            </div>
          </div>
          <p className="mb-4 whitespace-pre-line text-foreground text-sm leading-relaxed">
            {modalContent}
          </p>
          {post.images.length > 0 && (
            <ImageGrid images={post.images} grayscale={false} />
          )}
          <div className="flex items-center justify-between border-border/50 border-t pt-2">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                {post.reactionCount}
              </span>
            </div>
            <span className="text-muted-foreground text-xs">
              {post.commentCount} comments
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
