// Contenido del árbol: cuatro ramas. Fuente única para las versiones del
// árbol (v13 en adelante): cada versión lo copia a su src/data.js.
//
// Tipos de nodo:
//   { name, kids: [...] }   carpeta: al abrirla crece una rama con sus hijos
//   { name, text }          rama que al abrirse saca un párrafo
//   { name, href, note? }   hoja: un link (note = fecha u otro dato corto)
//
// Hechos tomados de natochi-c5r/CONTENT.md y del repo del blog (posts en
// blog/, updates publicadas en updates/). Las últimas tres de cada uno.

const ME = [
  "i'm natochi. dropout, based in santiago de chile.",
  'i look for growth levers in startups, ventures and cool things.',
  "over the last six years i've built businesses, communities and fun stuff wherever i've worked.",
  'now: generalist at platanus, contracting for kairos and m3, helping run gen stream, and starting amigos fund.',
  'into ai safety, cognitive science, venture capital, community stuff and anything borges.',
].join(' ');

// "me" con formato, para las versiones que lo saben imprimir (v20): un
// párrafo por idea; cada párrafo es una lista de tramos. `href`: link (va con
// una línea fina abajo). `mark`: subrayado a mano, imperfecto. Las demás
// versiones usan `text`, el mismo texto en plano.
const ME_RICH = [
  [{ s: "i'm natochi. " }, { s: 'dropout', mark: true }, { s: ', based in santiago de chile.' }],
  [{ s: 'i look for ' }, { s: 'growth levers', mark: true }, { s: ' in startups, ventures and cool things.' }],
  [{ s: "over the last six years i've built businesses, communities and fun stuff wherever i've worked." }],
  [
    { s: 'now: ' },
    { s: 'generalist', mark: true },
    { s: ' at ' },
    { s: 'platanus', href: 'https://platan.us' },
    { s: ', contracting for ' },
    { s: 'kairos', href: 'https://kairos-project.org' },
    { s: ' and ' },
    { s: 'm3', href: 'https://m3fellowship.com' },
    { s: ', helping run ' },
    { s: 'gen stream', href: 'https://genstream.org' },
    { s: ', and starting ' },
    { s: 'amigos fund', href: 'https://amigos.sh' },
    { s: '.' },
  ],
  [{ s: 'into ai safety, cognitive science, venture capital, community stuff and ' }, { s: 'anything borges', mark: true }, { s: '.' }],
];

export const TREE = {
  name: 'natochi',
  kids: [
    { name: 'me', text: ME, rich: ME_RICH },
    {
      name: 'writing',
      kids: [
        // spomenik y angelsquad for latam están sin terminar: fuera del árbol
        { name: 'keep going', href: '/blog/seguir-adelante/', note: 'jan 1' },
      ],
    },
    {
      name: 'updates',
      kids: [
        { name: 'jun 13', href: '/updates/2026-06-13/' },
        { name: 'may 10', href: '/updates/2026-05-10/' },
        { name: 'apr 28', href: '/updates/2026-04-28/' },
        { name: 'apr 23', href: '/updates/2026-04-23/' },
        { name: 'apr 22', href: '/updates/2026-04-22/' },
        { name: 'apr 21', href: '/updates/2026-04-21/' },
        { name: 'apr 20', href: '/updates/2026-04-20/' },
      ],
    },
    {
      name: 'work with me',
      // sólo el link para agendar, en la punta de la rama (el cv sigue en /cv)
      kids: [{ name: 'book a call', href: 'https://cal.com/natochi' }],
    },
  ],
};
