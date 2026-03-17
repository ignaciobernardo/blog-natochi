const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

// Configuración
const CONFIG = {
    POSTS_DIR: path.join(__dirname, 'posts'),
    BLOG_DIR: path.join(__dirname, 'blog'),
    INDEX_PATH: path.join(__dirname, 'index.html'),
    SCRIPT_PATH: path.join(__dirname, 'script.js'),
    VISIBLE_POSTS: 3,
    AUTHOR_NAME: 'Nacho'
};

// Inicializar directorio blog
if (!fs.existsSync(CONFIG.BLOG_DIR)) {
    fs.mkdirSync(CONFIG.BLOG_DIR, { recursive: true });
}

/**
 * Convierte sintaxis de Obsidian (![[imagen.png]]) a markdown estándar
 */
function convertObsidianSyntax(markdown) {
    return markdown.replace(
        /!\[\[([^\]]+)\]\]/g,
        (match, imageName) => {
            const cleanName = imageName.trim();
            return `\n\n![${cleanName}](../posts/${encodeURIComponent(cleanName)})\n\n`;
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
function generatePostHTML(title, content, date, postNumber) {
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${postNumber}. ${title} - natochi</title>

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="alternate icon" href="../favicon.ico">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://natochi.cv/blog/${postNumber}.html">
    <meta property="og:title" content="${postNumber}. ${title} - natochi">
    <meta property="og:description" content="${title}">
    <meta property="og:image" content="https://natochi.cv/og-image.png">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://natochi.cv/blog/${postNumber}.html">
    <meta property="twitter:title" content="${postNumber}. ${title} - natochi">
    <meta property="twitter:description" content="${title}">
    <meta property="twitter:image" content="https://natochi.cv/og-image.png">

    <link rel="stylesheet" href="../style.css">
</head>
<body class="blog-page">
    <a class="cal-link" href="https://cal.com/natochi" target="_blank" rel="noopener">tienes una <span>duda</span>?<br>sacame 30min</a>

    <div class="container">
        <div class="content">
            <div class="back-link">
                <a href="../index.html">&#8592; Index</a>
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
                    <a href="mailto:natochi@platan.us">Email</a>,
                    <a href="https://www.linkedin.com/in/natochi/" target="_blank" rel="noopener">LinkedIn</a>,
                    <a href="https://x.com/natochi_" target="_blank" rel="noopener">Twitter</a>,
                    <a href="https://www.instagram.com/ignaciobernardo/" target="_blank" rel="noopener">Instagram</a>
                </p>
            </footer>
        </div>
    </div>

    <script src="../script.js"></script>
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
    
    // Generar y guardar HTML
    const postHTML = generatePostHTML(title, html, date, postNumber);
    const postFileName = `${postNumber}.html`;
    const postFilePath = path.join(CONFIG.BLOG_DIR, postFileName);
    
    fs.writeFileSync(postFilePath, postHTML);
    
    console.log(`✓ Generado: ${postFileName} - ${title}`);
    
    return {
        number: postNumber,
        title,
        filename: postFileName,
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
 * Actualiza posts.html con todos los posts
 */
function updatePostsPage(allPosts) {
    const postsPath = path.join(__dirname, 'posts.html');
    if (!fs.existsSync(postsPath)) return;

    let postsContent = fs.readFileSync(postsPath, 'utf-8');

    const postsList = allPosts
        .map(post => `                <div class="post-row">
                    <a href="blog/${post.filename}" class="post-row-title">${post.title}</a>
                    <span class="post-row-date">${post.date}</span>
                </div>`)
        .join('\n');

    const listRegex = /<div class="post-list">[\s\S]*?<\/div>\n\s*\n/;
    const newList = `<div class="post-list">\n${postsList}\n            </div>\n\n`;

    postsContent = postsContent.replace(listRegex, newList);
    fs.writeFileSync(postsPath, postsContent);

    console.log('✓ posts.html actualizado');
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
        /<a href="blog\/\d+\.html" class="node-sibling" id="node-latest">/,
        `<a href="blog/${latest.filename}" class="node-sibling" id="node-latest">`
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
 * Función principal
 */
function main() {
    console.log('Generando posts...\n');
    
    const posts = processPosts();
    console.log(`\nTotal: ${posts.length} posts procesados\n`);
    
    if (posts.length > 0) {
        updateIndex(posts);
        updatePostsPage(posts);
        console.log('\n✓ Blog generado exitosamente!');
    } else {
        console.log('\n⚠ No se encontraron posts. Crea archivos .md en la carpeta posts/');
    }
}

// Ejecutar
main();
