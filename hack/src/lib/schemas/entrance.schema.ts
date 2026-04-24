import { z } from 'zod';

export const entranceSearchParamsSchema = z.object({
  search: z.string().optional().default(''),
  eventId: z.string().uuid().optional(),
});

export type EntranceSearchParams = z.infer<typeof entranceSearchParamsSchema>;

export const markEntranceSchema = z.object({
  personId: z.string().uuid(),
  personType: z.enum(['hacker', 'mentor']),
  eventId: z.string().uuid(),
});

export type MarkEntranceData = z.infer<typeof markEntranceSchema>;
