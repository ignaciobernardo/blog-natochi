import { Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface ConfirmationSubmissionEmailProps {
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

export default function ConfirmationSubmissionEmail25({
  hackerName,
  hackerGithub,
  isTeam,
  teamMembers = [],
}: ConfirmationSubmissionEmailProps) {
  const githubUsername = extractGithubUsername(hackerGithub);
  const preview = `Recibimos tu postulación a Platanus Hack 25, ${githubUsername}`;

  const hasMultipleMembers = isTeam && teamMembers.length > 1;
  const teamMembersText = hasMultipleMembers ? ' y equipo' : '';

  const teamGithubUsernames = teamMembers
    .map((m) => extractGithubUsername(m.github))
    .filter(Boolean);

  const teamGithubUsers =
    teamGithubUsernames.length > 1
      ? `${teamGithubUsernames.slice(0, -1).join(', ')} y ${teamGithubUsernames[teamGithubUsernames.length - 1]}`
      : teamGithubUsernames[0] || '';

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>POSTULACIÓN RECIBIDA</Heading>

        <Text style={text}>
          Hola {hackerName.trim()}
          {teamMembersText},
        </Text>

        <Text style={text}>
          <strong>Recibimos tu postulación a Platanus Hack 25.</strong>
        </Text>

        <Text style={text}>
          Recibirán una respuesta a más tardar el 14 de noviembre a las 23:59
          CLT.
        </Text>

        <Hr style={hr} />

        <Text style={text}>
          Gracias por postular {teamGithubUsers || githubUsername}
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

const hr = {
  borderColor: '#ffffff',
  borderWidth: '1px',
  borderStyle: 'solid' as const,
  margin: '20px 0',
  opacity: 0.2,
};
