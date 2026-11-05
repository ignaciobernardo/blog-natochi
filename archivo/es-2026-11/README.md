# es-2026-11

Los textos originales en español del blog y de las updates, tal como estaban
antes de pasarlos a inglés (noviembre de 2026).

- `posts/2..md`: seguir adelante (fuente de blog/seguir-adelante).
- `newsletter/*.md`: las updates publicadas, del 20 de abril al 13 de junio.
- `blog/spomenik`, `blog/angelsquad-for-latam` y `updates/primera-update`: sólo
  existían como HTML, se guardan así.

Para volver al español: copiar `posts/` y `newsletter/` encima de los del
repo, copiar los tres HTML a su lugar, correr `node generate.js` (dejando
aparte borradores que no se quieran publicar) y, para el árbol de la home,
volver a correr `tools/v20-posts.py` y `tools/v20-deploy.py` en natochi-city.
