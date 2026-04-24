'use server';

import { sponsorInquiryNotifier } from '@/src/operators/slack/sponsor-inquiry-notifier';

interface CitySelection {
  cityId: string;
  cityName: string;
  country: string;
  tier: 'exclusive' | 'partner' | 'sponsor' | 'host';
}

interface SubmitSponsorInquiryInput {
  companyName: string;
  emails: string[];
  message?: string;
  citySelections: CitySelection[];
}

interface SubmitSponsorInquiryResult {
  success: boolean;
  error?: string;
}

export async function submitSponsorInquiryAction(
  input: SubmitSponsorInquiryInput,
): Promise<SubmitSponsorInquiryResult> {
  try {
    if (!input.companyName.trim()) {
      return { success: false, error: 'El nombre de la empresa es requerido' };
    }

    if (input.emails.length === 0) {
      return { success: false, error: 'Al menos un email es requerido' };
    }

    if (input.citySelections.length === 0) {
      return { success: false, error: 'Debes seleccionar al menos una ciudad' };
    }

    await sponsorInquiryNotifier.notifyNewInquiry({
      companyName: input.companyName.trim(),
      emails: input.emails,
      message: input.message?.trim() || undefined,
      citySelections: input.citySelections,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to submit sponsor inquiry:', error);
    return {
      success: false,
      error: 'Hubo un error al enviar tu consulta. Por favor intenta de nuevo.',
    };
  }
}
