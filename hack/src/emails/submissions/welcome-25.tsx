import { Heading, Img, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface WelcomeEmailProps {
  hackerName: string;
}

export default function WelcomeEmail({ hackerName }: WelcomeEmailProps) {
  const preview = `¡Bienvenid@ a Platanus Hack 25 ft. Buk! 🍌💻`;

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>BIENVENID@ A PLATANUS HACK 25 FT. BUK 🍌💻</Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>
          Bienvenid@ Oficialmente a Platanus Hack 25 ft. Buk 🍌💻
        </Text>

        <Text style={text}>
          Llevamos meses trabajando para que esta segunda edición sea difícil de
          olvidar.
        </Text>

        <Text style={text}>
          Estaremos esperándote mañana a las 18:30 en Roger de Flor 2725, Torre
          3, piso 3 Oficinas de buk, Las Condes 🇨🇱.
        </Text>

        <Text style={text}>Así se verá la entrada.</Text>

        <Section style={imageContainer}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/assets/images/misc/entrada-mut.jpg`}
            alt="Entrada Oficinas BUK"
            style={entranceImage}
          />
        </Section>

        <Text style={{ ...text, ...boldText }}>
          Las puertas cierran a las 20:00.
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
          . Ya puedes aplicar a créditos de Runway ahí (plazo hasta mañana).
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

const link = {
  color: '#e0ff00',
  textDecoration: 'underline' as const,
};

const imageContainer = {
  margin: '20px 0',
};

const entranceImage = {
  width: '100%',
  maxWidth: '550px',
  height: 'auto',
  display: 'block' as const,
  borderRadius: '4px',
};
