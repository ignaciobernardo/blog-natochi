import { hackerProfileSchema } from '@/src/lib/schemas/application.schema';

// Test cases for GitHub URLs
const githubTestCases = [
  // Valid cases
  { url: 'https://github.com/username', expected: true },
  { url: 'https://github.com/user-name', expected: true },
  { url: 'https://github.com/user123', expected: true },
  { url: 'https://github.com/123user', expected: true },
  { url: 'https://github.com/a', expected: true },

  // Invalid cases
  {
    url: 'https://github.com/username/',
    expected: false,
    reason: 'trailing slash',
  },
  {
    url: 'https://github.com/user/repo',
    expected: false,
    reason: 'repository path',
  },
  {
    url: 'http://github.com/username',
    expected: false,
    reason: 'http instead of https',
  },
  {
    url: 'https://www.github.com/username',
    expected: false,
    reason: 'www subdomain',
  },
  { url: 'https://github.com/', expected: false, reason: 'no username' },
  { url: 'github.com/username', expected: false, reason: 'missing protocol' },
  {
    url: 'https://github.com/user name',
    expected: false,
    reason: 'space in username',
  },
  {
    url: 'https://github.com/user@name',
    expected: false,
    reason: 'invalid character',
  },
  {
    url: 'https://linkedin.com/in/username',
    expected: false,
    reason: 'wrong domain',
  },
];

// Test cases for LinkedIn URLs
const linkedinTestCases = [
  // Valid cases
  { url: 'https://www.linkedin.com/in/username', expected: true },
  { url: 'https://www.linkedin.com/in/user-name', expected: true },
  { url: 'https://www.linkedin.com/in/user_name', expected: true },
  { url: 'https://www.linkedin.com/in/user123', expected: true },
  { url: 'https://www.linkedin.com/in/a', expected: true },
  { url: 'https://linkedin.com/in/username', expected: true },
  { url: 'https://linkedin.com/in/user-name', expected: true },

  // Invalid cases
  {
    url: 'https://www.linkedin.com/in/username/',
    expected: false,
    reason: 'trailing slash',
  },
  {
    url: 'https://linkedin.com/in/username/',
    expected: false,
    reason: 'trailing slash without www',
  },
  {
    url: 'http://www.linkedin.com/in/username',
    expected: false,
    reason: 'http instead of https',
  },
  {
    url: 'https://www.linkedin.com/feed/',
    expected: false,
    reason: 'feed URL',
  },
  { url: 'https://www.linkedin.com/', expected: false, reason: 'no username' },
  {
    url: 'www.linkedin.com/in/username',
    expected: false,
    reason: 'missing protocol',
  },
  {
    url: 'https://cl.linkedin.com/in/username',
    expected: false,
    reason: 'country subdomain',
  },
  {
    url: 'https://www.linkedin.com/in/username?param=value',
    expected: false,
    reason: 'query parameters',
  },
  {
    url: 'https://github.com/username',
    expected: false,
    reason: 'wrong domain',
  },
];

function testGithubValidation() {
  console.log('🧪 Testing GitHub URL Validation\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of githubTestCases) {
    try {
      const result = hackerProfileSchema.shape.githubProfile.safeParse(
        testCase.url,
      );

      if (result.success === testCase.expected) {
        console.log(`✅ PASS: ${testCase.url}`);
        if (!testCase.expected && testCase.reason) {
          console.log(`   → Correctly rejected: ${testCase.reason}`);
        }
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.url}`);
        console.log(
          `   → Expected: ${testCase.expected ? 'valid' : 'invalid'}`,
        );
        console.log(`   → Got: ${result.success ? 'valid' : 'invalid'}`);
        if (!result.success) {
          console.log(`   → Error: ${result.error.errors[0]?.message}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testCase.url}`);
      console.log(`   → ${error}`);
      failed++;
    }
    console.log('');
  }

  return { passed, failed };
}

function testLinkedinValidation() {
  console.log('🧪 Testing LinkedIn URL Validation\n');

  let passed = 0;
  let failed = 0;

  for (const testCase of linkedinTestCases) {
    try {
      const result = hackerProfileSchema.shape.linkedinProfile.safeParse(
        testCase.url,
      );

      if (result.success === testCase.expected) {
        console.log(`✅ PASS: ${testCase.url}`);
        if (!testCase.expected && testCase.reason) {
          console.log(`   → Correctly rejected: ${testCase.reason}`);
        }
        passed++;
      } else {
        console.log(`❌ FAIL: ${testCase.url}`);
        console.log(
          `   → Expected: ${testCase.expected ? 'valid' : 'invalid'}`,
        );
        console.log(`   → Got: ${result.success ? 'valid' : 'invalid'}`);
        if (!result.success) {
          console.log(`   → Error: ${result.error.errors[0]?.message}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${testCase.url}`);
      console.log(`   → ${error}`);
      failed++;
    }
    console.log('');
  }

  return { passed, failed };
}

async function main() {
  console.log('═'.repeat(80));
  console.log('URL Validation Test Suite');
  console.log('═'.repeat(80));
  console.log('');

  const githubResults = testGithubValidation();
  console.log('─'.repeat(80));
  console.log('');

  const linkedinResults = testLinkedinValidation();
  console.log('═'.repeat(80));
  console.log('');

  console.log('📊 Test Results Summary\n');
  console.log(
    `GitHub:   ${githubResults.passed} passed, ${githubResults.failed} failed`,
  );
  console.log(
    `LinkedIn: ${linkedinResults.passed} passed, ${linkedinResults.failed} failed`,
  );
  console.log('');

  const totalPassed = githubResults.passed + linkedinResults.passed;
  const totalFailed = githubResults.failed + linkedinResults.failed;
  const totalTests = totalPassed + totalFailed;

  console.log(`Total: ${totalPassed}/${totalTests} tests passed`);

  if (totalFailed === 0) {
    console.log('\n✨ All tests passed!');
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${totalFailed} test(s) failed`);
    process.exit(1);
  }
}

main();
