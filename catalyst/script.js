const ascii = document.querySelector("#ascii");
const headline = document.querySelector("#headline");
const asciiVideoSrc = "./assets/video/ascii-art.mp4";

function initThemeSwitcher() {
  if (document.documentElement.dataset.theme && !document.querySelector(".theme-switcher")) {
    return;
  }

  const savedTheme = window.localStorage.getItem("catalyst-theme");
  if (savedTheme && savedTheme !== "blue") {
    document.documentElement.dataset.theme = savedTheme;
  }

  document.querySelectorAll(".theme-swatch").forEach((button) => {
    button.addEventListener("click", () => {
      const theme = button.dataset.themeValue;
      if (!theme || theme === "blue") {
        document.documentElement.removeAttribute("data-theme");
        window.localStorage.setItem("catalyst-theme", "blue");
        return;
      }

      document.documentElement.dataset.theme = theme;
      window.localStorage.setItem("catalyst-theme", theme);
    });
  });
}

function initPeopleHover() {
  const image = document.querySelector(".people-active-image");
  const caption = document.querySelector(".people-active-caption");
  const rows = document.querySelectorAll(".person-row");

  if (!image || !caption || !rows.length) return;

  const selectRow = (row) => {
    const src = row.dataset.img;
    const text = row.dataset.caption;
    if (!src || !text) return;

    rows.forEach((item) => item.classList.remove("is-selected"));
    row.classList.add("is-selected");
    image.src = src;
    image.alt = text;
    caption.textContent = text;
  };

  rows.forEach((row) => {
    row.addEventListener("mouseenter", () => selectRow(row));
    row.addEventListener("focus", () => selectRow(row));
    row.addEventListener("click", () => {
      const url = row.dataset.linkedin;
      if (url) window.open(url, "_blank", "noopener");
    });
  });

  // --- mobile: the page is locked; scrolling the list updates the active person ---
  const list = document.querySelector(".people-list");
  const rowList = Array.from(rows);
  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

  function selectByScroll() {
    if (!isMobile() || !list) return;
    const refY = list.getBoundingClientRect().top + 6; // top of the list viewport
    let chosen = rowList[0];
    for (const row of rowList) {
      if (row.getBoundingClientRect().top <= refY + 2) chosen = row;
      else break;
    }
    if (chosen) selectRow(chosen);
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      selectByScroll();
      ticking = false;
    });
  }

  if (list) list.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", selectByScroll);
}

function renderStaticAscii() {
  if (!ascii) return;
  ascii.textContent = typeof CATALYST_ASCII === "string" ? CATALYST_ASCII : "";
}

function initVideoAscii() {
  if (!ascii || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    renderStaticAscii();
    return;
  }

  const video = document.createElement("video");
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const chars = " .:-=+*#%@";
  let frameRequest = 0;
  let lastRender = 0;

  if (!context) {
    renderStaticAscii();
    return;
  }

  video.src = asciiVideoSrc;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  video.style.display = "none";
  document.body.appendChild(video);

  // always show the static art first so the field is never blank,
  // even if the video can't play (autoplay blocked, file:// taint, black frame)
  renderStaticAscii();

  const setCanvasSize = () => {
    const columns = Math.max(80, Math.min(185, Math.floor(window.innerWidth / 9)));
    const rows = Math.max(48, Math.min(120, Math.floor(window.innerHeight / 10)));
    canvas.width = columns;
    canvas.height = rows;
  };

  const renderFrame = (time) => {
    frameRequest = window.requestAnimationFrame(renderFrame);

    if (time - lastRender < 66 || video.readyState < 2) return;
    lastRender = time;

    // scale the frame up and recenter: the art sits in the upper half of the video,
    // so we draw it bigger and shift it down to center the figure. drawing the full
    // source (no source-crop) keeps this safe even before video dimensions are known.
    const zoom = 1.7;
    const dW = canvas.width * zoom;
    const dH = canvas.height * zoom;
    const dx = (canvas.width - dW) / 2;
    // 0.245 ≈ the figure's vertical centroid in the frame, so it lands at canvas center.
    // Fixed value (not per-frame) → output height is constant → no jitter/shaking.
    const dy = canvas.height / 2 - 0.245 * dH;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(video, dx, dy, dW, dH);
    let data;
    try {
      ({ data } = context.getImageData(0, 0, canvas.width, canvas.height));
    } catch (err) {
      // canvas tainted (e.g. opened via file://) — fall back to static art
      window.cancelAnimationFrame(frameRequest);
      renderStaticAscii();
      return;
    }
    let output = "";
    let inkCount = 0;

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3] / 255;
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const brightness =
          (red * 0.2126 + green * 0.7152 + blue * 0.0722) *
          alpha;
        const distanceFromBlue = Math.hypot(red - 30, green - 65, blue - 180);

        if (distanceFromBlue < 38 || brightness < 78) {
          output += " ";
          continue;
        }

        inkCount += 1;
        const normalized = Math.max(brightness / 255, distanceFromBlue / 260);
        const charIndex = Math.floor(normalized * (chars.length - 1));
        output += chars[Math.max(0, Math.min(chars.length - 1, charIndex))];
      }
      output += "\n";
    }

    // skip near-empty frames (e.g. the black first frame) so we keep the static art
    if (inkCount > 40) ascii.textContent = output;
  };

  const start = () => {
    setCanvasSize();
    video.play().catch(renderStaticAscii);
    frameRequest = window.requestAnimationFrame(renderFrame);
  };

  video.addEventListener("loadeddata", start, { once: true });
  video.addEventListener("error", renderStaticAscii, { once: true });
  window.addEventListener("resize", setCanvasSize);
  window.addEventListener("pagehide", () => window.cancelAnimationFrame(frameRequest), { once: true });
}

function resizeHeadline() {
  if (!headline) return;

  const isMobile = window.innerWidth < 768;
  const targetWidth = isMobile ? window.innerWidth - 20 : window.innerWidth;
  const targetHeight = window.innerHeight * (isMobile ? 0.37 : 0.4);
  const maxSize = isMobile ? 48 : 360;
  let size = 10;

  headline.style.fontSize = `${size}px`;

  while (
    (isMobile || headline.scrollWidth < targetWidth) &&
    headline.scrollHeight < targetHeight &&
    size < maxSize
  ) {
    size += 1;
    headline.style.fontSize = `${size}px`;
  }

  size = Math.max(10, size - 1);
  headline.style.fontSize = `${size}px`;

  while (headline.scrollWidth > targetWidth && size > 10) {
    size -= 1;
    headline.style.fontSize = `${size}px`;
  }
}

function handleResize() {
  resizeHeadline();
}

initVideoAscii();
initThemeSwitcher();
initPeopleHover();
handleResize();
window.addEventListener("resize", handleResize);

// the headline is sized by measuring its width, so it must be recalculated once the
// web font (Bugrino) is ready — otherwise the first paint measures the fallback font
// and overshoots. keep it hidden until sized with the real font to avoid a flash.
function revealHeadline() {
  if (headline) {
    handleResize();
    headline.style.visibility = "visible";
  }
}
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(revealHeadline);
}
window.addEventListener("load", revealHeadline);
setTimeout(revealHeadline, 1500); // safety: reveal even if fonts never resolve
