'use client';

import { useRouter } from 'next/navigation';
import type { ArcadeGameFlat } from '@/src/queries/arcade-games';
import { GameModal } from './game-modal';

interface GameModalWrapperProps {
  game: ArcadeGameFlat;
}

export function GameModalWrapper({ game }: GameModalWrapperProps) {
  const router = useRouter();

  const handleClose = () => {
    router.push('/25/arcade/games', { scroll: false });
  };

  return <GameModal game={game} onClose={handleClose} />;
}
