/* ============================================================================
   index10-rails.js — the two horizontal rails, and nothing else.
   ----------------------------------------------------------------------------
   THE RAILS ALREADY WORK BEFORE THIS FILE LOADS. They are lists with
   `overflow-x: auto`, so the wheel, the trackpad, a drag, the arrow keys and a
   screen reader's own navigation all move them. That is the whole reason they
   are lists rather than a carousel component: the behaviour is the browser's,
   and it is better than anything I would write.

   What this adds is the pair of round buttons the mockup draws. They are marked
   `hidden` in the markup and revealed here, so a reader with scripts off never
   sees a control that does nothing — which is the one thing a carousel button
   must never be.

   No autoplay. No timer. Nothing moves unless a person moves it (MJ6).
   ========================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function mountRail(section) {
  const track = section.querySelector('[data-rail-track]');
  const controls = section.querySelector('[data-rail-controls]');
  if (!track || !controls) return;

  const prev = controls.querySelector('[data-rail="prev"]');
  const next = controls.querySelector('[data-rail="next"]');
  if (!prev || !next) return;

  /* One page is the visible width less a card's worth of overlap, so the card
     you were reading is still on screen after the jump. A carousel that scrolls
     exactly one viewport loses the reader's place every time. */
  const page = () => Math.max(track.clientWidth * 0.8, 240);

  const go = (dir) => {
    track.scrollBy({
      left: dir * page(),
      behavior: REDUCED ? 'auto' : 'smooth',
    });
  };

  /* Disabled at the ends rather than wrapping. A rail that silently teleports
     back to the start is a rail whose scrollbar is lying about where you are. */
  const sync = () => {
    const max = track.scrollWidth - track.clientWidth;
    const x = track.scrollLeft;
    prev.disabled = x <= 2;
    next.disabled = x >= max - 2;
    /* If everything fits, the buttons have no work to do and no business being
       on screen. */
    controls.hidden = max <= 2;
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync, { passive: true });

  controls.hidden = false;
  sync();
}

function boot() {
  for (const s of document.querySelectorAll('.m-sec')) mountRail(s);
}

if (document.readyState === 'complete') boot();
else window.addEventListener('load', boot, { once: true });
