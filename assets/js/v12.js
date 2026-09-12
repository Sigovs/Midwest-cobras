/* v12.js — small jobs on top of v10.js and v11.js. The page is finished
   without it. */

(function () {
  'use strict';

  /* ── 1 · the bar's height, for a page that starts under it ──────────────
     finance.html has no hero to hide the fixed bar in, so its first section
     pads itself by the bar's real height (v12.css). Written to the root as
     --bar-h, re-taken when the window changes: the bar is one row, two or
     three depending on width. */
  function barHeight() {
    var bar = document.getElementById('site-head');
    if (!bar || !document.body.classList.contains('page-finance')) return;
    function take() {
      document.documentElement.style.setProperty('--bar-h', bar.getBoundingClientRect().height + 'px');
    }
    take();
    window.addEventListener('resize', take, { passive: true });
    /* The bar is taller before v10.js marks it stuck, and the change is a
       transition: the height that counts is the one after it. */
    bar.addEventListener('transitionend', take);
  }

  function boot() {
    barHeight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
