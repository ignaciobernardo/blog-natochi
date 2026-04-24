import { Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';
import EmailButton from '../_components/email-button';
import EmailLayout from '../_components/email-layout';

interface AskingSelfFinanceTripEmailProps {
  hackerName: string;
  hackerGithub: string;
  hackerPublicId: string;
  isTeam: boolean;
  modality: 'solo' | 'team' | 'team_looking';
  teamMembers?: Array<{ fullName: string; github: string | null }>;
  deadline: string;
}

function extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export default function AskingSelfFinanceTripEmail({
  hackerName,
  hackerGithub,
  hackerPublicId,
  isTeam,
  modality,
  teamMembers = [],
  deadline,
}: AskingSelfFinanceTripEmailProps) {
  const _githubUsername = extractGithubUsername(hackerGithub);
  const preview = `Platanus Hack 25 - Confirmación de viaje`;
  const responseUrl = `${process.env.NEXT_PUBLIC_APP_URL}/hacker/${hackerPublicId}/self-finance-flight`;

  const hasMultipleMembers = isTeam && teamMembers.length > 1;
  const teamMembersText = hasMultipleMembers ? ' y equipo' : '';

  // Use plural only for 'team' modality, singular for 'solo' and 'team_looking'
  const isPlural = modality === 'team';

  const teamGithubUsernames = teamMembers
    .map((m) => extractGithubUsername(m.github))
    .filter(Boolean);

  const _teamGithubUsers =
    teamGithubUsernames.length > 1
      ? `${teamGithubUsernames.slice(0, -1).join(', ')} y ${teamGithubUsernames[teamGithubUsernames.length - 1]}`
      : teamGithubUsernames[0] || '';

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>CONFIRMACIÓN DE VIAJE - PLATANUS HACK 25</Heading>

        <Text style={text}>
          Hola {hackerName.trim()}
          {teamMembersText},
        </Text>

        <Text style={text}>
          Tu postulación ha destacado y nos encantaría que participaras en
          Platanus Hack 25, este 21 a 23 de noviembre.
        </Text>

        <Text style={{ ...text, ...boldText }}>
          Sin embargo, debido a los cupos limitados, no podemos{' '}
          {isPlural ? 'ofrecerles' : 'ofrecerte'} pagar
          {isPlural ? ' los pasajes' : ' el pasaje'} a Chile.
        </Text>

        <Text style={text}>
          Si {isPlural ? 'pueden' : 'puedes'} pagar el pasaje por{' '}
          {isPlural ? 'sus' : 'tus'} medios, felices de{' '}
          {isPlural ? 'aceptarlos' : 'aceptarte'} en Platanus Hack 25 🎉
        </Text>

        <Hr style={hr} />

        <Text style={{ ...text, ...boldText }}>
          Tienes hasta el {deadline} (hora de Chile) para responder.
        </Text>

        <Section style={buttonContainer}>
          <EmailButton href={responseUrl}>Responder Ahora</EmailButton>
        </Section>
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
