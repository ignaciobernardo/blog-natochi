import { Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailButton from '../_components/email-button';
import EmailLayout from '../_components/email-layout';

interface FeedbackReminderEmailProps {
  hackerName: string;
  feedbackUrl: string;
  daysRemaining: number;
}

function getHeadingText(days: number): string {
  if (days <= 0) {
    return 'ÚLTIMO DÍA PARA DAR FEEDBACK 🎁';
  }
  if (days === 1) {
    return 'QUEDA UN DÍA 🎁';
  }
  if (days === 2) {
    return 'QUEDAN DOS DÍAS 🎁';
  }
  return `QUEDAN ${days} DÍAS 🎁`;
}

function getBodyText(days: number): string {
  if (days <= 0) {
    return 'Hoy es el último día (jueves 6 de febrero 2026, 23:59) para contestar el feedback de Platanus Hack 25 ft. Buk.';
  }
  if (days === 1) {
    return 'Queda un día (hasta jueves 6 de febrero 2026, 23:59) para contestar el feedback de Platanus Hack 25 ft. Buk.';
  }
  if (days === 2) {
    return 'Quedan dos días (hasta jueves 6 de febrero 2026, 23:59) para contestar el feedback de Platanus Hack 25 ft. Buk.';
  }
  return `Quedan ${days} días (hasta jueves 6 de febrero 2026, 23:59) para contestar el feedback de Platanus Hack 25 ft. Buk.`;
}

function getPreviewText(days: number): string {
  if (days <= 0) {
    return 'Último día para dar feedback y ganar hasta 50 USD';
  }
  if (days === 1) {
    return 'Queda un día para dar feedback y ganar hasta 50 USD';
  }
  if (days === 2) {
    return 'Quedan dos días para dar feedback y ganar hasta 50 USD';
  }
  return `Quedan ${days} días para dar feedback y ganar hasta 50 USD`;
}

export default function FeedbackReminderEmail({
  hackerName,
  feedbackUrl,
  daysRemaining,
}: FeedbackReminderEmailProps) {
  return (
    <EmailLayout preview={getPreviewText(daysRemaining)}>
      <Section>
        <Heading style={h1}>{getHeadingText(daysRemaining)}</Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>{getBodyText(daysRemaining)}</Text>

        <Text style={{ ...text, ...boldText }}>
          Entre los hackers que contesten antes de ese deadline, sortearemos 50
          USD 💵
        </Text>

        <Section style={buttonContainer}>
          <EmailButton href={feedbackUrl}>CONTESTAR FEEDBACK</EmailButton>
        </Section>

        <Text style={text}>Esperamos tu opinión!</Text>
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
  margin: '24px 0',
};
