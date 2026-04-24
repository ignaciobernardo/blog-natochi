import { getHackersForCredentials } from '@/src/queries/credentials';
import { ExportButton } from './_components/export-button';
import { UnifiedCredentialCard } from './_components/unified-credential-card';

const staffMembers = [
  {
    type: 'staff' as const,
    fullName: 'Rafael Fernández',
    company: 'Platanus',
    github: 'rafafdz',
  },
  {
    type: 'staff' as const,
    fullName: 'Paula Enei',
    company: 'Platanus',
    github: null,
  },
  {
    type: 'staff' as const,
    fullName: 'Raimundo Herrera',
    company: 'Platanus',
    github: 'rjherrera',
  },
  {
    type: 'staff' as const,
    fullName: 'Joaquín Stephens',
    company: 'Platanus',
    github: null,
  },
  {
    type: 'staff' as const,
    fullName: 'Lucía Uriarte',
    company: 'Buk',
    github: null,
  },
  {
    type: 'staff' as const,
    fullName: 'María José Nolasco',
    company: 'Buk',
    github: null,
  },
  {
    type: 'staff' as const,
    fullName: 'Trinidad Mesa',
    company: 'Buk',
    github: null,
  },
];

const sponsors = [
  {
    type: 'sponsor' as const,
    fullName: 'Jaime Arrieta',
    company: 'Buk',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Eliana Franco',
    company: 'Buk',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Buk',
    company: '',
    github: null,
    customQrId: 'buk-1',
  },
  {
    type: 'sponsor' as const,
    fullName: 'Buk',
    company: '',
    github: null,
    customQrId: 'buk-2',
  },
  {
    type: 'sponsor' as const,
    fullName: 'Alex Harasic',
    company: 'AWS',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'AWS',
    company: '',
    github: null,
    customQrId: 'aws-1',
  },
  {
    type: 'sponsor' as const,
    fullName: 'AWS',
    company: '',
    github: null,
    customQrId: 'aws-2',
  },
  {
    type: 'sponsor' as const,
    fullName: 'AWS',
    company: '',
    github: null,
    customQrId: 'aws-3',
  },
  {
    type: 'sponsor' as const,
    fullName: 'Cristian Sauterel',
    company: 'Maxxa',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Luis Palomo',
    company: 'Maxxa',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Darío Canales',
    company: 'Maxxa',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Natalia Toro',
    company: 'Buda',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Florencia Brahm',
    company: 'Buda',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Sebastián Arriagada',
    company: 'Buda',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Ignacio Porte',
    company: 'Buda',
    github: 'IgnacioPorte',
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Florencia Rostion',
    company: 'Fintoc',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Antonia Hernández',
    company: 'Fintoc',
    github: 'mari-hernandez',
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Martin Peñaloza',
    company: 'Fintoc',
    github: 'mpenalozag',
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Jose Marchant',
    company: 'Fintoc',
    github: 'JoMarchant',
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Rodrigo Monsalve',
    company: 'AgendaPro',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Carlos Izquierdo',
    company: 'AgendaPro',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'Nayhib Padrón',
    company: 'AgendaPro',
    github: null,
    customQrId: null,
  },
  {
    type: 'sponsor' as const,
    fullName: 'AgendaPro',
    company: '',
    github: null,
    customQrId: 'agendapro-1',
  },
  {
    type: 'sponsor' as const,
    fullName: 'AgendaPro',
    company: '',
    github: null,
    customQrId: 'agendapro-2',
  },
];

const invitados = [
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-1',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-2',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-3',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-4',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-5',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-6',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-7',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-8',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-9',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-10',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-11',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-12',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-13',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-14',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-15',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-16',
  },
  {
    type: 'invitado' as const,
    fullName: '',
    company: null,
    github: null,
    customQrId: 'invitado-17',
  },
];

const jueces = [
  {
    type: 'juez' as const,
    fullName: 'Daniel Undurraga',
    company: null,
    github: 'buenaonda',
    customQrId: null,
  },
  {
    type: 'juez' as const,
    fullName: 'Loreto Prieto',
    company: 'NeuralWorks',
    github: 'LorePrieto',
    customQrId: null,
  },
  {
    type: 'juez' as const,
    fullName: 'Felipe Sateler',
    company: 'Buk',
    github: 'fsateler',
    customQrId: null,
  },
  {
    type: 'juez' as const,
    fullName: 'Omar Larré',
    company: 'Fintual',
    github: null,
    customQrId: null,
  },
  {
    type: 'juez' as const,
    fullName: null,
    company: null,
    github: null,
    customQrId: 'juez-4',
  },
];

