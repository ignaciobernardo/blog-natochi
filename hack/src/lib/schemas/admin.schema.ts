import { z } from 'zod';
import { adminRoles } from '@/src/lib/db/schema';

export const createAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required').max(255),
  role: z.enum(adminRoles, {
    errorMap: () => ({ message: 'Role must be either "full" or "guest"' }),
  }),
});

export type CreateAdminFormData = z.infer<typeof createAdminSchema>;
