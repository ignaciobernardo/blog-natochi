import { SpotifyClient } from '@/src/clients/spotify';
import { checkRateLimit, trackMusicAction } from '@/src/queries/music';

const InteractionResponseType = {
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
};

// Create a fresh Spotify client for each request (serverless-friendly)
async function getSpotifyClient(): Promise<SpotifyClient> {
  const client = new SpotifyClient({
    clientId: process.env.SPOTIFY_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
    eventId: process.env.MUSIC_EVENT_ID || '',
  });

  // Initialize with database-cached token (fast if cached)
  await client.initialize();

  return client;
}

export async function handleMusicCommand(interaction: any) {
  const commandName = interaction.data.name;

  switch (commandName) {
    case 'ping':
      return handlePing(interaction);
    case 'help':
      return handleHelp(interaction);
    case 'nowplaying':
      return handleNowPlaying(interaction);
    case 'queue':
      return handleQueue(interaction);
    case 'addsong':
      return handleAddSong(interaction);
    default:
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '❌ Unknown command',
          flags: 64, // Ephemeral
        },
      };
  }
}

async function handlePing(_interaction: any) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: '🏓 Pong!',
    },
  };
}

async function handleHelp(_interaction: any) {
  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `**🎵 Music Bot Commands**

\`/ping\` - Check bot status
\`/help\` - Show this message
\`/nowplaying\` - Show currently playing song
\`/queue\` - Show Spotify queue
\`/addsong <song>\` - Add a song to the queue

**Rate Limits:** You can add up to 2 songs every 10 minutes.`,
      flags: 64, // Ephemeral
    },
  };
}

async function handleNowPlaying(interaction: any) {
  try {
    // Get user info (handle both guild and DM contexts)
    const user = interaction.member?.user || interaction.user;

    const spotify = await getSpotifyClient();
    const currentTrack = await spotify.getCurrentlyPlaying();

    await trackMusicAction({
      userId: user.id,
      username: user.username,
      action: 'NOW_PLAYING_VIEW',
      trackName: currentTrack?.name || null,
      trackArtists: currentTrack?.artists || null,
      trackUrl: currentTrack?.url || null,
    });

    if (!currentTrack) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '🎵 No track is currently playing.',
        },
      };
    }

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '🎵 Now Playing',
            description: `[${currentTrack.name}](${currentTrack.url})\nby ${currentTrack.artists}`,
            color: 0x1db954,
            thumbnail: currentTrack.albumArt
              ? { url: currentTrack.albumArt }
              : undefined,
          },
        ],
      },
    };
  } catch (error) {
    console.error('[Command] Error in nowplaying:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ Failed to fetch currently playing track.',
        flags: 64,
      },
    };
  }
}

async function handleQueue(interaction: any) {
  try {
    // Get user info (handle both guild and DM contexts)
    const user = interaction.member?.user || interaction.user;

    const spotify = await getSpotifyClient();
    const queue = await spotify.getQueue();

    await trackMusicAction({
      userId: user.id,
      username: user.username,
      action: 'QUEUE_VIEW',
      trackName: null,
      trackArtists: null,
      trackUrl: null,
    });

    if (!queue || queue.length === 0) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '📭 The queue is empty.',
        },
      };
    }

    const queueList = queue
      .slice(0, 10)
      .map(
        (track, index) =>
          `${index + 1}. [${track.name}](${track.url}) - ${track.artists}`,
      )
      .join('\n');

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '📋 Current Queue',
            description: queueList,
            color: 0x1db954,
            footer:
              queue.length > 10
                ? { text: `And ${queue.length - 10} more songs...` }
                : undefined,
          },
        ],
      },
    };
  } catch (error) {
    console.error('[Command] Error in queue:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ Failed to fetch queue.',
        flags: 64,
      },
    };
  }
}

async function handleAddSong(interaction: any) {
  try {
    // Get user info (handle both guild and DM contexts)
    const user = interaction.member?.user || interaction.user;
    const userId = user.id;
    const username = user.username;

    // Check rate limit
    const rateLimit = await checkRateLimit(userId);

    if (!rateLimit.isAllowed) {
      const resetInSeconds = Math.ceil(
        (rateLimit.resetTime.getTime() - Date.now()) / 1000,
      );
      const minutes = Math.floor(resetInSeconds / 60);
      const seconds = resetInSeconds % 60;
      const timeRemaining = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `⏱️ You've reached the limit of 2 songs per 10 minutes. Please try again in ${timeRemaining}.`,
          flags: 64,
        },
      };
    }

    const query = interaction.data.options[0].value;
    const spotify = await getSpotifyClient();
    const tracks = await spotify.searchTracks(query);

    if (!tracks || tracks.length === 0) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: '🔍 No tracks found matching your query.',
          flags: 64,
        },
      };
    }

    // For simplicity, auto-add the first result
    // In a full implementation, you'd use components (buttons) for selection
    const selectedTrack = tracks[0];
    const addedTrack = await spotify.addToQueue(selectedTrack.uri || '');

    await trackMusicAction({
      userId,
      username,
      action: 'ADD_SONG',
      trackName: addedTrack.name,
      trackArtists: addedTrack.artists,
      trackUrl: addedTrack.url,
    });

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            title: '✅ Song Added to Queue',
            description: `[${addedTrack.name}](${addedTrack.url})\nby ${addedTrack.artists}`,
            color: 0x1db954,
            thumbnail: addedTrack.albumArt
              ? { url: addedTrack.albumArt }
              : undefined,
          },
        ],
      },
    };
  } catch (error) {
    console.error('[Command] Error in addsong:', error);
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ Failed to add song to queue.',
        flags: 64,
      },
    };
  }
}
