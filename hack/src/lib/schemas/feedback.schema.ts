import { z } from 'zod';
import type {
  EventQualityRatings,
  feedbackUsagePermissions,
  fundingPreferences,
  participationIntents,
  sponsorWorkIntents,
  startupAmbitions,
  startupIntents,
} from '@/src/lib/db/schema';

export const eventQualityRatingsSchema = z.object({
  oficina: z.number().min(1).max(5),
  wifi: z.number().min(1).max(5),
  comida: z.number().min(1).max(5),
  software: z.number().min(1).max(5),
  comunicacion: z.number().min(1).max(5),
  branding: z.number().min(1).max(5),
  mentores: z.number().min(1).max(5),
  jueces: z.number().min(1).max(5),
  sponsors: z.number().min(1).max(5),
  nivelTecnico: z.number().min(1).max(5),
  tracks: z.number().min(1).max(5),
  premios: z.number().min(1).max(5),
  procesoEvaluacion: z.number().min(1).max(5),
  publicVoting: z.number().min(1).max(5),
  organizacion: z.number().min(1).max(5),
}) satisfies z.ZodSchema<EventQualityRatings>;

export const feedbackFormSchema = z.object({
  // Overall experience (Q1-3)
  overallRating: z.number().min(1).max(10),
  npsScore: z.number().min(0).max(10),
  participationIntent: z.enum([
    'yes',
    'no',
    'maybe',
  ] as const satisfies readonly (typeof participationIntents)[number][]),

  // Event quality (Q4)
  eventQualityRatings: eventQualityRatingsSchema,

  // Improvement (Q5-7)
  bestPart: z.string().min(1, 'Este campo es requerido'),
  worstPart: z.string().optional(),
  suggestions: z.string().optional(),

  // Sponsors (Q8-11)
  sponsorUnaidedRecall: z.string().min(1, 'Este campo es requerido'),
  sponsorsInteracted: z.array(z.string()).optional(),
  sponsorWorkIntent: z
    .enum([
      'yes',
      'no',
      'already_did',
    ] as const satisfies readonly (typeof sponsorWorkIntents)[number][])
    .optional(),
  sponsorComments: z.string().optional(),

  // Future (Q12-14)
  startupIntent: z.enum([
    'yes',
    'no',
    'already_building',
  ] as const satisfies readonly (typeof startupIntents)[number][]),
  fundingPreference: z
    .enum([
      'bootstrapped',
      'vc',
      'other',
    ] as const satisfies readonly (typeof fundingPreferences)[number][])
    .optional(),
  startupAmbition: z
    .enum([
      'up_to_100k',
      '100k_to_1m',
      '1m_to_10m',
      '10m_plus',
      'not_sure',
    ] as const satisfies readonly (typeof startupAmbitions)[number][])
    .optional(),

  // Extras (Q15-18)
  howHeardAbout: z.string().optional(),
  additionalComments: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  feedbackUsagePermission: z.enum([
    'yes_with_name',
    'yes_anonymous',
    'no',
  ] as const satisfies readonly (typeof feedbackUsagePermissions)[number][]),

  // Mentor feedback (optional, only if team had a mentor)
  mentorRating: z.number().min(1).max(10).optional(),
});

export type FeedbackFormData = z.infer<typeof feedbackFormSchema>;

export const HACK_25_SPONSORS = [
  { id: 'platanus', name: 'Platanus' },
  { id: 'buk', name: 'Buk' },
  { id: 'anthropic', name: 'Anthropic' },
  { id: 'fintoc', name: 'Fintoc' },
  { id: 'agendapro', name: 'AgendaPro' },
  { id: 'maxxa', name: 'Maxxa' },
  { id: 'aws', name: 'AWS' },
  { id: 'buda', name: 'Buda.com' },
  { id: 'runway', name: 'Runway' },
  { id: 'elevenlabs', name: 'ElevenLabs' },
] as const;

export type Hack25Sponsor = (typeof HACK_25_SPONSORS)[number]['id'];

export const EVENT_QUALITY_LABELS: Record<keyof EventQualityRatings, string> = {
  oficina: 'Oficina / Venue',
  wifi: 'WiFi',
  comida: 'Comida',
  software: 'Software (web, bot, etc)',
  comunicacion: 'Comunicación',
  branding: 'Branding / Estética',
  mentores: 'Mentores',
  jueces: 'Jueces',
  sponsors: 'Sponsors',
  nivelTecnico: 'Nivel técnico de los participantes',
  tracks: 'Tracks',
  premios: 'Premios',
  procesoEvaluacion: 'Proceso de evaluación',
  publicVoting: 'Votación pública',
  organizacion: 'Organización general',
};
