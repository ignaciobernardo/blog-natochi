import { eq } from 'drizzle-orm';
import { db } from '@/src/lib/db';
import { hackerProfiles, hackers } from '@/src/lib/db/schema';

const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScsIe0H6ORotLjam06FbvjymufhiC5KDbkcGk9RnxX6niB0TA/formResponse';

const FORM_ENTRY_IDS = {
  fullName: 'entry.1368002934',
  linkedin: 'entry.398360570',
  orgId: 'entry.1006236479',
  products: 'entry.1339325095',
  updates: 'entry.146192201',
  email: 'emailAddress',
};

// Map app product values to Google Form values
const PRODUCT_VALUE_MAP: Record<string, string> = {
  'Claude.ai': 'Claude.ai',
  'Claude code': 'Claude Code',
  'Claude API': 'Claude API',
  'Ninguno de los anteriores': 'None of the above',
};

interface SubmitAnthropicFormParams {
  hackerProfileId: string;
}

interface SubmitAnthropicFormResult {
  success: boolean;
  error?: string;
}

export class AnthropicFormSubmitter {
  async submit(
    params: SubmitAnthropicFormParams,
  ): Promise<SubmitAnthropicFormResult> {
    try {
      const profile = await db.query.hackerProfiles.findFirst({
        where: eq(hackerProfiles.id, params.hackerProfileId),
      });

      if (!profile) {
        return {
          success: false,
          error: `Hacker profile ${params.hackerProfileId} not found`,
        };
      }

      if (profile.anthropicInfoSentAt) {
        console.log(
          `Anthropic form already submitted for profile ${params.hackerProfileId} at ${profile.anthropicInfoSentAt}`,
        );
        return { success: true };
      }

      if (
        !profile.anthropicAccountEmail ||
        !profile.anthropicOrgId ||
        !profile.anthropicUsedProducts
      ) {
        return {
          success: false,
          error: `Missing Anthropic data for profile ${params.hackerProfileId}`,
        };
      }

      const hacker = await db.query.hackers.findFirst({
        where: eq(hackers.id, profile.hackerId),
      });

      if (!hacker) {
        return {
          success: false,
          error: `Hacker ${profile.hackerId} not found`,
        };
      }

      const formData = new URLSearchParams();
      formData.append(FORM_ENTRY_IDS.fullName, hacker.fullName);
      formData.append(FORM_ENTRY_IDS.linkedin, hacker.linkedin || '');
      formData.append(FORM_ENTRY_IDS.orgId, profile.anthropicOrgId);

      // Products - append each as separate entry with same key (checkbox behavior)
      const products = profile.anthropicUsedProducts as string[];
      for (const product of products) {
        const mappedProduct = PRODUCT_VALUE_MAP[product] || product;
        formData.append(FORM_ENTRY_IDS.products, mappedProduct);
      }

      // Updates field
      formData.append(
        FORM_ENTRY_IDS.updates,
        profile.anthropicUpdates ? 'Yes' : 'No',
      );

      // Email
      formData.append(FORM_ENTRY_IDS.email, profile.anthropicAccountEmail);

      // Sentinel fields for checkboxes
      formData.append(`${FORM_ENTRY_IDS.products}_sentinel`, '');
      formData.append(`${FORM_ENTRY_IDS.updates}_sentinel`, '');

      // Required Google Form fields
      formData.append('fvv', '1');
      formData.append('pageHistory', '0');

      console.log(
        `Submitting Anthropic form for ${hacker.fullName} (${profile.anthropicAccountEmail})...`,
      );

      const response = await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
        redirect: 'manual',
      });

      // Google Forms returns 302 redirect on success, or 200 if followed
      if (
        response.status === 200 ||
        response.status === 302 ||
        response.status === 303
      ) {
        await db
          .update(hackerProfiles)
          .set({
            anthropicInfoSentAt: new Date(),
          })
          .where(eq(hackerProfiles.id, params.hackerProfileId));

        console.log(
          `✅ Anthropic form submitted successfully for profile ${params.hackerProfileId}`,
        );
        return { success: true };
      }

      return {
        success: false,
        error: `Form submission failed with status ${response.status}`,
      };
    } catch (error) {
      console.error('Failed to submit Anthropic form:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const anthropicFormSubmitter = new AnthropicFormSubmitter();
