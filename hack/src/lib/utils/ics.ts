interface ICSEventParams {
  title: string;
  description?: string;
  location: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

function formatICSDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

function escapeICSText(text: string): string {
  return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
}

export function generateICS(params: ICSEventParams): string {
  const now = new Date();
  const dtstamp = formatICSDate(now);
  const dtstart = formatICSDate(params.startDate);
  const dtend = formatICSDate(params.endDate);

  const uid = `${dtstamp}@hack.platan.us`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Platanus Hack//Platanus Hack 25//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=America/Santiago:${dtstart}`,
    `DTEND;TZID=America/Santiago:${dtend}`,
    `SUMMARY:${escapeICSText(params.title)}`,
    `LOCATION:${escapeICSText(params.location)}`,
  ];

  if (params.description) {
    lines.push(`DESCRIPTION:${escapeICSText(params.description)}`);
  }

  if (params.url) {
    lines.push(`URL:${params.url}`);
  }

  lines.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: ${escapeICSText(params.title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  );

  return lines.join('\r\n');
}

export function generatePlatanusHack25ICS(): string {
  // Nov 21, 2025 18:30 CLT
  const startDate = new Date('2025-11-21T18:30:00-03:00');
  // Nov 23, 2025 15:30 CLT
  const endDate = new Date('2025-11-23T15:30:00-03:00');

  return generateICS({
    title: 'Platanus Hack 25 🍌💻',
    description:
      'Platanus Hack 25 ft Buk.\n200 hackers, de cero a producto en 36 horas.',
    location:
      'Roger de Flor 2725, Torre 3, piso 3, Las Condes, Región Metropolitana, Chile',
    startDate,
    endDate,
    url: 'https://hack.platan.us/hacker',
  });
}
