import { Button, Heading, Img, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface VotingStartedEmailProps {
  hackerName: string;
  projectName: string;
  projectSlug: string;
  projectImageUrl: string;
  baseUrl: string;
}

export default function VotingStartedEmail({
  hackerName,
  projectName,
  projectSlug,
  projectImageUrl,
  baseUrl,
}: VotingStartedEmailProps) {
  const preview = `La votación pública ya empezó | ${projectName}`;

  // Ensure baseUrl is always absolute
  const absoluteBaseUrl = baseUrl?.startsWith('http')
    ? baseUrl
    : `https://${baseUrl || 'hack.platan.us'}`;

  const projectVoteUrl = `${absoluteBaseUrl}/25/vote/${projectSlug}`;
  const allProjectsUrl = `${absoluteBaseUrl}/25/vote`;

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>LA VOTACIÓN PÚBLICA YA EMPEZÓ 🚀</Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>
          Ya se abrió la votación pública. Puedes ver todos los proyectos en{' '}
          <a href={allProjectsUrl} style={link}>
            {allProjectsUrl}
          </a>
          .
        </Text>

        <Text style={text}>
          Recuerda que se aceptarán votos hasta el{' '}
          <span style={boldText}>martes 6 de enero a las 23:59 CLT</span>. El
          equipo con más votos ganará{' '}
          <span style={boldText}>700 USD en BTC</span>.
        </Text>

        <Text style={{ ...text, ...boldText, margin: '24px 0 16px 0' }}>
          Acá puedes ver tu proyecto:
        </Text>

        <Section style={imageContainer}>
          <a href={projectVoteUrl} style={link}>
            <Img src={projectImageUrl} alt={projectName} style={projectImage} />
          </a>
        </Section>

        <Section style={linkContainer}>
          <a href={projectVoteUrl} style={{ ...link, ...boldText }}>
            {projectVoteUrl}
          </a>
        </Section>

        <Section style={buttonContainer}>
          <Button href={projectVoteUrl} style={button}>
            VER TU PROYECTO
          </Button>
        </Section>

        <Text style={{ ...text, ...boldText, margin: '32px 0 0 0' }}>
          Es el momento para compartir el link de tu proyecto en redes sociales!
          📱
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
  textAlign: 'center' as const,
};

const projectImage = {
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
  display: 'block' as const,
  margin: '0 auto',
  borderRadius: '4px',
  border: '2px solid #e0ff00',
};

const linkContainer = {
  margin: '16px 0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  margin: '32px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#e0ff00',
  color: '#000000',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block' as const,
  padding: '12px 24px',
  border: '2px solid #000000',
  borderRadius: '4px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};
