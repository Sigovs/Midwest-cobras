/* v10.js — two small jobs. The page is finished HTML and CSS without it.

   1 · the header takes a ground once the hero has left
   2 · the two rails get their arrow buttons

   Both rails already scroll without this file — they are lists with
   overflow-x, so the wheel, a trackpad, a drag, the arrow keys and a screen
   reader all move them. The buttons are marked hidden in the markup and
   revealed here, so a reader with scripts off never sees a control that does
   nothing. Nothing on this page moves on its own. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1 · the header ─────────────────────────────────────────────────── */
  function head() {
    var bar = document.getElementById('site-head');
    var hero = document.querySelector('.hero');
    if (!bar || !hero) return;

    /* IntersectionObserver rather than a scroll handler: the browser works out
       when the hero has left and says so, instead of us asking on every frame. */
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      bar.setAttribute('data-stuck', entries[0].isIntersecting ? 'false' : 'true');
    }, { rootMargin: '-72px 0px 0px 0px', threshold: 0 }).observe(hero);
  }

  /* ── 2 · the rails ──────────────────────────────────────────────────── */
  function rail(section) {
    var track = section.querySelector('[data-rail-track]');
    var controls = section.querySelector('[data-rail-controls]');
    if (!track || !controls) return;

    var prev = controls.querySelector('[data-rail="prev"]');
    var next = controls.querySelector('[data-rail="next"]');
    if (!prev || !next) return;

    /* Two rails, two right answers. A rail of small cards moves four fifths of
       a screen, so the card you were reading is still on it afterwards. The
       inventory carousel holds one large card at a time and snaps hard to the
       middle, so it moves exactly one card — 0.8 of the window there is more
       than a card and a gap, and the snap would drag it back, which reads as
       the button fighting you. */
    function page() {
      var mandatory = getComputedStyle(track).scrollSnapType.indexOf("mandatory") !== -1;
      if (mandatory && track.children.length > 1) {
        var a = track.children[0].getBoundingClientRect();
        var b = track.children[1].getBoundingClientRect();
        return Math.max(b.left - a.left, 240);
      }
      return Math.max(track.clientWidth * 0.8, 240);
    }

    function go(dir) {
      track.scrollBy({ left: dir * page(), behavior: reduced ? 'auto' : 'smooth' });
    }

    /* Disabled at the ends rather than wrapping: a rail that silently
       teleports back to the start is a rail whose scrollbar is lying. */
    function sync() {
      var max = track.scrollWidth - track.clientWidth;
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      controls.hidden = max <= 2;      /* nothing to scroll, nothing to press */
    }

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync, { passive: true });

    controls.hidden = false;
    sync();
    /* Web fonts land after first paint and change the measurements. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(sync);
  }

  /* 100vw counts the scrollbar and the layout does not, so anything sized from
     100vw overshoots by exactly this much. The rails are, hence this. */
  function scrollbar() {
    var w = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--sbw', (w > 0 ? w : 0) + 'px');
  }

  function boot() {
    scrollbar();
    window.addEventListener('resize', scrollbar, { passive: true });
    head();
    var sections = document.querySelectorAll('.sect');
    for (var i = 0; i < sections.length; i++) rail(sections[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
