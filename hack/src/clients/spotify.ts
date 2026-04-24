import SpotifyWebApi from 'spotify-web-api-node';
import {
  getSpotifyRefreshToken,
  getSpotifyTokenCache,
  updateSpotifyRefreshToken,
  updateSpotifyTokenCache,
} from '@/src/queries/credentials';

interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  eventId: string;
}

export interface SpotifyTrack {
  name: string;
  artists: string;
  url: string;
  albumArt: string | null;
  uri?: string;
  duration?: number;
}

export class SpotifyClient {
  private api: SpotifyWebApi;
  private eventId: string;
  private isRefreshing = false; // Prevent concurrent refresh attempts

  constructor(config: SpotifyConfig) {
    this.eventId = config.eventId;
    this.api = new SpotifyWebApi({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
    });
  }

  async initialize() {
    // Fetch refresh token from database (only once per instance)
    if (!this.api.getRefreshToken()) {
      console.log(
        '[Spotify] 🔄 Fetching refresh token for event:',
        this.eventId,
      );
      const refreshToken = await getSpotifyRefreshToken(this.eventId);
      if (!refreshToken) {
        throw new Error(
          `No Spotify refresh token found for event ${this.eventId}`,
        );
      }

      console.log(
        '[Spotify] ✅ Refresh token found, length:',
        refreshToken.length,
      );
      this.api.setRefreshToken(refreshToken);
    }

    // Always check token validity (even on re-initialization)
    await this.ensureValidToken();
  }

  private async ensureValidToken() {
    // Check if we have a valid cached access token in the database
    const tokenCache = await getSpotifyTokenCache(this.eventId);
    const now = new Date();

    // Token is valid if it exists and expires more than 60 seconds from now
    const isTokenValid =
      tokenCache.accessToken &&
      tokenCache.expiresAt &&
      tokenCache.expiresAt.getTime() - now.getTime() > 60000;

    if (isTokenValid && tokenCache.accessToken && tokenCache.expiresAt) {
      const secondsUntilExpiry = Math.floor(
        (tokenCache.expiresAt.getTime() - now.getTime()) / 1000,
      );
      console.log(
        `[Spotify] ✅ Using cached token, valid for ${secondsUntilExpiry}s`,
      );
      this.api.setAccessToken(tokenCache.accessToken);
    } else {
      console.log(
        '[Spotify] 🔑 Token expired or missing, refreshing access token...',
      );
      await this.refreshAccessToken();
    }
  }

