/* Mounts the design-system components (NodeGrid, Field, Highlight) wherever a page asks for them,
   and sends the contact form to the visitor's mail app, addressed to Quorum's public inbox. */
(function () {
  var h = React.createElement;
  document.querySelectorAll('[data-q]').forEach(function (el) {
    var Comp = window.Quorum[el.getAttribute('data-q')];
    var props = JSON.parse(el.getAttribute('data-props') || '{}');
    var html = el.innerHTML.trim(), children;
    if (html) children = /</.test(html) ? h('span', { style: { display: 'contents' }, dangerouslySetInnerHTML: { __html: html } }) : el.textContent.trim();
    ReactDOM.createRoot(el).render(h(Comp, props, children));
  });
  document.querySelectorAll('[data-q-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form), name = f.get('name') || '', email = f.get('email') || '';
      var body = (f.get('message') || '') + '\n\n' + name + (email ? ' <' + email + '>' : '');
      location.href = 'mailto:team@quorumai.org?subject=' + encodeURIComponent(name ? 'Message from ' + name : 'Message') + '&body=' + encodeURIComponent(body);
    });
  });
})();
