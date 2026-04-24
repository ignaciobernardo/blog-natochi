-- Custom SQL migration file, put you code below! --

-- Normalize country values in teams table to two-letter ISO codes
UPDATE teams
SET country = CASE
  -- Plain text countries
  WHEN country = 'Argentina' THEN 'AR'
  WHEN country = 'Bolivia' THEN 'BO'
  WHEN country = 'Chile' THEN 'CL'
  WHEN country = 'Colombia' THEN 'CO'
  WHEN country = 'Denmark' THEN 'DK'
  WHEN country = 'Ecuador' THEN 'EC'
  WHEN country = 'España' THEN 'ES'
  WHEN country = 'France' THEN 'FR'
  WHEN country = 'México' THEN 'MX'
  WHEN country = 'Perú' THEN 'PE'
  WHEN country = 'United States' THEN 'US'
  WHEN country = 'Uruguay' THEN 'UY'

  -- Countries with emojis
  WHEN country = '🇦🇷 Argentina' THEN 'AR'
  WHEN country = '🇧🇴 Bolivia' THEN 'BO'
  WHEN country = '🇧🇷 Brasil' THEN 'BR'
  WHEN country = '🇨🇱 Chile' THEN 'CL'
  WHEN country = '🇨🇴 Colombia' THEN 'CO'
  WHEN country = '🇪🇨 Ecuador' THEN 'EC'
  WHEN country = '🇮🇳 India' THEN 'IN'
  WHEN country = '🇲🇽 México' THEN 'MX'
  WHEN country = '🇵🇪 Perú' THEN 'PE'
  WHEN country = '🇵🇹 Portugal' THEN 'PT'

  -- Unknown/Other
  WHEN country = 'Unknown' THEN 'OTHER'
  WHEN country = '❓ Other' THEN 'OTHER'

  -- Default: keep as is if already a two-letter code
  ELSE country
END
WHERE country IN (
  'Argentina', 'Bolivia', 'Chile', 'Colombia', 'Denmark', 'Ecuador',
  'España', 'France', 'México', 'Perú', 'United States', 'Uruguay',
  '🇦🇷 Argentina', '🇧🇴 Bolivia', '🇧🇷 Brasil', '🇨🇱 Chile',
  '🇨🇴 Colombia', '🇪🇨 Ecuador', '🇮🇳 India', '🇲🇽 México',
  '🇵🇪 Perú', '🇵🇹 Portugal', 'Unknown', '❓ Other'
);