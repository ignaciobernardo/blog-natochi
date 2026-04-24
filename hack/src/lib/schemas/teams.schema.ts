import { z } from 'zod';

export const createTeamFormSchema = z.object({
  slug: z
    .string()
    .min(1, 'Team slug is required')
    .max(255, 'Team slug is too long')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
  tableNumber: z.string().max(50, 'Table number is too long').optional(),
});

export type CreateTeamFormData = z.infer<typeof createTeamFormSchema>;
