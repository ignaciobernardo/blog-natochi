# Blog Minimalista

Blog generado automáticamente desde archivos Markdown con formato Obsidian.

## Cómo usar

1. **Crear un nuevo post**: Crea un archivo `.md` en la carpeta `posts/` con el siguiente formato:

```markdown
---
title: Título del Post
date: 2025-01-15
---

Tu contenido aquí en markdown.

![Descripción](ruta/imagen.jpg)
```

2. **Agregar imágenes**: Las imágenes se centran automáticamente. Puedes usar la sintaxis estándar de markdown:
   - `![alt text](ruta/imagen.jpg)` - Imagen centrada
   - Las imágenes deben estar en una carpeta accesible (por ejemplo, `images/`)

3. **Generar el blog**: Ejecuta:
   ```bash
   npm run generate
   ```

4. **Ver el blog**: Abre `index.html` en tu navegador o usa el servidor local.

## Formato Obsidian

El sistema soporta:
- Front matter (YAML) para título y fecha
- Markdown estándar
- Imágenes centradas automáticamente
- Enlaces
- Listas
- Y más...

## Numeración

Los posts se numeran automáticamente desde el 1, ordenados por fecha de modificación (más reciente = número más alto).

