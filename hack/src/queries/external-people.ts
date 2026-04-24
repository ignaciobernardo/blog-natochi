import { and, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  type ExternalPerson,
  externalPeople,
  type InsertExternalPerson,
} from '@/src/lib/db/schema';

export async function getAllExternalPeople(
  eventId: string,
  search?: string,
): Promise<ExternalPerson[]> {
  const conditions = [eq(externalPeople.eventId, eventId)];

  if (search) {
    const term = `%${search}%`;
    const orCondition = or(
      ilike(externalPeople.fullName, term),
      ilike(externalPeople.slug, term),
      ilike(externalPeople.category, term),
      ilike(externalPeople.role, term),
    );
    if (orCondition) conditions.push(orCondition);
  }

  return db
    .select()
    .from(externalPeople)
    .where(and(...conditions))
    .orderBy(externalPeople.fullName);
}

export async function getExternalPersonById(
  id: string,
  eventId?: string,
): Promise<ExternalPerson | undefined> {
  const results = await db
    .select()
    .from(externalPeople)
    .where(
      eventId
        ? and(eq(externalPeople.id, id), eq(externalPeople.eventId, eventId))
        : eq(externalPeople.id, id),
    )
    .limit(1);
  return results[0];
}

export async function getExternalPersonBySlug(
  eventId: string,
  slug: string,
): Promise<ExternalPerson | undefined> {
  const results = await db
    .select()
    .from(externalPeople)
    .where(
      and(eq(externalPeople.eventId, eventId), eq(externalPeople.slug, slug)),
    )
    .limit(1);
  return results[0];
}

export async function createExternalPerson(
  data: Omit<InsertExternalPerson, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<ExternalPerson> {
  const results = await db.insert(externalPeople).values(data).returning();
  return results[0];
}

export async function updateExternalPerson(
  id: string,
  data: Partial<Omit<InsertExternalPerson, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<ExternalPerson> {
  const results = await db
    .update(externalPeople)
    .set(data)
    .where(eq(externalPeople.id, id))
    .returning();
  return results[0];
}

export async function deleteExternalPerson(id: string): Promise<void> {
  await db.delete(externalPeople).where(eq(externalPeople.id, id));
}
