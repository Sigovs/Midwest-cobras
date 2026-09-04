/* ── MARK SWITCH — REVIEW FURNITURE ─────────────────────────────────────────
   Two candidate logos are on index10 while the client chooses between them.
   Clicking the mark in the header swaps which one is painted, without a reload.

   Why not two pages, which is the obvious way to do it: a logo is judged by
   flipping between candidates with everything else held still. A reload puts
   the client back at the top of a 7 MB page with the hero video restarting,
   and by the time the second mark is on screen the first one is a memory
   rather than a comparison.

   THE VISIBLE SWITCHER IS GONE, removed on Alex's instruction 2026-09-04 now
   that the mark itself is the control. Named because it is a real cost and not
   a tidy-up: nothing on screen says the logo can be clicked. The <a> carries a
   title so a hover explains it, and that is a hover-only affordance, which is
   exactly the discoverability failure the anti-patterns list names. It is
   acceptable here only because this is a review build with Alex in the room to
   say "click the logo" — it would not be acceptable on a page facing the public.

   PROGRESSIVE ENHANCEMENT, NOT A HOOK. The control is a real link to a real
   URL. With this file blocked, the link still navigates and the ?mark= it
   carries is still read by the inline script in <head>. All this file does is
   take the reload out.

   DELETE THIS FILE when the client picks a mark. It goes with the losing SVG
   and the second <img> in the header and the footer. */
(function () {
  'use strict';

  var root = document.documentElement;

  function normalise(value) {
    return value === '2' ? '2' : '1';
  }

  /* One function owns the whole state: the attribute, the address bar and the
     mark link's own destination. They are updated together or the page starts
     telling the client two different things about which logo they are on. */
  function apply(mark, pushHistory) {
    mark = normalise(mark);
    var other = mark === '2' ? '1' : '2';

    root.setAttribute('data-mark', mark);

    /* The mark always points at the one you are NOT looking at. */
    var brand = document.querySelector('.wordmark[data-mark-to]');
    if (brand) {
      brand.setAttribute('data-mark-to', other);
      brand.setAttribute('href', '?mark=' + other);
    }

    /* pushState rather than replaceState: Back should undo a switch, because
       that is what the client will reach for after flipping four times. The
       rest of the address — the hash they scrolled to included — is preserved,
       which is the reason for editing a URL object instead of assigning a
       string. */
    if (pushHistory) {
      var url = new URL(location.href);
      url.searchParams.set('mark', mark);
      history.pushState({ mark: mark }, '', url);
    }
  }

  /* Delegated, so it keeps working after the href above is rewritten. */
  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var target = event.target;
    if (!target || typeof target.closest !== 'function') return;

    var control = target.closest('[data-mark-to]');
    if (!control) return;

    event.preventDefault();
    apply(control.getAttribute('data-mark-to'), true);
  });

  window.addEventListener('popstate', function () {
    apply(new URLSearchParams(location.search).get('mark'), false);
  });

  /* The inline script in <head> has already set the attribute — this run does
     not change the picture, it brings the link's destination into line with it. */
  apply(root.getAttribute('data-mark'), false);
})();
