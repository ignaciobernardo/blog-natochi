import { Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout26Ar from '../_components/email-layout-26-ar';

interface PriorityWaitingEmailProps {
  hackerName: string;
  hackerGithub: string;
  isTeam: boolean;
  teamMembers?: Array<{ fullName: string; github: string | null }>;
}

function extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export default function PriorityWaitingEmail({
  hackerName,
  hackerGithub,
  isTeam,
  teamMembers = [],
}: PriorityWaitingEmailProps) {
  const githubUsername = extractGithubUsername(hackerGithub);
  const preview = `Platanus Hack 26: Buenos Aires - Estado de postulación, ${githubUsername}`;

  const hasMultipleMembers = isTeam && teamMembers.length > 1;
  const teamMembersText = hasMultipleMembers ? ' y equipo' : '';

  // Plural forms for team
  const postulacion = hasMultipleMembers
    ? 'postulación es una'
    : 'postulación es una';
  const recibiras = hasMultipleMembers ? 'Recibirán' : 'Recibirás';

  return (
    <EmailLayout26Ar preview={preview}>
      <Section>
        <Heading style={h1}>ESTADO DE POSTULACIÓN</Heading>

        <Text style={text}>
          Hola {hackerName.trim()}
          {teamMembersText},
        </Text>

        <Text style={text}>
          Hemos recibido muy buenas postulaciones prioritarias y hay bastantes
          de muy buen nivel que queremos seleccionar con detención.
        </Text>

        <Text style={text}>
          Tu {postulacion} de esas, por lo que nos tomaremos unos días.
        </Text>

        <Text style={{ ...text, ...boldText }}>
          {recibiras} una respuesta definitiva en los próximos días.
        </Text>

        <Hr style={hr} />

        <Text style={text}>
          Muchas gracias por postular al evento, esperamos tener buenas noticias
          pronto.
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

const hr = {
  borderColor: '#ffffff',
  borderWidth: '1px',
  borderStyle: 'solid' as const,
  margin: '20px 0',
  opacity: 0.2,
};
