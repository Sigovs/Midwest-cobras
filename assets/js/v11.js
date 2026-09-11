/* v11.js — small jobs on top of v10.js. The page is finished without it.

   1 · the hero sequence: the video plays once, the stills dissolve through,
       and it comes back round — pausable, and stopped when nobody can see it
   2 · the Grand Opening count, to the minute, handing over to "open" by itself
   3 · the two forms say they are a preview when they are sent
   4 · the build enquiry panel: in from the right, and back out the same way
   5 · 04's words and the news pictures arrive the way every other section's do
   6 · variant C: headings cut into lines, a car photo following the pointer

   Under reduced motion the sequence never starts: v10.js has already parked
   the video on its last frame, and that still is the hero. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HOLD = 7000;            /* how long each still holds before the next dissolve */

  /* ── 1 · the hero sequence ─────────────────────────────────────────────── */
  function slides() {
    var stage = document.querySelector('[data-slides]');
    var ui = document.querySelector('[data-slides-ui]');
    if (!stage || !ui || reduced) return;

    var frames = Array.prototype.slice.call(stage.querySelectorAll('.hero__slide'));
    if (frames.length < 2) return;

    var video = stage.querySelector('video.hero__slide');
    var track = ui.querySelector('.hero__track');
    var pauseBtn = ui.querySelector('[data-slides-pause]');
    var hero = stage.closest('.hero');
    var i = 0, timer = null, paused = false, visible = true;

    /* The stills are only fetched once the page is up, so the hero's first
       paint is exactly what it was in v10. */
    frames.forEach(function (f) {
      if (f.tagName === 'IMG' && f.getAttribute('data-src')) {
        f.decoding = 'async';
        f.src = f.getAttribute('data-src');
      }
    });

    /* The video hands on when it finishes instead of looping. Without this
       script it still loops, which is the right fallback for a hero. */
    if (video) { video.removeAttribute('loop'); video.loop = false; }

    var dots = frames.map(function (f, n) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hero__dot';
      b.setAttribute('aria-label', 'Show picture ' + (n + 1) + ' of ' + frames.length);
      b.addEventListener('click', function () { go(n); });
      li.appendChild(b);
      track.appendChild(li);
      return b;
    });
    ui.hidden = false;

    function holdFor(n) {
      if (frames[n] === video && video && isFinite(video.duration) && video.duration > 0) {
        return Math.round(video.duration * 1000);
      }
      return HOLD;
    }

    function play(v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    }

    function paint() {
      var ms = holdFor(i) + 'ms';
      stage.style.setProperty('--hold', ms);
      ui.style.setProperty('--hold', ms);
      frames.forEach(function (f, n) { f.classList.toggle('is-on', n === i); });
      dots.forEach(function (d, n) {
        d.removeAttribute('aria-current');
        if (n === i) { void d.offsetWidth; d.setAttribute('aria-current', 'true'); }
      });
    }

    function schedule() {
      clearTimeout(timer);
      if (paused || !visible) return;
      if (frames[i] === video && video) {
        try { video.currentTime = 0; } catch (e) {}
        play(video);
        /* Its own end is the cue; this is only the net under it, for a video
           that never arrives or never plays. */
        timer = setTimeout(function () { go(i + 1); }, holdFor(i) + 1500);
        return;
      }
      timer = setTimeout(function () { go(i + 1); }, HOLD);
    }

    function go(n) {
      i = (n + frames.length) % frames.length;
      if (video && frames[i] !== video) video.pause();
      paint();
      schedule();
    }

    if (video) {
      video.addEventListener('ended', function () {
        if (frames[i] === video && !paused) go(i + 1);
      });
      video.addEventListener('loadedmetadata', function () {
        if (frames[i] === video) paint();
      });
    }

    pauseBtn.addEventListener('click', function () {
      paused = !paused;
      pauseBtn.setAttribute('aria-pressed', String(paused));
      pauseBtn.setAttribute('aria-label', paused ? 'Play the pictures' : 'Pause the pictures');
      if (paused) ui.setAttribute('data-paused', ''); else ui.removeAttribute('data-paused');
      if (paused) {
        clearTimeout(timer);
        if (video && frames[i] === video) video.pause();
      } else if (video && frames[i] === video) {
        play(video);
      } else {
        paint();
        schedule();
      }
    });

    /* The hero is sticky and never leaves the window, so "can anyone see it"
       is answered by scroll position: once the page has slid over it, the
       sequence stops rather than dissolving behind a wall of sections. It
       also stops while the build enquiry is open — pictures changing behind
       a scrim are motion behind the thing being read. */
    function check() {
      var now = !document.hidden &&
        !document.documentElement.hasAttribute('data-locked') &&
        window.pageYOffset < (hero ? hero.offsetHeight : window.innerHeight);
      if (now === visible) return;
      visible = now;
      if (!visible) {
        clearTimeout(timer);
        if (video) video.pause();
      } else if (!paused) {
        paint();
        schedule();
      }
    }
    var queued = false;
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; check(); });
    }, { passive: true });
    document.addEventListener('visibilitychange', check);
    document.addEventListener('enquiry', check);

    paint();
    /* Frame one is the video, already playing on its own autoplay. */
    if (video && frames[0] === video) {
      timer = setTimeout(function () { go(1); }, holdFor(0) + 1500);
    } else {
      schedule();
    }
  }

  /* ── 2 · the Grand Opening ─────────────────────────────────────────────
     Minutes, not seconds, and each update lands on the minute boundary rather
     than on a free-running interval. The date written above the count is the
     content and is there without this; the count only ever adds to it.

     Variant C: each figure is two odometer drums (v11.css). The drums wait at
     zero until the count is on screen, then turn once to the time left; after
     that only the minute moves. The spoken reading is a hidden span that is
     always right, rolled or not. Under reduced motion the drums simply show
     the time. */
  function countdown() {
    var box = document.querySelector('[data-countdown]');
    if (!box) return;
    var open = document.querySelector('[data-countdown-open]');
    var target = Date.parse(box.getAttribute('data-countdown'));
    if (isNaN(target)) return;

    var units = ['d', 'h', 'm'];
    var cell = {};
    units.forEach(function (u) {
      var n = box.querySelector('[data-cd="' + u + '"]');
      if (!n) return;
      n.textContent = '';
      var sr = document.createElement('span'); sr.className = 'v11-sr';
      var drums = document.createElement('span'); drums.className = 'odo';
      drums.setAttribute('aria-hidden', 'true');
      var cols = [0, 1].map(function (k) {
        var dg = document.createElement('span'); dg.className = 'odo__dg';
        var strip = document.createElement('span'); strip.style.setProperty('--k', String(k));
        for (var d = 0; d < 10; d++) { var b = document.createElement('b'); b.textContent = d; strip.appendChild(b); }
        dg.appendChild(strip); drums.appendChild(dg);
        return strip;
      });
      n.appendChild(sr); n.appendChild(drums);
      cell[u] = { sr: sr, cols: cols };
    });

    function two(v) { return (v < 10 ? '0' : '') + v; }
    var rolled = reduced;
    function now() {
      var left = target - Date.now();
      /* Rounded up: at 11:29:30 it should say one minute, not none. */
      var mins = Math.ceil(left / 60000);
      return { left: left, d: Math.floor(mins / 1440), h: Math.floor((mins % 1440) / 60), m: mins % 60 };
    }
    function paint(t) {
      units.forEach(function (u) {
        if (!cell[u]) return;
        var s = two(Math.min(t[u], 99));
        cell[u].sr.textContent = s;
        if (!rolled) return;
        cell[u].cols[0].style.setProperty('--n', s[0]);
        cell[u].cols[1].style.setProperty('--n', s[1]);
      });
    }
    function tick() {
      var t = now();
      if (t.left <= 0) {
        box.hidden = true;
        if (open) open.hidden = false;
        return;
      }
      box.hidden = false;
      paint(t);
      setTimeout(tick, (t.left % 60000) || 60000);
    }
    tick();

    if (!rolled) {
      var go = function () {
        if (rolled) return;
        rolled = true;
        if (io) io.disconnect();
        paint(now());
      };
      var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) go(); });
      }, { threshold: 0.4 }) : null;
      if (io) io.observe(box); else go();
      window.setTimeout(go, 6000);   /* the same failsafe the reveal keeps */
    }
  }

  /* ── 3 · the forms ─────────────────────────────────────────────────────
     This build is for design approval and neither form is connected to
     anything, so sending one says exactly that instead of pretending. Each
     form carries its own sentence in data-apply-note. */
  function forms() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-apply]'), function (form) {
      var status = form.querySelector('[data-apply-status]');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!status) return;
        status.textContent = form.getAttribute('data-apply-note') ||
          'Thank you. This is a design preview, so nothing was sent.';
        status.hidden = false;
      });
    });
  }

  /* ── 4 · the build enquiry ─────────────────────────────────────────────
     Both "Build yours" buttons are mailto links to Evan in the markup — the
     client's own suggestion, and what a visitor without scripts gets. Here
     they open the panel instead. showModal() carries the weight: top layer,
     inert page, focus kept inside and handed back afterwards. This only
     times the entrance and the exit around it. */
  function enquiry() {
    var dlg = document.querySelector('[data-enquiry]');
    var triggers = document.querySelectorAll('[data-enquiry-open]');
    if (!dlg || !triggers.length || typeof dlg.showModal !== 'function') return;
    var panel = dlg.querySelector('.enquiry__panel');
    var root = document.documentElement;
    var opener = null, closing = false;

    /* The exit's length, read off the CSS rather than typed here twice. */
    function exitMs() {
      var cs = getComputedStyle(panel);
      var d = cs.transitionDuration.split(','), w = cs.transitionDelay.split(',');
      var ms = 0;
      d.forEach(function (x, n) { ms = Math.max(ms, (parseFloat(x) + (parseFloat(w[n]) || 0)) * 1000); });
      return ms;
    }

    function open(e) {
      e.preventDefault();
      if (dlg.open) return;
      opener = e.currentTarget;
      /* Lock the page, padded by the scrollbar it is about to lose — measured
         now, while the scrollbar is still there to measure. */
      root.style.setProperty('--lock-gap', Math.max(0, window.innerWidth - root.clientWidth) + 'px');
      root.setAttribute('data-locked', '');
      document.dispatchEvent(new Event('enquiry'));
      dlg.showModal();
      /* showModal() puts focus on the first control, which is the ×, and
         rings it the moment the panel appears. The title takes focus instead:
         a reader hears what opened, and the × is one Shift+Tab away. */
      var title = dlg.querySelector('.enquiry__title');
      if (title) title.focus({ preventScroll: true });
      /* Two frames: the first paints the panel at its starting edge, the
         second lets it travel. One frame and it would simply appear. */
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { dlg.setAttribute('data-open', ''); });
      });
    }

    function close() {
      if (!dlg.open || closing) return;
      closing = true;
      dlg.removeAttribute('data-open');
      var timer = setTimeout(done, exitMs() + 100);
      function onEnd(ev) {
        if (ev.target === panel && ev.propertyName === 'transform') done();
      }
      function done() {
        if (!closing) return;
        closing = false;
        clearTimeout(timer);
        panel.removeEventListener('transitionend', onEnd);
        dlg.close();
        root.removeAttribute('data-locked');
        root.style.removeProperty('--lock-gap');
        document.dispatchEvent(new Event('enquiry'));
        /* Back to the button, without scrolling the page to it. */
        if (opener) opener.focus({ preventScroll: true });
      }
      panel.addEventListener('transitionend', onEnd);
    }

    Array.prototype.forEach.call(triggers, function (t) { t.addEventListener('click', open); });
    Array.prototype.forEach.call(dlg.querySelectorAll('[data-enquiry-close]'), function (b) {
      b.addEventListener('click', close);
    });
    /* Escape would close the dialog on the spot; it leaves the way it came. */
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
  }

  /* ── 5 · 04's words arrive like every other section's ─────────────────
     v10's reveal leaves 04 out on purpose: the section was built around a
     numeral and a pair of plates on scroll timelines, and its type only
     drifted with its columns. With the numeral and the plates gone, the
     heading and the client's paragraphs were the only text on the page that
     simply stood there while everything around them arrived.

     Same roles, same CSS (v10's [data-reveal] rules), same once-only observer,
     same stagger, same six-second failsafe. Only the list is here, because
     v10.js is shared with index10 and stays as the client saw it.

     Evan's figure takes the text role — a rise — not the media role. The
     media wipe is a clip-path on the element, and it would cut the oxblood
     light off at the photograph's edge. */
  function aboutReveal() {
    if (reduced || !('IntersectionObserver' in window)) return;
    /* 04 by its class, and the news pictures by the new 'photo' role —
       roles, so a second page with the same parts gets the same arrival. */
    var PICKS = [
      ['text',  '.about .tag'],
      ['title', '.about .sect__title'],
      ['text',  '.about .who'],
      ['text',  '.about__body > *'],
      ['photo', '.news__item .lot__shot']
    ];
    var seen = [];
    PICKS.forEach(function (pick) {
      Array.prototype.forEach.call(document.querySelectorAll(pick[1]), function (el) {
        if (el.hasAttribute('data-reveal')) return;
        /* Only what is still below the fold — never hide what is being read. */
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
        el.setAttribute('data-reveal', pick[0]);
        seen.push(el);
      });
    });
    if (!seen.length) return;

    /* Stagger per parent, 90ms a step, capped at four steps — v10's numbers. */
    var parents = [], counts = [];
    seen.forEach(function (el) {
      var k = parents.indexOf(el.parentNode);
      if (k < 0) { k = parents.push(el.parentNode) - 1; counts[k] = 0; }
      el.style.setProperty('--reveal-delay', (Math.min(counts[k]++, 3) * 90) + 'ms');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.setAttribute('data-in', '');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });
    seen.forEach(function (el) { io.observe(el); });

    window.setTimeout(function () {
      io.disconnect();
      seen.forEach(function (el) { el.setAttribute('data-in', ''); });
    }, 6000);
  }

  /* ── 6a · headings leave the line ──────────────────────────────────────
     Variant C. Every heading the reveal is holding back as a title — v10's
     list and 04's — is cut into its rendered lines, and each line rises out
     of its own mask (v11.css). Only headings that are plain text are cut;
     nothing with markup inside is touched. The cut is measured after the
     webfonts have landed, so the lines are the real ones, and once the
     heading has arrived the plain text goes back, so it rewraps with the
     window like any other text. */
  function splitTitles() {
    if (reduced) return;
    var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      Array.prototype.forEach.call(document.querySelectorAll('[data-reveal="title"]'), function (h) {
        if (h.hasAttribute('data-in') || h.childElementCount) return;
        var text = h.textContent.replace(/\s+/g, ' ').trim();
        if (!text) return;

        var words = text.split(' ');
        h.textContent = '';
        var spans = words.map(function (w, i) {
          var sp = document.createElement('span');
          sp.textContent = w;
          h.appendChild(sp);
          if (i < words.length - 1) h.appendChild(document.createTextNode(' '));
          return sp;
        });
        var lines = [], top = null;
        spans.forEach(function (sp) {
          if (top === null || Math.abs(sp.offsetTop - top) > 2) { lines.push([]); top = sp.offsetTop; }
          lines[lines.length - 1].push(sp.textContent);
        });

        h.textContent = '';
        lines.forEach(function (ws, i) {
          var ln = document.createElement('span'); ln.className = 'ln';
          var inner = document.createElement('span');
          inner.textContent = ws.join(' ');
          inner.style.setProperty('--i', String(i));
          ln.appendChild(inner);
          h.appendChild(ln);
          if (i < lines.length - 1) h.appendChild(document.createTextNode(' '));
        });
        h.classList.add('is-split');

        var mo = new MutationObserver(function () {
          if (!h.hasAttribute('data-in')) return;
          mo.disconnect();
          window.setTimeout(function () {
            h.classList.remove('is-split');
            h.textContent = text;
          }, 1800 + lines.length * 160);
        });
        mo.observe(h, { attributes: true, attributeFilter: ['data-in'] });
      });
    });
  }

  /* ── 6b · the car photographs lean toward you ─────────────────────────
     Sets where a fine pointer is over an inventory card; v11.css turns it
     into a small pan inside the photograph's zoom. Mouse and trackpad only,
     and not at all under reduced motion. */
  function lotPan() {
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (reduced) return;
    Array.prototype.forEach.call(document.querySelectorAll('.lot'), function (lot) {
      lot.addEventListener('pointermove', function (e) {
        if (!fine.matches) return;
        var r = lot.getBoundingClientRect();
        lot.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
        lot.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
      });
      lot.addEventListener('pointerleave', function () {
        lot.style.removeProperty('--px');
        lot.style.removeProperty('--py');
      });
    });
  }

  function boot() {
    slides();
    countdown();
    forms();
    enquiry();
    aboutReveal();
    splitTitles();
    lotPan();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
