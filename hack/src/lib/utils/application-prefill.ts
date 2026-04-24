import { applicationSchema } from '@/src/lib/schemas/application.schema';
import type { ApplicationFormData } from '@/src/lib/types/application';

function decodeBase64Url(value: string) {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalizedValue.length % 4;
  const paddedValue =
    padding === 0 ? normalizedValue : normalizedValue + '='.repeat(4 - padding);

  if (typeof window === 'undefined') {
    return Buffer.from(paddedValue, 'base64').toString('utf-8');
  }

  const binary = window.atob(paddedValue);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

export function decodeApplicationPrefill(
  encodedPayload: string,
): ApplicationFormData | null {
  try {
    const decodedPayload = decodeBase64Url(encodedPayload);
    const parsedPayload = JSON.parse(decodedPayload);
    const result = applicationSchema.safeParse(parsedPayload);

    if (!result.success || result.data.modality !== 'team') {
      return null;
    }

    return result.data;
  } catch {
    return null;
  }
}
