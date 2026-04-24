import { Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailButton from '../_components/email-button';
import EmailLayout from '../_components/email-layout';

interface FeedbackRequestEmailProps {
  hackerName: string;
  feedbackUrl: string;
}

export default function FeedbackRequestEmail({
  hackerName,
  feedbackUrl,
}: FeedbackRequestEmailProps) {
  const preview = `Qué te pareció Platanus Hack 25? | Gana 50 USD hasta el jueves`;

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>QUÉ TE PARECIÓ LA HACK? | GANA 50 USD 🎁</Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>
          Nos encantaría saber qué te pareció Platanus Hack 25 ft. Buk.
        </Text>

        <Text style={text}>
          Qué tal lo pasaste, qué funcionó bien y qué podría mejorar 👀
        </Text>

        <Text style={{ ...text, ...boldText }}>
          Sortearemos 50 USD entre los hackers que contesten el feedback antes
          del jueves 5 de febrero 2026 23:59, CLT.
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
