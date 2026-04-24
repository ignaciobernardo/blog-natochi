import { Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailButton from '../_components/email-button';
import EmailLayout from '../_components/email-layout';

interface SelfFinanceReminderEmailProps {
  hackerPublicId: string;
  modality: 'solo' | 'team' | 'team_looking';
  deadline: string;
}

export default function SelfFinanceReminderEmail({
  hackerPublicId,
  modality,
  deadline,
}: SelfFinanceReminderEmailProps) {
  const preview = `Platanus Hack 25 - Recordatorio: 24 horas restantes`;
  const responseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/hacker/${hackerPublicId}/self-finance-flight`;

  // Use plural only for 'team' modality, singular for 'solo' and 'team_looking'
  const isPlural = modality === 'team';

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>RECORDATORIO - PLATANUS HACK 25</Heading>

        <Text style={text}>Hola,</Text>

        <Text style={text}>
          Este es un recordatorio de que {isPlural ? 'tienen' : 'tienes'} hasta
          el {deadline} (hora de Chile) para responder sobre el financiamiento
          del viaje a Platanus Hack.
        </Text>

        <Text style={{ ...text, ...boldText }}>
          {isPlural ? 'Quedan' : 'Quedan'} menos de 24 horas para responder.
        </Text>

        <Section style={buttonContainer}>
          <EmailButton href={responseUrl}>Responder Ahora</EmailButton>
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
