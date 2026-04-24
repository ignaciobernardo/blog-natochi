import { Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout26Ar from '../_components/email-layout-26-ar';

interface WelcomeEmailProps {
  hackerName: string;
}

export default function WelcomeEmail({ hackerName }: WelcomeEmailProps) {
  const preview = `¡Bienvenid@ a Platanus Hack 26: Buenos Aires! 🍌💻`;

  return (
    <EmailLayout26Ar preview={preview}>
      <Section>
        <Heading style={h1}>
          BIENVENID@ A PLATANUS HACK 26: BUENOS AIRES 🍌💻
        </Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>
          Bienvenid@ Oficialmente a Platanus Hack 26: Buenos Aires 🍌💻
        </Text>

        <Text style={text}>
          Llevamos meses trabajando para que esta segunda edición sea difícil de
          olvidar.
        </Text>

        <Text style={text}>
          Estaremos compartiendo por correo y por Discord el horario final y la
          ubicación exacta del check-in en Buenos Aires.
        </Text>

        <Text style={text}>
          📅 El cronograma del evento ya está disponible:{' '}
          <a href="https://hack.platan.us/schedule" style={link}>
            https://hack.platan.us/schedule
          </a>
        </Text>

        <Text style={text}>
          📊 Ve familiarizándote desde ya con tu hacker dashboard:{' '}
          <a href="https://hack.platan.us/hacker" style={link}>
            https://hack.platan.us/hacker
          </a>
          .
        </Text>

        <Text style={text}>
          Qué llevar, cómo funciona el alojar, comidas y más lo puedes ver en{' '}
          <a
            href="https://discord.com/channels/1439366811979223345/1439370735658471566"
            style={link}
          >
            FAQ
          </a>
          .
        </Text>

        <Text style={text}>
          Estamos muy emocionados de pasar el fin de semana contigo.
        </Text>

        <Text style={{ ...text, ...boldText }}>
          Te pedimos puntualidad y ganas de pasar de largo hackeando 🙏
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

const boldText = {
  fontWeight: 'bold' as const,
};

const link = {
  color: '#e0ff00',
  textDecoration: 'underline' as const,
};
