import { z } from 'zod';

export const mentorAvailabilitySchema = z.object({
  day: z.enum(['friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:mm format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be in HH:mm format'),
  tentative: z.boolean().optional(),
});

export const mentorFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  github: z
    .string()
    .url('Must be a valid GitHub URL')
    .min(1, 'GitHub URL is required'),
  linkedin: z
    .string()
    .url('Must be a valid LinkedIn URL')
    .optional()
    .or(z.literal('')),
  pictureUrl: z.string().optional().or(z.literal('')),
  companyTitle: z.string().optional(),
  availability: z.array(mentorAvailabilitySchema).optional(),
});

export type MentorAvailabilityFormData = z.infer<
  typeof mentorAvailabilitySchema
>;
export type MentorFormData = z.infer<typeof mentorFormSchema>;
