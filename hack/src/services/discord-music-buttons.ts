import { and, eq, sum } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { nowPlaying, trackVotes } from '@/src/lib/db/schema';
import { discordMusicBot } from '@/src/services/discord-music-bot';

const InteractionResponseType = {
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  UPDATE_MESSAGE: 7,
};

const VOTE_VALUES = {
  vote_love: 2,
  vote_like: 1,
  vote_dislike: -1,
  vote_hate: -2,
} as const;

const VOTE_LABELS = {
  vote_love: '😍 Love it',
  vote_like: '👍 Like it',
  vote_dislike: '👎 Dislike it',
  vote_hate: '🤮 Hate it',
} as const;

export async function handleButtonVote(interaction: any) {
  try {
    const customId = interaction.data.custom_id;
    const user = interaction.member?.user || interaction.user;
    const userId = user.id;
    const username = user.username;
    const messageId = interaction.message.id;

    if (!customId || !(customId in VOTE_VALUES)) {
      return {
        type: InteractionResponseType.UPDATE_MESSAGE,
        data: {
          content: '❌ Invalid vote button',
          flags: 64,
        },
      };
    }

    const voteValue = VOTE_VALUES[customId as keyof typeof VOTE_VALUES];

    const [currentTrack] = await db
      .select()
      .from(nowPlaying)
      .where(eq(nowPlaying.discordMessageId, messageId))
      .limit(1);

    if (!currentTrack) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Track not found',
          flags: 64,
        },
      };
    }

    // Check if user already voted on this track
    const [existingVote] = await db
      .select()
      .from(trackVotes)
      .where(
        and(
          eq(trackVotes.nowPlayingId, currentTrack.id),
          eq(trackVotes.userId, userId),
        ),
      )
      .limit(1);

    const isUpdatingVote = !!existingVote;

    await db
      .insert(trackVotes)
      .values({
        nowPlayingId: currentTrack.id,
        userId,
        username,
        voteValue,
      })
      .onConflictDoUpdate({
        target: [trackVotes.nowPlayingId, trackVotes.userId],
        set: {
          voteValue,
          votedAt: new Date(),
        },
      });

    const [scoreResult] = await db
      .select({
        total: sum(trackVotes.voteValue),
      })
      .from(trackVotes)
      .where(eq(trackVotes.nowPlayingId, currentTrack.id));

    const totalScore = Number(scoreResult?.total || 0);

    await db
      .update(nowPlaying)
      .set({
        currentVoteScore: totalScore,
        updatedAt: new Date(),
      })
      .where(eq(nowPlaying.id, currentTrack.id));

    // Immediately update the Discord widget with the new vote score
    discordMusicBot.updateVotingWidget(messageId).catch((error) => {
      console.error('[Button Vote] Failed to update widget:', error);
    });

    const voteLabel = VOTE_LABELS[customId as keyof typeof VOTE_LABELS];
    const actionText = isUpdatingVote ? 'Vote updated' : 'Vote recorded';

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ **${actionText}!** Your vote: ${voteLabel} (${voteValue > 0 ? '+' : ''}${voteValue})\n_You can change your vote anytime by clicking a different button._`,
        flags: 64,
      },
    };
  } catch (error) {
    console.error('[Button Vote] Error:', error);
    return {
      type: InteractionResponseType.UPDATE_MESSAGE,
      data: {
        content: '❌ Failed to record vote',
        flags: 64,
      },
    };
  }
}
