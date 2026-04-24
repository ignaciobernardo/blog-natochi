import { z } from 'zod';

export const emailSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1).catch(1),
  limit: z.coerce.number().int().positive().max(100).default(20).catch(20),
  search: z.string().optional(),
  status: z.enum(['pending', 'sent', 'failed']).optional(),
  sortBy: z
    .enum(['createdAt', 'sentAt'])
    .default('createdAt')
    .catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').catch('desc'),
});

export type EmailSearchParams = z.infer<typeof emailSearchParamsSchema>;
