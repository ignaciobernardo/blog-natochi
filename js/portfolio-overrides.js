(() => {
  const lineHeight = 15;
  const scriptUrl =
    document.currentScript?.src ||
    new URL("portfolio-overrides.js", window.location.href).href;
  const projectUrl = new URL(".", scriptUrl);
  const projectPath = projectUrl.pathname.replace(/\/$/, "");
  const placeholderUrl = new URL(
    "__---%20Fine%20Thought%20---___files/portfolio-placeholder.mp4",
    projectUrl,
  ).href;
  const content = window.NATOCHI_CONTENT;
  let currentRoute = "/";
  let isApplying = false;
  let lastTouchY = null;
  let staticChromeBound = false;

  const profileCopy = [
    "I’m Ernesto Ignacio “Nacho” Bernardo — a Chilean founder, generalist and community builder based in Santiago, working across Latin America.",
    "I founded Amigos Fund, advise Zavu, work as a generalist at Platanus, and co-founded Indies.cl — LatAm’s largest builder community, with more than 3,000 members.",
    "At Platanus I lead ecosystem initiatives: the region’s largest hackathon, with more than 100,000 USD in sponsorships and 70,000 USD in credits, plus an angel co-investing program that secured 42,000 USD in six days.",
    "Before that, I closed more than 3 million USD in contracts at Asimov and built my first business at 17, scaling it to more than 250,000 in sales.",
  ];
  const contactLinks = [
    ["Email — ernesto@indies.cl", "mailto:ernesto@indies.cl"],
    ["LinkedIn — /in/natochi", "https://www.linkedin.com/in/natochi/"],
    ["X — @natochi_", "https://x.com/natochi_"],
    ["Book 30 minutes", "https://cal.com/natochi"],
    ["View full CV", "https://natochi.cv/cv/"],
  ];

  const escapeHtml = (value) =>
    value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        })[character],
    );

  const wrapCodeText = (value, maxLength) => {
    const words = value.split(/\s+/);
    const lines = [];
    let current = "";

    words.forEach((word) => {
      if (!current || current.length + word.length + 1 <= maxLength) {
        current = current ? `${current} ${word}` : word;
      } else {
        lines.push(current);
        current = word;
      }
    });

    if (current) {
      lines.push(current);
    }

    return lines;
  };

  const syntaxIndent = (count) => "&nbsp;".repeat(count);

  const syntaxTag = (indent, tag, attributes = "", closing = false) =>
    `${syntaxIndent(indent)}<span class="code">&lt;${closing ? "/" : ""}${tag}${
      attributes ? ` ${attributes}` : ""
    }&gt;</span>`;

  const syntaxAttribute = (name, value) =>
    `<span class="attribute">${name}</span>=<span class="attribute-value">"${escapeHtml(value)}"</span>`;

  const buildInfoSyntax = ({
    comment,
    className,
    heading,
    entries,
    charactersPerLine,
  }) => {
    const lines = [
      `<span class="comment">&lt;!-- ${escapeHtml(comment)} --&gt;</span>`,
      syntaxTag(0, "section", syntaxAttribute("class", className)),
      syntaxTag(2, "h3"),
      `${syntaxIndent(4)}${escapeHtml(heading)}`,
      syntaxTag(2, "h3", "", true),
    ];

    entries.forEach(({ text, href }) => {
      const tag = href ? "a" : "p";
      const attributes = href ? syntaxAttribute("href", href) : "";
      lines.push(syntaxTag(2, tag, attributes));
      wrapCodeText(text, charactersPerLine).forEach((wrappedLine) => {
        const renderedText = `${syntaxIndent(4)}${escapeHtml(wrappedLine)}`;

        if (href) {
          lines.push(
            `<a class="portfolio-info-code-anchor" href="${escapeHtml(href)}" target="_blank" rel="noopener">${renderedText}</a>`,
          );
        } else {
          lines.push(renderedText);
        }
      });
      lines.push(syntaxTag(2, tag, "", true), "");
    });

    lines.push(syntaxTag(0, "section", "", true));
    return `<span class="portfolio-info-code-content">${lines.join("<br>")}</span>`;
  };

  const getScroller = () => document.querySelector(".c-page");

  const scrollByDelta = (delta) => {
    const scroller = getScroller();

    if (!scroller) {
      return;
    }

    const maxScroll = scroller.scrollHeight - scroller.clientHeight;
    scroller.scrollTop = Math.max(
      0,
      Math.min(maxScroll, scroller.scrollTop + delta),
    );
  };

  window.addEventListener(
    "wheel",
    (event) => {
      if (event.target.closest(".c-gui__panel--info")) {
        return;
      }

      const scroller = getScroller();

      if (!scroller || scroller.scrollHeight <= scroller.clientHeight) {
        return;
      }

      const multiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? lineHeight
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? scroller.clientHeight
            : 1;

      event.preventDefault();
      event.stopImmediatePropagation();
      scrollByDelta(event.deltaY * multiplier);
    },
    { capture: true, passive: false },
  );

  window.addEventListener(
    "touchstart",
    (event) => {
      lastTouchY = event.touches[0]?.clientY ?? null;
    },
    { capture: true, passive: true },
  );

  window.addEventListener(
    "touchmove",
    (event) => {
      if (event.target.closest(".c-gui__panel--info")) {
        return;
      }

      const nextY = event.touches[0]?.clientY;

      if (lastTouchY === null || nextY === undefined) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      scrollByDelta(lastTouchY - nextY);
      lastTouchY = nextY;
    },
    { capture: true, passive: false },
  );

  window.addEventListener(
    "touchend",
    () => {
      lastTouchY = null;
    },
    { capture: true, passive: true },
  );

  window.addEventListener(
    "keydown",
    (event) => {
      const scroller = getScroller();

      if (
        !scroller ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")
      ) {
        return;
      }

      const deltas = {
        ArrowDown: lineHeight * 3,
        ArrowUp: -lineHeight * 3,
        PageDown: scroller.clientHeight * 0.9,
        PageUp: -scroller.clientHeight * 0.9,
        Home: -scroller.scrollHeight,
        End: scroller.scrollHeight,
        " ": event.shiftKey
          ? -scroller.clientHeight * 0.9
          : scroller.clientHeight * 0.9,
      };

      if (!(event.key in deltas)) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      scrollByDelta(deltas[event.key]);
    },
    { capture: true },
  );

  const ensureInfoContent = () => {
    const infoPanel = document.querySelector(".c-gui__panel--info");
    const activeTab = infoPanel
      ?.querySelector(
        ".c-gui__panel__section .c-gui__panel__header__tabs__tab.state-active",
      )
      ?.textContent.trim();
    const editor = infoPanel?.querySelector(
      ".c-gui__panel__section .c-editor__ascii",
    );

    if (!editor || !/^(Profile|Contact)$/.test(activeTab || "")) {
      return;
    }

    const width = Math.round(editor.getBoundingClientRect().width);
    const charactersPerLine = Math.max(
      24,
      Math.floor(Math.max(width, 320) / 7.2) - 7,
    );
    const signature = `${activeTab}:${width}:${charactersPerLine}`;

    if (
      editor.dataset.portfolioContent === signature &&
      editor.querySelector(".portfolio-info-code-content")
    ) {
      return;
    }

    editor.classList.add("portfolio-info-code");

    if (activeTab === "Profile") {
      editor.innerHTML = buildInfoSyntax({
        comment: "start .scope-profile",
        className: "scope-profile",
        heading: "PROFILE",
        entries: profileCopy.map((text) => ({ text })),
        charactersPerLine,
      });
    } else {
      editor.innerHTML = buildInfoSyntax({
        comment: "start .scope-contact",
        className: "scope-contact",
        heading: "GET IN TOUCH",
        entries: [
          {
            text: "Based in Santiago, Chile. Always open to meeting builders, founders and teams working on ambitious ideas across Latin America.",
          },
          {
            text: "Email me, find me online, or book a 30-minute conversation.",
          },
          ...contactLinks.map(([text, href]) => ({ text, href })),
        ],
        charactersPerLine,
      });
    }

    editor.dataset.portfolioContent = signature;
  };

  const bindStaticChrome = () => {
    if (staticChromeBound) {
      return;
    }

    const infoPanel = document.querySelector(".c-gui__panel--info");
    const sidebarButton = document.querySelector(
      ".c-gui__panel__header__button--sidebar",
    );
    const closeButton = document.querySelector(
      ".c-gui__panel__header__button--close",
    );
    const lightButton = document.querySelector(
      ".c-gui__panel__header__button--light-mode",
    );
    const infoTabs = infoPanel?.querySelectorAll(
      ".c-gui__panel__section:first-child .c-gui__panel__header__tabs__tab",
    );
    const infoScroller = infoPanel?.querySelector(
      ".c-gui__panel__section:first-child .c-gui__panel__content--scroll",
    );

    if (
      !infoPanel ||
      !sidebarButton ||
      !closeButton ||
      !lightButton ||
      !infoScroller ||
      !infoTabs?.length
    ) {
      return;
    }

    let infoTouchY = null;

    infoPanel.addEventListener(
      "wheel",
      (event) => {
        if (!event.target.closest(".c-gui__panel__content--scroll")) {
          return;
        }

        const multiplier =
          event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? lineHeight
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
              ? infoScroller.clientHeight
              : 1;

        event.preventDefault();
        event.stopPropagation();
        infoScroller.scrollTop += event.deltaY * multiplier;
      },
      { capture: true, passive: false },
    );

    infoPanel.addEventListener(
      "touchstart",
      (event) => {
        infoTouchY = event.touches[0]?.clientY ?? null;
      },
      { capture: true, passive: true },
    );
    infoPanel.addEventListener(
      "touchmove",
      (event) => {
        const nextY = event.touches[0]?.clientY;

        if (
          !event.target.closest(".c-gui__panel__content--scroll") ||
          infoTouchY === null ||
          nextY === undefined
        ) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        infoScroller.scrollTop += infoTouchY - nextY;
        infoTouchY = nextY;
      },
      { capture: true, passive: false },
    );
    infoPanel.addEventListener(
      "touchend",
      () => {
        infoTouchY = null;
      },
      { capture: true, passive: true },
    );

    const setSidebarOpen = (open) => {
      document.documentElement.classList.toggle("state-info-open", open);
      sidebarButton.classList.toggle("state-info-open", open);
      sidebarButton.setAttribute(
        "aria-label",
        open ? "Close sidebar" : "Open sidebar",
      );

      if (open) {
        window.requestAnimationFrame(() => {
          ensureInfoContent();
        });
      }

      const syncMainDocument = () => {
        const page = document.querySelector(".portfolio-code-page");

        if (page) {
          syncLineNumbers(page);
        }
      };

      window.requestAnimationFrame(syncMainDocument);
      window.setTimeout(syncMainDocument, 350);
    };

    sidebarButton.addEventListener("click", () => {
      setSidebarOpen(
        !document.documentElement.classList.contains("state-info-open"),
      );
    });
    closeButton.addEventListener("click", () => setSidebarOpen(false));
    lightButton.addEventListener("click", () => {
      const isLight = document.documentElement.classList.toggle(
        "state-light-mode",
      );
      lightButton.setAttribute(
        "aria-label",
        isLight ? "Switch to dark mode" : "Switch to light mode",
      );
    });

    infoTabs.forEach((tab) => {
      tab.setAttribute("role", "button");
      tab.setAttribute("tabindex", "0");

      const activate = () => {
        infoTabs.forEach((candidate) => {
          candidate.classList.toggle("state-active", candidate === tab);
        });
        const editor = infoPanel.querySelector(
          ".c-gui__panel__section:first-child .c-editor__ascii",
        );

        if (editor) {
          delete editor.dataset.portfolioContent;
        }

        ensureInfoContent();
      };

      tab.addEventListener("click", activate);
      tab.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });

    staticChromeBound = true;
  };

  const normalizeRoute = (path) => {
    let route = path || "/";

    if (projectPath && route.startsWith(projectPath)) {
      route = route.slice(projectPath.length) || "/";
    }

    route = `/${route.replace(/^\/+|\/+$/g, "")}`;
    return route === "/" ? route : route.replace(/\/+$/, "");
  };

  const routeUrl = (route) =>
    `${projectPath}${route === "/" ? "/" : route}` || "/";

  const createLine = (page, text = "", modifier = "") => {
    const line = document.createElement("div");
    line.className = `portfolio-code-line${modifier ? ` portfolio-code-line--${modifier}` : ""}`;
    line.textContent = text || "\u00a0";
    page.append(line);
    return line;
  };

  const createSyntaxLine = (page, segments, modifier = "") => {
    const line = createLine(page, "", modifier);
    line.textContent = "";

    segments.forEach(({ text, className = "" }) => {
      const span = document.createElement("span");
      span.textContent = text;

      if (className) {
        span.className = className;
      }

      line.append(span);
    });

    return line;
  };

  const createLink = ({ label, href, route, tokenClass = "" }) => {
    const link = document.createElement("a");
    link.className = `portfolio-code-link${tokenClass ? ` ${tokenClass}` : ""}`;
    link.textContent = label;

    if (route) {
      link.href = routeUrl(route);
      link.dataset.route = route;
    } else {
      link.href = href;

      if (/^https?:/i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener";
      }
    }

    return link;
  };

  const addLinkLine = (page, options, prefix = "", suffix = "") => {
    const line = createLine(page);
    line.textContent = "";

    if (prefix) {
      line.append(document.createTextNode(prefix));
    }

    line.append(createLink(options));

    if (suffix) {
      line.append(document.createTextNode(suffix));
    }

    return line;
  };

  const appendInlineMarkdown = (line, source) => {
    const pattern =
      /\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)]+)\)|(https?:\/\/[^\s]+)/g;
    let cursor = 0;
    let match;

    while ((match = pattern.exec(source))) {
      const preceding = source
        .slice(cursor, match.index)
        .replace(/(\*\*|__|\*|_)/g, "");
      line.append(document.createTextNode(preceding));
      const href = match[2] || match[3];
      const label = match[1] || match[3];
      const isLocalRoute = href.startsWith("/");
      line.append(
        createLink({
          label,
          href,
          route: isLocalRoute ? normalizeRoute(href) : undefined,
        }),
      );
      cursor = match.index + match[0].length;
    }

    line.append(
      document.createTextNode(
        source.slice(cursor).replace(/(\*\*|__|\*|_)/g, ""),
      ),
    );
  };

  const renderMarkdown = (page, markdown) => {
    markdown.split(/\r?\n/).forEach((sourceLine) => {
      const image = sourceLine.trim().match(/^!\[\[([^\]]+)\]\]$/);

      if (image) {
        const [, name] = image;
        createLine(page, `// ${name}`, "comment");
        const ascii = content.imageAscii[name] || `[missing image: ${name}]`;
        ascii.split("\n").forEach((row) => {
          createLine(page, row, "ascii");
        });
        return;
      }

      if (!sourceLine.trim()) {
        createLine(page);
        return;
      }

      const isSeparator = /^-{3,}$/.test(sourceLine.trim());
      const line = createLine(
        page,
        "",
        isSeparator ? "comment" : "",
      );
      line.textContent = "";
      appendInlineMarkdown(line, isSeparator ? "// ---" : sourceLine);
    });
  };

  const renderHome = (page) => {
    const home = content.home;
    const syntax = (text, className = "") => ({ text, className });
    const string = (value) => syntax(JSON.stringify(value), "attribute-value");
    const property = (value) => syntax(value, "attribute");
    const punctuation = (value) =>
      syntax(value, "portfolio-token--punctuation");
    const addSyntaxLink = ({ indent, key, label, href, route, suffix = "," }) => {
      const line = createLine(page);
      line.textContent = "";
      line.append(
        document.createTextNode(indent),
        Object.assign(document.createElement("span"), {
          className: "attribute",
          textContent: key,
        }),
        document.createTextNode(': "'),
        createLink({
          label,
          href,
          route,
          tokenClass: "attribute-value",
        }),
        document.createTextNode(`"${suffix}`),
      );
    };

    createLine(page, "// natochi.js", "comment");
    createLine(page);
    createSyntaxLine(
      page,
      [
        syntax("const", "code"),
        punctuation(" natochi = {"),
      ],
      "title",
    );
    createSyntaxLine(page, [
      punctuation("  "),
      property("name"),
      punctuation(": "),
      string(home.title),
      punctuation(","),
    ]);
    createSyntaxLine(page, [
      punctuation("  "),
      property("profile"),
      punctuation(": ["),
    ]);
    home.intro.forEach((paragraph) => {
      createSyntaxLine(page, [
        punctuation("    "),
        string(paragraph),
        punctuation(","),
      ]);
    });
    createSyntaxLine(page, [punctuation("  ],")]);

    addSyntaxLink({
      indent: "  ",
      key: "currently",
      label: "platan.us",
      href: home.current.href,
    });
    createSyntaxLine(page, [
      punctuation("  "),
      property("projects"),
      punctuation(": ["),
    ]);

    home.projects.forEach((project) => {
      createSyntaxLine(page, [punctuation("    {")]);
      addSyntaxLink({
        indent: "      ",
        key: "name",
        label: project.label,
        href: project.href,
      });
      createSyntaxLine(page, [
        punctuation("      "),
        property("description"),
        punctuation(": "),
        string(project.description),
        punctuation(","),
      ]);
      createSyntaxLine(page, [punctuation("    },")]);
    });
    createSyntaxLine(page, [punctuation("  ],")]);

    createSyntaxLine(page, [
      punctuation("  "),
      property("readingAndWatching"),
      punctuation(": ["),
    ]);
    home.media.forEach((item) => {
      createSyntaxLine(page, [punctuation("    {")]);
      addSyntaxLink({
        indent: "      ",
        key: "title",
        label: item.label,
        href: item.href,
      });
      createSyntaxLine(page, [
        punctuation("      "),
        property("author"),
        punctuation(": "),
        string(item.description.replace(/\.$/, "")),
        punctuation(","),
      ]);
      createSyntaxLine(page, [punctuation("    },")]);
    });
    createSyntaxLine(page, [punctuation("  ],")]);

    createSyntaxLine(page, [
      punctuation("  "),
      property("routes"),
      punctuation(": {"),
    ]);
    home.navigation.forEach((item) => {
      addSyntaxLink({
        indent: "    ",
        key: item.label,
        label: item.route,
        route: item.route,
      });
    });
    createSyntaxLine(page, [punctuation("  },")]);
    createSyntaxLine(page, [punctuation("};")]);
  };

  const addLocalNavigation = (page, parentRoute) => {
    const line = createLine(page);
    line.textContent = "";
    line.append(
      createLink({
        label: `← ${parentRoute === "/updates" ? "updates" : "posts"}`,
        route: parentRoute,
      }),
      document.createTextNode("  "),
      createLink({ label: "home", route: "/" }),
    );
  };

  const renderUpdates = (page) => {
    createLine(page, "// natochi.js /updates", "comment");
    createLine(page);
    createLine(page, "~ updates.", "title");
    createLine(page);

    content.updates.forEach((update) => {
      addLinkLine(
        page,
        {
          label: update.label,
          route: `/updates/${update.date}`,
        },
        "→ ",
      );
      createLine(page, update.date, "description");
    });

    createLine(page);
    addLinkLine(page, { label: "← home", route: "/" });
  };

  const renderUpdate = (page, update) => {
    createLine(page, `// natochi.js /updates/${update.date}`, "comment");
    addLocalNavigation(page, "/updates");
    createLine(page);
    createLine(page, `~ ${update.label}.`, "title");
    createLine(page, update.date, "muted");
    createLine(page);
    renderMarkdown(page, update.body);
  };

  const renderPosts = (page) => {
    createLine(page, "// natochi.js /posts", "comment");
    createLine(page);
    createLine(page, "~ blog.", "title");
    createLine(page);

    content.posts.forEach((post) => {
      addLinkLine(
        page,
        {
          label: post.title,
          route: `/posts/${post.slug}`,
        },
        "→ ",
      );
      createLine(page, post.date, "description");
    });

    createLine(page);
    addLinkLine(page, { label: "← home", route: "/" });
  };

  const renderPost = (page, post) => {
    createLine(page, `// natochi.js /posts/${post.slug}`, "comment");
    addLocalNavigation(page, "/posts");
    createLine(page);
    createLine(page, post.title, "title");
    createLine(page, post.date, "muted");
    createLine(page);
    renderMarkdown(page, post.body);
  };

  const renderNotFound = (page) => {
    createLine(page, `// natochi.js ${currentRoute}`, "comment");
    createLine(page);
    createLine(page, "404 — nothing here.", "title");
    createLine(page);
    addLinkLine(page, { label: "← home", route: "/" });
  };

  const syncLineNumbers = (page) => {
    const inner = document.querySelector(".c-page__inner");
    const scroller = getScroller();
    const numberColumn = document.querySelector(
      ".c-page__lines-column .c-mono-type--line-nums",
    );

    if (!inner || !numberColumn || !scroller) {
      return;
    }

    const lines = [...page.querySelectorAll(".portfolio-code-line")];
    const bufferLines = 5;
    const viewportLines = Math.floor(scroller.clientHeight / lineHeight);
    const totalLines = Math.max(lines.length + bufferLines, viewportLines);
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < totalLines; index += 1) {
      const number = document.createElement("span");
      number.className = "portfolio-line-number";
      number.textContent = index + 1;

      if (lines[index]) {
        lines[index].dataset.line = index + 1;
        number.style.height = `${Math.max(
          lineHeight,
          lines[index].getBoundingClientRect().height,
        )}px`;
      }

      fragment.append(number);
    }

    numberColumn.replaceChildren(fragment);
    inner.style.setProperty("--natochi-lines", totalLines);
    inner.style.setProperty(
      "--natochi-document-height",
      `${Math.max(
        scroller.clientHeight,
        Math.ceil(page.getBoundingClientRect().height) +
          bufferLines * lineHeight,
      )}px`,
    );
  };

  const setLineHover = (line, active) => {
    const lineNumber = line?.dataset.line;

    if (!lineNumber) {
      return;
    }

    document
      .querySelector(
        `.portfolio-line-number:nth-child(${Number(lineNumber)})`,
      )
      ?.classList.toggle("state-link-hover", active);
  };

  const bindPageInteractions = (page) => {
    if (page.dataset.interactionsBound) {
      return;
    }

    const findLinkedLine = (event) =>
      event.target.closest(".portfolio-code-link")?.closest(
        ".portfolio-code-line",
      );

    page.addEventListener("pointerover", (event) => {
      setLineHover(findLinkedLine(event), true);
    });
    page.addEventListener("pointerout", (event) => {
      setLineHover(findLinkedLine(event), false);
    });
    page.addEventListener("focusin", (event) => {
      setLineHover(findLinkedLine(event), true);
    });
    page.addEventListener("focusout", (event) => {
      setLineHover(findLinkedLine(event), false);
    });
    page.addEventListener("click", (event) => {
      const link = event.target.closest(".portfolio-code-link[data-route]");

      if (!link) {
        return;
      }

      event.preventDefault();
      navigate(link.dataset.route);
    });
    page.dataset.interactionsBound = "true";
  };

  const renderRoute = (route, { resetScroll = false } = {}) => {
    const page = document.querySelector(".portfolio-code-page");

    if (!page || !content) {
      return;
    }

    currentRoute = normalizeRoute(route);
    page.replaceChildren();

    if (currentRoute === "/") {
      renderHome(page);
    } else if (currentRoute === "/updates") {
      renderUpdates(page);
    } else if (currentRoute.startsWith("/updates/")) {
      const date = currentRoute.split("/")[2];
      const update = content.updates.find((item) => item.date === date);
      update ? renderUpdate(page, update) : renderNotFound(page);
    } else if (currentRoute === "/posts") {
      renderPosts(page);
    } else if (
      currentRoute.startsWith("/posts/") ||
      currentRoute.startsWith("/blog/")
    ) {
      const slug = currentRoute.split("/")[2];
      const post = content.posts.find((item) => item.slug === slug);
      post ? renderPost(page, post) : renderNotFound(page);
    } else {
      renderNotFound(page);
    }

    page.dataset.route = currentRoute;
    requestAnimationFrame(() => syncLineNumbers(page));

    if (resetScroll) {
      getScroller()?.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  const navigate = (route) => {
    const nextRoute = normalizeRoute(route);

    if (nextRoute === currentRoute) {
      return;
    }

    window.history.pushState({}, "", routeUrl(nextRoute));
    renderRoute(nextRoute, { resetScroll: true });
  };

  const ensureCodePage = () => {
    const background = document.querySelector(".c-page__background");

    if (!background) {
      return;
    }

    background
      .querySelectorAll(
        ".portfolio-plain-index, .portfolio-procedural-extension, .portfolio-final-message",
      )
      .forEach((element) => element.remove());

    let page = background.querySelector(".portfolio-code-page");

    if (!page) {
      page = document.createElement("article");
      page.className = "portfolio-code-page";
      page.setAttribute("aria-label", "natochi.js");
      background.append(page);
      bindPageInteractions(page);
      renderRoute(currentRoute);
    }
  };

  const applyOverrides = () => {
    if (isApplying) {
      return;
    }

    isApplying = true;

    document
      .querySelectorAll(".c-gui__panel__header__tabs__tab")
      .forEach((tab) => {
        const label = tab.textContent.trim();

        if (/^(profile|contact)$/i.test(label)) {
          tab.classList.remove("portfolio-hidden-ui");
        }

        if (
          /^preview-.+\.js$/i.test(label) &&
          label !== "preview-placeholder.js"
        ) {
          tab.textContent = "preview-placeholder.js";
        }

        if (
          /^(nacho-bernardo|fine-thought)\.js$/i.test(label) ||
          label === "index.txt"
        ) {
          tab.textContent = "natochi.js";
        }
      });

    document.querySelectorAll("video").forEach((video) => {
      const source = video.currentSrc || video.src;

      if (source !== placeholderUrl) {
        video.src = placeholderUrl;
        video.load();
      }
    });

    ensureInfoContent();
    ensureCodePage();
    bindStaticChrome();
    queueMicrotask(() => {
      isApplying = false;
    });
  };

  const savedRoute = sessionStorage.getItem("natochi-route");
  sessionStorage.removeItem("natochi-route");
  currentRoute = normalizeRoute(savedRoute || window.location.pathname);

  if (savedRoute) {
    window.history.replaceState({}, "", routeUrl(currentRoute));
  }

  window.addEventListener("popstate", () => {
    renderRoute(window.location.pathname, { resetScroll: true });
  });
  window.addEventListener("resize", () => {
    applyOverrides();
    const page = document.querySelector(".portfolio-code-page");

    if (page) {
      requestAnimationFrame(() => syncLineNumbers(page));
    }
  });

  const startOverrides = () => {
    const observer = new MutationObserver(applyOverrides);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    applyOverrides();
  };

  if (document.readyState === "complete") {
    startOverrides();
  } else {
    window.addEventListener(
      "load",
      () => {
        startOverrides();
      },
      { once: true },
    );
  }
})();
