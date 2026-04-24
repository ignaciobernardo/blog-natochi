import { Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';
import EmailButton from '../_components/email-button';
import EmailLayout from '../_components/email-layout';

interface ApprovedSubmissionEmailProps {
  hackerName: string;
  hackerGithub: string;
  hackerPublicId: string;
  isTeam: boolean;
  teamMembers?: Array<{ fullName: string; github: string | null }>;
  hasSelfFinanceCommitment?: boolean;
}

function extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export default function ApprovedSubmissionEmail({
  hackerName,
  hackerGithub,
  hackerPublicId,
  isTeam,
  teamMembers = [],
  hasSelfFinanceCommitment = false,
}: ApprovedSubmissionEmailProps) {
  const githubUsername = extractGithubUsername(hackerGithub);
  const preview = `Bienvenid@ a Platanus Hack 25, ${githubUsername}`;
  const graphicsUrl = `${process.env.NEXT_PUBLIC_APP_URL}/hacker/${hackerPublicId}/status`;

  const hasMultipleMembers = isTeam && teamMembers.length > 1;
  const teamMembersText = hasMultipleMembers ? ' y equipo' : '';
  const profileText = hasMultipleMembers
    ? 'tu perfil y los de tu equipo destacaron sobre el resto'
    : 'tu perfil destacó sobre el resto';

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
        <Heading style={h1}>BIENVENID@ A PLATANUS HACK 25</Heading>

        <Text style={text}>
          Hola {hackerName.trim()}
          {teamMembersText},
        </Text>

        <Text style={text}>
          Han postulado muchos hackers y <strong>{profileText}</strong>.
        </Text>

        <Text style={{ ...text, ...boldText }}>
          Nos encantaría que fueras parte de Platanus Hack 25, este 21 a 23 de
          noviembre 🎉
        </Text>

        <Text style={text}>
          En unos días recibirás más información para confirmar tu asistencia y
          para completar algunos detalles extra.
        </Text>

        {hasSelfFinanceCommitment && (
          <>
            <Hr style={hr} />

            <Section
              style={{
                backgroundColor: '#e0ff00',
                border: '2px solid #000000',
                padding: '16px',
                margin: '20px 0',
              }}
            >
              <Text
                style={{
                  ...text,
                  color: '#000000',
                  fontWeight: 'bold' as const,
                  margin: '0',
                }}
              >
                ⚠️ IMPORTANTE: Recuerden que se comprometieron a pagar sus
                pasajes a Chile. Háganlo cuanto antes para evitar precios altos.
              </Text>
            </Section>
          </>
        )}

        <Hr style={hr} />

        <Text style={text}>
          Si quieres publicar en redes que fuiste seleccionad@, puedes ver
          gráficas personalizadas acá:
        </Text>

        <Section style={buttonContainer}>
          <EmailButton href={graphicsUrl}>
            Ver gráficas personalizadas
          </EmailButton>
        </Section>

        <Hr style={hr} />

        <Text style={text}>
          Felicitaciones nuevamente {teamGithubUsers || githubUsername}
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
