/* ============================================================================
   smoother.js — scroll smoothing, for every direction rather than one.
   ----------------------------------------------------------------------------
   This used to be eight lines inside cinema.js with a paragraph above them
   apologising for existing. The rule it was breaking has been lifted on Alex's
   instruction (2026-08-25), so it moves here: one instance, one place, one set
   of numbers, available to any page that has the wrapper markup.

   WHAT WAS LIFTED, precisely. The project rule said "no smooth-scroll library,
   ever" and the direction-C block was written as a yield to it. That blanket
   ban is gone. What has NOT gone is the thing underneath it — MJ6 owns whether
   the visitor still controls the transport at all, and these still bind:

     · no pin the reader cannot scroll out of
     · no sequence that has to be watched to the end
     · the scrollbar is real, draggable, and lands where it says
     · in-page anchors and the skip link go where they point

   Smoothing adds latency to the reader's own input. That is a real cost and it
   is the reason the number is 1.2 rather than the floaty 2+ that makes a page
   feel like it is on ice — not a rule, a judgement, and one worth re-taking on
   any page whose content is dense reading rather than a camera move.

   ONE FLOOR IS KEPT AND IT IS NOT A TASTE POSITION. Under
   prefers-reduced-motion there is no smoothing at all. Smoothing is motion
   applied to the visitor's own scrolling, which is the last place someone with
   a vestibular condition can escape it. Overriding that is a line in this file
   if it is ever genuinely wanted, and it should be argued rather than typed.
   ========================================================================== */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

export const SMOOTH = {
  desktop: 1.2,
  /* Touch is no longer locked out. It is light rather than absent: a phone
     already has momentum scrolling of its own, and matching it too hard is how
     a page starts fighting the platform instead of easing it. */
  touch: 0.1,
};

let instance = null;

/**
 * Create the page's one ScrollSmoother, if this page has the markup for it.
 * Safe to call more than once; safe to call on a page with no wrapper.
 *
 * MUST be called before any ScrollTrigger that pins, so the pin measures
 * against the smoothed scroller rather than the raw one.
 */
export function createSmoother(opts = {}) {
  if (instance) return instance;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.setAttribute('data-smooth', 'off-reduced-motion');
    return null;
  }

  const wrapper = document.querySelector('#smooth-wrapper');
  const content = document.querySelector('#smooth-content');
  if (!wrapper || !content) {
    document.documentElement.setAttribute('data-smooth', 'off-no-wrapper');
    return null;
  }

  instance = ScrollSmoother.get() || ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: opts.smooth ?? SMOOTH.desktop,
    smoothTouch: opts.smoothTouch ?? SMOOTH.touch,
    effects: opts.effects ?? true,
    normalizeScroll: false,   // leaves the browser's own scroll semantics alone
  });

  document.documentElement.setAttribute('data-smooth', 'on');
  patchAnchors(instance);
  return instance;
}

export function getSmoother() { return instance; }

/* An in-page link inside a smoothed page lands wherever the native scroll put
   it, which is not where the smoother thinks it is. The skip link is the one
   that matters most and the one nobody tests, so it is handled here rather
   than left to be discovered by somebody using it. */
function patchAnchors(smoother) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (!id || id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    smoother.scrollTo(el, true, 'top top');
    // the target still has to take focus, or the skip link skips nothing
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    el.focus({ preventScroll: true });
  });
}
