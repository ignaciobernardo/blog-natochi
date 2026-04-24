import { ThumbsUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface LinkedInPostProps {
  authorName: string;
  authorJobTitle: string;
  authorProfilePicture: string;
  timePosted: string;
  postContent: string;
  reactionsCount: number;
  commentsCount: number;
  postImages?: string[];
  url?: string;
}

function PostContent({
  authorName,
  authorJobTitle,
  authorProfilePicture,
  timePosted,
  postContent,
  reactionsCount,
  commentsCount,
  postImages = [],
}: Omit<LinkedInPostProps, 'url'>) {
  return (
    <>
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
          <Image
            src={authorProfilePicture}
            alt={`${authorName} profile picture`}
            fill
            className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-foreground text-sm">
              {authorName}
            </h3>
            <span className="text-muted-foreground text-sm">
              • {timePosted}
            </span>
          </div>
          <p className="text-muted-foreground text-xs">{authorJobTitle}</p>
        </div>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="whitespace-pre-line text-foreground text-sm leading-relaxed">
          {postContent}
        </p>
      </div>

      {/* Post Images */}
      {postImages.length > 0 && (
        <div className="mb-4">
          {postImages.length === 1 ? (
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <Image
                src={postImages[0]}
                alt="Post image"
                fill
                className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {postImages.slice(0, 4).map((image, index) => (
                <div
                  key={image}
                  className="relative aspect-square overflow-hidden rounded-lg"
                >
                  <Image
                    src={image}
                    alt={`Post image ${index + 1}`}
                    fill
                    className="object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
                  />
                  {index === 3 && postImages.length > 4 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="font-semibold text-white">
                        +{postImages.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reactions Bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-foreground" />
          <span className="text-muted-foreground text-xs">
            {reactionsCount}
          </span>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground text-xs">
          <span>{commentsCount} comentarios</span>
          <span>1 vez compartido</span>
        </div>
      </div>
    </>
  );
}

export default function LinkedInPost({
  authorName,
  authorJobTitle,
  authorProfilePicture,
  timePosted,
  postContent,
  reactionsCount,
  commentsCount,
  postImages = [],
  url,
}: LinkedInPostProps) {
  if (url) {
    return (
      <Link
        href={url as any}
        target="_blank"
        rel="noopener noreferrer"
        className="group mx-auto block max-w-xl rounded-lg border border-border p-4 backdrop-blur-xs transition-all duration-300 hover:scale-105"
      >
        <PostContent
          authorName={authorName}
          authorJobTitle={authorJobTitle}
          authorProfilePicture={authorProfilePicture}
          timePosted={timePosted}
          postContent={postContent}
          reactionsCount={reactionsCount}
          commentsCount={commentsCount}
          postImages={postImages}
        />
      </Link>
    );
  }

  return (
    <div className="group mx-auto max-w-xl rounded-lg border border-border p-4 backdrop-blur-xs transition-all duration-300">
      <PostContent
        authorName={authorName}
        authorJobTitle={authorJobTitle}
        authorProfilePicture={authorProfilePicture}
        timePosted={timePosted}
        postContent={postContent}
        reactionsCount={reactionsCount}
        commentsCount={commentsCount}
        postImages={postImages}
      />
    </div>
  );
}
