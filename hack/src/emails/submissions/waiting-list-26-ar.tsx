import { Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout26Ar from '../_components/email-layout-26-ar';

interface WaitingListEmailProps {
  hackerName: string;
  hackerGithub: string;
  teamMembers?: Array<{ fullName: string; github: string | null }>;
  hackerGender?: string | null;
}

function extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export default function WaitingListEmail({
  hackerName,
  hackerGithub,
  teamMembers = [],
  hackerGender,
}: WaitingListEmailProps) {
  const githubUsername = extractGithubUsername(hackerGithub);
  const preview = `Lista de Espera - Platanus Hack 26: Buenos Aires, ${githubUsername}`;

  const isTeam = teamMembers.length > 1;
  const teamMembersText = isTeam ? ' y equipo' : '';
  const isFemale = hackerGender === 'female';

  const agregado = isTeam
    ? 'han sido agregados'
    : isFemale
      ? 'has sido agregada'
      : 'has sido agregado';

  const les = isTeam ? 'Les' : 'Te';
  const contactaremos = isTeam ? 'contactaremos' : 'contactaremos';

  const teamGithubUsernames = teamMembers
    .map((m) => extractGithubUsername(m.github))
    .filter(Boolean);

  const teamGithubUsers =
    teamGithubUsernames.length > 1
      ? `${teamGithubUsernames.slice(0, -1).join(', ')} y ${teamGithubUsernames[teamGithubUsernames.length - 1]}`
      : teamGithubUsernames[0] || '';

  return (
    <EmailLayout26Ar preview={preview}>
      <Section>
        <Heading style={h1}>
          LISTA DE ESPERA - PLATANUS HACK 26: BUENOS AIRES
        </Heading>

        <Text style={text}>
          Hola {hackerName.trim()}
          {teamMembersText},
        </Text>

        <Text style={text}>
          {agregado.charAt(0).toUpperCase() + agregado.slice(1)} a la lista de
          espera para Platanus Hack 26: Buenos Aires.
        </Text>

        <Hr style={hr} />

        <Text style={text}>
          Si algún {isTeam ? 'equipo seleccionado' : 'hacker seleccionado'}{' '}
          cancela su asistencia, {les.toLowerCase()} {contactaremos}{' '}
          inmediatamente por correo electrónico.
        </Text>

        <Text style={text}>
          {les} pediremos confirmar su disponibilidad para asistir el fin de
          semana completo del evento.
        </Text>

        <Hr style={hr} />

        <Text style={text}>
          Gracias por su interés en Platanus Hack 26: Buenos Aires,{' '}
          {teamGithubUsers || githubUsername}
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

const hr = {
  borderColor: '#ffffff',
  borderWidth: '1px',
  borderStyle: 'solid' as const,
  margin: '20px 0',
  opacity: 0.2,
};
