# Natochi editor portfolio — V2

V2 parte del snapshot congelado en `../natochi-editor-v1`. Sólo reemplaza el
documento del editor principal (panel derecho) y renombra su tab como
`natochi.js`.

## Comportamiento

- `/` muestra la presentación, proyectos, intereses y enlaces de Natochi.
- `/updates` lista las siete updates publicadas en el repositorio fuente.
- `/updates/YYYY-MM-DD` muestra cada update completa dentro de `natochi.js`.
- `/posts` lista los tres posts publicados.
- `/posts/SLUG` muestra cada post completo dentro de `natochi.js`.
- Los enlaces internos usan History API: la URL cambia sin desmontar el editor.
- Atrás y adelante del navegador funcionan.
- Las 38 fotografías de las updates fueron convertidas a ASCII de hasta 36
  caracteres de ancho. No se copiaron los archivos fotográficos pesados.
- Los enlaces se vuelven azules al hacer hover y también iluminan su número de
  línea.
- Ya no se fuerza un documento de 999 líneas: la cantidad se adapta a la ruta.
- Profile y Contact conservan el renderer de HTML con syntax highlighting del
  diseño original, usando los datos reales de Natochi.
- La preview permanece como estaba en V1.

## Ejecutar

```bash
cd '/Users/natochi/projects/old and small projects/brand experiments/natochi-editor-v2'
python3 -m http.server 4174
```

Abrir:

- `http://localhost:4174/`
- `http://localhost:4174/updates`
- `http://localhost:4174/posts`

Las carpetas de ruta contienen shells mínimos para que `/updates`, `/posts` y
sus páginas hijas también funcionen al abrirse directamente con el servidor
estático.

## Sincronizar contenido

El contenido publicado proviene de:

- `/Users/natochi/projects/blog-natochi/info/index.html`
- `/Users/natochi/projects/blog-natochi/newsletter/*.md`
- `/Users/natochi/projects/blog-natochi/posts/*.md`

Para regenerar `natochi-content.js`, las rutas estáticas y el arte ASCII:

```bash
node scripts/sync-natochi-content.mjs
```

El generador toma como fuente predeterminada
`/Users/natochi/projects/blog-natochi`. También acepta otra carpeta como primer
argumento.

## Archivos principales

- `index.html`: snapshot estático original.
- `portfolio-overrides.css`: presentación del editor y estados interactivos.
- `portfolio-overrides.js`: navegación dentro de `natochi.js`.
- `natochi-content.js`: contenido sincronizado y arte ASCII precalculado.
- `scripts/sync-natochi-content.mjs`: generador reproducible.

Los cambios del repositorio fuente no fueron modificados.

La carpeta padre `brand experiments/` refleja esta V2 para que el servidor que
ya se ejecuta desde allí muestre el proyecto directamente en
`http://localhost:4174/`. El snapshot V1 continúa aislado en
`natochi-editor-v1/`.
