import { z } from 'zod';

const dateTimeSchema = z
  .union([
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Invalid datetime format'),
    z.literal(''),
  ])
  .optional()
  .transform((val) => (val === '' || val === undefined ? undefined : val));

const optionalUrlSchema = z
  .union([z.string().url('Must be a valid URL'), z.literal('')])
  .optional()
  .transform((val) => (val === '' || val === undefined ? undefined : val));

export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens',
    ),
  domain: z
    .string()
    .min(1, 'Domain is required')
    .url('Domain must be a valid URL'),
  photosAlbumUrl: optionalUrlSchema,
  priorityAnswerDate: dateTimeSchema,
  priorityDeadlineAt: dateTimeSchema,
  finalDeadlineAt: dateTimeSchema,
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  rsvpOpenAt: dateTimeSchema,
  votingStartsAt: dateTimeSchema,
  votingEndsAt: dateTimeSchema,
  trackSelectionStartTime: dateTimeSchema,
  mentorSelectionStartTime: dateTimeSchema,
  feedbackPrizeDeadline: dateTimeSchema,
  capacityTeams: z.coerce.number().int().positive().nullable().optional(),
  capacityHackers: z.coerce.number().int().positive().nullable().optional(),
  targetSubmission: z.coerce.number().int().positive().nullable().optional(),
  trackTeamLimit: z.coerce.number().int().positive().nullable().optional(),
  mentorTeamLimit: z.coerce.number().int().positive().nullable().optional(),
});

export const updateEventSchema = createEventSchema.extend({
  id: z.string().uuid(),
});

export type CreateEventFormData = z.infer<typeof createEventSchema>;
export type UpdateEventFormData = z.infer<typeof updateEventSchema>;
