import { z } from 'zod';
import { submissionStatuses } from '@/src/lib/db/schema';

export const teamReviewSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1).catch(1),
  limit: z.coerce.number().int().positive().max(100).default(20).catch(20),
  search: z.string().optional(),
  eventId: z.string().uuid().optional(),
  status: z
    .string()
    .transform((val) => val.split(',').filter(Boolean))
    .pipe(z.array(z.enum(submissionStatuses)))
    .optional(),
  country: z.string().optional(),
  submittedAfter: z.coerce.date().optional(),
  submittedBefore: z.coerce.date().optional(),
  sortBy: z.enum(['submittedAt']).default('submittedAt').catch('submittedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').catch('desc'),
});

export type TeamReviewSearchParams = z.infer<
  typeof teamReviewSearchParamsSchema
>;
