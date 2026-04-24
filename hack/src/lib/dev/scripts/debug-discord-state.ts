import { discordService } from '@/src/services/discord';

const HACKER_PROFILE_ID = 'a6423891-d454-4220-83eb-3c2d5f835833';

console.log('Testing Discord State Parameter');
console.log('='.repeat(80));
console.log('');
console.log('Original UUID:', HACKER_PROFILE_ID);
console.log('UUID Length:', HACKER_PROFILE_ID.length, '(should be 36)');
console.log('');

const oauthUrl = discordService.getOAuthUrl(HACKER_PROFILE_ID);
console.log('Generated OAuth URL:');
console.log(oauthUrl);
console.log('');

// Parse the URL to check the state parameter
const url = new URL(oauthUrl);
const stateParam = url.searchParams.get('state');

console.log('State parameter in URL:', stateParam);
console.log('State length:', stateParam?.length, '(should be 36)');
console.log(
  'State matches original?',
  stateParam === HACKER_PROFILE_ID ? '✅ Yes' : '❌ No',
);
console.log('');

if (stateParam !== HACKER_PROFILE_ID) {
  console.log('❌ STATE MISMATCH DETECTED!');
  console.log('Expected:', HACKER_PROFILE_ID);
  console.log('Got:     ', stateParam);
  console.log(
    'Missing characters:',
    HACKER_PROFILE_ID.length - (stateParam?.length || 0),
  );
}

console.log('='.repeat(80));
console.log('');
console.log('Please check:');
console.log(
  '1. When you authorize on Discord, does the redirect URL have the complete state?',
);
console.log(
  '2. Copy the FULL URL from your browser address bar after Discord redirects',
);
console.log('3. Check if the state parameter is complete in that URL');
