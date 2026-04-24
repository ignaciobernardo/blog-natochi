import type { FeedbackFormData } from '@/src/lib/schemas/feedback.schema';
import { EVENT_QUALITY_LABELS } from '@/src/lib/schemas/feedback.schema';
import { slackService } from '@/src/services/slack';

interface FeedbackNotificationData {
  hackerName: string;
  hackerEmail: string;
  hackerGithub: string | null;
  teamSlug: string | null;
  projectName: string | null;
  projectSlug: string | null;
  eventDomain: string | null;
  mentorName: string | null;
  feedback: FeedbackFormData;
}

const participationIntentLabels: Record<string, string> = {
  yes: 'Si',
  no: 'No',
  maybe: 'Tal vez',
};

const sponsorWorkIntentLabels: Record<string, string> = {
  yes: 'Si',
  no: 'No',
  already_did: 'Ya lo hice',
};

const startupIntentLabels: Record<string, string> = {
  yes: 'Si',
  no: 'No',
  already_building: 'Ya estoy construyendo',
};

const fundingPreferenceLabels: Record<string, string> = {
  bootstrapped: 'Bootstrapped',
  vc: 'VC',
  other: 'Otro',
};

const startupAmbitionLabels: Record<string, string> = {
  up_to_100k: 'Hasta $100k',
  '100k_to_1m': '$100k - $1M',
  '1m_to_10m': '$1M - $10M',
  '10m_plus': '$10M+',
  not_sure: 'No estoy seguro',
};

const qualityOrder = [
  'oficina',
  'wifi',
  'comida',
  'software',
  'comunicacion',
  'branding',
  'mentores',
  'jueces',
  'sponsors',
  'nivelTecnico',
  'tracks',
  'premios',
  'procesoEvaluacion',
  'publicVoting',
  'organizacion',
] as const;

const qualityEmojis = [
  '🏢',
  '📶',
  '🍽️',
  '🧰',
  '📣',
  '🎨',
  '🧑‍🏫',
  '🧑‍⚖️',
  '🤝',
  '🚀',
  '🧭',
  '🎁',
  '🧪',
  '🗳️',
  '🧩',
];

const feedbackUsagePermissionLabels: Record<string, string> = {
  yes_with_name: 'Si, con nombre',
  yes_anonymous: 'Si, anonimo',
  no: 'No',
};

