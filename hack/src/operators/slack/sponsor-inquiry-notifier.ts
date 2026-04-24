import { slackService } from '@/src/services/slack';

interface CitySelection {
  cityId: string;
  cityName: string;
  country: string;
  tier: 'exclusive' | 'partner' | 'sponsor' | 'host';
}

interface SponsorInquiryData {
  companyName: string;
  emails: string[];
  message?: string;
  citySelections: CitySelection[];
}

const tierEmojis: Record<string, string> = {
  exclusive: '👑',
  partner: '🚀',
  sponsor: '🫶',
  host: '🏢',
};

const tierNames: Record<string, string> = {
  exclusive: 'Exclusive Partner',
  partner: 'Partner',
  sponsor: 'Sponsor',
  host: 'Host',
};

export class SponsorInquiryNotifier {
  async notifyNewInquiry(data: SponsorInquiryData): Promise<void> {
    try {
      const cityDetails = data.citySelections
        .map(
          (cs) =>
            `• ${tierEmojis[cs.tier]} *${cs.cityName}* (${cs.country}) - ${tierNames[cs.tier]}`,
        )
        .join('\n');

      const headerText = `💰 Nueva consulta de sponsor: ${data.companyName}`;

      await slackService.sendRichMessage({
        text: headerText,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*💰 Nueva consulta de sponsor*`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Empresa:*\n${data.companyName}`,
              },
              {
                type: 'mrkdwn',
                text: `*Emails:*\n${data.emails.join(', ')}`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Paquetes seleccionados:*\n${cityDetails}`,
            },
          },
          ...(data.message
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `*Mensaje:*\n> ${data.message}`,
                  },
                },
              ]
            : []),
        ],
      });

      console.log(
        '✅ Slack notification sent successfully for sponsor inquiry:',
        data.companyName,
      );
    } catch (error) {
      console.error('Failed to send Slack notification for sponsor inquiry:', {
        companyName: data.companyName,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }
}

export const sponsorInquiryNotifier = new SponsorInquiryNotifier();
