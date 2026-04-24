import { and, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import {
  hackerProfiles,
  hackers,
  type InsertOutboundEmail,
  outboundEmails,
} from '@/src/lib/db/schema';

export async function createOutboundEmail(data: InsertOutboundEmail) {
  const [record] = await db.insert(outboundEmails).values(data).returning();
  return record;
}

export async function updateOutboundEmail(
  id: string,
  updates: Partial<
    Pick<
      InsertOutboundEmail,
      'status' | 'sentAt' | 'failureReason' | 'externalMessageId'
    >
  >,
) {
  await db.update(outboundEmails).set(updates).where(eq(outboundEmails.id, id));
}

export async function getOutboundEmail(id: string) {
  const [record] = await db
    .select()
    .from(outboundEmails)
    .where(eq(outboundEmails.id, id));

  return record;
}

export async function deleteOutboundEmail(id: string) {
  await db.delete(outboundEmails).where(eq(outboundEmails.id, id));
}

interface GetOutboundEmailsParams {
  page?: number;
  limit?: number;
  search?: string;
  to?: string;
  status?: 'pending' | 'sent' | 'failed';
  sortBy?: 'createdAt' | 'sentAt';
  sortOrder?: 'asc' | 'desc';
}

export async function getOutboundEmails(params: GetOutboundEmailsParams = {}) {
  const {
    page = 1,
    limit = 20,
    search,
    to,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions: any[] = [];

  // Filter by recipient email
  if (to) {
    conditions.push(eq(outboundEmails.to, to));
  }

  // Filter by status
  if (status) {
    conditions.push(eq(outboundEmails.status, status));
  }

  // Search filtering (to, subject, template name, html content)
  if (search) {
    conditions.push(
      or(
        ilike(outboundEmails.to, `%${search}%`),
        ilike(outboundEmails.subject, `%${search}%`),
        ilike(outboundEmails.templateName, `%${search}%`),
        ilike(outboundEmails.htmlContent, `%${search}%`),
      ),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Determine sort column
  const sortColumn =
    sortBy === 'sentAt' ? outboundEmails.sentAt : outboundEmails.createdAt;
  const sortDirection = sortOrder === 'asc' ? sortColumn : desc(sortColumn);

  const records = await db
    .select()
    .from(outboundEmails)
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(sortDirection);

  // Get total count for pagination
  const [{ total }] = await db
    .select({ total: count() })
    .from(outboundEmails)
    .where(whereClause);

  const totalPages = Math.ceil(total / limit);

  return {
    emails: records,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getOutboundEmailStats() {
  const [stats] = await db
    .select({
      total: count(),
      sent: count(sql`CASE WHEN status = 'sent' THEN 1 END`),
      failed: count(sql`CASE WHEN status = 'failed' THEN 1 END`),
      pending: count(sql`CASE WHEN status = 'pending' THEN 1 END`),
    })
    .from(outboundEmails);

  return {
    total: Number(stats.total),
    sent: Number(stats.sent),
    failed: Number(stats.failed),
    pending: Number(stats.pending),
    successRate:
      stats.total > 0 ? (Number(stats.sent) / Number(stats.total)) * 100 : 0,
  };
}

export async function getEmailsForSubmissionMembers(submissionId: string) {
  // Get all hacker emails and github profiles from this submission (via hacker_profiles)
  const hackerData = await db
    .select({ email: hackers.email, github: hackers.github })
    .from(hackerProfiles)
    .innerJoin(hackers, eq(hackerProfiles.hackerId, hackers.id))
    .where(eq(hackerProfiles.submissionId, submissionId));

  if (hackerData.length === 0) {
    return [];
  }

  const emails = hackerData.map((h) => h.email);

  // Create a map of email to github for quick lookup
  const emailToGithub = new Map(hackerData.map((h) => [h.email, h.github]));

  // Get all outbound emails sent to these members
  const records = await db
    .select()
    .from(outboundEmails)
    .where(inArray(outboundEmails.to, emails))
    .orderBy(desc(outboundEmails.createdAt));

  // Attach github profile to each email record
  return records.map((email) => ({
    ...email,
    recipientGithub: emailToGithub.get(email.to),
  }));
}