export class FeedbackNotifier {
  async notifyNewFeedback(data: FeedbackNotificationData): Promise<void> {
    try {
      const {
        hackerName,
        hackerEmail,
        hackerGithub,
        teamSlug,
        projectName,
        projectSlug,
        eventDomain,
        mentorName,
        feedback,
      } = data;

      const ratingEmoji = this.getRatingEmoji(feedback.overallRating);
      const npsEmoji = this.getNpsEmoji(feedback.npsScore);

      const header = `📝 *Nuevo feedback* de *${hackerName}*`;

      const githubUsername = hackerGithub
        ? this.formatGithub(hackerGithub)
        : null;
      const baseDomain = eventDomain ? eventDomain.replace(/\/$/, '') : null;
      const projectVoteUrl =
        projectSlug && baseDomain
          ? `${baseDomain}/25/vote/${projectSlug}`
          : null;

      const basicInfo = [
        `• Email: ${hackerEmail}`,
        githubUsername
          ? `• GitHub: <https://github.com/${githubUsername}|@${githubUsername}>`
          : null,
        teamSlug ? `• Equipo: *${teamSlug}*` : null,
        projectVoteUrl && projectName
          ? `• Proyecto: <${projectVoteUrl}|${projectName}>`
          : projectName
            ? `• Proyecto: *${projectName}*`
            : null,
        mentorName ? `• Mentor: ${mentorName}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const ratings = [
        `• Rating general: ${ratingEmoji} ${feedback.overallRating}/10`,
        `• NPS: ${npsEmoji} ${feedback.npsScore}/10`,
        `• Volveria a participar: ${participationIntentLabels[feedback.participationIntent] || feedback.participationIntent}`,
        mentorName && feedback.mentorRating
          ? `• Rating mentor: ${this.getRatingEmoji(feedback.mentorRating)} ${feedback.mentorRating}/10`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      const qualityRatings = qualityOrder
        .map((key, index) => {
          const label = EVENT_QUALITY_LABELS[key];
          const emoji = qualityEmojis[index] || '•';
          const value = feedback.eventQualityRatings[key];
          return `${emoji} ${label}: ${value}/5`;
        })
        .join('\n');

      const qualitativeAnswers = [
        `• Lo mejor: ${this.truncate(feedback.bestPart, 200)}`,
        feedback.worstPart
          ? `• Lo peor: ${this.truncate(feedback.worstPart, 200)}`
          : null,
        feedback.suggestions
          ? `• Sugerencias: ${this.truncate(feedback.suggestions, 200)}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      const sponsorInfo = [
        `• Sponsors recordados: ${this.truncate(feedback.sponsorUnaidedRecall, 100)}`,
        feedback.sponsorsInteracted?.length
          ? `• Interactuo con: ${feedback.sponsorsInteracted.join(', ')}`
          : null,
        feedback.sponsorWorkIntent
          ? `• Trabajaria en sponsor: ${sponsorWorkIntentLabels[feedback.sponsorWorkIntent] || feedback.sponsorWorkIntent}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      const futureInfo = [
        `• Quiere hacer startup: ${startupIntentLabels[feedback.startupIntent] || feedback.startupIntent}`,
        feedback.fundingPreference
          ? `• Preferencia funding: ${fundingPreferenceLabels[feedback.fundingPreference] || feedback.fundingPreference}`
          : null,
        feedback.startupAmbition
          ? `• Ambicion: ${startupAmbitionLabels[feedback.startupAmbition] || feedback.startupAmbition}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      const extras = [
        feedback.howHeardAbout
          ? `• Como se entero: ${this.truncate(feedback.howHeardAbout, 100)}`
          : null,
        feedback.additionalComments
          ? `• Comentarios adicionales: ${this.truncate(feedback.additionalComments, 200)}`
          : null,
        `• Permiso para usar feedback: ${feedbackUsagePermissionLabels[feedback.feedbackUsagePermission] || feedback.feedbackUsagePermission}`,
      ]
        .filter(Boolean)
        .join('\n');

      const mediaSection =
        feedback.mediaUrls && feedback.mediaUrls.length > 0
          ? feedback.mediaUrls
              .map((url, i) => `• <${url}|Archivo ${i + 1}>`)
              .join('\n')
          : null;

      await slackService.sendRichMessage({
        text: `Nuevo feedback de ${hackerName}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: header,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: basicInfo,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Ratings*\n${ratings}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Calidad del evento*
${qualityRatings}`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Feedback cualitativo*\n${qualitativeAnswers}`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Sponsors*\n${sponsorInfo}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Futuro*\n${futureInfo}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Extras*\n${extras}`,
            },
          },
          ...(mediaSection
            ? [
                {
                  type: 'divider' as const,
                },
                {
                  type: 'section' as const,
                  text: {
                    type: 'mrkdwn' as const,
                    text: `*📎 Archivos adjuntos (${feedback.mediaUrls?.length})*\n${mediaSection}`,
                  },
                },
              ]
            : []),
        ],
        unfurl_links: false,
        unfurl_media: false,
      });

      console.log('✅ Slack feedback notification sent successfully');
    } catch (error) {
      console.error('Failed to send Slack feedback notification:', error);
    }
  }

  private getRatingEmoji(rating: number): string {
    if (rating >= 9) return '🔥';
    if (rating >= 7) return '😊';
    if (rating >= 5) return '😐';
    if (rating >= 3) return '😕';
    return '😢';
  }

  private getNpsEmoji(score: number): string {
    if (score >= 9) return '💚';
    if (score >= 7) return '💛';
    return '❤️';
  }

  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  }

  private formatGithub(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const match = trimmed.match(/github\.com\/(.+)$/i);
    return match ? match[1].replace(/\/$/, '') : trimmed.replace(/^@/, '');
  }
}

export const feedbackNotifier = new FeedbackNotifier();
