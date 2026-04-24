import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Text,
} from '@react-email/components';

interface EmailLayout26ArProps {
  children: React.ReactNode;
  preview: string;
}

export default function EmailLayout26Ar({
  children,
  preview,
}: EmailLayout26ArProps) {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || 'https://hack.platan.us'
  ).replace(/\/$/, '');

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={outerContainer}>
          <Img
            src={`${appUrl}/assets/email/header-26-ar.png`}
            alt="Platanus Hack 26 Buenos Aires"
            style={headerImage}
          />
          <div style={innerContainer}>
            {children}
            <div style={separator} />
            <Text style={footer}>
              Equipo de <strong>Platanus Hack 26</strong>
            </Text>
            <Text style={ps}>Si tienes alguna duda, responde este mail</Text>
          </div>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: '14px',
  fontWeight: 'normal' as const,
  padding: '40px 20px',
};

const outerContainer = {
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
};

const innerContainer = {
  backgroundColor: '#333333',
  border: '1px solid #e0ff00',
  padding: '32px 24px',
  margin: '0',
};

const separator = {
  borderTop: '1px solid #ffffff',
  opacity: 0.2,
  margin: '32px 0 24px 0',
};

const footer = {
  color: '#ffffff',
  fontSize: '13px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontWeight: 'normal' as const,
  lineHeight: '20px',
  margin: '0',
  padding: '0',
  opacity: 0.9,
};

const headerImage = {
  width: '100%',
  height: 'auto',
  display: 'block' as const,
  aspectRatio: '3 / 1',
};

const ps = {
  color: '#999999',
  fontSize: '11px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontWeight: 'normal' as const,
  fontStyle: 'italic' as const,
  lineHeight: '16px',
  margin: '8px 0 0 0',
  padding: '0',
  opacity: 0.7,
};
