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
    VISIBLE_POSTS: 11,
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
    <title>${postNumber}. ${title} - ${CONFIG.AUTHOR_NAME}</title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="../favicon.svg">
    <link rel="alternate icon" href="../favicon.ico">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://natochi.com/blog/${postNumber}.html">
    <meta property="og:title" content="${postNumber}. ${title} - ${CONFIG.AUTHOR_NAME}">
    <meta property="og:description" content="${title}">
    <meta property="og:image" content="https://natochi.com/og-image.png">
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="https://natochi.com/blog/${postNumber}.html">
    <meta property="twitter:title" content="${postNumber}. ${title} - ${CONFIG.AUTHOR_NAME}">
    <meta property="twitter:description" content="${title}">
    <meta property="twitter:image" content="https://natochi.com/og-image.png">
    
    <script>
        (function() {
            const savedTheme = localStorage.getItem('theme');
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
                document.documentElement.classList.add('dark-mode');
            }
        })();
    </script>
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle theme">
        <svg class="moon-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <polygon points="22 17 22 19 21 19 21 20 20 20 20 21 18 21 18 22 16 22 16 23 10 23 10 22 8 22 8 21 6 21 6 20 5 20 5 19 4 19 4 17 3 17 3 15 2 15 2 9 3 9 3 7 4 7 4 5 5 5 5 4 6 4 6 3 8 3 8 2 10 2 10 1 15 1 15 2 13 2 13 3 11 3 11 4 10 4 10 6 9 6 9 8 8 8 8 12 9 12 9 14 10 14 10 16 11 16 11 17 13 17 13 18 15 18 15 19 19 19 19 18 21 18 21 17 22 17"/>
        </svg>
        <svg class="sun-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
    </button>
    <button class="stamps-toggle" id="stamps-toggle" aria-label="Toggle stamps">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <polygon points="18 5 18 11 17 11 17 12 15 12 15 13 14 13 14 15 9 15 9 12 10 12 10 11 11 11 11 10 13 10 13 9 14 9 14 7 13 7 13 6 11 6 11 7 10 7 10 8 9 8 9 9 8 9 8 8 7 8 7 7 6 7 6 6 5 6 5 5 6 5 6 4 7 4 7 3 9 3 9 2 15 2 15 3 16 3 16 4 17 4 17 5 18 5"/>
            <polygon points="13 18 14 18 14 21 13 21 13 22 10 22 10 21 9 21 9 18 10 18 10 17 13 17 13 18"/>
        </svg>
        <span class="stamps-tooltip">with love from <a href="https://www.linkedin.com/in/trinidadmatta/" target="_blank" rel="noopener noreferrer">tonchi</a> !</span>
    </button>
    <div class="container">
        <div class="content">
            <div class="blog-post">
                <h2>${title}</h2>
                <div class="separator">-</div>
                <div class="blog-content">
${content}
                </div>
                <p class="date">${date}</p>
            </div>
            
            <div class="back-link">
                <a href="../index.html">../</a>
            </div>
        </div>
    </div>
    
    <footer class="stamps-footer">
        <div class="stamp" data-stamp="1" style="--rotation: -5deg;"><img src="../stamps/stamp1.PNG" alt="Stamp 1"></div>
        <div class="stamp" data-stamp="2" style="--rotation: 8deg;"><img src="../stamps/stamp2.PNG" alt="Stamp 2"></div>
        <div class="stamp" data-stamp="3" style="--rotation: -3deg;"><img src="../stamps/stamp3.PNG" alt="Stamp 3"></div>
        <div class="stamp" data-stamp="4" style="--rotation: 6deg;"><img src="../stamps/stamp4.PNG" alt="Stamp 4"></div>
        <div class="stamp" data-stamp="5" style="--rotation: -7deg;"><img src="../stamps/stamp5.PNG" alt="Stamp 5"></div>
        <div class="stamp" data-stamp="6" style="--rotation: 4deg;"><img src="../stamps/stamp6.PNG" alt="Stamp 6"></div>
        <div class="stamp" data-stamp="7" style="--rotation: -6deg;"><img src="../stamps/stamp7.PNG" alt="Stamp 7"></div>
        <div class="stamp" data-stamp="8" style="--rotation: 9deg;"><img src="../stamps/stamp8.PNG" alt="Stamp 8"></div>
        <div class="stamp" data-stamp="9" style="--rotation: -4deg;"><img src="../stamps/stamp9.PNG" alt="Stamp 9"></div>
        <div class="stamp" data-stamp="10" style="--rotation: 7deg;"><img src="../stamps/stamp10.PNG" alt="Stamp 10"></div>
        <div class="stamp" data-stamp="11" style="--rotation: -2deg;"><img src="../stamps/stamp11.PNG" alt="Stamp 11"></div>
        <div class="stamp" data-stamp="12" style="--rotation: 5deg;"><img src="../stamps/stamp12.PNG" alt="Stamp 12"></div>
        <div class="stamp" data-stamp="13" style="--rotation: -8deg;"><img src="../stamps/stamp13.PNG" alt="Stamp 13"></div>
        <div class="stamp" data-stamp="14" style="--rotation: 3deg;"><img src="../stamps/stamp14.PNG" alt="Stamp 14"></div>
        <div class="stamp" data-stamp="15" style="--rotation: -6deg;"><img src="../stamps/stamp15.PNG" alt="Stamp 15"></div>
        <div class="stamp" data-stamp="16" style="--rotation: 10deg;"><img src="../stamps/stamp16.PNG" alt="Stamp 16"></div>
        <div class="stamp" data-stamp="17" style="--rotation: -1deg;"><img src="../stamps/stamp17.PNG" alt="Stamp 17"></div>
        <div class="stamp" data-stamp="18" style="--rotation: 6deg;"><img src="../stamps/stamp18.PNG" alt="Stamp 18"></div>
    </footer>
    
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
        .map(post => `                <li><a href="blog/${post.filename}">${post.number}. ${post.title}</a></li>`)
        .join('\n');
    
    const listRegex = /<ul class="blog-list" id="all-posts-list">[\s\S]*?<\/ul>/;
    const newList = `<ul class="blog-list" id="all-posts-list">\n${postsList}\n            </ul>`;
    
    postsContent = postsContent.replace(listRegex, newList);
    fs.writeFileSync(postsPath, postsContent);
    
    console.log('✓ posts.html actualizado');
}

/**
 * Actualiza index.html con la lista de posts
 */
function updateIndex(posts) {
    let indexContent = fs.readFileSync(CONFIG.INDEX_PATH, 'utf-8');
    
    const visiblePosts = posts.slice(0, CONFIG.VISIBLE_POSTS);
    const hiddenPosts = posts.slice(CONFIG.VISIBLE_POSTS);
    
    const postsList = visiblePosts
        .map(post => `                <li><a href="blog/${post.filename}">${post.number}. ${post.title}</a></li>`)
        .join('\n');
    
    const listRegex = /<ul class="blog-list">[\s\S]*?<\/ul>/;
    const newList = `<ul class="blog-list">\n${postsList}\n            </ul>`;
    
    indexContent = indexContent.replace(listRegex, newList);
    fs.writeFileSync(CONFIG.INDEX_PATH, indexContent);
    
    updateScript(hiddenPosts);
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
