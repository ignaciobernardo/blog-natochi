import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  type InsertTimeSlot,
  type TimeSlot,
  timeSlots,
} from '@/src/lib/db/schema';

export async function getTimeSlotsByEvent(
  eventId: string,
): Promise<TimeSlot[]> {
  return db
    .select()
    .from(timeSlots)
    .where(eq(timeSlots.eventId, eventId))
    .orderBy(timeSlots.startTime);
}

export async function getTimeSlotsByEventAndDateRange(
  eventId: string,
  startDate: Date,
  endDate: Date,
): Promise<TimeSlot[]> {
  return db
    .select()
    .from(timeSlots)
    .where(
      and(
        eq(timeSlots.eventId, eventId),
        gte(timeSlots.startTime, startDate),
        lte(timeSlots.endTime, endDate),
      ),
    )
    .orderBy(timeSlots.startTime);
}

export async function getTimeSlotById(
  id: string,
): Promise<TimeSlot | undefined> {
  const result = await db
    .select()
    .from(timeSlots)
    .where(eq(timeSlots.id, id))
    .limit(1);
  return result[0];
}

export async function createTimeSlot(data: InsertTimeSlot): Promise<TimeSlot> {
  const result = await db.insert(timeSlots).values(data).returning();
  return result[0];
}

export async function updateTimeSlot(
  id: string,
  data: Partial<InsertTimeSlot>,
): Promise<TimeSlot> {
  const result = await db
    .update(timeSlots)
    .set(data)
    .where(eq(timeSlots.id, id))
    .returning();
  return result[0];
}

export async function deleteTimeSlot(id: string): Promise<void> {
  await db.delete(timeSlots).where(eq(timeSlots.id, id));
}
