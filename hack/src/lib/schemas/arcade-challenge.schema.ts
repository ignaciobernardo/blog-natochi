import { z } from 'zod';

const dateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid datetime format');

export const createArcadeChallengeSchema = z.object({
  eventId: z.string().uuid('Event is required'),
  name: z.string().min(1, 'Challenge name is required').max(255),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
  submissionDeadline: dateTimeSchema,
  votingDeadline: dateTimeSchema,
});

export const updateArcadeChallengeSchema = createArcadeChallengeSchema.extend({
  id: z.string().uuid(),
});

export type CreateArcadeChallengeFormData = z.infer<
  typeof createArcadeChallengeSchema
>;
export type UpdateArcadeChallengeFormData = z.infer<
  typeof updateArcadeChallengeSchema
>;
