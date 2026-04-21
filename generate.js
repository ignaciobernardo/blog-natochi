const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

// Configuración
const CONFIG = {
    POSTS_DIR: path.join(__dirname, 'posts'),
    BLOG_DIR: path.join(__dirname, 'blog'),
    NEWSLETTER_DIR: path.join(__dirname, 'newsletter'),
    UPDATES_DIR: path.join(__dirname, 'updates'),
    INDEX_PATH: path.join(__dirname, 'index.html'),
    POSTS_PAGE_PATH: path.join(__dirname, 'posts', 'index.html'),
    NEWSLETTER_PAGE_PATH: path.join(__dirname, 'newsletter', 'index.html'),
    SCRIPT_PATH: path.join(__dirname, 'script.js'),
    VISIBLE_POSTS: 3,
    AUTHOR_NAME: 'Nacho'
};

// Inicializar directorios
if (!fs.existsSync(CONFIG.BLOG_DIR)) {
    fs.mkdirSync(CONFIG.BLOG_DIR, { recursive: true });
}
if (!fs.existsSync(CONFIG.UPDATES_DIR)) {
    fs.mkdirSync(CONFIG.UPDATES_DIR, { recursive: true });
}

/**
 * Genera un slug URL-friendly a partir de un título
 */
function slugify(title) {
    return title
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^a-z0-9\s-]/g, '')  // remove non-alphanumeric
        .trim()
        .replace(/\s+/g, '-')          // spaces to hyphens
        .replace(/-+/g, '-');           // collapse multiple hyphens
}

/**
 * Convierte sintaxis de Obsidian (![[imagen.png]]) a markdown estándar
 */
function convertObsidianSyntax(markdown) {
    return markdown.replace(
        /!\[\[([^\]]+)\]\]/g,
        (match, imageName) => {
            const cleanName = imageName.trim();
            return `\n\n![${cleanName}](/posts/${encodeURIComponent(cleanName)})\n\n`;
        }
    );
}

/**
 * Procesa imágenes HTML y las envuelve en contenedor centrado
 */
function processImages(html) {
    return html.replace(
        /<img src="([^"]+)" alt="([^"]*)"(?:\s+title="([^"]*)")?>/g,
        '<div class="image-container"><img src="$1" alt="$2" title="$3"></div>'
    );
}

/**
 * Si el string es YYYY-MM-DD, lo devuelve como "apr 20". Si no, lo deja igual.
 */
function formatNewsletterTitle(raw) {
    const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return raw;
    const month = months[parseInt(match[2], 10) - 1];
    const day = parseInt(match[3], 10);
    return `${month} ${day}`;
}

/**
 * Formatea la fecha al formato requerido
 */
function formatDate(date) {
    const dateStr = typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)
        ? date
        : new Date(date).toISOString().split('T')[0];

    return dateStr;
}

/**
 * Genera el HTML completo de un post
 */
function generatePostHTML(title, content, date, postNumber, slug) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${postNumber}. ${title} - natochi</title>

    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/favicon.png">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://natochi.cv/blog/${slug}">
    <meta property="og:title" content="${postNumber}. ${title} - natochi">
    <meta property="og:description" content="${title}">
    <meta property="og:image" content="https://natochi.cv/og-image.png">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://natochi.cv/blog/${slug}">
    <meta property="twitter:title" content="${postNumber}. ${title} - natochi">
    <meta property="twitter:description" content="${title}">
    <meta property="twitter:image" content="https://natochi.cv/og-image.png">

    <link rel="stylesheet" href="/style.css">
</head>
<body class="blog-page">
    <a class="cal-link" href="https://cal.com/natochi" target="_blank" rel="noopener">got a <span>question</span>?<br>book 30min</a>

    <div class="container">
        <div class="content">
            <div class="back-link">
                <a href="/">&#8592; Index</a>
            </div>

            <div class="blog-post">
                <h1>${title}</h1>
                <p class="date">${date}</p>
                <div class="blog-content">
