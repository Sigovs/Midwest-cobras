/* ============================================================================
   lower.js — a motion vocabulary for the page below the stage. index4 only.
   ----------------------------------------------------------------------------
   WHAT WAS THERE. main.js observes one role, [data-motion='rise'], and gives it
   opacity 0→1 with 8px of travel over 520ms, then unobserves. index3 applies it
   eleven times, and applies it to WHOLE BLOCKS — .build-list holds six rows and
   arrives as one 8-pixel unit. After that nothing on the page ever moves again.

   Eight pixels over half a second is below the threshold at which a reader
   registers that anything happened. The lower half was not under-animated. It
   was functionally static, and it had a motion system that made it look like a
   decision.

   This is additive. main.js is untouched and still runs; these are different
   attributes on different elements, so nothing is driven twice.

   FOUR ROLES, and the reason there are four rather than one:

     rise      a mass arrives.
     stagger   a LIST arrives, one child at a time. Six specification rows are
               six facts, not one block, and this single change does more than
               everything else in the file.
     hold      scroll-linked for the length of its own section. Exactly one per
               section: a page where every element tracks the scroll is seasick.
     rule      a hairline draws along its own length. Nearly free, and it is
               what ties this half of the page to the leader lines in the film.

   Everything except `hold` is enter-once. The resting state lives in stage.css,
   so a page whose JavaScript never arrives is a page with all of its content
   visible — this file only ever takes styles away.
   ========================================================================== */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nodes = Array.from(document.querySelectorAll('[data-lower]'));

if (!nodes.length) {
  console.warn('[lower] nothing declares a [data-lower] role in this document — the page below the stage has no motion vocabulary attached.');
}

/* Reduced motion: everything arrives, nothing travels. Identical end state to
   the authored static path, reached without a single transition. */
if (reduced) {
  for (const el of nodes) el.classList.add('is-in');
} else {
  /* index the children of a stagger so CSS can delay them without JS holding a
     timer per row */
  for (const el of nodes) {
    if (el.dataset.lower !== 'stagger') continue;
    const kids = el.children;
    if (!kids.length) {
      console.warn('[lower] "stagger" on <' + el.tagName.toLowerCase() + '> with no children — it will behave as a plain rise, which is the thing stagger exists to avoid.');
    }
    for (let i = 0; i < kids.length; i++) kids[i].style.setProperty('--i', String(i));
  }

  const enter = new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      obs.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  for (const el of nodes) {
    if (el.dataset.lower === 'hold') continue;
    enter.observe(el);
  }

  /* ── hold ──────────────────────────────────────────────────────────────
     One per section, and it is the only thing down here that tracks the
     scroll. The featured images have real headroom for it: cine.css gives them
     `aspect-ratio: 16/10` with `object-fit: cover`, so a slow scale has
     somewhere to go and never reveals an edge. */
  const held = nodes.filter((el) => el.dataset.lower === 'hold');
  if (held.length) {
    let ticking = false;
    const run = () => {
      ticking = false;
      const h = window.innerHeight;
      for (const el of held) {
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > h) continue;
        /* -1 above the fold, +1 below it, 0 when centred */
        const t = ((r.top + r.height / 2) - h / 2) / (h / 2 + r.height / 2);
        const img = el.querySelector('img') || el;
        img.style.scale = String(1.06 - 0.04 * (1 - Math.abs(t)));
        img.style.translate = '0 ' + (t * -14).toFixed(1) + 'px';
      }
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(run);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    run();
  }
}

/* Absence raises no alarm, so it is asked about directly: a role nobody wrote
   the CSS for is a no-op that looks exactly like a page that was never
   animated. This is the same check main.js makes, for the same reason. */
const KNOWN = new Set(['rise', 'stagger', 'hold', 'rule']);
for (const el of nodes) {
  const role = el.dataset.lower;
  if (!KNOWN.has(role)) {
    console.warn('[lower] unknown role "' + role + '" — it will do nothing, silently, which is indistinguishable from a page with no motion.');
  }
}
