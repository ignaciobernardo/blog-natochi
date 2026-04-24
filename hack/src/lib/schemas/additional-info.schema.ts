import { z } from 'zod';

export const additionalInfoFormSchema = z
  .object({
    countryType: z.enum(['chile', 'other'], {
      required_error: 'Debes seleccionar un país',
    }),
    nationalId: z.string().min(1, 'Este campo es requerido'),
    shoeSize: z.coerce
      .number({
        required_error: 'Talla de zapato es requerida',
        invalid_type_error: 'Talla de zapato debe ser un número',
      })
      .int('Talla de zapato debe ser un número entero')
      .min(36, 'Talla mínima es 36')
      .max(44, 'Talla máxima es 44'),
    emergencyContactName: z
      .string()
      .min(1, 'Nombre de contacto de emergencia es requerido'),
    emergencyContactPhone: z
      .string()
      .min(1, 'Teléfono de contacto de emergencia es requerido'),
  })
  .refine(
    (data) => {
      // If Chile, validate RUT format
      if (data.countryType === 'chile') {
        return /^(\d{1,2}\.\d{3}\.\d{3}[-][0-9kK]{1})$/.test(data.nationalId);
      }
      // For other countries, just check it's not empty (already validated above)
      return true;
    },
    {
      message: 'Formato de RUT inválido (ej: 12.345.678-9)',
      path: ['nationalId'],
    },
  );

export type AdditionalInfoFormData = z.infer<typeof additionalInfoFormSchema>;
