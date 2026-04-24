import { desc, eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  account,
  admins,
  type InsertAdmin,
  session,
  user,
} from '@/src/lib/db/schema';

export interface AdminWithLastLogin {
  id: string;
  email: string;
  fullName: string;
  role: 'full' | 'guest';
  createdAt: Date;
  lastLoginAt: Date | null;
}

export async function getAdminsWithLastLogin(): Promise<AdminWithLastLogin[]> {
  const result = await db
    .select({
      id: admins.id,
      email: admins.email,
      fullName: admins.fullName,
      role: admins.role,
      createdAt: admins.createdAt,
      lastLoginAt: session.createdAt,
    })
    .from(admins)
    .leftJoin(user, eq(user.email, admins.email))
    .leftJoin(session, eq(session.userId, user.id))
    .orderBy(desc(admins.createdAt));

  const adminMap = new Map<string, AdminWithLastLogin>();

  for (const row of result) {
    const existing = adminMap.get(row.id);

    if (!existing) {
      adminMap.set(row.id, {
        id: row.id,
        email: row.email,
        fullName: row.fullName,
        role: row.role,
        createdAt: row.createdAt,
        lastLoginAt: row.lastLoginAt,
      });
    } else if (
      row.lastLoginAt &&
      (!existing.lastLoginAt || row.lastLoginAt > existing.lastLoginAt)
    ) {
      existing.lastLoginAt = row.lastLoginAt;
    }
  }

  return Array.from(adminMap.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function createAdmin(data: InsertAdmin) {
  const [record] = await db.insert(admins).values(data).returning();
  return record;
}

export async function getAdminByEmail(email: string) {
  const [record] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email));
  return record;
}

export async function deleteAdminByEmail(email: string) {
  await db.transaction(async (tx) => {
    // Find the user record
    const [targetUser] = await tx
      .select()
      .from(user)
      .where(eq(user.email, email));

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Delete associated account records
    await tx.delete(account).where(eq(account.userId, targetUser.id));

    // Delete user record
    await tx.delete(user).where(eq(user.id, targetUser.id));

    // Delete admin record
    await tx.delete(admins).where(eq(admins.email, email));
  });
}

export async function updateAdminPassword(
  email: string,
  hashedPassword: string,
) {
  const [targetUser] = await db
    .select()
    .from(user)
    .where(eq(user.email, email));

  if (!targetUser) {
    throw new Error('User not found');
  }

  await db
    .update(account)
    .set({ password: hashedPassword })
    .where(eq(account.userId, targetUser.id));
}

export interface CreateAdminUserData {
  email: string;
  fullName: string;
  role: 'full' | 'guest';
  hashedPassword: string;
  userId: string;
  adminId: string;
}

export async function createAdminUser(data: CreateAdminUserData) {
  const now = new Date();

  await db.transaction(async (tx) => {
    // Create admin record first
    await tx.insert(admins).values({
      id: data.adminId,
      email: data.email,
      fullName: data.fullName,
      role: data.role,
    });

    // Create user with linkedId and adminRole
    await tx.insert(user).values({
      id: data.userId,
      email: data.email,
      name: data.fullName,
      emailVerified: true,
      userType: 'admin',
      linkedId: data.adminId,
      adminRole: data.role,
      createdAt: now,
      updatedAt: now,
    });

    // Create account with hashed password
    await tx.insert(account).values({
      id: crypto.randomUUID(),
      userId: data.userId,
      accountId: data.email,
      providerId: 'credential',
      password: data.hashedPassword,
      createdAt: now,
      updatedAt: now,
    });
  });
}
