/* v12.js — small jobs on top of v10.js and v11.js. The page is finished
   without it.

   LOADED BEFORE v10.js, not after — the one layer that is. Job 2 has to mark
   the reveal elements before v10's reveal() looks at them, because v10 skips
   anything already marked and that is the only way to take its six-second
   failsafe off them without editing a file index10 and index11 depend on.

   1 · the bar's height, for finance.html, which starts under it
   2 · the reveal, re-timed: the failsafe runs from the first scroll, not
       from load */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1 · the bar's height, for a page that starts under it ──────────────
     finance.html has no hero to hide the fixed bar in, so its first section
     pads itself by the bar's real height (v12.css). Written to the root as
     --bar-h, re-taken when the window changes: the bar is one row, two or
     three depending on width. */
  function barHeight() {
    var bar = document.getElementById('site-head');
    /* finance.html and build.html both open straight onto a section. */
    if (!bar || !document.body.matches('.page-finance, .page-build, .page-consignment, .page-inventory')) return;
    function take() {
      document.documentElement.style.setProperty('--bar-h', bar.getBoundingClientRect().height + 'px');
    }
    take();
    window.addEventListener('resize', take, { passive: true });
    /* The bar is taller before v10.js marks it stuck, and the change is a
       transition: the height that counts is the one after it. */
    bar.addEventListener('transitionend', take);
  }

  /* ── 2 · the reveal, with a failsafe that waits for the reader ──────────
     Alex, 2026-09-11: "bring back the motion on titles on scroll". It was
     never gone; it was being spent. v10's reveal marks what is below the
     fold and reveals it as it is scrolled to — and six seconds after load
     reveals everything regardless, so that a misfiring observer can never
     leave a section blank. The hero plays eight seconds of video. Anyone
     who watches it scrolls into a page that has already arrived.

     The failsafe is right and its clock is wrong. Same marks, same roles,
     same stagger, same observer — v10's and v11's lists, in v10's order —
     and the six seconds counted per element, from the moment it is on
     screen at all, instead of from load for everything. An element the
     strict observer never fires for (a threshold a browser disagrees with,
     a box taller than the window) is on screen, unrevealed, and six seconds
     later it is revealed. One that has not been reached yet is at no risk,
     because what is not on screen was never missing. v10 and v11 then find
     every element already marked and leave them alone; v11's line split
     works on the marks as before. */
  function reveal() {
    if (reduced || !('IntersectionObserver' in window)) return;
    var ROLES = [
      ['title', '.sect__title, .row__h, .news__h, .lot__name, .build__h, .site-foot__line'],
      ['text',  '.lede, .sect__note, .row__body p, .news__item p, .news__meta, .spec, .tag, .btn, .link, .site-foot__col, .site-foot address'],
      ['media', '.frame'],
      ['text',  '.about .tag'],
      ['title', '.about .sect__title'],
      ['text',  '.about .who'],
      ['text',  '.about__body > *'],
      ['photo', '.news__item .lot__shot']
    ];
    var seen = [];
    ROLES.forEach(function (role, r) {
      Array.prototype.forEach.call(document.querySelectorAll(role[1]), function (el) {
        if (el.closest('.hero') || el.closest('.rail') || el.closest('.row')) return;
        /* A box that scrolls inside itself (build.html's summary, 2026-09-14)
           is not scrolled to by the page, so an observer watching the window
           would leave what is inside it blank until the six-second failsafe.
           Its contents are marked as already arrived — marked, so v10 and
           v11 leave them alone too. */
        if (el.closest('[data-no-reveal]')) {
          if (!el.hasAttribute('data-reveal')) { el.setAttribute('data-reveal', role[0]); el.setAttribute('data-in', ''); }
          return;
        }
        /* v10 leaves 04 to its scroll timeline; v11 then takes 04's parts by
           name. Same split here: the first three roles skip 04, the rest
           are 04's. */
        if (r < 3 && el.closest('.about__grid, .about__pair')) return;
        if (el.hasAttribute('data-reveal')) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
        el.setAttribute('data-reveal', role[0]);
        seen.push(el);
      });
    });
    if (!seen.length) return;

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

    /* The loose observer: any part of the element in the window, no margin.
       It starts the element's own six seconds. */
    var late = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        late.unobserve(e.target);
        window.setTimeout(function () {
          if (e.target.hasAttribute('data-in')) return;
          e.target.setAttribute('data-in', '');
          io.unobserve(e.target);
        }, 6000);
      });
    }, { threshold: 0 });
    seen.forEach(function (el) { late.observe(el); });
  }

  function boot() {
    barHeight();
    reveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
