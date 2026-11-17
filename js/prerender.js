/* Faster page changes: when someone hovers (or focuses) an internal page link,
   the destination is loaded in the background so it opens almost instantly.
   - Chrome/Edge/Opera: native Speculation Rules, full prerender on hover.
   - Firefox/Safari (no prerender support): falls back to a plain prefetch of
     the HTML on hover, which still skips most of the network wait.
   PDFs, external links, anchors on the current page and new-tab links are left
   alone. With JS off, or on data-saver connections, nothing happens. */
(function () {
  var conn = navigator.connection;
  if (conn && (conn.saveData || /(^|-)2g$/.test(conn.effectiveType || ''))) return;

  if (window.HTMLScriptElement && HTMLScriptElement.supports &&
      HTMLScriptElement.supports('speculationrules')) {
    var s = document.createElement('script');
    s.type = 'speculationrules';
    s.textContent = JSON.stringify({
      prerender: [{
        where: { and: [
          { href_matches: '/*.html*' },
          { not: { href_matches: '/*.pdf' } },
          { not: { selector_matches: '[target=_blank]' } }
        ] },
        eagerness: 'moderate'
      }]
    });
    document.head.appendChild(s);
    return;
  }

  var done = {};
  function warm(e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.origin !== location.origin) return;
    if (!/\.html$/.test(a.pathname) && a.pathname !== '/') return;
    var url = a.origin + a.pathname + a.search;
    if (url === location.origin + location.pathname + location.search || done[url]) return;
    done[url] = true;
    var l = document.createElement('link');
    l.rel = 'prefetch'; l.href = url; l.as = 'document';
    document.head.appendChild(l);
  }
  document.addEventListener('mouseover', warm, { passive: true });
  document.addEventListener('focusin', warm);
  document.addEventListener('touchstart', warm, { passive: true });
})();
