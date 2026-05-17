#!/bin/bash

set -e
cd "$(dirname "$0")"

case "$1" in
  blog)
    echo "Building posts..."
    node generate.js

    git add blog/ posts/ index.html script.js style.css

    if git diff --cached --quiet; then
      echo "Nothing changed."
      exit 0
    fi

    TITLE=$(node -e "
      const fm = require('front-matter');
      const fs = require('fs');
      const files = fs.readdirSync('posts')
        .filter(f => f.endsWith('.md'))
        .sort((a,b) => fs.statSync('posts/'+b).mtimeMs - fs.statSync('posts/'+a).mtimeMs);
      if (files[0]) {
        const { attributes } = fm(fs.readFileSync('posts/'+files[0], 'utf-8'));
        process.stdout.write(attributes.title || files[0]);
      }
    " 2>/dev/null || echo "post")

    git commit -m "blog: ${TITLE} [$(date +%Y-%m-%d)]"
    git push
    echo "Done."
    ;;

  update)
    echo "Building updates..."
    node generate.js

    git add updates/ newsletter/ index.html

    if git diff --cached --quiet; then
      echo "Nothing changed."
      exit 0
    fi

    LATEST=$(ls newsletter/*.md 2>/dev/null | sort -r | head -1 | xargs basename .md 2>/dev/null || echo "update")
    git commit -m "update: $LATEST [$(date +%Y-%m-%d)]"
    git push
    echo "Done."
    ;;

  both)
    echo "Building..."
    node generate.js

    git add blog/ posts/ updates/ newsletter/ index.html script.js style.css

    if git diff --cached --quiet; then
      echo "Nothing changed."
      exit 0
    fi

    git commit -m "publish: blog + updates [$(date +%Y-%m-%d)]"
    git push
    echo "Done."
    ;;

  project)
    if [ -z "$2" ]; then
      echo "Usage: ./publish.sh project <folder>"
      echo "Example: ./publish.sh project mini/amigos"
      exit 1
    fi

    git add "$2/"

    if git diff --cached --quiet; then
      echo "Nothing changed in $2/"
      exit 0
    fi

    git commit -m "project: $2 [$(date +%Y-%m-%d)]"
    git push
    echo "Done."
    ;;

  *)
    echo ""
    echo "Usage: ./publish.sh <command>"
    echo ""
    echo "  blog             Build + push blog posts only"
    echo "  update           Build + push newsletter updates only"
    echo "  both             Build + push blog + updates"
    echo "  project <path>   Push a specific project folder"
    echo ""
    echo "Examples:"
    echo "  ./publish.sh blog"
    echo "  ./publish.sh update"
    echo "  ./publish.sh project mini/amigos"
    echo ""
    ;;
esac
