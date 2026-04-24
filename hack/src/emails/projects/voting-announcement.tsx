import { Button, Heading, Img, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface VotingAnnouncementEmailProps {
  hackerName: string;
  projectName: string;
  projectSlug: string;
  projectImageUrl: string;
  baseUrl: string;
}

export default function VotingAnnouncementEmail({
  hackerName,
  projectName,
  projectSlug,
  projectImageUrl,
  baseUrl,
}: VotingAnnouncementEmailProps) {
  const preview = `Votación pública inicia el lunes | ${projectName}`;

  // Ensure baseUrl is always absolute
  const absoluteBaseUrl = baseUrl?.startsWith('http')
    ? baseUrl
    : `https://${baseUrl || 'hack.platan.us'}`;

  const projectVoteUrl = `${absoluteBaseUrl}/25/vote/${projectSlug}`;
  const allProjectsUrl = `${absoluteBaseUrl}/25/vote`;

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>
          VOTACIÓN PÚBLICA INICIA EL LUNES | {projectName.toUpperCase()}
        </Heading>

        <Text style={text}>Hola {hackerName.trim()} 🎅</Text>

        <Text style={text}>
          Luego de un gran trabajo editando los videos e intentando lograr la
          mejor calidad con el contenido que obtuvimos, tenemos listo tu
          proyecto para la votación pública 🎉
        </Text>

        <Text style={{ ...text, ...boldText, margin: '20px 0 12px 0' }}>
          Algunos detalles del concurso de votación pública:
        </Text>

        <Section style={listContainer}>
          <Text style={listItem}>
            • La plataforma permitirá votos entre el{' '}
            <span style={boldText}>Lunes 29 de diciembre 2025 00:00 CLT</span>{' '}
            hasta el{' '}
            <span style={boldText}>martes 06 de enero de 2026 23:59 CLT</span>.
          </Text>
          <Text style={listItem}>
            • Cada votante inciará sesión con Google, y puede votar por un
            máximo de <span style={boldText}>7 proyectos</span>.
          </Text>
          <Text style={listItem}>
            • Puedes actualizar el logo (
            <span style={code}>project-logo.png</span>), descripción corta (
            <span style={code}>project-description-spanish</span>) y descripción
            en markdown (<span style={code}>project-description.md</span>)
            actualizando tu repo en github. La página se actualizará
            automáticamente.
          </Text>
          <Text style={listItem}>
            • El equipo con más votos al finalizar el periodo, se llevará{' '}
            <span style={boldText}>700 USD en BTC</span> a repartir.
          </Text>
        </Section>

        <Text style={{ ...text, ...boldText, margin: '24px 0 16px 0' }}>
          Puedes ver tu proyecto aquí:
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
          <Button href={allProjectsUrl} style={button}>
            VER TODOS LOS PROYECTOS
          </Button>
        </Section>

        <Text style={{ ...text, ...boldText, margin: '32px 0 0 0' }}>
          Mucha suerte 💪
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

const listContainer = {
  margin: '0 0 20px 0',
  paddingLeft: '16px',
};

const listItem = {
  color: '#ffffff',
  fontSize: '14px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontWeight: 'normal' as const,
  lineHeight: '22px',
  margin: '8px 0',
};

const code = {
  backgroundColor: 'rgba(224, 255, 0, 0.15)',
  color: '#e0ff00',
  padding: '2px 6px',
  borderRadius: '3px',
  fontSize: '13px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
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
