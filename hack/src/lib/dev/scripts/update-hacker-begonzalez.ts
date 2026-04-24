import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackers } from '@/src/lib/db/schema';

async function updateHackerInfo() {
  const hackerId = 'd90f11f2-f39e-4bf4-9e18-506934f49f78';

  console.log('🔍 Finding hacker with ID:', hackerId);

  const [existingHacker] = await db
    .select()
    .from(hackers)
    .where(eq(hackers.id, hackerId))
    .limit(1);

  if (!existingHacker) {
    console.error('❌ Hacker not found');
    return;
  }

  console.log('📋 Current hacker info:');
  console.log('  Email:', existingHacker.email);
  console.log('  GitHub:', existingHacker.github);
  console.log('  LinkedIn:', existingHacker.linkedin);

  console.log('\n🔄 Updating hacker information...');

  const [updatedHacker] = await db
    .update(hackers)
    .set({
      email: 'jtgonzalez@copec.cl',
      github: 'https://github.com/GonzalezAnguita',
      linkedin: 'https://linkedin.com/in/gonzalezanguita',
    })
    .where(eq(hackers.id, hackerId))
    .returning();

  console.log('\n✅ Hacker updated successfully!');
  console.log('📋 New hacker info:');
  console.log('  Email:', updatedHacker.email);
  console.log('  GitHub:', updatedHacker.github);
  console.log('  LinkedIn:', updatedHacker.linkedin);
}

updateHackerInfo()
  .then(() => {
    console.log('\n✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error updating hacker:', error);
    process.exit(1);
  });
