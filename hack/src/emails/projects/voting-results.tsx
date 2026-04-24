import { Button, Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface VotingResultsEmailProps {
  hackerName: string;
  baseUrl: string;
}

export default function VotingResultsEmail({
  hackerName,
  baseUrl,
}: VotingResultsEmailProps) {
  const preview = 'Resultados de la votación pública Platanus Hack 25';

  const absoluteBaseUrl = baseUrl?.startsWith('http')
    ? baseUrl
    : `https://${baseUrl || 'hack.platan.us'}`;

  const resultsUrl = `${absoluteBaseUrl}/25/vote/results`;

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>🏆 RESULTADOS VOTACIÓN PÚBLICA</Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>
          Luego de intensos días de votación, con{' '}
          <span style={boldText}>2.591 votantes únicos</span> y una remontada
          épica, los resultados ya están listos.
        </Text>

        <Text style={{ ...text, ...boldText, margin: '24px 0 12px 0' }}>
          El podio final:
        </Text>

        <Section style={leaderboardContainer}>
          <Text style={leaderboardItem}>
            🏆 <span style={boldText}>771 votos</span> - Scrapi
          </Text>
          <Text style={leaderboardItem}>
            🥈 <span style={boldText}>663 votos</span> - Themis
          </Text>
          <Text style={leaderboardItem}>
            🥉 <span style={boldText}>496 votos</span> - 0ratorIA
          </Text>
          <Text style={leaderboardItem}>
            4️⃣ <span style={boldText}>247 votos</span> - CUENTI
          </Text>
          <Text style={leaderboardItem}>
            5️⃣ <span style={boldText}>165 votos</span> - SuperTracker
          </Text>
        </Section>

        <Text style={text}>
          El equipo ganador se lleva{' '}
          <span style={boldText}>700 USD en BTC</span> a repartir 🔥
        </Text>

        <Text style={text}>
          Verificamos internamente el comportamiento de los votos para detectar
          cualquier anomalía ✅
        </Text>

        <Section style={buttonContainer}>
          <Button href={resultsUrl} style={button}>
            VER RESULTADOS COMPLETOS
          </Button>
        </Section>

        <Text style={{ ...text, ...boldText, margin: '32px 0 0 0' }}>
          ¡Felicitaciones a todos los participantes! 🎉
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

const leaderboardContainer = {
  margin: '0 0 20px 0',
  paddingLeft: '8px',
};

const leaderboardItem = {
  color: '#ffffff',
  fontSize: '14px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontWeight: 'normal' as const,
  lineHeight: '26px',
  margin: '4px 0',
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
