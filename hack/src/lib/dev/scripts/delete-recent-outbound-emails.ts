import { gte } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { outboundEmails } from '@/src/lib/db/schema';

async function deleteRecentOutboundEmails() {
  console.log('🗑️  Deleting outbound emails from the last day...\n');

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  try {
    const result = await db
      .delete(outboundEmails)
      .where(gte(outboundEmails.createdAt, oneDayAgo))
      .returning({ id: outboundEmails.id });

    console.log(
      `✅ Deleted ${result.length} outbound emails from the last day`,
    );
    console.log('\nDeleted email IDs:');
    for (const email of result) {
      console.log(`  - ${email.id}`);
    }
  } catch (error) {
    console.error('❌ Error deleting emails:', error);
    throw error;
  }
}

deleteRecentOutboundEmails()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