const mentors = [
  {
    type: 'mentor' as const,
    fullName: 'Stephanie Chau',
    company: 'Nirvana',
    github: 'stephichau',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Sebastián Hevia',
    company: 'AgendaPro',
    github: 'sebastianhevia',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Andrés Matte',
    company: 'Kapso',
    github: 'aamatte',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Cristóbal Dotte',
    company: 'Buk Finanzas',
    github: 'cdotte',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Daniel Leal',
    company: 'Fintoc',
    github: 'daleal',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Enzo Tamburini',
    company: 'Toku',
    github: 'entamburini',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Patricio López',
    company: 'Fraccional',
    github: 'lopezjurip',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Pedro Saratscheff',
    company: 'Ruuf',
    github: 'saratscheff',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Tamara Lues',
    company: 'Fintual',
    github: 'tamaralues',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Andrés Cádiz',
    company: 'Uber',
    github: 'ironcadiz',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Juan Ignacio Donoso',
    company: 'Buda',
    github: 'blackjid',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Nicolás Teare',
    company: 'Fintoc',
    github: 'nateare',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Vicente Aguilera',
    company: 'PartsFlow.ai',
    github: 'vjaguilera',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Ramón Echeverría',
    company: 'Grupalia',
    github: 'rieg-ec',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Nicolás Vega',
    company: 'Carvuk',
    github: 'Nicolasvegam',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Fernando Florenzano',
    company: 'Design Systems International',
    github: 'fdoflorenzano',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Ignacio Márquez',
    company: 'Plutto',
    github: 'imarquezc',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Sergio Campamá',
    company: 'Meta Food',
    github: 'sergiocampama',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Josefina Hidalgo',
    company: 'Buk',
    github: 'josefinahj',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: 'Ana Undurraga',
    company: 'Buda',
    github: 'aundurraga',
    customQrId: null,
  },
  {
    type: 'mentor' as const,
    fullName: '',
    company: '',
    github: null,
    customQrId: 'mentor-1',
  },
  {
    type: 'mentor' as const,
    fullName: '',
    company: '',
    github: null,
    customQrId: 'mentor-2',
  },
  {
    type: 'mentor' as const,
    fullName: '',
    company: '',
    github: null,
    customQrId: 'mentor-3',
  },
];

const diseno = [
  {
    type: 'diseno' as const,
    fullName: 'Cristobal Amigo',
    company: 'PUCHWORS',
    github: null,
    customQrId: null,
  },
  {
    type: 'diseno' as const,
    fullName: 'Vicente Puig',
    company: 'PUCHWORS',
    github: null,
    customQrId: null,
  },
  {
    type: 'diseno' as const,
    fullName: 'Denise Wenderoth',
    company: 'PUCHWORS',
    github: null,
    customQrId: null,
  },
];

const emptyHackers = Array.from({ length: 10 }, (_, i) => ({
  type: 'hacker' as const,
  id: `hack-25-hacker-${i + 1}`,
  fullName: '',
  github: null,
}));

export default async function CredentialsPage() {
  const hackers = await getHackersForCredentials();

  const hackerCredentials = hackers.map((hacker) => ({
    type: 'hacker' as const,
    ...hacker,
  }));

  const allCredentials = [
    ...staffMembers,
    ...sponsors,
    ...invitados,
    ...jueces,
    ...mentors,
    ...diseno,
    ...hackerCredentials,
    ...emptyHackers,
  ];

  const CARDS_PER_CONTAINER = 40;
  const containers: (typeof allCredentials)[] = [];

  for (let i = 0; i < allCredentials.length; i += CARDS_PER_CONTAINER) {
    containers.push(allCredentials.slice(i, i + CARDS_PER_CONTAINER));
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="w-full">
        <div className="mb-8">
          <h1 className="mb-2 font-bold text-4xl text-gray-900">
            Platanus Hack 25 Credentials
          </h1>
          <p className="text-gray-600">
            Total credentials: {allCredentials.length} ({staffMembers.length}{' '}
            staff + {sponsors.length} sponsors + {invitados.length} invitados +{' '}
            {jueces.length} jueces + {mentors.length} mentors + {diseno.length}{' '}
            diseño + {hackers.length} hackers) | Containers: {containers.length}
          </p>
          <div className="mt-4">
            <ExportButton />
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {containers.map((containerCredentials, containerIndex) => {
            const containerKey = containerCredentials
              .map((c) => `${c.type}-${c.fullName || ('id' in c ? c.id : '')}`)
              .join('|');
            return (
              <div key={containerKey} className="flex flex-col gap-4">
                <div className="font-bold text-2xl text-gray-900">
                  {containerIndex + 1}/{containers.length}
                </div>
                <div
                  data-container-id={containerIndex + 1}
                  className="flex items-center justify-center p-12"
                  style={{
                    width: '2800px',
                    minHeight: '10000px',
                  }}
                >
                  <div className="grid h-full grid-cols-4 content-center justify-items-center gap-16">
                    {containerCredentials.map((credential) => {
                      const key =
                        credential.type === 'hacker'
                          ? `hacker-${(credential as any).id}`
                          : `${credential.type}-${(credential as any).customQrId || credential.fullName}`;

                      return (
                        <UnifiedCredentialCard
                          key={key}
                          type={credential.type}
                          fullName={credential.fullName}
                          company={(credential as any).company}
                          github={(credential as any).github}
                          hackerId={(credential as any).id}
                          customQrId={(credential as any).customQrId}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {allCredentials.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-gray-600 text-lg">No credentials found</p>
          </div>
        )}
      </div>
    </div>
  );
}
