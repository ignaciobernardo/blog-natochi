import { discordService } from '@/src/services/discord';

const HACKER_PROFILE_ID = 'a6423891-d454-4220-83eb-3c2d5f835833';

console.log('='.repeat(80));
console.log('Discord OAuth Flow Test');
console.log('='.repeat(80));
console.log('');

// Step 1: Generate OAuth URL
const oauthUrl = discordService.getOAuthUrl(HACKER_PROFILE_ID);
console.log('STEP 1: Visit this URL in your browser to authorize:');
console.log('');
console.log(oauthUrl);
console.log('');
console.log('-'.repeat(80));
console.log('');

console.log('STEP 2: After authorizing, you will be redirected to:');
console.log('http://localhost:3000/api/discord/callback?code=XXXXX&state=...');
console.log('');
console.log('Copy the "code" parameter from the URL.');
console.log('');
console.log('-'.repeat(80));
console.log('');

console.log('STEP 3: Test token exchange with curl:');
console.log('');
console.log('Replace YOUR_CODE_HERE with the actual code from step 2:');
console.log('');

const clientId = process.env.DISCORD_CLIENT_ID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const redirectUri = process.env.DISCORD_REDIRECT_URI;

const curlCommand = `curl -X POST 'https://discord.com/api/v10/oauth2/token' \\
  -H 'Content-Type: application/x-www-form-urlencoded' \\
  -d 'client_id=${clientId}' \\
  -d 'client_secret=${clientSecret}' \\
  -d 'grant_type=authorization_code' \\
  -d 'code=YOUR_CODE_HERE' \\
  -d 'redirect_uri=${redirectUri}'`;

console.log(curlCommand);
console.log('');
console.log('-'.repeat(80));
console.log('');

console.log('STEP 4: If successful, you should get a response like:');
console.log(
  JSON.stringify(
    {
      access_token: 'xxx',
      token_type: 'Bearer',
      expires_in: 604800,
      refresh_token: 'xxx',
      scope: 'identify guilds.join',
    },
    null,
    2,
  ),
);
console.log('');

console.log('='.repeat(80));
console.log('Debugging Tips:');
console.log('='.repeat(80));
console.log('');
console.log('Common errors:');
console.log('  - "invalid_client" → Check client_id and client_secret');
console.log(
  '  - "invalid_grant" / "Invalid code" → Code expired or already used',
);
console.log(
  '  - "redirect_uri_mismatch" → redirect_uri must match Discord Portal exactly',
);
console.log('');
console.log('Environment variables being used:');
console.log(`  DISCORD_CLIENT_ID: ${clientId ? '✅ Set' : '❌ Missing'}`);
console.log(
  `  DISCORD_CLIENT_SECRET: ${clientSecret ? '✅ Set' : '❌ Missing'}`,
);
console.log(`  DISCORD_REDIRECT_URI: ${redirectUri || '❌ Missing'}`);
console.log('');
