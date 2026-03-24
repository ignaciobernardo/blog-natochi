Agrega grants, programs o fellowships a la página /for-my-friends del blog y pushea a GitHub.

El usuario te va a dar una o más entries con: URL, nombre, y descripción corta. Cada entry va en una de las 3 categorías: grants, programs, o fellowships.

Pasos:
1. Lee el archivo `for-my-friends/index.html`
2. Para cada entry, agrega una nueva fila dentro del `<div class="info-grid">` de la categoría correspondiente, usando este formato:
   ```html
   <a href="URL" target="_blank" rel="noopener" class="grid-title">nombre</a>
   <span class="grid-desc">descripción.</span>
   ```
3. Si una categoría tiene el placeholder "coming soon" / "...", reemplázalo con la primera entry real
4. Hace git add del archivo `for-my-friends/index.html`
5. Crea un commit con mensaje descriptivo de lo que se agregó
6. Pushea a origin main

Input del usuario: $ARGUMENTS
