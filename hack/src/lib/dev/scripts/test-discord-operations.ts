import { DiscordClient } from '@/src/clients/discord';

const DISCORD_USER_ID = process.env.TEST_DISCORD_USER_ID || '';
const GITHUB_USERNAME = process.env.TEST_GITHUB_USERNAME || 'TestUser';

if (!DISCORD_USER_ID) {
  console.error('❌ Please set TEST_DISCORD_USER_ID in .env.local');
  console.log('');
  console.log('To get your Discord User ID:');
  console.log(
    '1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)',
  );
  console.log('2. Right-click your username in Discord');
  console.log('3. Click "Copy User ID"');
  console.log('4. Add to .env.local: TEST_DISCORD_USER_ID=your_id_here');
  console.log(
    '5. Add to .env.local: TEST_GITHUB_USERNAME=your_github_username',
  );
  process.exit(1);
}

const client = new DiscordClient({
  clientId: process.env.DISCORD_CLIENT_ID || '',
  clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  redirectUri: process.env.DISCORD_REDIRECT_URI || '',
  botToken: process.env.DISCORD_BOT_TOKEN || '',
  guildId: process.env.DISCORD_GUILD_ID || '',
});

const welcomeChannelId = process.env.DISCORD_WELCOME_CHANNEL_ID || '';
const hackerRoleId = process.env.DISCORD_HACKER_ROLE_ID || '';

async function testDiscordOperations() {
  console.log('='.repeat(80));
  console.log('Testing Discord Bot Operations');
  console.log('='.repeat(80));
  console.log('');
  console.log('Configuration:');
  console.log(`  Discord User ID: ${DISCORD_USER_ID}`);
  console.log(`  GitHub Username: ${GITHUB_USERNAME}`);
  console.log(`  Guild ID: ${process.env.DISCORD_GUILD_ID}`);
  console.log(`  Hacker Role ID: ${hackerRoleId}`);
  console.log(`  Welcome Channel ID: ${welcomeChannelId}`);
  console.log('');
  console.log('='.repeat(80));
  console.log('');

  // Test 1: Set Nickname
  console.log('TEST 1: Setting nickname to', GITHUB_USERNAME);
  console.log('-'.repeat(80));
  try {
    await client.setNickname({
      userId: DISCORD_USER_ID,
      nickname: GITHUB_USERNAME,
    });
    console.log('✅ SUCCESS: Nickname set to', GITHUB_USERNAME);
  } catch (error) {
    console.error('❌ FAILED to set nickname');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (
      error instanceof Error &&
      error.message.includes('Missing Permissions')
    ) {
      console.log('');
      console.log('Fix: Bot needs "Manage Nicknames" permission');
    }
  }
  console.log('');

  // Test 2: Add Role
  console.log('TEST 2: Adding Hacker role');
  console.log('-'.repeat(80));
  try {
    await client.addRole({
      userId: DISCORD_USER_ID,
      roleId: hackerRoleId,
    });
    console.log('✅ SUCCESS: Hacker role assigned');
  } catch (error) {
    console.error('❌ FAILED to assign role');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (
      error instanceof Error &&
      error.message.includes('Missing Permissions')
    ) {
      console.log('');
      console.log('Fix: Bot needs "Manage Roles" permission');
      console.log(
        'Fix: Bot role must be HIGHER than Hacker role in role hierarchy',
      );
    }
  }
  console.log('');

  // Test 3: Send Welcome Message
  console.log('TEST 3: Sending welcome message');
  console.log('-'.repeat(80));
  try {
    const welcomeMessage = `🎉 [TEST] Welcome <@${DISCORD_USER_ID}> (${GITHUB_USERNAME}) to the hackathon Discord!`;
    await client.sendMessage({
      channelId: welcomeChannelId,
      content: welcomeMessage,
    });
    console.log('✅ SUCCESS: Welcome message sent');
    console.log('Message:', welcomeMessage);
  } catch (error) {
    console.error('❌ FAILED to send message');
    console.error('Error:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.message.includes('Missing Access')) {
      console.log('');
      console.log('Fix: Bot needs "Send Messages" permission in the channel');
    }
  }
  console.log('');

  console.log('='.repeat(80));
  console.log('Testing Complete!');
  console.log('='.repeat(80));
}

testDiscordOperations()
  .then(() => {
    console.log('');
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('');
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
