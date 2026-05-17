Publica posts del blog o updates de newsletter.

Usa `./publish.sh` con el subcomando correcto:

- `./publish.sh blog`    — build + push solo posts del blog
- `./publish.sh update`  — build + push solo newsletter updates
- `./publish.sh both`    — build + push ambos
- `./publish.sh project mini/amigos` — push un proyecto puntual

El script hace git add solo de los archivos relevantes, nunca toca los proyectos en mini/ ni hack/ salvo que se llame explícitamente con `project`.

Si el usuario pide publicar un post o update, correr el subcomando correspondiente.