${content}
                </div>
            </div>

            <footer class="post-footer">
                <hr class="post-separator">
                <p class="post-socials">
                    <span class="socials-label">[&#8599;]:</span>
                    <a href="mailto:ernesto@indies.cl">Email</a>,
                    <a href="https://www.linkedin.com/in/natochi/" target="_blank" rel="noopener">LinkedIn</a>,
                    <a href="https://x.com/natochi_" target="_blank" rel="noopener">Twitter</a>,
                    <a href="https://www.instagram.com/ignaciobernardo/" target="_blank" rel="noopener">Instagram</a>
                </p>
            </footer>
        </div>
    </div>

    <script src="/script.js"></script>
</body>
</html>`;
}

/**
 * Procesa un archivo markdown y genera el post HTML
 */
function processPostFile(file, index, totalFiles) {
    const filePath = path.join(CONFIG.POSTS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { attributes, body } = frontMatter(content);

    // Convertir sintaxis Obsidian y procesar markdown
    const markdownBody = convertObsidianSyntax(body);
    let html = marked.parse(markdownBody);
    html = processImages(html);

    // Extraer metadatos
    const title = attributes.title || path.basename(file, '.md');
    const date = formatDate(attributes.date || new Date());
    const postNumber = totalFiles - index;
    const slug = attributes.slug || slugify(title);

    // Crear directorio para el post y guardar HTML
    const postDir = path.join(CONFIG.BLOG_DIR, slug);
    if (!fs.existsSync(postDir)) {
        fs.mkdirSync(postDir, { recursive: true });
    }

    const postHTML = generatePostHTML(title, html, date, postNumber, slug);
    const postFilePath = path.join(postDir, 'index.html');

    fs.writeFileSync(postFilePath, postHTML);

    console.log(`✓ Generado: blog/${slug}/index.html - ${title}`);

    return {
        number: postNumber,
        title,
        slug,
        date
    };
}

/**
 * Lee y procesa todos los posts de la carpeta posts/
 */
function processPosts() {
    if (!fs.existsSync(CONFIG.POSTS_DIR)) {
        console.log('Carpeta posts/ no existe. Creándola...');
        fs.mkdirSync(CONFIG.POSTS_DIR, { recursive: true });
        return [];
    }

    const files = fs.readdirSync(CONFIG.POSTS_DIR)
        .filter(file => file.endsWith('.md'))
        .sort((a, b) => {
            const statA = fs.statSync(path.join(CONFIG.POSTS_DIR, a));
            const statB = fs.statSync(path.join(CONFIG.POSTS_DIR, b));
            return statB.mtimeMs - statA.mtimeMs;
        });

    const posts = files.map((file, index) =>
        processPostFile(file, index, files.length)
    );

    return posts.sort((a, b) => b.number - a.number);
}

/**
 * Actualiza script.js con los posts ocultos
 */
function updateScript(hiddenPosts) {
    let scriptContent = fs.readFileSync(CONFIG.SCRIPT_PATH, 'utf-8');

    const moreEntries = hiddenPosts.map(post => ({
        num: post.number,
        title: post.title
    }));

    const entriesArray = `const moreEntries = ${JSON.stringify(moreEntries, null, 4)};`;
    const entriesRegex = /const moreEntries = \[[\s\S]*?\];/;

    scriptContent = scriptContent.replace(entriesRegex, entriesArray);
    fs.writeFileSync(CONFIG.SCRIPT_PATH, scriptContent);

    console.log('✓ script.js actualizado');
}

/**
 * Actualiza posts/index.html con todos los posts
 */
function updatePostsPage(allPosts) {
    if (!fs.existsSync(CONFIG.POSTS_PAGE_PATH)) return;

    let postsContent = fs.readFileSync(CONFIG.POSTS_PAGE_PATH, 'utf-8');

    const postsList = allPosts
        .map(post => `                <div class="post-row">
                    <a href="/blog/${post.slug}" class="post-row-title">${post.title}</a>
                    <span class="post-row-date">${post.date}</span>
                </div>`)
        .join('\n');

    const listRegex = /<div class="post-list">[\s\S]*?<\/div>\n\s*\n/;
    const newList = `<div class="post-list">\n${postsList}\n            </div>\n\n`;

    postsContent = postsContent.replace(listRegex, newList);
    fs.writeFileSync(CONFIG.POSTS_PAGE_PATH, postsContent);

    console.log('✓ posts/index.html actualizado');
}

/**
 * Actualiza index.html con la lista de posts
 */
function updateIndex(posts) {
    if (posts.length === 0) return;

    let indexContent = fs.readFileSync(CONFIG.INDEX_PATH, 'utf-8');
    const latest = posts[0];

    // Update the LATEST node link and description
    indexContent = indexContent.replace(
        /<a href="\/blog\/[^"]*" class="node-sibling" id="node-latest">/,
        `<a href="/blog/${latest.slug}" class="node-sibling" id="node-latest">`
    );
    // Update the node-desc inside node-latest
    indexContent = indexContent.replace(
        /(<a[^>]*id="node-latest"[^>]*>[\s\S]*?<p class="node-desc">)(.*?)(<\/p>)/,
        `$1${latest.title}$3`
    );

    fs.writeFileSync(CONFIG.INDEX_PATH, indexContent);
    console.log('✓ index.html actualizado');
}

/**
 * Genera el HTML completo de una entrada de newsletter
 */
function generateNewsletterHTML(title, content, date, slug) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - natochi</title>

    <link rel="icon" type="image/png" href="/favicon.png">

    <meta property="og:type" content="article">
    <meta property="og:url" content="https://natochi.cv/updates/${slug}">
    <meta property="og:title" content="${title} - natochi">
    <meta property="og:description" content="${title}">
    <meta property="og:image" content="https://natochi.cv/og-image.png">

    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://natochi.cv/updates/${slug}">
    <meta property="twitter:title" content="${title} - natochi">
    <meta property="twitter:description" content="${title}">
    <meta property="twitter:image" content="https://natochi.cv/og-image.png">

    <link rel="stylesheet" href="/style.css">
</head>
<body class="blog-page">
    <a class="cal-link" href="https://cal.com/natochi" target="_blank" rel="noopener">got a <span>question</span>?<br>book 30min</a>

    <div class="container">
        <div class="content">
            <div class="back-link">
                <a href="/newsletter">&#8592; Newsletter</a>
            </div>

            <div class="blog-post">
                <h1>${title}</h1>
                <p class="date">${date}</p>
                <div class="blog-content">
${content}
                </div>
            </div>

            <footer class="post-footer">
                <hr class="post-separator">
                <p class="post-socials">
                    <span class="socials-label">[&#8599;]:</span>
                    <a href="mailto:ernesto@indies.cl">Email</a>,
                    <a href="https://www.linkedin.com/in/natochi/" target="_blank" rel="noopener">LinkedIn</a>,
                    <a href="https://x.com/natochi_" target="_blank" rel="noopener">Twitter</a>,
                    <a href="https://www.instagram.com/ignaciobernardo/" target="_blank" rel="noopener">Instagram</a>
                </p>
            </footer>
        </div>
    </div>

    <script src="/script.js"></script>
</body>
</html>`;
}

