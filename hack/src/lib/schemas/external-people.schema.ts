import { z } from 'zod';

export const createExternalPersonSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(255, 'Name is too long'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category is too long'),
  role: z.string().max(100, 'Role is too long').optional().nullable(),
  githubUrl: z
    .string()
    .url('Invalid GitHub URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  linkedinUrl: z
    .string()
    .url('Invalid LinkedIn URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  redirectUrl: z
    .string()
    .url('Invalid redirect URL')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type CreateExternalPersonFormData = z.infer<
  typeof createExternalPersonSchema
>;

export const updateExternalPersonSchema = createExternalPersonSchema.extend({
  id: z.string().uuid(),
});

export type UpdateExternalPersonFormData = z.infer<
  typeof updateExternalPersonSchema
>;
