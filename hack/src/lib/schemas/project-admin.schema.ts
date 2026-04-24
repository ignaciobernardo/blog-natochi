import { z } from 'zod';

export const projectAdminSearchParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1).catch(1),
  limit: z.coerce.number().int().positive().max(100).default(20).catch(20),
  search: z.string().optional(),
  hasVideo: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  hasRepo: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sortBy: z
    .enum(['name', 'createdAt', 'updatedAt'])
    .default('createdAt')
    .catch('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').catch('desc'),
});

export type ProjectAdminSearchParams = z.infer<
  typeof projectAdminSearchParamsSchema
>;

export const updateProjectFormSchema = z.object({
  onelinerShort: z
    .string()
    .max(60, 'Short oneliner must be 60 characters or less')
    .optional(),
});

export type UpdateProjectFormData = z.infer<typeof updateProjectFormSchema>;
