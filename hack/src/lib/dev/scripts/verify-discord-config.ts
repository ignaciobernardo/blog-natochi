console.log('Discord Configuration Check:');
console.log('================================');
console.log(
  'DISCORD_CLIENT_ID:',
  process.env.DISCORD_CLIENT_ID ? '✅ Set' : '❌ Missing',
);
console.log(
  'DISCORD_CLIENT_SECRET:',
  process.env.DISCORD_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
);
console.log(
  'DISCORD_REDIRECT_URI:',
  process.env.DISCORD_REDIRECT_URI || '❌ Missing',
);
console.log(
  'DISCORD_BOT_TOKEN:',
  process.env.DISCORD_BOT_TOKEN ? '✅ Set' : '❌ Missing',
);
console.log('DISCORD_GUILD_ID:', process.env.DISCORD_GUILD_ID || '❌ Missing');
console.log(
  'DISCORD_WELCOME_CHANNEL_ID:',
  process.env.DISCORD_WELCOME_CHANNEL_ID || '❌ Missing',
);
console.log(
  'DISCORD_HACKER_ROLE_ID:',
  process.env.DISCORD_HACKER_ROLE_ID || '❌ Missing',
);
console.log('================================');

if (process.env.DISCORD_REDIRECT_URI?.endsWith('/')) {
  console.warn(
    '⚠️  WARNING: DISCORD_REDIRECT_URI has trailing slash - this might cause issues!',
  );
}
