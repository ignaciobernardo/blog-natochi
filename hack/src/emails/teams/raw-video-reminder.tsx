import { Heading, Section, Text } from '@react-email/components';
import React from 'react';
import EmailLayout from '../_components/email-layout';

interface RawVideoReminderEmailProps {
  hackerName: string;
  teamSlug: string;
  uploadFolderUrl: string;
  videoUrl?: string;
}

export default function RawVideoReminderEmail({
  hackerName,
  uploadFolderUrl,
  videoUrl,
}: RawVideoReminderEmailProps) {
  const preview = `Subir slides en PDF y Demo | Presentaciones Platanus Hack 25`;

  return (
    <EmailLayout preview={preview}>
      <Section>
        <Heading style={h1}>
          SUBIR SLIDES EN PDF Y DEMO | PRESENTACIONES PLATANUS HACK 25
        </Heading>

        <Text style={text}>Hola {hackerName.trim()},</Text>

        <Text style={text}>
          Esperamos que ya estés un poco más recuperado de un intenso (pero
          ojalá entretenido) fin de semana en Platanus Hack 25.
        </Text>

        <Text style={text}>
          Como ya comunicamos{' '}
          <a
            href="https://discord.com/channels/1439366811979223345/1439370715802505431/1443010283223257251"
            style={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            por discord
          </a>
          , tuvimos un problema con la productora.
        </Text>

        <Text style={text}>
          Hay un <strong style={boldText}>problema de exposición</strong> con
          los videos de las presentaciones y el resultado{' '}
          <strong style={boldText}>no lo consideramos aceptable</strong>. Parte
          importante del valor de Platanus Hack es que puedan tener un{' '}
          <strong style={boldText}>
            buen entregable del proyecto que construyeron
          </strong>{' '}
          en el fin de semana, y eso incluye un video de buena calidad. La
          motivación es que pueda ir directamente a sus portafolios y que les
          sirva para obtener la mayor cantidad de votos en la votación pública
          (que quedó para la próxima semana).
        </Text>

        <Text style={text}>
          Dado esto, necesitamos que suban en{' '}
          <a
            href={uploadFolderUrl}
            style={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            esta carpeta
          </a>{' '}
          dos archivos:
        </Text>

        <Text style={highlightBox}>
          <strong>1.</strong> Las slides que usaron para presentar, en{' '}
          <strong style={boldText}>formato PDF</strong>.
        </Text>

        <Text style={{ ...highlightBox, marginBottom: '20px' }}>
          <strong>2.</strong> Una reproducción del demo que hicieron durante su
          presentación, en formato MP4. Una grabación de pantalla funciona bien.
          Preocúpense de que se vea lo más profesional posible.{' '}
          {videoUrl ? (
            <>
              Será sincronizada con el{' '}
              <a
                href={videoUrl}
                style={{ ...link, color: '#000000' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                video de su presentación
              </a>
              , por lo que úsenlo como guía para grabar el demo.
            </>
          ) : (
            'Será sincronizada con el video de su presentación, por lo que úsenlo como guía para grabar el demo.'
          )}
        </Text>

        <Text style={text}>
          De nuestra parte nos preocuparemos de hacer calzar las slides y el
          demo con el video que ya tenemos de su presentación. Buscaremos que el
          contenido sea lo mejor posible, a pesar del incidente.
        </Text>

        <Text style={{ ...text, ...boldText }}>
          Les pedimos que envíen este contenido lo antes posible 🫶
        </Text>

        <Text style={text}>Gracias por entender!</Text>
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

const highlightBox = {
  color: '#000000',
  fontSize: '14px',
  fontFamily:
    'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
  fontWeight: 'normal' as const,
  lineHeight: '22px',
  margin: '20px 0 12px 0',
  padding: '12px 16px',
  backgroundColor: '#e0ff00',
  border: '1px solid #000000',
};

const link = {
  color: '#e0ff00',
  textDecoration: 'underline' as const,
};
