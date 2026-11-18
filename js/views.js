// natochi.cv global view counter: one count per page load, anywhere on the site.
// The number lives in a Cloudflare Worker (natochi.cv/api/views, source in ~/projects/natochi-views).
// Pages that want to show it read the promise window.natochiViews -> { views, visitors } | null.
(() => {
  if (window.top !== window.self || navigator.webdriver) return;        // not inside an iframe, not automation
  window.natochiViews = fetch('/api/views', {
    method: 'POST', keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path: location.pathname }),
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
})();
