import { Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailButton from '../_components/email-button';
import EmailLayout from '../_components/email-layout';

interface OnboardingReminderEmailProps {
  hackerPublicId: string;
  modality: 'solo' | 'team' | 'team_looking';
  deadline: string;
  hoursRemaining: number;
}

export default function OnboardingReminderEmail({
  hackerPublicId,
  modality,
  deadline,
  hoursRemaining,
}: OnboardingReminderEmailProps) {
  const preview = `Platanus Hack 25 - Recordatorio: ${hoursRemaining}h restantes para onboarding`;
  const onboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/hacker/${hackerPublicId}/onboard`;

  const isPlural = modality === 'team';

  const timeText =
    hoursRemaining === 1
      ? '1 hora'
      : hoursRemaining < 24
        ? `${hoursRemaining} horas`
        : `${hoursRemaining / 24} día${hoursRemaining > 24 ? 's' : ''}`;

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>RECORDATORIO - PLATANUS HACK 25</Heading>

        <Text style={text}>Hola,</Text>

        <Text style={text}>
          Este es un recordatorio de que {isPlural ? 'tienen' : 'tienes'} hasta
          el {deadline} (hora de Chile) para completar el proceso de onboarding
          para Platanus Hack 25.
        </Text>

        <Text style={{ ...text, ...boldText }}>
          {isPlural ? 'Quedan' : 'Quedan'} {timeText} para completar el
          onboarding.
        </Text>

        <Text style={text}>
          Si no {isPlural ? 'completan' : 'completas'} el onboarding a tiempo,{' '}
          {isPlural ? 'su' : 'tu'} lugar en el evento será liberado.
        </Text>

        <Section style={buttonContainer}>
          <EmailButton href={onboardUrl}>Completar Onboarding</EmailButton>
        </Section>
      </Section>
    </EmailLayout>
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

const boldText = {
  fontWeight: 'bold' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};
