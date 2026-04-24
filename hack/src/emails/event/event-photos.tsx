import { Heading, Img, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface EventPhotosEmailProps {
  hackerName: string;
}

export default function EventPhotosEmail({
  hackerName,
}: EventPhotosEmailProps) {
  const preview = `Fotos Oficiales Platanus Hack 25 ft. Buk 🍌📸🔥`;

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>
          FOTOS OFICIALES PLATANUS HACK 25 FT. BUK 🍌📸🔥
        </Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>
          Las fotos oficiales ya están aquí. Nos encantaron!
        </Text>

        <Section style={imageContainer}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/assets/images/misc/portada-email.webp`}
            alt="Fotos Platanus Hack 25"
            style={photoImage}
          />
        </Section>

        <Text style={text}>
          Puedes verlas en{' '}
          <a href="https://25.hack.platan.us/pics" style={link}>
            https://25.hack.platan.us/pics
          </a>
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

const link = {
  color: '#e0ff00',
  textDecoration: 'underline' as const,
};

const imageContainer = {
  margin: '20px 0',
};

const photoImage = {
  width: '100%',
  maxWidth: '550px',
  height: 'auto',
  display: 'block' as const,
  borderRadius: '4px',
};
