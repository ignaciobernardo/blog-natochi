import { discordMusicBot } from '@/src/services/discord-music-bot';

export async function checkSpotifyTrack() {
  await discordMusicBot.checkCurrentTrack();
}
