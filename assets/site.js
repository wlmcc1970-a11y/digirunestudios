/* DigiRune Studios website v4 (2026-11). Menu, subtle motion, smart Download buttons, old-link forwarding,
   publisher form and Store Launch Kit sign-up (both use the DigiRune notes endpoint + Cloudflare Turnstile),
   GoatCounter event counts. No cookies, no other tracking. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var LIVE = /(^|\.)digirunestudios\.com$/.test(location.hostname);
  var ENDPOINT = 'https://digirune-feedback.will-6d6.workers.dev/report';
  var SITEKEY = '0x4AAAAAAFW88K0K9FyRmEzA';
  var base = (d.body && d.body.getAttribute('data-base')) || '';

  function count(path, title) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: path, title: title || path, event: true }); } catch (e) {}
  }

  // Old one-page links (store listings, printed pieces, old posts) keep working on the new pages.
  try {
    if (d.body.getAttribute('data-page') === 'home' && location.hash) {
      var map = { '#privacy': 'privacy/', '#data-deletion': 'privacy/#data-deletion', '#publishers': 'for-publishers/', '#process': 'for-publishers/#process',
        '#standard': 'for-publishers/#standard', '#contact': 'for-publishers/#contact', '#cta-band': 'for-publishers/#contact', '#about': 'about/' };
      var to = map[location.hash.toLowerCase()];
      if (to) location.replace(base + (window.DR_PREVIEW ? to.replace(/\/(#|$)/, '/index.html$1') : to));
    }
  } catch (e) {}

  // Year in the footer.
  try { var y = d.getElementById('yr'); if (y) y.textContent = String(new Date().getFullYear()); } catch (e) {}

  // Mobile menu.
  var btn = d.querySelector('.menu'), drawer = d.getElementById('drawer');
  if (btn && drawer) {
    var setOpen = function (open) {
      drawer.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('.lbl').textContent = open ? 'Close' : 'Menu';
    };
    btn.addEventListener('click', function () { setOpen(!drawer.classList.contains('open')); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('open')) { setOpen(false); btn.focus(); } });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  }

  // Cards fade in on scroll (CSS turns this off for reduce-motion visitors).
  var rev = d.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && rev.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('seen'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('seen'); }); }

  // "Download" opens the right store on a phone; elsewhere it goes to the app's entry on Our Apps.
  var ua = navigator.userAgent || '';
  var isAndroid = /Android/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  d.querySelectorAll('a[data-dl]').forEach(function (a) {
    var g = a.getAttribute('data-google'), ap = a.getAttribute('data-apple');
    if (isAndroid && g) { a.href = g; a.target = '_blank'; a.rel = 'noopener'; }
    else if (isIOS && ap) { a.href = ap; a.target = '_blank'; a.rel = 'noopener'; }
  });

  // Desktop QR codes point at our-apps/?get=<app>: on a phone, go straight to that app's store page.
  try {
    var gm = /[?&]get=([a-z]+)/.exec(location.search);
    if (gm && d.body.getAttribute('data-page') === 'apps') {
      var row = d.getElementById(gm[1]);
      var sel = isIOS ? '.badge[data-count$="-apple"]' : (isAndroid ? '.badge[data-count$="-google"]' : '');
      var pick = row && sel ? row.querySelector(sel) : null;
      count('qr-' + gm[1], 'QR scan: ' + gm[1]);
      if (pick) location.replace(pick.href);
      else if (row) row.scrollIntoView();
    }
  } catch (e) {}

  // Count store taps and other key clicks (GoatCounter events).
  d.addEventListener('click', function (e) {
    var a = e.target.closest('[data-count]');
    if (a) count(a.getAttribute('data-count'), a.getAttribute('data-count-title'));
  });

  // Forms: publisher message and Store Launch Kit sign-up.
  var tsLoading = null;
  function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (tsLoading) return tsLoading;
    tsLoading = new Promise(function (res, rej) {
      var s = d.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.onload = function () { res(); }; s.onerror = function () { rej(new Error('ts')); };
      d.head.appendChild(s);
    });
    return tsLoading;
  }
  function deviceId() {
    var k = 'dr-device', v = null;
    try { v = localStorage.getItem(k); } catch (e) {}
    if (!v || !/^[A-Za-z0-9_-]{8,64}$/.test(v)) {
      v = '';
      var c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var arr = new Uint8Array(24);
      try { crypto.getRandomValues(arr); } catch (e) { for (var i = 0; i < 24; i++) arr[i] = Math.floor(Math.random() * 256); }
      for (var j = 0; j < 24; j++) v += c[arr[j] % c.length];
      try { localStorage.setItem(k, v); } catch (e) {}
    }
    return v;
  }
  var ERR = {
    email: 'Please check the email address.',
    message: 'Please add a few more words.',
    limit: 'Thank you. We have already received several messages from this device today. Please email will@digirunestudios.com instead.',
    busy: 'The form is busy right now. Please email will@digirunestudios.com instead.',
    check: 'The security check did not complete. Please try again, or email will@digirunestudios.com.'
  };
  d.querySelectorAll('form[data-form]').forEach(function (f) {
    var kind = f.getAttribute('data-form');
    var msg = f.querySelector('.msg'), slot = f.querySelector('.ts'), widget = null, token = '';
    function say(t, bad) { msg.textContent = t; msg.classList.toggle('err', !!bad); }
    function ensureWidget() {
      if (!LIVE || widget !== null) return;
      widget = false;
      loadTurnstile().then(function () {
        widget = window.turnstile.render(slot, { sitekey: SITEKEY, size: 'flexible', callback: function (t) { token = t; }, 'expired-callback': function () { token = ''; } });
      }).catch(function () { widget = null; });
    }
    f.addEventListener('focusin', ensureWidget);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (n) { var el = f.elements[n]; return el ? String(el.value || '').trim() : ''; };
      var email = v('email');
      var badEmail = !/^[^\s@<>"(),;:\\]+@[^\s@<>"'(),;:\\]+\.[^\s@<>"'(),;:\\]{2,}$/.test(email);
      if (kind === 'publisher' && !v('name')) { say('Please add your name.', true); f.elements.name.focus(); return; }
      if (badEmail) { say(ERR.email, true); f.elements.email.focus(); return; }
      var body;
      if (kind === 'publisher') {
        if (v('message').length < 10) { say('Please add a short message.', true); f.elements.message.focus(); return; }
        body = 'Publisher inquiry\nName: ' + v('name') + '\nCompany: ' + v('company') + '\nGame: ' + v('game') + '\n\n' + v('message');
      } else {
        body = 'Store Launch Kit: join the list';
      }
      if (!LIVE) { say('Preview copy: this form sends from the live site only. Nothing was sent.', false); return; }
      if (!token) { ensureWidget(); say('One moment: completing the security check, then press the button again.', false); return; }
      var b = f.querySelector('button[type="submit"]'); b.disabled = true; say('Sending...', false);
      fetch(ENDPOINT, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app: kind === 'publisher' ? 'DigiRune Studios website: publisher inquiry' : 'Store Launch Kit sign-up',
          version: 'site v4', platform: 'web', kind: 'other', message: body, email: email,
          device: deviceId(), turnstile: token, website: v('website')
        })
      }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (j) {
          if (j && j.ok) {
            f.classList.add('sent');
            count(kind === 'publisher' ? 'publisher-message' : 'launch-kit-signup', kind === 'publisher' ? 'Publisher message sent' : 'Store Launch Kit sign-up');
            var done = f.querySelector('.done'); if (done) { done.setAttribute('tabindex', '-1'); done.focus(); }
          } else {
            say(ERR[j && j.error] || 'The message could not be sent. Please email will@digirunestudios.com.', true);
            try { if (widget) window.turnstile.reset(widget); } catch (x) {} token = '';
          }
        })
        .catch(function () { say('The message could not be sent. Please email will@digirunestudios.com.', true); })
        .then(function () { b.disabled = false; });
    });
  });

  // Count the first play of the portfolio video.
  d.querySelectorAll('video[data-count-video]').forEach(function (vd) {
    vd.addEventListener('play', function once() { vd.removeEventListener('play', once); count('video-portfolio-play', 'Our Portfolio video: play'); });
  });

  // Share button on the thank-you message (For App Builders).
  d.querySelectorAll('[data-share]').forEach(function (s) {
    s.addEventListener('click', function () {
      var url = 'https://digirunestudios.com/for-app-builders/';
      if (navigator.share) { navigator.share({ title: 'DigiRune Studios Store Launch Kit', url: url }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(url).then(function () { s.textContent = 'Link copied'; }).catch(function () {}); }
      count('launch-kit-share', 'Store Launch Kit: share');
    });
  });
})();
