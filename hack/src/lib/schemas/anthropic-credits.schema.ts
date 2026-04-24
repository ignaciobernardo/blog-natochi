import { z } from 'zod';

export const anthropicCreditsFormSchema = z.object({
  anthropicAccountEmail: z
    .string()
    .min(1, 'Email es requerido')
    .email('Formato de email inválido'),
  anthropicOrgId: z
    .string()
    .min(1, 'Organization ID es requerido')
    .uuid('Formato de Organization ID inválido (debe ser UUID)'),
  anthropicUsedProducts: z
    .array(z.string())
    .min(1, 'Debes seleccionar al menos un producto'),
  anthropicUpdates: z.boolean(),
});

export type AnthropicCreditsFormData = z.infer<
  typeof anthropicCreditsFormSchema
>;
