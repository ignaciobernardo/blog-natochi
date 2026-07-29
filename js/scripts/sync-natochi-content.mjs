import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const sourceDirectory = resolve(
  process.argv[2] || "/Users/natochi/projects/blog-natochi",
);
const newsletterDirectory = join(sourceDirectory, "newsletter");
const outputPath = join(projectDirectory, "natochi-content.js");

const read = (path) => readFileSync(path, "utf8");

const parseFrontmatter = (source) => {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);

  if (!match) {
    return { attributes: {}, body: source.trim() };
  }

  const attributes = Object.fromEntries(
    match[1].split("\n").map((line) => {
      const separator = line.indexOf(":");
      const key = line.slice(0, separator).trim();
      const value = line
        .slice(separator + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      return [key, value];
    }),
  );

  return { attributes, body: match[2].trim() };
};

const unique = (values) => [...new Set(values)];

const updateIndex = read(join(sourceDirectory, "updates", "index.html"));
const updateDates = unique(
  [...updateIndex.matchAll(/href="\/updates\/(\d{4}-\d{2}-\d{2})"/g)].map(
    ([, date]) => date,
  ),
);
const monthNames = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
const updates = updateDates.map((date) => {
  const [, month, day] = date.split("-").map(Number);
  return {
    date,
    label: `${monthNames[month - 1]} ${day}`,
    body: read(join(newsletterDirectory, `${date}.md`)).trim(),
  };
});

const postFiles = ["1..md", "2..md", "3..md"].map((filename) => {
  const parsed = parseFrontmatter(
    read(join(sourceDirectory, "posts", filename)),
  );
  return {
    title: parsed.attributes.title,
    date: parsed.attributes.date,
    body: parsed.body,
  };
});
const postIndex = read(join(sourceDirectory, "posts", "index.html"));
const postSlugs = unique(
  [...postIndex.matchAll(/href="\/blog\/([^"]+)"/g)].map(([, slug]) => slug),
);
const posts = postSlugs.map((slug) => {
  const post = postFiles.find(
    ({ title }) =>
      title
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") === slug,
  );

  if (!post) {
    throw new Error(`Could not match post source for ${slug}`);
  }

  return { slug, ...post };
});

const imageNames = unique(
  updates.flatMap(({ body }) =>
    [...body.matchAll(/!\[\[([^\]]+)\]\]/g)].map(([, name]) => name),
  ),
);
const palette = "@%#*+=-:. ";
const imageAscii = Object.fromEntries(
  imageNames.map((name) => {
    const sourcePath = join(newsletterDirectory, name);

    if (!existsSync(sourcePath)) {
      return [name, `[missing image: ${name}]`];
    }

    const [sourceWidth, sourceHeight] = execFileSync(
      "magick",
      ["identify", "-format", "%w %h", sourcePath],
      { encoding: "utf8" },
    )
      .trim()
      .split(/\s+/)
      .map(Number);
    const width = 36;
    const height = Math.max(
      5,
      Math.min(16, Math.round((width * sourceHeight * 0.45) / sourceWidth)),
    );
    const pixels = execFileSync("magick", [
      sourcePath,
      "-auto-orient",
      "-resize",
      `${width}x${height}!`,
      "-colorspace",
      "Gray",
      "-depth",
      "8",
      "gray:-",
    ]);
    const rows = [];

    for (let y = 0; y < height; y += 1) {
      let row = "";

      for (let x = 0; x < width; x += 1) {
        const value = pixels[y * width + x] ?? 255;
        row += palette[Math.round((value / 255) * (palette.length - 1))];
      }

      rows.push(row.replace(/\s+$/, ""));
    }

    return [name, rows.join("\n")];
  }),
);

const content = {
  home: {
    title: "natochi (╬`益´)",
    intro: [
      "dropout, 23yo, based in santiago de chile. focused on finding growth levers for: startups, ventures, and cool things ;).",
      "over the last 6 years i've built businesses, communities and fun stuff at the places i've worked.",
      "interests: ai safety, cognitive science, venture capital, community stuff & anything borges related.",
    ],
    current: {
      label: "~ currently @ platan.us",
      href: "https://platan.us/",
    },
    projects: [
      {
        label: "themis.lat",
        href: "https://themis.lat/",
        description:
          "tool to find corruption in chile's government contracting. came in 2nd out of 200 hackers (1k+ applicants).",
      },
      {
        label: "indies.la",
        href: "https://indies.la/",
        description:
          "biggest community of builders of latam. 2k members, hackathons and cool sponsors.",
      },
      {
        label: "kernel",
        href: "https://kernel.platan.us/",
        description: "angel squad for latam.",
      },
      {
        label: "amigos.sh",
        href: "https://amigos.sh/",
        description:
          "microgrant fund for young individuals addressing important problems.",
      },
      {
        label: "hack@latam",
        href: "https://hack.indies.la/",
        description:
          "biggest hackathon for social impact. 1.3k applicants. 6k in cash. 5 countries at the same time.",
      },
      {
        label: "platanus hack",
        href: "https://hack.platan.us/",
        description: "biggest irl hackathon in latam. 5 countries. 36 hrs.",
      },
      {
        label: "events",
        href: "https://luma.com/user/natochi",
        description:
          "i love doing meetups !! [u cannot imagine the money i spent on pizzas].",
      },
    ],
    media: [
      {
        label: "in search of lost time",
        href: "https://www.goodreads.com/book/show/18796.In_Search_of_Lost_Time",
        description: "marcel proust.",
      },
      {
        label: "sōsō no frieren",
        href: "https://myanimelist.net/anime/52991/Sousou_no_Frieren",
        description: "kanehito yamada.",
      },
    ],
    navigation: [
      { label: "updates", route: "/updates" },
      { label: "blog", route: "/posts" },
    ],
  },
  updates,
  posts,
  imageAscii,
};

writeFileSync(
  outputPath,
  `window.NATOCHI_CONTENT = ${JSON.stringify(content, null, 2)};\n`,
);

const routeShell = (route) => `<!doctype html>
<meta charset="utf-8">
<title>natochi.js</title>
<script>
sessionStorage.setItem("natochi-route", ${JSON.stringify(route)});
location.replace("/");
</script>
`;
const routeDirectories = [
  ...updates.map(({ date }) => [`updates/${date}`, `/updates/${date}`]),
  ...posts.map(({ slug }) => [`posts/${slug}`, `/posts/${slug}`]),
  ["updates", "/updates"],
  ["posts", "/posts"],
];

for (const [directory, route] of routeDirectories) {
  const outputDirectory = join(projectDirectory, directory);
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(join(outputDirectory, "index.html"), routeShell(route));
}

console.log(
  `Synced ${updates.length} updates, ${posts.length} posts and ${imageNames.length} ASCII images.`,
);
