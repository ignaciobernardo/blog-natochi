import { Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout26Ar from '../_components/email-layout-26-ar';

interface OnboardingExpiredEmailProps {
  modality: 'solo' | 'team' | 'team_looking';
}

export default function OnboardingExpiredEmail({
  modality,
}: OnboardingExpiredEmailProps) {
  const preview = `Platanus Hack 26: Buenos Aires - Onboarding expirado`;

  const isPlural = modality === 'team';

  return (
    <EmailLayout26Ar preview={preview}>
      <Section>
        <Heading style={h1}>
          ONBOARDING EXPIRADO - PLATANUS HACK 26: BUENOS AIRES
        </Heading>

        <Text style={text}>Hola,</Text>

        <Text style={text}>
          Lamentablemente, el plazo para completar el onboarding de Platanus
          Hack 26: Buenos Aires ha vencido.
        </Text>

        <Text style={text}>
          Como {isPlural ? 'no completaron' : 'no completaste'} el proceso a
          tiempo, {isPlural ? 'su' : 'tu'} lugar en el evento ha sido liberado
          para otros participantes.
        </Text>

        <Text style={text}>
          Esperamos {isPlural ? 'verlos' : 'verte'} en futuras ediciones de
          Platanus Hack.
        </Text>
      </Section>
    </EmailLayout26Ar>
  );
}

const h1 = {
  color: '#000000',
  fontSize: '22px',
  fontWeight: 'bold' as const,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  margin: '0 0 20px 0',
  padding: '12px 16px',
  backgroundColor: '#e0ff00',
  border: '1px solid #000000',
};

const text = {
  color: '#ffffff',
  fontSize: '14px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontWeight: 'normal' as const,
  lineHeight: '22px',
  margin: '12px 0',
};
