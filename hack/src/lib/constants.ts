export const isProductionEnvironment = process.env.NODE_ENV === 'production';
export const isDevelopmentEnvironment =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;

export const SITE_URL = 'https://hack.platan.us';
export const SPONSOR_CONTACT_EMAIL = 'rafael@platan.us';
export const GITHUB_ORG = 'platanus-hack';

export const HACK_24 = {
  slug: '2024',
  name: 'Platanus Hack 24',
  city: 'Santiago',
  country: 'CL',
  startsAt: '2024-11-24',
  endsAt: '2024-11-26',
} as const;

export const HACK_25 = {
  slug: '2025',
  name: 'Platanus Hack 25',
  city: 'Santiago',
  country: 'CL',
  startsAt: '2025-11-21T18:30:00-03:00',
  endsAt: '2025-11-23T15:00:00-03:00',
  repoPrefix: 'platanus-hack-25',
} as const;

export const HACK_26_AR = {
  slug: '26-ar',
  name: 'Platanus Hack 26: Buenos Aires',
  city: 'Buenos Aires',
  country: 'AR',
  startsAt: '2026-05-08T18:00:00-03:00',
  endsAt: '2026-05-10T15:00:00-03:00',
  deadlines: {
    priority: '2026-04-15T23:59:00-03:00',
    regular: '2026-04-27T23:59:00-03:00',
  },
  repoPrefix: 'platanus-hack-26-ar',
} as const;

export const HACK_26_MX = {
  slug: '26-mx',
  name: 'Platanus Hack 26: Ciudad de México',
  city: 'Ciudad de México',
  country: 'MX',
  startsAt: '2026-06-19',
  endsAt: '2026-06-21',
} as const;

export const HACK_26_CO = {
  slug: '26-co',
  name: 'Platanus Hack 26: Bogotá',
  city: 'Bogotá',
  country: 'CO',
  startsAt: '2026-09-11',
  endsAt: '2026-09-13',
} as const;

export const HACK_26_VE = {
  slug: '26-ve',
  name: 'Platanus Hack 26: Caracas',
  city: 'Caracas',
  country: 'VE',
  startsAt: '2026-10-23',
  endsAt: '2026-10-25',
} as const;

export const HACK_26_CL = {
  slug: '26-cl',
  name: 'Platanus Hack 26: Santiago',
  city: 'Santiago',
  country: 'CL',
  startsAt: '2026-11-20',
  endsAt: '2026-11-22',
} as const;

export const TOUR_STOPS = [
  HACK_26_AR,
  HACK_26_MX,
  HACK_26_CO,
  HACK_26_VE,
  HACK_26_CL,
] as const;

export const CURRENT_EVENT = HACK_26_AR;

/**
 * Default arcade cabinet keyboard mapping
 * Maps arcade control codes (e.g., 'P1_U', 'P1_1') to keyboard keys or mouse actions
 *
 * Supported values:
 * - Keyboard keys: 'w', 'a', 's', 'd', 'space', 'Enter', 'ArrowUp', etc.
 * - Mouse actions: 'click' or 'leftclick', 'rightclick', 'middleclick'
 */
export const DEFAULT_ARCADE_MAPPING: Record<string, string> = {
  // Player 1 - Direction
  P1_U: 'w',
  P1_D: 's',
  P1_L: 'a',
  P1_R: 'd',
  // Player 1 - Buttons
  P1_1: 'u',
  P1_2: 'i',
  P1_3: 'o',
  P1_4: 'j',
  P1_5: 'k',
  P1_6: 'l',
  START1: '1',
  // Player 2 - Direction
  P2_U: 'ArrowUp',
  P2_D: 'ArrowDown',
  P2_L: 'ArrowLeft',
  P2_R: 'ArrowRight',
  // Player 2 - Buttons
  P2_1: 'r',
  P2_2: 't',
  P2_3: 'y',
  P2_4: 'f',
  P2_5: 'g',
  P2_6: 'h',
  START2: '2',
};

export const COUNTRIES = [
  // LATAM - Chile first
  { code: 'CL', name: 'Chile', emoji: '🇨🇱' },
  { code: 'AR', name: 'Argentina', emoji: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', emoji: '🇧🇴' },
  { code: 'BR', name: 'Brazil', emoji: '🇧🇷' },
  { code: 'CO', name: 'Colombia', emoji: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', emoji: '🇨🇷' },
  { code: 'CU', name: 'Cuba', emoji: '🇨🇺' },
  { code: 'DO', name: 'Dominican Republic', emoji: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', emoji: '🇪🇨' },
  { code: 'SV', name: 'El Salvador', emoji: '🇸🇻' },
  { code: 'GT', name: 'Guatemala', emoji: '🇬🇹' },
  { code: 'HN', name: 'Honduras', emoji: '🇭🇳' },
  { code: 'MX', name: 'Mexico', emoji: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', emoji: '🇳🇮' },
  { code: 'PA', name: 'Panama', emoji: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', emoji: '🇵🇾' },
  { code: 'PE', name: 'Peru', emoji: '🇵🇪' },
  { code: 'PR', name: 'Puerto Rico', emoji: '🇵🇷' },
  { code: 'UY', name: 'Uruguay', emoji: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', emoji: '🇻🇪' },
  // Other countries
  { code: 'US', name: 'United States', emoji: '🇺🇸' },
  { code: 'CA', name: 'Canada', emoji: '🇨🇦' },
  { code: 'ES', name: 'Spain', emoji: '🇪🇸' },
  { code: 'PT', name: 'Portugal', emoji: '🇵🇹' },
  { code: 'FR', name: 'France', emoji: '🇫🇷' },
  { code: 'DE', name: 'Germany', emoji: '🇩🇪' },
  { code: 'IT', name: 'Italy', emoji: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', emoji: '🇳🇱' },
  { code: 'GB', name: 'United Kingdom', emoji: '🇬🇧' },
  { code: 'TR', name: 'Turkey', emoji: '🇹🇷' },
  { code: 'IN', name: 'India', emoji: '🇮🇳' },
  { code: 'SG', name: 'Singapore', emoji: '🇸🇬' },
  { code: 'CN', name: 'China', emoji: '🇨🇳' },
  { code: 'DK', name: 'Denmark', emoji: '🇩🇰' },
  { code: 'OTHER', name: 'Other', emoji: '🌍' },
] as const;
