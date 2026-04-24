import { ArcadeScreen } from './_components/arcade-screen';
import { ChallengePrompt } from './_components/challenge-prompt';

export default function ArcadePage() {
  const challengePrompt = `
en platanus hack 25 (21 a 23 de nov) tenemos una máquina de arcade. podríamos poner algún juego retro, pero mucho mejor si lo podemos convertir en un desafío

MISSION
vibecodea el juego de arcade más cool

REQUIREMENTS
• usarás phaser js (librería para crear juegos web)
• el código de tu juego no puede pesar más de 50kb
• no puedes usar ningún asset externo, todo lo debes generar con código

PRIZE
• primer lugar: $250 usd en cash y un cupo asegurado para la platanus hack 25
• segundo lugar: $100 usd en cash
• ambos juegos estarán disponibles en el arcade

DEADLINE
• 10 de noviembre, 23:59 (hora chile)
  `.trim();

  return (
    <ArcadeScreen intensity="medium">
      <ChallengePrompt
        prompt={challengePrompt}
        repoUrl="https://github.com/platanus-hack/platanus-hack-25-arcade/fork"
      />
    </ArcadeScreen>
  );
}
