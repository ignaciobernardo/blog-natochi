import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { getArcadeEmbedUrl } from '@/src/lib/utils/arcade';
import { getArcadeGameFlatById } from '@/src/queries/arcade-games';
import { ArcadeScreen } from '../../../_components/arcade-screen';
import { RefreshGameButton } from '../_components/refresh-game-button';

interface ReviewPageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { gameId } = await params;
  const game = await getArcadeGameFlatById(gameId);

  if (!game) {
    notFound();
  }

  const sizeKB = (Buffer.byteLength(game.codeMinified, 'utf-8') / 1024).toFixed(
    2,
  );
  const originalSizeKB = (Buffer.byteLength(game.code, 'utf-8') / 1024).toFixed(
    2,
  );
  const embedUrl = getArcadeEmbedUrl(game.versionId);

  return (
    <ArcadeScreen intensity="medium">
      <div className="container mx-auto max-w-[1800px] font-mono">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2 text-center">
          <Link
            href="/25/arcade"
            className="flex cursor-pointer flex-col gap-1 transition-opacity hover:opacity-80"
          >
            <h1
              className="font-bold font-logo text-4xl text-foreground/90 uppercase tracking-wider md:text-5xl"
              style={{ fontFamily: 'var(--font-logo)' }}
            >
              Platanus Hack 25
            </h1>
            <h2
              className="crt-glow font-bold font-logo text-3xl text-primary uppercase tracking-wider md:text-4xl"
              style={{ fontFamily: 'var(--font-logo)' }}
            >
              Game Review
            </h2>
          </Link>
        </div>

        {/* Main Content Container - Sidebar and Game Centered Together */}
        <div
          className="flex items-center justify-center"
          style={{ minHeight: '75vh' }}
        >
          {/* Wrapper for Game and Sidebar - Centered as One Unit */}
          <div className="flex gap-0">
            {/* LEFT SIDEBAR: Metadata & Actions */}
            <div
              className="flex w-[320px] flex-col space-y-5 rounded-lg border-4 border-primary bg-black/50 p-6 shadow-[0_0_30px_rgba(255,214,0,0.3)] backdrop-blur-sm"
              style={{ height: '75vh' }}
            >
              <div className="flex-1 space-y-5 overflow-y-auto">
                {/* Game Title */}
                <div className="space-y-3 border-primary/30 border-b pb-5">
                  <h3 className="crt-glow font-bold text-primary text-xl">
                    {game.title}
                  </h3>
                  <div className="rounded border-2 border-green-500 bg-green-500/10 px-3 py-2 text-center">
                    <p className="font-bold text-green-400 text-xs uppercase">
                      v{game.versionNumber}
                    </p>
                  </div>
                </div>

                {/* Cover Image */}
                {game.coverUrl && (
                  <div>
                    <h4 className="mb-2 font-bold text-primary text-xs uppercase">
                      Cover
                    </h4>
                    <div
                      className="overflow-hidden rounded border-2 border-primary/40 bg-black/40"
                      style={{ aspectRatio: '4/3' }}
                    >
                      <Image
                        src={game.coverUrl}
                        alt={`${game.title} cover`}
                        width={400}
                        height={300}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Description */}
                {game.description && (
                  <div>
                    <h4 className="mb-2 font-bold text-primary text-xs uppercase">
                      Description
                    </h4>
                    <p className="text-foreground/80 text-sm leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                )}

                {/* Repository */}
                <div>
                  <h4 className="mb-2 font-bold text-primary text-xs uppercase">
                    Repository
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p className="text-foreground/80">
                      <span className="text-foreground/60">Owner:</span>{' '}
                      <span className="font-mono">{game.githubUsername}</span>
                    </p>
                    <p className="text-foreground/80">
                      <span className="text-foreground/60">Repo:</span>{' '}
                      <span className="font-mono">{game.repoName}</span>
                    </p>
                    {game.commitSha && (
                      <p className="text-foreground/80">
                        <span className="text-foreground/60">Commit:</span>{' '}
                        <span className="font-mono">
                          {game.commitSha.substring(0, 7)}
                        </span>
                      </p>
                    )}
                    <a
                      href={game.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-primary underline hover:opacity-80"
                    >
                      View on GitHub →
                    </a>
                  </div>
                </div>

                {/* File Size */}
                <div>
                  <h4 className="mb-2 font-bold text-primary text-xs uppercase">
                    File Size
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-foreground/20 bg-black/30 p-2">
                      <p className="mb-1 text-[10px] text-foreground/60 uppercase">
                        Original
                      </p>
                      <p className="font-bold text-foreground text-sm">
                        {originalSizeKB} KB
                      </p>
                    </div>
                    <div className="rounded border border-foreground/20 bg-black/30 p-2">
                      <p className="mb-1 text-[10px] text-foreground/60 uppercase">
                        Minified
                      </p>
                      <p className="font-bold text-foreground text-sm">
                        {sizeKB} KB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div>
                  <h4 className="mb-2 font-bold text-primary text-xs uppercase">
                    Timestamps
                  </h4>
                  <div className="space-y-1 text-foreground/80 text-sm">
                    <p>
                      <span className="text-foreground/60">Created:</span>{' '}
                      {new Date(game.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Pinned at Bottom */}
              <div className="space-y-3 border-primary/30 border-t pt-5">
                <RefreshGameButton gameId={game.id} />
                <Button
                  asChild
                  className="w-full bg-primary text-black hover:bg-primary/90"
                >
                  <Link
                    href={`/25/arcade/games?game=${game.slug}`}
                    target="_blank"
                  >
                    Go to Game →
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full border-primary text-primary hover:bg-primary/10"
                >
                  <Link href="/25/arcade/submit">← Back to Submit</Link>
                </Button>
              </div>
            </div>

            {/* RIGHT: Game Viewport (4:3 ratio) */}
            <div
              className="overflow-hidden rounded-lg border-4 border-primary bg-black shadow-[0_0_30px_rgba(255,214,0,0.3)]"
              style={{
                aspectRatio: '4/3',
                height: '75vh',
                maxWidth: '100%',
              }}
            >
              <iframe
                src={embedUrl}
                title={game.title}
                className="h-full w-full"
                sandbox="allow-scripts"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </ArcadeScreen>
  );
}
