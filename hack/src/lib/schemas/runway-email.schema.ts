import { z } from 'zod';

export const runwayEmailFormSchema = z.object({
  runwayEmail: z
    .string()
    .min(1, 'Email es requerido')
    .email('Email inválido')
    .max(255, 'Email demasiado largo'),
});

export type RunwayEmailFormData = z.infer<typeof runwayEmailFormSchema>;
