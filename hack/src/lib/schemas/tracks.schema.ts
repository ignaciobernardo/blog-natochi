import { z } from 'zod';

export const trackFormSchema = z.object({
  name: z.string().min(1, 'Track name is required'),
  description: z.string().optional().or(z.literal('')),
});

export type TrackFormData = z.infer<typeof trackFormSchema>;
