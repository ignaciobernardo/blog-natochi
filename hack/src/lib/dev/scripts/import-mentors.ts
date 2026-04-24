import { db } from '@/src/lib/db';
import { type MentorAvailability, mentors } from '@/src/lib/db/schema';

const mentorsData = [
  {
    fullName: 'Daniel Leal',
    github: 'https://github.com/daleal',
    pictureUrl: '/assets/images/mentors/daniel-leal.webp',
    companyTitle: 'Senior Software Engineer, Fintoc',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      { day: 'saturday', startTime: '12:30', endTime: '16:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Andres Matte',
    github: 'https://github.com/aamatte',
    pictureUrl: '/assets/images/mentors/andres-matte.webp',
    companyTitle: 'Co-founder, Kapso',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      {
        day: 'saturday',
        startTime: '10:30',
        endTime: '14:00',
        tentative: true,
      },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Sergio Campamá',
    github: 'https://github.com/sergiocampama',
    pictureUrl: '/assets/images/mentors/sergio-campama.png',
    companyTitle: 'CTO, Meta Food Chile',
    availability: [
      { day: 'friday', startTime: '18:00', endTime: '23:00' },
      { day: 'saturday', startTime: '10:30', endTime: '15:00' },
      { day: 'sunday', startTime: '12:00', endTime: '14:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Ignacio Márquez',
    github: 'https://github.com/imarquezc',
    pictureUrl: '/assets/images/mentors/ignacio-marquez.webp',
    companyTitle: 'Co-founder & CTO, Plutto',
    availability: [
      { day: 'friday', startTime: '18:30', endTime: '23:00' },
      { day: 'saturday', startTime: '11:30', endTime: '15:30' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Ramón Echeverría',
    github: 'https://github.com/rieg-ec',
    pictureUrl: '/assets/images/mentors/ramon-echeverria.webp',
    companyTitle: 'Co-founder & CTO, Grupalia',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      { day: 'saturday', startTime: '09:00', endTime: '20:00' },
      { day: 'sunday', startTime: '09:00', endTime: '17:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Stephanie Chau',
    github: 'https://github.com/stephichau',
    pictureUrl: '/assets/images/mentors/stephanie-chau.webp',
    companyTitle: 'Senior Software Engineer, Nirvana',
    availability: [
      { day: 'friday', startTime: '18:00', endTime: '23:00' },
      {
        day: 'saturday',
        startTime: '08:30',
        endTime: '13:30',
        tentative: true,
      },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Juan Ignacio Donoso',
    github: 'https://github.com/blackjid',
    pictureUrl: '/assets/images/mentors/juan-ignacio-donoso.webp',
    companyTitle: 'Infrastructure/Devops & Founder, Buda.com',
    availability: [
      { day: 'friday', startTime: '18:30', endTime: '23:00' },
      { day: 'saturday', startTime: '10:30', endTime: '15:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Andrés Cádiz',
    github: 'https://github.com/ironcadiz',
    pictureUrl: '/assets/images/mentors/andres-cadiz.png',
    companyTitle: 'Senior Scientist, Uber',
    availability: [
      { day: 'friday', startTime: '18:30', endTime: '23:00' },
      { day: 'saturday', startTime: '11:00', endTime: '17:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Josefina Hidalgo',
    github: 'https://github.com/josefinahj',
    pictureUrl: '/assets/images/mentors/jose-hidalgo.webp',
    companyTitle: 'Engineering Manager Lead, Buk',
    availability: [
      { day: 'friday', startTime: '18:00', endTime: '23:00' },
      {
        day: 'saturday',
        startTime: '08:30',
        endTime: '13:30',
        tentative: true,
      },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Sebastián Hevia',
    github: 'https://github.com/sebastianhevia',
    pictureUrl: '/assets/images/mentors/sebastian-hevia.webp',
    companyTitle: 'Co-founder & CTO, AgendaPro',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      { day: 'saturday', startTime: '09:00', endTime: '13:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Vicente Aguilera',
    github: 'https://github.com/vjaguilera',
    pictureUrl: '/assets/images/mentors/vicente-aguilera.webp',
    companyTitle: 'Co-founder & CTO, PartsFlow.ai',
    availability: [
      { day: 'friday', startTime: '18:30', endTime: '23:59' },
      { day: 'saturday', startTime: '11:30', endTime: '18:30' },
      { day: 'sunday', startTime: '10:00', endTime: '17:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Nicolás Teare',
    github: 'https://github.com/nateare',
    pictureUrl: '/assets/images/mentors/nicolas-teare.webp',
    companyTitle: 'Head of Engineering, Fintoc',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      { day: 'saturday', startTime: '12:00', endTime: '16:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Patricio López',
    github: 'https://github.com/lopezjurip',
    pictureUrl: '/assets/images/mentors/patricio-lopez.webp',
    companyTitle: 'Co-founder & CTO, Fraccional',
    availability: [
      { day: 'friday', startTime: '18:30', endTime: '23:59' },
      { day: 'saturday', startTime: '09:00', endTime: '12:00' },
      { day: 'sunday', startTime: '09:00', endTime: '15:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Tamara Lues',
    github: 'https://github.com/tamaralues',
    pictureUrl: '/assets/images/mentors/tamara-lues.webp',
    companyTitle: 'Developer, Fintual',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      { day: 'saturday', startTime: '12:00', endTime: '16:00' },
      { day: 'sunday', startTime: '12:00', endTime: '14:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Cristóbal Dotte',
    github: 'https://github.com/cdotte',
    pictureUrl: '/assets/images/mentors/cristobal-dotte.webp',
    companyTitle: 'Head of Engineering, Buk Finanzas',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      {
        day: 'saturday',
        startTime: '10:30',
        endTime: '14:00',
        tentative: true,
      },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Ana Undurraga',
    github: 'https://github.com/aundurraga',
    pictureUrl: '/assets/images/mentors/ana-undurraga.webp',
    companyTitle: 'Software Engineer, Buda',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      { day: 'saturday', startTime: '10:00', endTime: '14:00' },
      { day: 'sunday', startTime: '09:00', endTime: '15:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Pedro Saratscheff',
    github: 'https://github.com/saratscheff',
    pictureUrl: '/assets/images/mentors/pedro-saratscheff.webp',
    companyTitle: 'Co-founder & CTO, Ruuf',
    availability: [
      {
        day: 'saturday',
        startTime: '12:00',
        endTime: '15:00',
        tentative: true,
      },
      { day: 'sunday', startTime: '09:00', endTime: '15:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Nicolás Vega',
    github: 'https://github.com/nicolasvegam',
    pictureUrl: '/assets/images/mentors/nico-vega.webp',
    companyTitle: 'Co-founder & CTO, Carvuk',
    availability: [
      { day: 'friday', startTime: '18:30', endTime: '23:00' },
      { day: 'saturday', startTime: '09:00', endTime: '13:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Enzo Tamburini',
    github: 'https://github.com/entamburini',
    pictureUrl: '/assets/images/mentors/enzo-tamburini.webp',
    companyTitle: 'Co-founder, Toku',
    availability: [
      { day: 'friday', startTime: '19:00', endTime: '23:00' },
      { day: 'saturday', startTime: '11:00', endTime: '15:00' },
    ] as MentorAvailability[],
  },
  {
    fullName: 'Fernando Florenzano',
    github: 'https://github.com/fdoflorenzano',
    pictureUrl: '/assets/images/mentors/fernando-florenzano.webp',
    companyTitle: 'Staff Design Engineer, Design Systems International',
    availability: [
      { day: 'friday', startTime: '18:30', endTime: '23:00' },
      { day: 'saturday', startTime: '10:00', endTime: '12:00' },
    ] as MentorAvailability[],
  },
];

async function importMentors() {
  console.log('Starting mentor import...');

  try {
    // Clear existing mentors
    console.log('Clearing existing mentors...');
    await db.delete(mentors);
    console.log('✅ Cleared existing mentors');

    // Import new mentors
    for (const mentor of mentorsData) {
      console.log(`Importing ${mentor.fullName}...`);
      await db.insert(mentors).values(mentor);
    }

    console.log(`✅ Successfully imported ${mentorsData.length} mentors`);
  } catch (error) {
    console.error('❌ Error importing mentors:', error);
    throw error;
  }
}

importMentors()
  .then(() => {
    console.log('Import complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
