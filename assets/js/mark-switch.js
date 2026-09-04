/* ── MARK SWITCH — REVIEW FURNITURE ─────────────────────────────────────────
   Two candidate logos are on index10 while the client chooses between them.
   This swaps which one is painted, without a reload.

   Why not two pages, which is the obvious way to do it: a logo is judged by
   flipping between candidates with everything else held still. A reload puts
   the client back at the top of a 7 MB page with the hero video restarting,
   and by the time the second mark is on screen the first one is a memory
   rather than a comparison.

   PROGRESSIVE ENHANCEMENT, NOT A HOOK. Every control here is a real link to a
   real URL. With this file blocked, the links still navigate and the ?mark=
   they carry is still read by the inline script in <head>. All this file does
   is take the reload out.

   DELETE THIS FILE when the client picks a mark. It goes with the .mark-switch
   markup, the .mark-switch rules in v10.css, and the losing SVG. */
(function () {
  'use strict';

  var root = document.documentElement;

  function normalise(value) {
    return value === '2' ? '2' : '1';
  }

  /* One function owns the whole state: the attribute, the address bar, the
     mark link's own destination and which switch button reads as current. They
     are updated together or the page starts telling the client two different
     things about which logo they are looking at. */
  function apply(mark, pushHistory) {
    mark = normalise(mark);
    var other = mark === '2' ? '1' : '2';

    root.setAttribute('data-mark', mark);

    /* The mark in the header always points at the one you are NOT looking at. */
    var brand = document.querySelector('.wordmark[data-mark-to]');
    if (brand) {
      brand.setAttribute('data-mark-to', other);
      brand.setAttribute('href', '?mark=' + other);
    }

    var buttons = document.querySelectorAll('.mark-switch a[data-mark-to]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute(
        'aria-current',
        buttons[i].getAttribute('data-mark-to') === mark ? 'true' : 'false'
      );
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

  /* Delegated, so it covers the mark in the header and the two switch buttons
     with one listener and keeps working after the hrefs above are rewritten. */
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
     not change the picture, it brings the link destination and the current
     button into line with it. */
  apply(root.getAttribute('data-mark'), false);
})();
