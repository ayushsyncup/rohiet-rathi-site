/* Fills the pages from content.json. Edit content via /admin */
(function () {
  var script = document.currentScript;
  var root = new URL('.', script.src).href;
  var esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var u = function (p) { p = p || ''; return /^(https?:|mailto:|tel:|#|data:)/.test(p) ? p : (p ? root + p : ''); };
  var get = function (o, path) { return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); };

  var tpl = {
    stat: function (i) { return '<div><div class="stat-num">' + esc(i.number) + '</div><div class="stat-label">' + esc(i.label) + '</div></div>'; },
    feat: function (i) {
      var fs = String(i.number).length > 12 ? ' style="font-size:16px;"' : '';
      return '<div class="box"><div class="num"' + fs + '>' + esc(i.number) + '</div><div class="label">' + esc(i.label) + '</div></div>';
    },
    hl: function (i) {
      var n = String(i.number).length, fs = n > 18 ? ' style="font-size:15px; line-height:1.3;"' : (n > 11 ? ' style="font-size:19px;"' : '');
      return '<div class="highlight-card"><div class="num"' + fs + '>' + esc(i.number) + '</div><div class="label">' + esc(i.label) + '</div></div>';
    },
    aboutcard: function (i) { return '<div class="about-card"><div class="icon">' + esc(i.icon) + '</div><h3>' + esc(i.title) + '</h3><p>' + esc(i.text) + '</p></div>'; },
    fact: function (i) { return '<tr><td>' + esc(i.label) + '</td><td>' + esc(i.value) + '</td></tr>'; },
    chip: function (i) { return '<span class="brand-chip">' + esc(i.name) + '</span>'; },
    invest: function (i) {
      var ext = /^https?:/.test(i.websiteUrl || '') ? ' target="_blank" rel="noopener"' : '';
      var mark = i.wideLogo
        ? '<img src="' + esc(u(i.logo)) + '" alt="' + esc(i.name) + ' logo" style="display:block;height:44px;width:auto;">'
        : '<div class="invest-mark">' + esc((i.name || '?').charAt(0)) + (i.logo ? '<img src="' + esc(u(i.logo)) + '" alt="' + esc(i.name) + ' logo" onerror="this.remove()">' : '') + '</div>';
      return '<div class="invest-card"><div class="invest-top"><a href="' + esc(u(i.websiteUrl)) + '"' + ext + ' aria-label="' + esc(i.name) + '">' + mark + '</a><span class="tag">' + esc(i.tag) + '</span></div><h3>' + esc(i.name) + '</h3><div class="role-tag">' + esc(i.role) + '</div><p>' + esc(i.description) + '</p><a class="link" href="' + esc(u(i.websiteUrl)) + '"' + ext + '>' + esc(i.linkText) + '</a></div>';
    },
    brandcard: function (i) {
      var ext = i.websiteUrl ? ' target="_blank" rel="noopener"' : '';
      var href = i.websiteUrl ? u(i.websiteUrl) : (i.page ? root + 'rohits/' + i.page : '#');
      return '<a class="brand-card" href="' + esc(href) + '"' + ext + '><div class="mark">' + esc((i.name || '?').charAt(0)) + (i.logo ? '<img src="' + esc(u(i.logo)) + '" alt="" onerror="this.remove()">' : '') + '</div><div class="name">' + esc(i.name) + '</div></a>';
    },
    customer: function (i) {
      var inner = i.logo ? '<img src="' + esc(u(i.logo)) + '" alt="' + esc(i.name) + '">' : '<div class="fallback-name">' + esc(i.name) + '</div>';
      return i.websiteUrl
        ? '<a class="customer-card" href="' + esc(u(i.websiteUrl)) + '" target="_blank" rel="noopener" aria-label="' + esc(i.name) + '">' + inner + '</a>'
        : '<div class="customer-card">' + inner + '</div>';
    }
  };

  function apply(c) {
    document.querySelectorAll('[data-c]').forEach(function (el) { var v = get(c, el.getAttribute('data-c')); if (v != null) el.textContent = v; });
    document.querySelectorAll('[data-c-src]').forEach(function (el) { var v = get(c, el.getAttribute('data-c-src')); if (v) el.setAttribute('src', u(v)); });
    document.querySelectorAll('[data-c-href]').forEach(function (el) {
      var v = get(c, el.getAttribute('data-c-href')); if (!v) return;
      el.setAttribute('href', u(v));
      if (/^https?:/.test(v)) { el.setAttribute('target', '_blank'); el.setAttribute('rel', 'noopener'); }
    });
    document.querySelectorAll('[data-list]').forEach(function (el) {
      var arr = get(c, el.getAttribute('data-list')), t = tpl[el.getAttribute('data-tpl')];
      if (Array.isArray(arr) && t) el.innerHTML = arr.map(t).join('');
    });

    var co = c.company || {};
    // Shared across every Rohit's Supply page
    document.querySelectorAll('.brand-logo img').forEach(function (i) { if (co.logo) i.src = u(co.logo); if (co.name) i.alt = co.name; });
    document.querySelectorAll('.whatsapp-float').forEach(function (a) {
      if (co.whatsappNumber) a.href = 'https://api.whatsapp.com/send?phone=' + encodeURIComponent(co.whatsappNumber) + '&text=' + encodeURIComponent(co.whatsappMessage || '');
    });
    document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
      if (!co.phone) return;
      var digits = /\d/.test(a.textContent); a.href = 'tel:' + co.phone;
      a.textContent = digits ? (co.phoneDisplay || co.phone) : (co.callButtonText || a.textContent);
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
      if (!co.email) return; var same = a.textContent.trim().indexOf('@') > -1; a.href = 'mailto:' + co.email; if (same) a.textContent = co.email;
    });
    document.querySelectorAll('.nav-personal').forEach(function (a) { if (co.personalLinkText) a.textContent = co.personalLinkText; });
    document.querySelectorAll('.js-address').forEach(function (a) { if (co.address) a.textContent = co.address; });
  }

  function load(url) { return fetch(url, { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  load(root + 'api/content')
    .catch(function () { return load(root + 'content.json?v=' + Date.now()); })
    .then(function (c) { if (c) { window.SITE_CONTENT = c; apply(c); } })
    .catch(function () { /* keep the built-in defaults */ });
})();
