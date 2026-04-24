import { Github } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getArcadeEmbedUrl } from '@/src/lib/utils/arcade';
import {
  getArcadeGameFlatById,
  getArcadeGameFlatBySlug,
} from '@/src/queries/arcade-games';
import { ArcadeScreen } from '../../_components/arcade-screen';

interface GamePageProps {
  params: Promise<{
    gameId: string;
  }>;
}

export async function generateMetadata({
  params,
}: GamePageProps): Promise<Metadata> {
  const { gameId } = await params;

  const game =
    (await getArcadeGameFlatBySlug(gameId)) ??
    (await getArcadeGameFlatById(gameId));

  if (!game) {
    return {
      title: 'Game Not Found',
    };
  }

  return {
    title: `Platanus Hack 25 Arcade | ${game.title}`,
    description:
      game.description ||
      `Play ${game.title} by ${game.githubUsername} - A game submitted to Platanus Hack 25 Arcade`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { gameId } = await params;

  const game =
    (await getArcadeGameFlatBySlug(gameId)) ??
    (await getArcadeGameFlatById(gameId));

  if (!game) {
    notFound();
  }

  const embedUrl = getArcadeEmbedUrl(game.versionId);

  return (
    <ArcadeScreen intensity="medium">
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-4 font-mono">
        {/* Header */}
        <div className="flex flex-col gap-1 text-center">
          <Link
            href="/25/arcade"
            className="inline-block transition-opacity hover:opacity-80"
          >
            <h1
              className="font-bold font-logo text-foreground/90 text-lg uppercase tracking-wider md:text-xl"
              style={{ fontFamily: 'var(--font-logo)' }}
            >
              Platanus Hack 25 Arcade
            </h1>
          </Link>
        </div>

        {/* Game Title, Author & Description */}
        <div className="flex flex-col gap-2 text-center">
          <h3 className="crt-glow font-bold text-2xl text-primary md:text-3xl">
            {game.title}
          </h3>
          <div className="flex items-center justify-center gap-2 text-foreground/60 text-xs">
            <span>by</span>
            <a
              href={game.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-mono text-foreground transition-colors hover:text-primary"
            >
              <Github className="h-3 w-3" />
              {game.githubUsername}
            </a>
          </div>
          {game.description && (
            <p className="text-foreground/70 text-xs leading-relaxed">
              {game.description}
            </p>
          )}
        </div>

        {/* Game Viewport */}
        <div className="flex items-center justify-center">
          <div
            className="overflow-hidden rounded-lg border-4 border-primary bg-black shadow-[0_0_30px_rgba(255,214,0,0.3)]"
            style={{
              width: '960px',
              height: '720px',
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
    </ArcadeScreen>
  );
}
