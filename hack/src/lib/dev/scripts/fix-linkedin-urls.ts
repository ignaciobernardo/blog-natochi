import { sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

async function fixLinkedinUrls() {
  console.log('Starting LinkedIn URL normalization...\n');

  // First, let's see what we're working with
  const beforeStatsResult = (await db.execute(sql`
    SELECT
      CASE
        WHEN linkedin LIKE 'https://www.linkedin.com/in/%/' THEN 'with_www_and_trailing_slash'
        WHEN linkedin LIKE 'https://www.linkedin.com/in/%' AND linkedin NOT LIKE '%/' THEN 'with_www_correct'
        WHEN linkedin LIKE 'https://linkedin.com/in/%/' THEN 'no_www_with_trailing_slash'
        WHEN linkedin LIKE 'https://linkedin.com/in/%' AND linkedin NOT LIKE '%/' THEN 'no_www_no_slash'
        WHEN linkedin LIKE 'http://www.linkedin.com/in/%' THEN 'http_with_www'
        WHEN linkedin LIKE 'http://linkedin.com/in/%' THEN 'http_no_www'
        WHEN linkedin LIKE 'www.linkedin.com/in/%' THEN 'missing_protocol_with_www'
        WHEN linkedin LIKE 'linkedin.com/in/%' THEN 'missing_protocol_no_www'
        WHEN linkedin NOT LIKE '%linkedin.com%' THEN 'not_linkedin_url'
        ELSE 'other_format'
      END as format_type,
      COUNT(*) as count
    FROM ${hackers}
    WHERE linkedin IS NOT NULL
    GROUP BY format_type
    ORDER BY count DESC;
  `)) as any;

  console.log('Before normalization:');
  const beforeStats = Array.isArray(beforeStatsResult)
    ? beforeStatsResult
    : beforeStatsResult.rows || [];
  console.table(beforeStats);

  // Update query that normalizes all LinkedIn URLs in a single statement
  const result = await db.execute(sql`
    UPDATE ${hackers}
    SET linkedin = CASE
      -- Set empty or invalid LinkedIn URLs to NULL
      WHEN linkedin = 'https://www.linkedin.com/'
        OR linkedin = 'https://www.linkedin.com'
        OR linkedin = 'https://linkedin.com/'
        OR linkedin = 'https://linkedin.com'
        OR linkedin = 'https://www.linkedin.com/feed/'
        OR linkedin = 'https://linkedin.com/feed/' THEN
        NULL

      -- Remove query parameters, fragments, and trailing slashes from www URLs
      WHEN linkedin LIKE 'https://www.linkedin.com/in/%' AND (linkedin LIKE '%?%' OR linkedin LIKE '%#%' OR linkedin LIKE '%/') THEN
        rtrim(regexp_replace(linkedin, '([?#].*)', ''), '/')

      -- Remove trailing slashes from www URLs
      WHEN linkedin LIKE 'https://www.linkedin.com/in/%/' THEN
        rtrim(linkedin, '/')

      -- Add www to URLs without it (no trailing slash)
      WHEN linkedin LIKE 'https://linkedin.com/in/%' AND linkedin NOT LIKE '%/' THEN
        replace(linkedin, 'https://linkedin.com/', 'https://www.linkedin.com/')

      -- Add www and remove trailing slash
      WHEN linkedin LIKE 'https://linkedin.com/in/%/' THEN
        rtrim(replace(linkedin, 'https://linkedin.com/', 'https://www.linkedin.com/'), '/')

      -- Convert country subdomains to www (cl.linkedin.com, ar.linkedin.com, etc.) and remove trailing slash
      WHEN linkedin ~ 'https://[a-z]{2}\.linkedin\.com/in/' THEN
        rtrim(regexp_replace(linkedin, 'https://[a-z]{2}\.linkedin\.com/', 'https://www.linkedin.com/'), '/')

      -- Country subdomain without https
      WHEN linkedin ~ '^[a-z]{2}\.linkedin\.com/in/' THEN
        rtrim('https://www.' || regexp_replace(linkedin, '^[a-z]{2}\.linkedin\.com/', 'linkedin.com/'), '/')

      -- Convert http to https with www
      WHEN linkedin LIKE 'http://www.linkedin.com/in/%' THEN
        replace(linkedin, 'http://www.linkedin.com/', 'https://www.linkedin.com/')

      -- Convert http to https and add www
      WHEN linkedin LIKE 'http://linkedin.com/in/%' THEN
        replace(linkedin, 'http://linkedin.com/', 'https://www.linkedin.com/')

      -- Add protocol to URLs missing it (with www)
      WHEN linkedin LIKE 'www.linkedin.com/in/%' THEN
        'https://' || linkedin

      -- Add protocol and www to URLs missing both
      WHEN linkedin LIKE 'linkedin.com/in/%' THEN
        'https://www.' || linkedin

      -- Handle username-only or incomplete URLs
      WHEN linkedin NOT LIKE 'https://%'
        AND linkedin NOT LIKE 'http://%'
        AND linkedin NOT LIKE '%.%'
        AND length(linkedin) > 0
        AND linkedin NOT LIKE '%/%' THEN
        'https://www.linkedin.com/in/' || linkedin

      -- Handle incomplete URLs like "linkedin.com/username" (missing /in/)
      WHEN linkedin LIKE '%linkedin.com/%'
        AND linkedin NOT LIKE '%/in/%'
        AND linkedin NOT LIKE 'https://%' THEN
        'https://www.linkedin.com/in/' || regexp_replace(linkedin, '.*linkedin\.com/', '')

      -- Handle incomplete URLs with protocol but missing /in/
      WHEN linkedin LIKE 'https://linkedin.com/%'
        AND linkedin NOT LIKE '%/in/%' THEN
        replace(linkedin, 'https://linkedin.com/', 'https://www.linkedin.com/in/')

      -- Set non-LinkedIn URLs to NULL (GitHub, Torre.ai, Google Drive, etc.)
      WHEN linkedin NOT LIKE '%linkedin.com%' THEN
        NULL

      -- Keep already correct format
      ELSE linkedin
    END
    WHERE linkedin IS NOT NULL
      AND (
        linkedin = 'https://www.linkedin.com/'
        OR linkedin = 'https://www.linkedin.com'
        OR linkedin = 'https://linkedin.com/'
        OR linkedin = 'https://linkedin.com'
        OR linkedin = 'https://www.linkedin.com/feed/'
        OR linkedin = 'https://linkedin.com/feed/'
        OR (linkedin LIKE 'https://www.linkedin.com/in/%' AND (linkedin LIKE '%?%' OR linkedin LIKE '%#%' OR linkedin LIKE '%/'))
        OR linkedin LIKE 'https://www.linkedin.com/in/%/'
        OR linkedin LIKE 'https://linkedin.com/in/%'
        OR linkedin ~ 'https://[a-z]{2}\.linkedin\.com/in/'
        OR linkedin ~ '^[a-z]{2}\.linkedin\.com/in/'
        OR linkedin LIKE 'http://www.linkedin.com/in/%'
        OR linkedin LIKE 'http://linkedin.com/in/%'
        OR linkedin LIKE 'www.linkedin.com/in/%'
        OR linkedin LIKE 'linkedin.com/in/%'
        OR (linkedin NOT LIKE 'https://%' AND linkedin NOT LIKE 'http://%' AND linkedin NOT LIKE '%.%' AND length(linkedin) > 0 AND linkedin NOT LIKE '%/%')
        OR (linkedin LIKE '%linkedin.com/%' AND linkedin NOT LIKE '%/in/%')
        OR linkedin NOT LIKE '%linkedin.com%'
      );
  `);

  const rowCount = Array.isArray(result)
    ? result.length
    : (result as any).rowCount || 0;
  console.log(`\n✅ Updated ${rowCount} records\n`);

  // Show the after stats
  const afterStatsResult = (await db.execute(sql`
    SELECT
      CASE
        WHEN linkedin LIKE 'https://www.linkedin.com/in/%/' THEN 'with_www_and_trailing_slash'
        WHEN linkedin LIKE 'https://www.linkedin.com/in/%' AND linkedin NOT LIKE '%/' THEN 'with_www_correct'
        WHEN linkedin LIKE 'https://linkedin.com/in/%/' THEN 'no_www_with_trailing_slash'
        WHEN linkedin LIKE 'https://linkedin.com/in/%' AND linkedin NOT LIKE '%/' THEN 'no_www_no_slash'
        WHEN linkedin LIKE 'http://www.linkedin.com/in/%' THEN 'http_with_www'
        WHEN linkedin LIKE 'http://linkedin.com/in/%' THEN 'http_no_www'
        WHEN linkedin LIKE 'www.linkedin.com/in/%' THEN 'missing_protocol_with_www'
        WHEN linkedin LIKE 'linkedin.com/in/%' THEN 'missing_protocol_no_www'
        WHEN linkedin NOT LIKE '%linkedin.com%' THEN 'not_linkedin_url'
        ELSE 'other_format'
      END as format_type,
      COUNT(*) as count
    FROM ${hackers}
    WHERE linkedin IS NOT NULL
    GROUP BY format_type
    ORDER BY count DESC;
  `)) as any;

  console.log('After normalization:');
  const afterStats = Array.isArray(afterStatsResult)
    ? afterStatsResult
    : afterStatsResult.rows || [];
  console.table(afterStats);

  // Show some examples of the normalized URLs
  const examplesResult = (await db.execute(sql`
    SELECT linkedin
    FROM ${hackers}
    WHERE linkedin IS NOT NULL
    ORDER BY linkedin
    LIMIT 10;
  `)) as any;

  console.log('\nExample normalized URLs:');
  const exampleRows = Array.isArray(examplesResult)
    ? examplesResult
    : examplesResult.rows || [];
  exampleRows.forEach((row: any) => {
    console.log(`  - ${row.linkedin}`);
  });

  console.log('\n✨ LinkedIn URL normalization complete!');
}

fixLinkedinUrls()
  .then(() => {
    console.log('Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
