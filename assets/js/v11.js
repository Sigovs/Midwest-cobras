/* v11.js — four small jobs on top of v10.js. The page is finished without it.

   1 · the hero sequence: the video plays once, the stills dissolve through,
       and it comes back round — pausable, and stopped when nobody can see it
   2 · the Grand Opening count, to the minute, handing over to "open" by itself
   3 · the two forms say they are a preview when they are sent
   4 · the build enquiry panel: in from the right, and back out the same way

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
       sequence stops rather than dissolving behind a wall of sections. */
    function check() {
      var now = !document.hidden && window.pageYOffset < (hero ? hero.offsetHeight : window.innerHeight);
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
     content and is there without this; the count only ever adds to it. */
  function countdown() {
    var box = document.querySelector('[data-countdown]');
    if (!box) return;
    var open = document.querySelector('[data-countdown-open]');
    var target = Date.parse(box.getAttribute('data-countdown'));
    if (isNaN(target)) return;
    var cell = {
      d: box.querySelector('[data-cd="d"]'),
      h: box.querySelector('[data-cd="h"]'),
      m: box.querySelector('[data-cd="m"]')
    };
    function two(n) { return (n < 10 ? '0' : '') + n; }
    function tick() {
      var left = target - Date.now();
      if (left <= 0) {
        box.hidden = true;
        if (open) open.hidden = false;
        return;
      }
      /* Rounded up: at 11:29:30 it should say one minute, not none. */
      var mins = Math.ceil(left / 60000);
      cell.d.textContent = two(Math.floor(mins / 1440));
      cell.h.textContent = two(Math.floor((mins % 1440) / 60));
      cell.m.textContent = two(mins % 60);
      box.hidden = false;
      setTimeout(tick, (left % 60000) || 60000);
    }
    tick();
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
        if (opener) opener.focus();
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

  function boot() {
    slides();
    countdown();
    forms();
    enquiry();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
