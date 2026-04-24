import { Heading, Hr, Section, Text } from '@react-email/components';
import React from 'react';
import EmailButton from '../_components/email-button';
import EmailLayout26Ar from '../_components/email-layout-26-ar';

interface OnboardingRequestEmailProps {
  hackerName: string;
  hackerPublicId: string;
  isTeam: boolean;
  modality: 'solo' | 'team' | 'team_looking';
  teamMembers?: Array<{ fullName: string; github: string | null }>;
  deadline: string;
}

export default function OnboardingRequestEmail({
  hackerName,
  hackerPublicId,
  isTeam,
  modality,
  teamMembers = [],
  deadline,
}: OnboardingRequestEmailProps) {
  const preview = `Platanus Hack 26: Buenos Aires - Completa tu onboarding`;
  const onboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/hacker/${hackerPublicId}/onboard`;

  const hasMultipleMembers = isTeam && teamMembers.length > 1;
  const teamMembersText = hasMultipleMembers ? ' y equipo' : '';

  const isPlural = modality === 'team';

  return (
    <EmailLayout26Ar preview={preview}>
      <Section>
        <Heading style={h1}>
          ONBOARDING - PLATANUS HACK 26: BUENOS AIRES
        </Heading>

        <Text style={text}>
          Hola {hackerName.trim()}
          {teamMembersText},
        </Text>

        <Text style={text}>
          Se acerca Platanus Hack 26: Buenos Aires. Para confirmar tu
          asistencia, necesitamos que {isPlural ? 'completen' : 'completes'}{' '}
          información extra:
        </Text>

        <Text style={text}>
          • Conectar tu cuenta de Github
          <br />• Aceptar las bases del evento
          <br />• Rellenar información adicional
          <br />• Rellenar los datos para los créditos de Anthropic
          <br />• Conectar tu cuenta de Discord
        </Text>

        <Text style={{ ...text, ...boldText }}>
          {isPlural ? 'Tienen' : 'Tienes'} hasta el {deadline} (hora de Buenos
          Aires) para completar esta información.
        </Text>

        <Hr style={hr} />

        <Section style={buttonContainer}>
          <EmailButton href={onboardUrl}>Completar Onboarding</EmailButton>
        </Section>
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

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};
