import { DiscordClient } from '@/src/clients/discord';
import { SpotifyClient } from '@/src/clients/spotify';
import {
  findHackerByDiscordUsername,
  findUserWhoAddedTrack,
  getCurrentTrack,
  updateDiscordMessage,
  upsertNowPlaying,
} from '@/src/queries/music';

const SKIP_THRESHOLD = -7;

function createVotingButtons() {
  return [
    {
      type: 1,
      components: [
        {
          type: 2,
          style: 3,
          label: 'Love it',
          custom_id: 'vote_love',
          emoji: { name: '😍' },
        },
        {
          type: 2,
          style: 1,
          label: 'Like it',
          custom_id: 'vote_like',
          emoji: { name: '👍' },
        },
        {
          type: 2,
          style: 2,
          label: 'Dislike it',
          custom_id: 'vote_dislike',
          emoji: { name: '👎' },
        },
        {
          type: 2,
          style: 4,
          label: 'Hate it',
          custom_id: 'vote_hate',
          emoji: { name: '🤮' },
        },
      ],
    },
  ];
}

interface TrackInfo {
  name: string;
  artists: string;
  url: string;
  albumArt: string | null;
}

class DiscordMusicBotService {
  private discord: DiscordClient | null = null;
  private spotify: SpotifyClient | null = null;
  private eventId: string;

  constructor() {
    this.eventId = process.env.MUSIC_EVENT_ID || '';
  }

  async initialize() {
    // If clients already exist, only ensure Spotify token is still valid
    if (this.discord && this.spotify) {
      console.log(
        '[Music Bot] Clients already initialized, checking token validity...',
      );
      await this.spotify.initialize(); // Re-check token validity
      return;
    }

    const requiredEnvVars = [
      'DISCORD_CLIENT_ID',
      'DISCORD_BOT_TOKEN',
      'DISCORD_GUILD_ID',
      'DISCORD_MUSIC_CHANNEL_ID',
      'SPOTIFY_CLIENT_ID',
      'SPOTIFY_CLIENT_SECRET',
      'MUSIC_EVENT_ID',
    ];

    const missing = requiredEnvVars.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      console.warn(
        `[Music Bot] Missing environment variables: ${missing.join(', ')}. Skipping initialization.`,
      );
      return;
    }

