import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface RejectedSubmissionEmailProps {
  hackerName: string;
  hackerGithub: string;
  teamMembers?: Array<{ fullName: string; github: string | null }>;
  hackerGender?: string | null;
  waitingListUrl?: string;
}

function extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export default function RejectedSubmissionEmail({
  hackerName,
  hackerGithub,
  teamMembers = [],
  hackerGender,
  waitingListUrl,
}: RejectedSubmissionEmailProps) {
  const githubUsername = extractGithubUsername(hackerGithub);
  const preview = `Postulación a Platanus Hack 25, ${githubUsername}`;

  // Determine if it's a team application (multiple members)
  const isTeam = teamMembers.length > 1;
  const teamMembersText = isTeam ? ' y equipo' : '';
  const pluralForm = isTeam ? 'ustedes' : 'tú';
  const isFemale = hackerGender === 'female';
  const quedaron = isTeam
    ? 'quedaron seleccionados'
    : isFemale
      ? 'quedaste seleccionada'
      : 'quedaste seleccionado';
  const habrían = isTeam ? 'habrían' : 'habrías';
  const quedan = isTeam ? 'quedan' : 'quedas';
  const les = isTeam ? 'Les' : 'Te';
  const invitadísimos = isTeam
    ? 'invitadísimos'
    : isFemale
      ? 'invitadísima'
      : 'invitadísimo';
  const verlos = isTeam ? 'verlos' : isFemale ? 'verte' : 'verte';
  const pueden = isTeam ? 'pueden' : 'puedes';
  const agregarse = isTeam ? 'agregarse' : 'agregarte';

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
        <Heading style={h1}>POSTULACIÓN A PLATANUS HACK 25</Heading>

        <Text style={text}>
          Hola {hackerName.trim()}
          {teamMembersText},
        </Text>

        <Text style={text}>
          {les} escribimos porque lamentablemente no {quedaron} como{' '}
          {isTeam ? 'equipo' : 'participante'} para la Platanus Hack.
        </Text>

        <Text style={text}>
          No fue una decisión fácil, recibimos muchísimas postulaciones y el
          nivel está muy bueno.
        </Text>

        <Text style={text}>
          Estamos seguros de que {habrían} construido algo increíble este fin de
          semana, pero lamentablemente tenemos un límite de participantes.
        </Text>

        <Hr style={hr} />

        <Text style={text}>
          Existe la posibilidad que{' '}
          {isTeam ? 'equipos seleccionados' : 'hackers seleccionados'} cancelen
          su asistencia al evento a último minuto. Si esto pasa, seleccionaremos{' '}
          {isTeam ? 'equipos' : 'hackers'} de la lista de espera.
        </Text>

        <Text style={text}>
          {pueden.charAt(0).toUpperCase() + pueden.slice(1)} {agregarse} a la
          lista de espera a continuación:
        </Text>

        {waitingListUrl && (
          <div style={buttonContainer}>
            <Button href={waitingListUrl} style={button}>
              UNIRSE A LA LISTA DE ESPERA
            </Button>
          </div>
        )}

        <Hr style={hr} />

        <Text style={text}>
          Más eventos para gente técnica como {pluralForm} se vienen en el
          futuro. Desde ya, {quedan} {invitadísimos}.
        </Text>

        <Text style={text}>
          Muchas gracias por postular al evento, esperamos {verlos} en el futuro
          en más eventos Platanus.
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

const buttonContainer = {
  margin: '24px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#e0ff00',
  color: '#000000',
  padding: '14px 24px',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block' as const,
  border: '1px solid #000000',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
};
