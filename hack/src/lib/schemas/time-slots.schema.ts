import { z } from 'zod';
import { timeSlotTargets } from '@/src/lib/db/schema';

export const timeSlotFormSchema = z
  .object({
    eventId: z.string().uuid('Invalid event ID'),
    title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
    description: z.string().max(1000, 'Description is too long').optional(),
    startTime: z.coerce.date({
      required_error: 'Start time is required',
      invalid_type_error: 'Invalid start time',
    }),
    endTime: z.coerce.date({
      required_error: 'End time is required',
      invalid_type_error: 'Invalid end time',
    }),
    location: z.string().max(255, 'Location is too long').optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'),
    target: z
      .array(z.enum(timeSlotTargets))
      .min(1, 'At least one target audience is required'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export type TimeSlotFormData = z.infer<typeof timeSlotFormSchema>;