    try {
      // Initialize Spotify (if not already initialized)
      if (!this.spotify) {
        console.log('[Music Bot] Initializing Spotify client...');
        this.spotify = new SpotifyClient({
          clientId: process.env.SPOTIFY_CLIENT_ID || '',
          clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
          eventId: this.eventId,
        });
        await this.spotify.initialize();
        console.log('[Music Bot] ✅ Spotify initialized');
      }

      // Initialize Discord client (if not already initialized)
      if (!this.discord) {
        console.log('[Music Bot] Initializing Discord client...');
        this.discord = new DiscordClient({
          clientId: process.env.DISCORD_CLIENT_ID || '',
          clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
          redirectUri: process.env.DISCORD_REDIRECT_URI || '',
          botToken: process.env.DISCORD_BOT_TOKEN || '',
          guildId: process.env.DISCORD_GUILD_ID || '',
        });

        // Register slash commands
        await this.registerCommands();
      }

      console.log('[Music Bot] ✅ Discord Music Bot initialized successfully');

      // Send initial now playing message on startup
      try {
        console.log('[Music Bot] 🔄 Fetching initial track...');
        await this.checkCurrentTrack();
        console.log('[Music Bot] ✅ Initial track check completed');
      } catch (error) {
        console.error('[Music Bot] ⚠️ Initial track check failed:', error);
        // Don't throw - initialization is still successful
      }
    } catch (error) {
      console.error('[Music Bot] ❌ Initialization failed:', error);
      throw error;
    }
  }

  private async registerCommands() {
    if (!this.discord) return;

    const commands = [
      {
        name: 'ping',
        description: 'Check bot status',
      },
      {
        name: 'help',
        description: 'Show available commands',
      },
      {
        name: 'nowplaying',
        description: 'Show currently playing song',
      },
      {
        name: 'queue',
        description: 'Show the Spotify queue',
      },
      {
        name: 'addsong',
        description: 'Add a song to the queue',
        options: [
          {
            name: 'song',
            type: 3, // STRING
            description: 'Song name or search query',
            required: true,
          },
        ],
      },
    ];

    await this.discord.registerGlobalCommands(commands);
    console.log('[Music Bot] ✅ Slash commands registered');
  }

  // Called by cron job every 5 seconds
  async checkCurrentTrack() {
    // Ensure clients are initialized (idempotent)
    await this.initialize();

    if (!this.spotify || !this.discord) {
      console.log(
        '[Music Bot] Early return: spotify=%s, discord=%s',
        !!this.spotify,
        !!this.discord,
      );
      return;
    }

    try {
      console.log('[Music Bot] 🔍 Checking current track...');
      const spotifyTrack = await this.spotify.getCurrentlyPlaying();

      if (!spotifyTrack) {
        console.log('[Music Bot] ℹ️ No track currently playing on Spotify');
        return;
      }

      console.log('[Music Bot] 🎵 Spotify track:', {
        name: spotifyTrack.name,
        artists: spotifyTrack.artists,
      });

      // Get current track from database (source of truth)
      const dbTrack = await getCurrentTrack(this.eventId);
      console.log(
        '[Music Bot] 💾 DB track:',
        dbTrack
          ? {
              name: dbTrack.trackName,
              artists: dbTrack.trackArtists,
            }
          : 'null',
      );

      // Check if track changed by comparing with database
      const spotifyTrackId = `${spotifyTrack.name}-${spotifyTrack.artists}`;
      const dbTrackId = dbTrack
        ? `${dbTrack.trackName}-${dbTrack.trackArtists}`
        : null;

      console.log('[Music Bot] 📊 Track comparison:', {
        spotifyTrackId,
        dbTrackId,
        isSame: spotifyTrackId === dbTrackId,
      });

      // Track changed
      if (spotifyTrackId !== dbTrackId) {
        console.log('[Music Bot] ✨ Track changed! Updating...');
        // Find who added this track
        const addedByUser = await findUserWhoAddedTrack(spotifyTrack.name);
        let hackerId: string | null = null;

        if (addedByUser?.username) {
          const hacker = await findHackerByDiscordUsername(
            addedByUser.username,
          );
          hackerId = hacker?.hackerId || null;
        }

        // Update database with new track
        await upsertNowPlaying({
          eventId: this.eventId,
          trackName: spotifyTrack.name,
          trackArtists: spotifyTrack.artists,
          trackUrl: spotifyTrack.url,
          albumArt: spotifyTrack.albumArt,
          addedByDiscordUsername: addedByUser?.username || null,
          addedByDiscordId: addedByUser?.userId || null,
          addedByHackerId: hackerId,
          currentVoteScore: 0,
        });

        console.log(
          `[Music Bot] 🎵 Track changed: ${spotifyTrack.name} by ${spotifyTrack.artists}`,
        );

        // Send to Discord channels
        console.log('[Music Bot] 📤 Sending to Discord channels...');
        await this.sendNowPlayingToChannels(
          spotifyTrack,
          addedByUser?.username || null,
          addedByUser?.userId || null,
        );
        console.log('[Music Bot] ✅ Discord message sent');
      } else {
        // Track is the same, check voting
        console.log('[Music Bot] 🎵 Track unchanged, checking voting...');
        await this.checkVoting();
      }
    } catch (error) {
      console.error('[Music Bot] ❌ Error checking current track:', error);
    }
  }

  private createNowPlayingEmbed(
    track: TrackInfo,
    addedBy: string | null,
    addedByDiscordId: string | null,
    currentScore?: number,
  ) {
    const fields: any[] = [];

    if (addedBy || addedByDiscordId) {
      const addedByValue = addedByDiscordId
        ? `<@${addedByDiscordId}>`
        : addedBy || 'Unknown';

      fields.push({
        name: '🎧 Added by',
        value: addedByValue,
        inline: true,
      });
    }

    if (currentScore !== undefined) {
      fields.push({
        name: '📊 Vote Score',
        value: currentScore.toString(),
        inline: true,
      });
    }

    return {
      title: '🎵 Now Playing',
      description: `**[${track.name}](${track.url})**\nby ${track.artists}`,
      color: 0x1db954,
      thumbnail: track.albumArt ? { url: track.albumArt } : undefined,
      fields,
      footer: {
        text: `Skip threshold: ${SKIP_THRESHOLD} • Vote using the buttons below!`,
      },
    };
  }

  private async sendNowPlayingToChannels(
    track: TrackInfo,
    addedBy: string | null,
    addedByDiscordId: string | null,
  ) {
    if (!this.discord) {
      console.error('[Music Bot] Discord client not available');
      return;
    }

    const channelId = process.env.DISCORD_MUSIC_CHANNEL_ID;
    if (!channelId) {
      console.error('[Music Bot] DISCORD_MUSIC_CHANNEL_ID not set');
      return;
    }

    console.log('[Music Bot] Creating embed for track:', track.name);
    const embed = this.createNowPlayingEmbed(track, addedBy, addedByDiscordId);
    const components = createVotingButtons();

    try {
      console.log(
        '[Music Bot] 📨 Sending embed to Discord channel:',
        channelId,
      );
      const message = await this.discord.sendMessageWithEmbed({
        channelId,
        embed,
        components,
      });
      console.log(
        '[Music Bot] ✅ Message sent with voting buttons, ID:',
        message.id,
      );

      // Store Discord message info in database
      console.log('[Music Bot] 💾 Updating database with message ID...');
      await updateDiscordMessage(this.eventId, channelId, message.id);
      console.log('[Music Bot] ✅ Database updated');

      console.log('[Music Bot] ✅ Sent now playing to music channel');
    } catch (error) {
      console.error('[Music Bot] ❌ Failed to send now playing:', error);
    }
  }

  /**
   * Updates the voting widget with current score immediately
   * Can be called externally after a vote is recorded
   */
  async updateVotingWidget(messageId: string) {
    if (!this.discord) {
      return;
    }

    try {
      // Get current track from database by message ID
      const dbTrack = await getCurrentTrack(this.eventId);

      if (!dbTrack || !dbTrack.discordChannelId || !dbTrack.discordMessageId) {
        return; // No message to update
      }

      // Only update if the message ID matches (prevent updating wrong track)
      if (dbTrack.discordMessageId !== messageId) {
        return;
      }

      // Score is already calculated and stored in database by button interactions
      const score = dbTrack.currentVoteScore;

      console.log(
        `[Music Bot] 🎯 Vote score updated: ${score} (threshold: ${SKIP_THRESHOLD})`,
      );

      // Update message embed with current score
      try {
        const updatedEmbed = this.createNowPlayingEmbed(
          {
            name: dbTrack.trackName,
            artists: dbTrack.trackArtists,
            url: dbTrack.trackUrl,
            albumArt: dbTrack.albumArt,
          },
          dbTrack.addedByDiscordUsername,
          dbTrack.addedByDiscordId,
          score,
        );

        const components = createVotingButtons();

        await this.discord.editMessageEmbed({
          channelId: dbTrack.discordChannelId,
          messageId: dbTrack.discordMessageId,
          embed: updatedEmbed,
          components,
        });
      } catch (error) {
        console.error('[Music Bot] ❌ Failed to update message score:', error);
      }

      // Check if track should be skipped
      if (score <= SKIP_THRESHOLD) {
        console.log(`[Music Bot] 🚫 Skipping track with score: ${score}`);
        await this.spotify?.skipToNext();

        // Send skip notification
        try {
          await this.discord.sendMessage({
            channelId: dbTrack.discordChannelId,
            content: '⏭️ Song skipped due to community vote!',
          });
        } catch (error) {
          console.error('[Music Bot] Error sending skip message:', error);
        }
      }
    } catch (error) {
      console.error('[Music Bot] Error updating voting widget:', error);
    }
  }

  private async checkVoting() {
    if (!this.discord) {
      return;
    }

    try {
      // Get current track from database
      const dbTrack = await getCurrentTrack(this.eventId);

      if (!dbTrack || !dbTrack.discordChannelId || !dbTrack.discordMessageId) {
        return; // No message to poll
      }

      // Use the new updateVotingWidget method
      await this.updateVotingWidget(dbTrack.discordMessageId);
    } catch (error) {
      console.error('[Music Bot] Error checking voting:', error);
    }
  }

  cleanup() {
    if (this.spotify) {
      this.spotify.cleanup();
    }
    // Reset clients to null so they can be re-initialized
    this.spotify = null;
    this.discord = null;
    console.log('[Music Bot] 🛑 Discord Music Bot cleaned up');
  }
}

// Singleton instance
export const discordMusicBot = new DiscordMusicBotService();