/**
 * Procesa un archivo markdown de newsletter y genera su HTML
 */
function processNewsletterFile(file, index, totalFiles) {
    const filePath = path.join(CONFIG.NEWSLETTER_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const { attributes, body } = frontMatter(content);

    const markdownBody = convertObsidianSyntax(body);
    let html = marked.parse(markdownBody);
    html = processImages(html);

    const rawTitle = attributes.title || path.basename(file, '.md');
    const title = formatNewsletterTitle(rawTitle);
    const date = formatDate(attributes.date || path.basename(file, '.md') || new Date());
    const slug = attributes.slug || slugify(rawTitle);

    const entryDir = path.join(CONFIG.UPDATES_DIR, slug);
    if (!fs.existsSync(entryDir)) {
        fs.mkdirSync(entryDir, { recursive: true });
    }

    const entryHTML = generateNewsletterHTML(title, html, date, slug);
    fs.writeFileSync(path.join(entryDir, 'index.html'), entryHTML);

    console.log(`✓ Generado: updates/${slug}/index.html - ${title}`);

    return { title, slug, date };
}

/**
 * Lee y procesa todos los archivos de newsletter/
 */
function processNewsletters() {
    if (!fs.existsSync(CONFIG.NEWSLETTER_DIR)) return [];

    const files = fs.readdirSync(CONFIG.NEWSLETTER_DIR)
        .filter(file => file.endsWith('.md'))
        .sort((a, b) => {
            const statA = fs.statSync(path.join(CONFIG.NEWSLETTER_DIR, a));
            const statB = fs.statSync(path.join(CONFIG.NEWSLETTER_DIR, b));
            return statB.mtimeMs - statA.mtimeMs;
        });

    return files.map((file, index) =>
        processNewsletterFile(file, index, files.length)
    );
}

/**
 * Actualiza newsletter/index.html con todas las entradas
 */
function updateNewsletterPage(allEntries) {
    if (!fs.existsSync(CONFIG.NEWSLETTER_PAGE_PATH)) return;

    let pageContent = fs.readFileSync(CONFIG.NEWSLETTER_PAGE_PATH, 'utf-8');

    const entriesList = allEntries
        .map(entry => `                <div class="post-row">
                    <a href="/updates/${entry.slug}" class="post-row-title">${entry.title}</a>
                    <span class="post-row-date">${entry.date}</span>
                </div>`)
        .join('\n');

    const listRegex = /<div class="post-list">[\s\S]*?<\/div>\n\s*\n/;
    const newList = `<div class="post-list">\n${entriesList}\n            </div>\n\n`;

    pageContent = pageContent.replace(listRegex, newList);
    fs.writeFileSync(CONFIG.NEWSLETTER_PAGE_PATH, pageContent);

    console.log('✓ newsletter/index.html actualizado');
}

/**
 * Actualiza el nodo newsletter en index.html con la última entrada
 */
function updateNewsletterNode(entries) {
    if (entries.length === 0) return;

    let indexContent = fs.readFileSync(CONFIG.INDEX_PATH, 'utf-8');
    const latest = entries[0];

    indexContent = indexContent.replace(
        /<a href="[^"]*" class="node-sibling" id="node-newsletter">/,
        `<a href="/updates/${latest.slug}" class="node-sibling" id="node-newsletter">`
    );
    indexContent = indexContent.replace(
        /(<a[^>]*id="node-newsletter"[^>]*>[\s\S]*?<p class="node-desc">)(.*?)(<\/p>)/,
        `$1${latest.title}$3`
    );

    fs.writeFileSync(CONFIG.INDEX_PATH, indexContent);
    console.log('✓ Newsletter node actualizado en index.html');
}

/**
 * Limpia archivos .html viejos en blog/ (los de formato N.html)
 */
function cleanOldBlogFiles() {
    const files = fs.readdirSync(CONFIG.BLOG_DIR);
    for (const file of files) {
        if (file.match(/^\d+\.html$/)) {
            fs.unlinkSync(path.join(CONFIG.BLOG_DIR, file));
            console.log(`✗ Eliminado viejo: blog/${file}`);
        }
    }
}

/**
 * Función principal
 */
function main() {
    console.log('Generando...\n');

    cleanOldBlogFiles();

    const posts = processPosts();
    console.log(`\nTotal posts: ${posts.length}\n`);

    if (posts.length > 0) {
        updatePostsPage(posts);
    }

    const newsletters = processNewsletters();
    console.log(`\nTotal newsletters: ${newsletters.length}\n`);

    if (newsletters.length > 0) {
        updateNewsletterPage(newsletters);
        updateNewsletterNode(newsletters);
    }

    console.log('\n✓ Generado exitosamente!');
}

// Ejecutar
main();
