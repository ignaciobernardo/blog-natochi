import { type NextRequest, NextResponse } from 'next/server';
import nacl from 'tweetnacl';
import { handleMusicCommand } from '@/src/services/discord-music-commands';

// Discord interaction types
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
};

const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
};

function verifyDiscordRequest(request: Request, body: string): boolean {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!signature || !timestamp || !publicKey) {
    return false;
  }

  try {
    const isValid = nacl.sign.detached.verify(
      Buffer.from(timestamp + body),
      Buffer.from(signature, 'hex'),
      Buffer.from(publicKey, 'hex'),
    );
    return isValid;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify Discord signature
    if (!verifyDiscordRequest(request, body)) {
      console.error('[Discord Webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const interaction = JSON.parse(body);

    // Handle PING
    if (interaction.type === InteractionType.PING) {
      return NextResponse.json({ type: InteractionResponseType.PONG });
    }

    // Handle slash commands
    if (interaction.type === InteractionType.APPLICATION_COMMAND) {
      const response = await handleMusicCommand(interaction);
      return NextResponse.json(response);
    }

    // Handle message components (buttons, etc.)
    if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
      const { handleButtonVote } = await import(
        '@/src/services/discord-music-buttons'
      );
      const response = await handleButtonVote(interaction);
      return NextResponse.json(response);
    }

    return NextResponse.json(
      { error: 'Unknown interaction type' },
      { status: 400 },
    );
  } catch (error) {
    console.error('[Discord Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
