// Change name to edit the visible title. The slug keeps the URL stable.
// Coordinates use the SVG viewBox (751 × 646); lines is optional wrapping.
const entries: { slug: string; name: string; x: number; y: number; lines?: string[] }[] = [
  {
    "slug": "woolf",
    "name": "WOOLF",
    "x": 353,
    "y": 31
  },
  {
    "slug": "barnes",
    "name": "BARNES",
    "x": 290,
    "y": 44
  },
  {
    "slug": "wickham",
    "name": "WICKHAM",
    "x": 435,
    "y": 44
  },
  {
    "slug": "bennett",
    "name": "Bennett",
    "x": 208,
    "y": 58
  },
  {
    "slug": "beach",
    "name": "Beach",
    "x": 516,
    "y": 61
  },
  {
    "slug": "cather",
    "name": "CATHER",
    "x": 243,
    "y": 91
  },
  {
    "slug": "white",
    "name": "WHITE",
    "x": 492,
    "y": 93
  },
  {
    "slug": "coleman",
    "name": "Coleman",
    "x": 186,
    "y": 109
  },
  {
    "slug": "barney",
    "name": "Barney",
    "x": 579,
    "y": 108
  },
  {
    "slug": "cunard",
    "name": "CUNARD",
    "x": 201,
    "y": 136
  },
  {
    "slug": "west",
    "name": "WEST",
    "x": 535,
    "y": 139
  },
  {
    "slug": "sackville-west",
    "name": "Sackville-West",
    "x": 135,
    "y": 153,
    "lines": [
      "Sackville-",
      "West"
    ]
  },
  {
    "slug": "marsden",
    "name": "Marsden",
    "x": 594,
    "y": 156
  },
  {
    "slug": "h-d",
    "name": "H. D.",
    "x": 173,
    "y": 183
  },
  {
    "slug": "warner",
    "name": "WARNER",
    "x": 553,
    "y": 183
  },
  {
    "slug": "yeats",
    "name": "Yeats",
    "x": 131,
    "y": 197
  },
  {
    "slug": "hemingway",
    "name": "Hemingway",
    "x": 623,
    "y": 202
  },
  {
    "slug": "eliot",
    "name": "ELIOT",
    "x": 149,
    "y": 229
  },
  {
    "slug": "stein",
    "name": "STEIN",
    "x": 587,
    "y": 230
  },
  {
    "slug": "wright",
    "name": "Wright",
    "x": 86,
    "y": 243
  },
  {
    "slug": "wells",
    "name": "Wells",
    "x": 654,
    "y": 246
  },
  {
    "slug": "fauset",
    "name": "FAUSET",
    "x": 131,
    "y": 259
  },
  {
    "slug": "sitwell",
    "name": "Sitwell",
    "x": 629,
    "y": 262
  },
  {
    "slug": "dubois",
    "name": "DuBois",
    "x": 87,
    "y": 276
  },
  {
    "slug": "hurston",
    "name": "HURSTON",
    "x": 85,
    "y": 307
  },
  {
    "slug": "sinclair",
    "name": "SINCLAIR",
    "x": 635,
    "y": 307
  },
  {
    "slug": "hughes",
    "name": "Hughes",
    "x": 85,
    "y": 336
  },
  {
    "slug": "joyce",
    "name": "JOYCE",
    "x": 125,
    "y": 352
  },
  {
    "slug": "richardson",
    "name": "RICHARDSON",
    "x": 592,
    "y": 353
  },
  {
    "slug": "van-vechten",
    "name": "Van Vechten",
    "x": 85,
    "y": 367,
    "lines": [
      "Van",
      "Vechten"
    ]
  },
  {
    "slug": "lowell",
    "name": "Lowell",
    "x": 653,
    "y": 370
  },
  {
    "slug": "larsen",
    "name": "LARSEN",
    "x": 140,
    "y": 398
  },
  {
    "slug": "rhys",
    "name": "RHYS",
    "x": 591,
    "y": 397
  },
  {
    "slug": "proust",
    "name": "Proust",
    "x": 111,
    "y": 427
  },
  {
    "slug": "lewis",
    "name": "Lewis",
    "x": 641,
    "y": 430
  },
  {
    "slug": "lawrence",
    "name": "LAWRENCE",
    "x": 161,
    "y": 443
  },
  {
    "slug": "pound",
    "name": "POUND",
    "x": 568,
    "y": 443
  },
  {
    "slug": "conrad",
    "name": "Conrad",
    "x": 131,
    "y": 474
  },
  {
    "slug": "ford",
    "name": "Ford",
    "x": 607,
    "y": 475
  },
  {
    "slug": "loy",
    "name": "LOY",
    "x": 208,
    "y": 490
  },
  {
    "slug": "moore",
    "name": "MOORE",
    "x": 537,
    "y": 494
  },
  {
    "slug": "m-anderson",
    "name": "M. Anderson",
    "x": 128,
    "y": 504
  },
  {
    "slug": "williams",
    "name": "Williams",
    "x": 571,
    "y": 521
  },
  {
    "slug": "macaulay",
    "name": "MACAULAY",
    "x": 233,
    "y": 535
  },
  {
    "slug": "mew",
    "name": "MEW",
    "x": 510,
    "y": 537
  },
  {
    "slug": "murry",
    "name": "Murry",
    "x": 530,
    "y": 552
  },
  {
    "slug": "macdiarmid",
    "name": "MACDIARMID",
    "x": 292,
    "y": 581
  },
  {
    "slug": "mansfield",
    "name": "MANSFIELD",
    "x": 421,
    "y": 579
  },
  {
    "slug": "bryher",
    "name": "Bryher",
    "x": 515,
    "y": 597
  }
];

export const authors = entries.map(author => ({
  ...author,
  text: `${author.name} es uno de los nombres de esta trama de modernistas. Cada línea invita a seguir una conexión: encuentros, correspondencias y conversaciones que atraviesan el mapa. Una obra puede leerse por sí sola, pero también junto a las voces que la rodean.`,
}));
