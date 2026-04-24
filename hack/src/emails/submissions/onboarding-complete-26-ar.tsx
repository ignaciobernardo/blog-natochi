import { Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';
import EmailButton from '../_components/email-button';
import EmailLayout26Ar from '../_components/email-layout-26-ar';

interface OnboardingCompleteEmailProps {
  hackerName: string;
  hackerGender: 'male' | 'female' | null;
}

export default function OnboardingCompleteEmail({
  hackerName,
  hackerGender,
}: OnboardingCompleteEmailProps) {
  const preview = `Todo listo para Platanus Hack 26: Buenos Aires`;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/hacker`;

  const readyText = hackerGender === 'female' ? 'lista' : 'listo';

  return (
    <EmailLayout26Ar preview={preview}>
      <Section>
        <Heading style={h1}>¡TODO LISTO! 🎉</Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>
          ¡Estás {readyText} para Platanus Hack 26: Buenos Aires 🎉!
        </Text>

        <Text style={text}>
          Te esperamos en Buenos Aires. Enviaremos por correo la fecha, hora y
          ubicación exacta del check-in.
        </Text>

        <Text style={{ ...text, ...addressText }}>Buenos Aires, Argentina</Text>

        <Text style={text}>
          Toda la información relevante previa al evento será enviada por email
          y a través del Discord.
        </Text>

        <Text style={text}>
          Por ahora puedes familiarizarte con tu{' '}
          <strong>Hacker Dashboard</strong>, que tendrá toda la información del
          evento.
        </Text>

        <Hr style={hr} />

        <Section style={buttonContainer}>
          <EmailButton href={dashboardUrl}>Ir a Hacker Dashboard</EmailButton>
        </Section>

        <Text style={smallText}>
          📅 Te compartiremos el calendario del evento cuando la agenda esté
          cerrada.
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

const addressText = {
  padding: '12px 16px',
  backgroundColor: 'rgba(224, 255, 0, 0.1)',
  border: '1px solid rgba(224, 255, 0, 0.3)',
  borderRadius: '4px',
  fontWeight: 'bold' as const,
};

const hr = {
  borderColor: '#ffffff',
  borderWidth: '1px',
  borderStyle: 'solid' as const,
  margin: '20px 0',
  opacity: 0.2,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const smallText = {
  ...text,
  fontSize: '12px',
  opacity: 0.7,
  textAlign: 'center' as const,
  margin: '20px 0 0 0',
};
