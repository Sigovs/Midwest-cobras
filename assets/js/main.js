/* ============================================================================
   main.js — navigation, motion roles, and the header's relationship to the hero.
   No scene here. The scene is assets/js/scene/ and it loads after this file has
   already made the page work.
   ========================================================================== */

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ── SCROLL SMOOTHING ──────────────────────────────────────────────────────
   Every page, one instance, and it happens here because main.js is the first
   module every direction loads — a pin has to measure against the smoothed
   scroller, so the smoother cannot be created after the scene it shares a page
   with. The module itself decides whether this page has the markup for it and
   whether the visitor wants motion at all. */
import { createSmoother } from './scene/smoother.js';
createSmoother();

/* ── NAV ───────────────────────────────────────────────────────────────────
   The Service dropdown opens on click, not on hover: a route that can only be
   found by hovering cannot be found on a phone, and cannot be found by anyone
   who does not already know it is there. Hover is added as a convenience on
   pointer devices, never as the only way in. */

const nav = document.querySelector('[data-nav]');

if (nav) {
  const mobileToggle = nav.querySelector('[data-nav-toggle]');
  const subToggle = nav.querySelector('[data-nav-sub]');
  const subMenu = subToggle && document.getElementById(subToggle.getAttribute('aria-controls'));

  const setSub = (open) => {
    if (!subToggle || !subMenu) return;
    subToggle.setAttribute('aria-expanded', String(open));
    subMenu.hidden = !open;
  };

  if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      mobileToggle.setAttribute('aria-expanded', String(open));
      if (!open) setSub(false);
    });
  }

  if (subToggle) {
    subToggle.addEventListener('click', () => {
      setSub(subToggle.getAttribute('aria-expanded') !== 'true');
    });

    const group = subToggle.closest('[data-nav-group]');
    if (group && window.matchMedia('(hover: hover) and (min-width: 56rem)').matches) {
      group.addEventListener('mouseenter', () => setSub(true));
      group.addEventListener('mouseleave', () => setSub(false));
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    setSub(false);
    nav.classList.remove('is-open');
    if (mobileToggle) mobileToggle.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', (e) => {
    if (nav.contains(e.target)) return;
    setSub(false);
  });
}

/* ── HEADER ────────────────────────────────────────────────────────────────
   Two different facts, and conflating them is what makes a bar cut a hard edge
   through content it is crossing: "the page has moved" and "the header has left
   the hero". Only the second one changes the header, and it is measured against
   the hero's own box rather than a magic scroll number. */

const header = document.querySelector('[data-header]');
const hero = document.querySelector('.hero');

if (header && hero && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    ([entry]) => header.classList.toggle('is-past-hero', !entry.isIntersecting),
    { rootMargin: `-${header.offsetHeight}px 0px 0px 0px`, threshold: 0 }
  );
  io.observe(hero);
}

/* ── MOTION ROLES ──────────────────────────────────────────────────────────
   Bound to what a mass IS — [data-motion='rise'] — never to a page's own
   section ids. A system written against #inventory animates nothing on the next
   page, raises no error doing it, and produces a page that looks exactly like
   one where motion was never designed.

   The check at the end is the other half of that: a silent no-op passes every
   test that asks whether something is broken, so we ask whether it took hold. */

const risers = document.querySelectorAll('[data-motion="rise"]');

if (risers.length && !reduced.matches && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      obs.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  risers.forEach((el) => io.observe(el));
} else {
  risers.forEach((el) => el.classList.add('is-in'));
}

/* Absence needs a check, because absence raises no alarm. */
if (risers.length === 0) {
  console.warn('[motion] no [data-motion] roles found on this page — the motion system is a no-op here, which is indistinguishable from a page that was never animated.');
}
