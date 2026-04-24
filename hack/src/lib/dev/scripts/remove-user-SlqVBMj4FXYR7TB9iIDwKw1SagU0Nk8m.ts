import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { account, session, user } from '@/src/lib/db/schema';

const USER_ID_TO_DELETE = 'SlqVBMj4FXYR7TB9iIDwKw1SagU0Nk8m';

async function removeUser() {
  console.log(`Starting removal of user: ${USER_ID_TO_DELETE}`);

  try {
    // First, get user details before deletion
    const [userToDelete] = await db
      .select()
      .from(user)
      .where(eq(user.id, USER_ID_TO_DELETE));

    if (!userToDelete) {
      console.log(`❌ User with ID ${USER_ID_TO_DELETE} not found`);
      return;
    }

    console.log('\nUser to delete:');
    console.log(`  ID: ${userToDelete.id}`);
    console.log(`  Email: ${userToDelete.email}`);
    console.log(`  Name: ${userToDelete.name}`);
    console.log(`  User Type: ${userToDelete.userType}`);
    console.log(`  Linked ID: ${userToDelete.linkedId}`);

    // Delete associated sessions
    const deletedSessions = await db
      .delete(session)
      .where(eq(session.userId, USER_ID_TO_DELETE))
      .returning();

    console.log(`\n✓ Deleted ${deletedSessions.length} session(s)`);

    // Delete associated accounts
    const deletedAccounts = await db
      .delete(account)
      .where(eq(account.userId, USER_ID_TO_DELETE))
      .returning();

    console.log(`✓ Deleted ${deletedAccounts.length} account(s)`);

    // Delete user
    await db.delete(user).where(eq(user.id, USER_ID_TO_DELETE));

    console.log(`✓ Deleted user: ${USER_ID_TO_DELETE}`);

    console.log('\n✅ User removal completed successfully!');
  } catch (error) {
    console.error('❌ Error removing user:', error);
    throw error;
  }
}

removeUser()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
