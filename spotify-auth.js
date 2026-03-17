// Step 1: Run `node spotify-auth.js` → open the URL in your browser
// Step 2: After authorizing, you'll be redirected to natochi.cv/callback?code=XXXXX
// Step 3: Copy the `code` from the URL and run: node spotify-auth.js YOUR_CODE

const https = require('https');

const CLIENT_ID = '6f9d568369394e6b9b189d81107de3e1';
const CLIENT_SECRET = '87c3bae87a72489fbf167c9afba1f792';
const REDIRECT_URI = 'https://natochi.cv/callback';
const SCOPE = 'user-read-recently-played';

const code = process.argv[2];

if (!code) {
    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(SCOPE)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    console.log('\n1. Open this URL in your browser:\n');
    console.log(authUrl);
    console.log('\n2. After authorizing, you will be redirected to a URL like:');
    console.log('   https://natochi.cv/callback?code=AQBxxxxx...\n');
    console.log('3. Copy the code value and run:');
    console.log('   node spotify-auth.js YOUR_CODE\n');
} else {
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
    }).toString();

    const options = {
        hostname: 'accounts.spotify.com',
        path: '/api/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
        },
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            const json = JSON.parse(data);
            if (json.refresh_token) {
                console.log('\n=== SUCCESS ===');
                console.log('Refresh token:', json.refresh_token);
                console.log('\nSave this! You only need to do this once.\n');
            } else {
                console.log('\nError:', json, '\n');
            }
        });
    });

    req.write(body);
    req.end();
}
