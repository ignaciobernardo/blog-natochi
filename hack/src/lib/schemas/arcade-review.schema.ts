import { z } from 'zod';

export const arcadeReviewSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1).catch(1),
  limit: z.coerce.number().int().positive().max(100).default(20).catch(20),
  search: z.string().optional(),
  challengeId: z.string().uuid().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').catch('desc'),
});

export type ArcadeReviewSearchParams = z.infer<
  typeof arcadeReviewSearchParamsSchema
>;
