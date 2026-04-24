import { COUNTRIES } from '@/src/lib/constants';

export function getCountryName(code: string): string {
  const country = COUNTRIES.find((c) => c.code === code);
  return country?.name ?? code;
}

export function getCountryEmoji(code: string): string {
  const country = COUNTRIES.find((c) => c.code === code);
  return country?.emoji ?? '';
}

export function getCountryDisplay(code: string): string {
  const emoji = getCountryEmoji(code);
  const name = getCountryName(code);
  return emoji ? `${emoji} ${name}` : name;
}

/**
 * Country ISO code mapping
 * Maps various country name formats (plain text, with emojis) to two-letter ISO codes
 * Matches the migration logic in 0014_normalize_country_codes.sql
 */
const countryMapping: Record<string, string> = {
  // Plain text countries
  Argentina: 'AR',
  Bolivia: 'BO',
  Brazil: 'BR',
  Brasil: 'BR',
  Canada: 'CA',
  Chile: 'CL',
  Colombia: 'CO',
  Denmark: 'DK',
  Ecuador: 'EC',
  Spain: 'ES',
  España: 'ES',
  France: 'FR',
  Germany: 'DE',
  India: 'IN',
  Mexico: 'MX',
  México: 'MX',
  Netherlands: 'NL',
  Paraguay: 'PY',
  Peru: 'PE',
  Perú: 'PE',
  Portugal: 'PT',
  Turkey: 'TR',
  'United States': 'US',
  Uruguay: 'UY',

  // Countries with emojis
  '🇦🇷 Argentina': 'AR',
  '🇧🇴 Bolivia': 'BO',
  '🇧🇷 Brasil': 'BR',
  '🇨🇦 Canada': 'CA',
  '🇨🇱 Chile': 'CL',
  '🇨🇴 Colombia': 'CO',
  '🇩🇪 Germany': 'DE',
  '🇩🇰 Denmark': 'DK',
  '🇪🇨 Ecuador': 'EC',
  '🇪🇸 España': 'ES',
  '🇫🇷 France': 'FR',
  '🇮🇳 India': 'IN',
  '🇲🇽 México': 'MX',
  '🇳🇱 Netherlands': 'NL',
  '🇵🇪 Perú': 'PE',
  '🇵🇹 Portugal': 'PT',
  '🇵🇾 Paraguay': 'PY',
  '🇹🇷 Turkey': 'TR',
  '🇺🇸 United States': 'US',
  '🇺🇾 Uruguay': 'UY',

  // Unknown/Other
  Unknown: 'OTHER',
  '❓ Other': 'OTHER',
};

/**
 * Normalize country name to ISO two-letter code
 * Matches the migration logic in 0014_normalize_country_codes.sql
 */
export function normalizeCountry(country: string | undefined): string {
  if (!country) return 'OTHER';

  const trimmed = country.trim();

  // Check direct mapping first
  if (countryMapping[trimmed]) {
    return countryMapping[trimmed];
  }

  // If it looks like already a two-letter code, keep it
  if (trimmed.length === 2 && /^[A-Z]{2}$/.test(trimmed)) {
    return trimmed;
  }

  // Default to OTHER for anything we don't recognize
  return 'OTHER';
}
