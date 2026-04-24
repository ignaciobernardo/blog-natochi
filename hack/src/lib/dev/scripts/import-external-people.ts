import { db } from '@/src/lib/db';
import { externalPeople } from '@/src/lib/db/schema';

// Same slugify as in credentials
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Slug logic matches credentials: customQrId > github username > slugify(fullName)
function getSlug(
  fullName: string,
  github: string | null,
  customQrId: string | null,
): string {
  return customQrId || github || slugify(fullName);
}

const staffMembers = [
  {
    fullName: 'Rafael Fernández',
    company: 'Platanus',
    github: 'rafafdz',
    customQrId: null,
  },
  {
    fullName: 'Paula Enei',
    company: 'Platanus',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'Raimundo Herrera',
    company: 'Platanus',
    github: 'rjherrera',
    customQrId: null,
  },
  {
    fullName: 'Joaquín Stephens',
    company: 'Platanus',
    github: null,
    customQrId: null,
  },
  { fullName: 'Lucía Uriarte', company: 'Buk', github: null, customQrId: null },
  {
    fullName: 'María José Nolasco',
    company: 'Buk',
    github: null,
    customQrId: null,
  },
  { fullName: 'Trinidad Mesa', company: 'Buk', github: null, customQrId: null },
];

const sponsors = [
  { fullName: 'Jaime Arrieta', company: 'Buk', github: null, customQrId: null },
  { fullName: 'Eliana Franco', company: 'Buk', github: null, customQrId: null },
  { fullName: 'Buk', company: 'Buk', github: null, customQrId: 'buk-1' },
  { fullName: 'Buk', company: 'Buk', github: null, customQrId: 'buk-2' },
  { fullName: 'Alex Harasic', company: 'AWS', github: null, customQrId: null },
  { fullName: 'AWS', company: 'AWS', github: null, customQrId: 'aws-1' },
  { fullName: 'AWS', company: 'AWS', github: null, customQrId: 'aws-2' },
  { fullName: 'AWS', company: 'AWS', github: null, customQrId: 'aws-3' },
  {
    fullName: 'Cristian Sauterel',
    company: 'Maxxa',
    github: null,
    customQrId: null,
  },
  { fullName: 'Luis Palomo', company: 'Maxxa', github: null, customQrId: null },
  {
    fullName: 'Darío Canales',
    company: 'Maxxa',
    github: null,
    customQrId: null,
  },
  { fullName: 'Natalia Toro', company: 'Buda', github: null, customQrId: null },
  {
    fullName: 'Florencia Brahm',
    company: 'Buda',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'Sebastián Arriagada',
    company: 'Buda',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'Ignacio Porte',
    company: 'Buda',
    github: 'IgnacioPorte',
    customQrId: null,
  },
  {
    fullName: 'Florencia Rostion',
    company: 'Fintoc',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'Antonia Hernández',
    company: 'Fintoc',
    github: 'mari-hernandez',
    customQrId: null,
  },
  {
    fullName: 'Martin Peñaloza',
    company: 'Fintoc',
    github: 'mpenalozag',
    customQrId: null,
  },
  {
    fullName: 'Jose Marchant',
    company: 'Fintoc',
    github: 'JoMarchant',
    customQrId: null,
  },
  {
    fullName: 'Rodrigo Monsalve',
    company: 'AgendaPro',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'Carlos Izquierdo',
    company: 'AgendaPro',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'Nayhib Padrón',
    company: 'AgendaPro',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'AgendaPro',
    company: 'AgendaPro',
    github: null,
    customQrId: 'agendapro-1',
  },
  {
    fullName: 'AgendaPro',
    company: 'AgendaPro',
    github: null,
    customQrId: 'agendapro-2',
  },
];

const jueces = [
  {
    fullName: 'Daniel Undurraga',
    company: null,
    github: 'buenaonda',
    customQrId: null,
  },
  {
    fullName: 'Loreto Prieto',
    company: 'NeuralWorks',
    github: 'LorePrieto',
    customQrId: null,
  },
  {
    fullName: 'Felipe Sateler',
    company: 'Buk',
    github: 'fsateler',
    customQrId: null,
  },
  {
    fullName: 'Omar Larré',
    company: 'Fintual',
    github: null,
    customQrId: null,
  },
  { fullName: 'Juez', company: null, github: null, customQrId: 'juez-4' },
];

const invitados = Array.from({ length: 17 }, (_, i) => ({
  fullName: 'Invitado',
  company: null,
  github: null,
  customQrId: `invitado-${i + 1}`,
}));

const diseno = [
  {
    fullName: 'Cristobal Amigo',
    company: 'PUCHWORS',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'Vicente Puig',
    company: 'PUCHWORS',
    github: null,
    customQrId: null,
  },
  {
    fullName: 'Denise Wenderoth',
    company: 'PUCHWORS',
    github: null,
    customQrId: null,
  },
];

async function main() {
  console.log('Importing external people (excluding mentors)...\n');

  const allPeople: {
    slug: string;
    fullName: string;
    category: string;
    role: string | null;
    githubUrl: string | null;
  }[] = [];

  // Staff
  for (const person of staffMembers) {
    allPeople.push({
      slug: getSlug(person.fullName, person.github, person.customQrId),
      fullName: person.fullName,
      category: 'staff',
      role: person.company,
      githubUrl: person.github ? `https://github.com/${person.github}` : null,
    });
  }

  // Sponsors
  for (const person of sponsors) {
    allPeople.push({
      slug: getSlug(person.fullName, person.github, person.customQrId),
      fullName: person.fullName,
      category: 'sponsor',
      role: person.company,
      githubUrl: person.github ? `https://github.com/${person.github}` : null,
    });
  }

  // Judges
  for (const person of jueces) {
    allPeople.push({
      slug: getSlug(person.fullName, person.github, person.customQrId),
      fullName: person.fullName,
      category: 'judge',
      role: person.company,
      githubUrl: person.github ? `https://github.com/${person.github}` : null,
    });
  }

  // Invitados
  for (const person of invitados) {
    allPeople.push({
      slug: getSlug(person.fullName, person.github, person.customQrId),
      fullName: person.fullName,
      category: 'invitado',
      role: person.company,
      githubUrl: null,
    });
  }

  // Design
  for (const person of diseno) {
    allPeople.push({
      slug: getSlug(person.fullName, person.github, person.customQrId),
      fullName: person.fullName,
      category: 'design',
      role: person.company,
      githubUrl: person.github ? `https://github.com/${person.github}` : null,
    });
  }

  console.log(`Total people to import: ${allPeople.length}\n`);

  let inserted = 0;
  let skipped = 0;

  for (const person of allPeople) {
    try {
      await db.insert(externalPeople).values(person).onConflictDoNothing();
      console.log(
        `✓ ${person.category}: ${person.fullName} => slug: ${person.slug}`,
      );
      inserted++;
    } catch (error) {
      console.log(
        `✗ Skipped ${person.fullName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      skipped++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
