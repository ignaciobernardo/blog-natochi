import { Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface SelfFinanceRejectionEmailProps {
  hackerName: string;
  hackerGithub: string;
  isTeam: boolean;
  modality: 'solo' | 'team' | 'team_looking';
  teamMembers?: Array<{ fullName: string; github: string | null }>;
}

function _extractGithubUsername(github: string | null): string {
  if (!github) return '';

  if (github.includes('github.com')) {
    const parts = github.split('/');
    return parts[parts.length - 1] || github;
  }

  return github;
}

export default function SelfFinanceRejectionEmail({
  hackerName: _hackerName,
  hackerGithub: _hackerGithub,
  isTeam: _isTeam,
  modality,
  teamMembers: _teamMembers = [],
}: SelfFinanceRejectionEmailProps) {
  const preview = `Platanus Hack 25 - Postulación descartada`;

  // Use plural only for 'team' modality, singular for 'solo' and 'team_looking'
  const isPlural = modality === 'team';

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>POSTULACIÓN DESCARTADA - PLATANUS HACK 25</Heading>

        <Text style={text}>Hola,</Text>

        <Text style={text}>
          {isPlural ? 'Indicaron' : 'Indicaste'} que no{' '}
          {isPlural ? 'pueden' : 'puedes'} volar a Chile financiando{' '}
          {isPlural ? 'los pasajes' : 'el pasaje'} por {isPlural ? 'su' : 'tu'}{' '}
          cuenta.
        </Text>

        <Text style={text}>
          Debido a que otros {isPlural ? 'equipos están' : 'postulantes están'}{' '}
          esperando un espacio en Platanus Hack, debemos descartar{' '}
          {isPlural ? 'su' : 'tu'} postulación por ahora.
        </Text>

        <Text style={text}>
          Esperamos {isPlural ? 'verlos' : 'verte'} en una próxima Platanus
          Hack.
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

const _hr = {
  borderColor: '#ffffff',
  borderWidth: '1px',
  borderStyle: 'solid' as const,
  margin: '20px 0',
  opacity: 0.2,
};