  private async refreshAccessToken() {
    // Prevent concurrent refresh attempts
    if (this.isRefreshing) {
      console.log('[Spotify] ⏸️ Token refresh already in progress, waiting...');
      // Wait a bit and return (the other refresh will complete)
      await new Promise((resolve) => setTimeout(resolve, 500));
      return;
    }

    try {
      this.isRefreshing = true;
      console.log('[Spotify] 🔄 Refreshing access token...');
      const data = await this.api.refreshAccessToken();
      const accessToken = data.body.access_token;
      const expiresInSeconds = data.body.expires_in;

      this.api.setAccessToken(accessToken);

      // Calculate expiration timestamp
      const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

      console.log(
        '[Spotify] ✅ New access token set, expires in:',
        expiresInSeconds,
        's',
      );

      // Save access token and expiration to database
      await updateSpotifyTokenCache(this.eventId, accessToken, expiresAt);
      console.log('[Spotify] 💾 Token cached in database');

      // If Spotify returns a new refresh token, update it in the database
      if (data.body.refresh_token) {
        console.log(
          '[Spotify] 🔄 New refresh token received, updating database...',
        );
        await updateSpotifyRefreshToken(this.eventId, data.body.refresh_token);
        this.api.setRefreshToken(data.body.refresh_token);
        console.log('[Spotify] ✅ Refresh token updated in database');
      }

      console.log('[Spotify] ✅ Access token refreshed');
    } catch (error) {
      console.error('[Spotify] ❌ Error refreshing access token:', error);
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  async getCurrentlyPlaying(): Promise<SpotifyTrack | null> {
    try {
      console.log('[Spotify] 🎵 Fetching currently playing track...');
      const response = await this.api.getMyCurrentPlayingTrack();

      if (!response.body || !response.body.item) {
        console.log('[Spotify] ℹ️ No track currently playing (no body or item)');
        return null;
      }

      const item = response.body.item;

      // Type guard: only handle tracks, not episodes
      if (item.type !== 'track') {
        console.log(
          '[Spotify] ℹ️ Current item is not a track, type:',
          item.type,
        );
        return null;
      }

      const track = {
        name: item.name,
        artists: item.artists.map((artist: any) => artist.name).join(', '),
        url: item.external_urls.spotify,
        albumArt: item.album.images[0]?.url || null,
        uri: item.uri,
      };
      console.log('[Spotify] ✅ Got track:', track.name, 'by', track.artists);
      return track;
    } catch (error) {
      console.error('[Spotify] ❌ Error getting currently playing:', error);
      return null;
    }
  }

  async getPlaybackState(): Promise<{
    trackUri: string | null;
    progressMs: number;
    isPlaying: boolean;
  } | null> {
    try {
      const response = await this.api.getMyCurrentPlaybackState();

      if (!response.body || !response.body.item) {
        return null;
      }

      const item = response.body.item;
      if (item.type !== 'track') {
        return null;
      }

      return {
        trackUri: item.uri,
        progressMs: response.body.progress_ms || 0,
        isPlaying: response.body.is_playing,
      };
    } catch (error) {
      console.error('[Spotify] ❌ Error getting playback state:', error);
      return null;
    }
  }

  async getQueue(): Promise<SpotifyTrack[]> {
    try {
      // Use custom request since spotify-web-api-node doesn't have getQueue
      const response = await fetch(
        'https://api.spotify.com/v1/me/player/queue',
        {
          headers: {
            Authorization: `Bearer ${this.api.getAccessToken()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const formatTrack = (track: any): SpotifyTrack => ({
        name: track.name,
        artists: track.artists.map((artist: any) => artist.name).join(', '),
        url: track.external_urls.spotify,
        albumArt: track.album.images[0]?.url || null,
        uri: track.uri,
      });

      const currentTrack = data.currently_playing
        ? formatTrack(data.currently_playing)
        : null;

      const queue = (data.queue || []).map(formatTrack);

      const allTracks = [currentTrack, ...queue].filter(
        (track): track is SpotifyTrack => track !== null,
      );

      // Deduplicate by URI
      const uniqueTracks = Array.from(
        new Map(allTracks.map((track) => [track.uri, track])).values(),
      );

      return uniqueTracks;
    } catch (error) {
      console.error('[Spotify] Error getting queue:', error);
      return [];
    }
  }

  async searchTracks(query: string, limit = 3): Promise<SpotifyTrack[]> {
    try {
      const response = await this.api.searchTracks(query, { limit });

      if (!response.body.tracks || !response.body.tracks.items.length) {
        return [];
      }

      return response.body.tracks.items.map((track) => ({
        name: track.name,
        artists: track.artists.map((artist) => artist.name).join(', '),
        url: track.external_urls.spotify,
        albumArt: track.album.images[0]?.url || null,
        uri: track.uri,
        duration: Math.floor(track.duration_ms / 1000),
      }));
    } catch (error) {
      console.error('[Spotify] Error searching tracks:', error);
      return [];
    }
  }

  async addToQueue(trackUri: string): Promise<SpotifyTrack> {
    try {
      await this.api.addToQueue(trackUri);

      const trackId = trackUri.split(':')[2];
      const track = await this.api.getTrack(trackId);

      return {
        name: track.body.name,
        artists: track.body.artists.map((artist) => artist.name).join(', '),
        url: track.body.external_urls.spotify,
        albumArt: track.body.album.images[0]?.url || null,
      };
    } catch (error) {
      console.error('[Spotify] Error adding to queue:', error);
      throw error;
    }
  }

  async skipToNext(): Promise<void> {
    try {
      await this.api.skipToNext();
      console.log('[Spotify] ⏭️ Skipped to next track');
    } catch (error) {
      console.error('[Spotify] Error skipping:', error);
      throw error;
    }
  }

  cleanup() {
    // No cleanup needed - no timers used
  }
}
