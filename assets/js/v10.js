/* v10.js — three small jobs. The page is finished HTML and CSS without it.

   1 · the header takes a ground once the hero has left
   1b · the hero video parks on its last frame under reduced motion
   2 · the rails get their arrow buttons and their wrap-around

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
    var first = document.querySelector('main .sect');
    if (!bar || !first) return;
    if (!('IntersectionObserver' in window)) return;

    /* WATCHING THE HERO STOPPED WORKING THE DAY THE HERO WENT STICKY. It used
       to scroll away and the bar took its ground when it left; now it holds at
       the top of the window forever, never stops intersecting, and the bar
       never took its ground at all — the labels ran over 02 with nothing
       behind them.

       So the thing watched is a one-pixel marker in normal flow, sitting where
       the hero used to end. It is made here rather than written into the markup
       because it is a mechanism, not content, and a page with no scripts has no
       use for it — that page keeps the ground at all times, which is the safe
       side of this switch and the reason it is the default in the stylesheet.

       isIntersecting is not enough on its own: the marker is outside the root
       both when it is ABOVE the bar and when it is still below the fold, and
       those two want opposite answers. The rectangle says which. */
    var mark = document.createElement('div');
    mark.setAttribute('aria-hidden', 'true');
    mark.style.cssText = 'position:relative;block-size:1px;margin-block-end:-1px;pointer-events:none';
    first.parentNode.insertBefore(mark, first);

    var io, h;
    function watch() {
      var next = Math.round(bar.getBoundingClientRect().height);
      if (next === h) return;              /* same bar, same line, same observer */
      h = next;
      if (io) io.disconnect();
      io = new IntersectionObserver(function (entries) {
        bar.setAttribute('data-stuck', entries[0].boundingClientRect.top <= h ? 'true' : 'false');
      }, { rootMargin: '-' + h + 'px 0px 0px 0px', threshold: 0 });
      io.observe(mark);
    }

    watch();
    /* The bar is two heights — one over the hero, one past it — and it is a
       third on a phone. The line has to follow it. */
    window.addEventListener('resize', watch, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(watch);
  }

  /* ── 1b · the hero video under reduced motion ───────────────────────── */
  function hero() {
    var v = document.querySelector('.hero__video');
    if (!v || !reduced) return;

    /* The autoplay attribute is in the markup, because without scripts that is
       the only thing that starts it and a still hero is a worse default than a
       moving one. Here it is taken back off and the video is parked on its last
       frame instead — the shot with the headlights on, which is the one the
       whole eight seconds is travelling towards. Someone who has asked for less
       motion gets the destination without the journey, rather than a poster of
       the frame before anything happened. */
    v.removeAttribute('autoplay');
    v.removeAttribute('loop');   /* or anything that restarts it runs forever */
    v.pause();
    var end = function () {
      try { v.currentTime = Math.max(0, v.duration - 0.05); } catch (e) {}
      v.pause();
    };
    if (v.readyState >= 1) end();
    else v.addEventListener('loadedmetadata', end, { once: true });
    /* Chrome can start it anyway before the attribute comes off. */
    v.addEventListener('play', function () { v.pause(); end(); });
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
      if (track.children.length < 2) return Math.max(track.clientWidth * 0.8, 240);
      var stride = track.children[1].getBoundingClientRect().left
                 - track.children[0].getBoundingClientRect().left;
      if (stride < 8) return Math.max(track.clientWidth * 0.8, 240);
      /* Whole cards only. Four fifths of a window is the right distance and
         almost never a whole number of cards, so it is rounded to one — a rail
         left standing between two cards has thrown away the grid it just drew.
         A card wider than a third of the window is a big card and moves alone;
         a rail of thumbnails moves as many as fit in four fifths of a screen. */
      var wide = stride > track.clientWidth / 3;
      var n = wide ? 1 : Math.max(1, Math.round(track.clientWidth * 0.8 / stride));
      return stride * n;
    }

    /* The browser animates the scroll, not a rAF loop here.

       A hand-rolled tween looked like the safer option and is not: rAF is
       throttled to about one frame a second when the window is occluded or the
       tab is in the background, and a scroll animation that stalls halfway
       leaves the rail parked between two cards. The browser's own smooth scroll
       is driven by the scroller and does not stall like that.

       What it will not survive is being started in the same task as a direct
       write to scrollLeft — it is silently dropped, which is a press of the
       arrow that does nothing. So when the loop has just jumped, the scroll is
       handed to the next task. */
    function go(dir) {
      clearTimeout(settle);
      var jumped = normalise();
      var step = dir * page();
      function run() {
        busyUntil = Date.now() + (reduced ? 0 : 700);
        track.scrollBy({ left: step, behavior: reduced ? 'auto' : 'smooth' });
        settle = setTimeout(afterSettle, 160);
      }
      if (jumped) setTimeout(run, 0); else run();
    }

    /* ── the loop ────────────────────────────────────────────────────────
       Three copies of the list: one before, the real one, one after. Prepending
       a full set shifts everything right by exactly one set width, so "home" is
       that width and nothing has to be measured against the old positions.

       When the scroll settles more than half a set either side of home, the
       scroll position jumps by one set. The content under the visitor is
       identical at both ends of that jump, so there is nothing to see — which is
       the whole trick, and the reason this needs three sets rather than two.

       Only after it settles. Jumping during a smooth scroll cancels the
       animation, and the spare set on each side is the room that buys the wait.

       No JavaScript: no clones, and the rail is a list that scrolls to its end.
       That is a smaller thing to lose than the cards themselves. */
    var real = Array.prototype.slice.call(track.children);
    var looping = false;

    function clone(el) {
      var c = el.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.setAttribute('data-clone', '');
      /* A copy is not a second car. It is out of the tab order and out of the
         accessibility tree, so the count a screen reader announces is the
         count that exists. */
      var focusable = c.querySelectorAll('a, button, input, select, textarea, [tabindex]');
      for (var i = 0; i < focusable.length; i++) focusable[i].setAttribute('tabindex', '-1');
      return c;
    }

    function buildLoop() {
      if (looping || real.length < 2) return;
      /* No "does it overflow yet" test here, and that was a real bug: with two
         cars the list fits the window exactly, so the guard refused to clone —
         and refusing to clone is what kept it from overflowing. Cloning is what
         creates the scroll, not a reaction to it. Two cars and a slice of the
         third is the shape the prototype has, and the third is the first one
         coming round again. */
      var head = document.createDocumentFragment();
      var tail = document.createDocumentFragment();
      for (var i = 0; i < real.length; i++) {
        head.appendChild(clone(real[i]));
        tail.appendChild(clone(real[i]));
      }
      track.appendChild(tail);
      track.insertBefore(head, track.firstChild);
      looping = true;
      home();
    }

    function setWidth() {
      if (!looping) return 0;
      var box = track.getBoundingClientRect().left + track.scrollLeft;
      var first = track.children[0].getBoundingClientRect().left - box;
      var nth = track.children[real.length].getBoundingClientRect().left - box;
      return nth - first;
    }

    function jump(to) {
      var snap = track.style.scrollSnapType;
      var behav = track.style.scrollBehavior;
      /* Snap off for the duration, or it drags the jump back the way it came. */
      track.style.scrollSnapType = 'none';
      track.style.scrollBehavior = 'auto';
      track.scrollLeft = to;
      track.style.scrollSnapType = snap;
      track.style.scrollBehavior = behav;
    }

    function home() { jump(setWidth()); }

    var settle, busyUntil = 0;
    /* A drag, a wheel or a swipe settles here. An arrow press waits out its own
       animation first — jumping mid-scroll is what cancels it. */
    function afterSettle() {
      if (Date.now() < busyUntil) { settle = setTimeout(afterSettle, 120); return; }
      normalise();
    }
    /* Returns whether it actually moved the scroll position — the caller needs
       to know, because a smooth scroll started right after a jump is dropped. */
    function normalise() {
      if (!looping) return false;
      var w = setWidth();
      if (!w) return false;
      var x = track.scrollLeft;
      if (x < w * 0.5) { jump(x + w); return true; }
      if (x > w * 1.5) { jump(x - w); return true; }
      return false;
    }

    /* A wrapping rail has no ends, so neither arrow is ever dead. Both stay
       live and the only question left is whether there is anything to scroll. */
    function sync() {
      var max = track.scrollWidth - track.clientWidth;
      if (looping) {
        prev.disabled = false;
        next.disabled = false;
      } else {
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max - 2;
      }
      controls.hidden = max <= 2;      /* nothing to scroll, nothing to press */
    }

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });
    track.addEventListener('scroll', function () {
      sync();
      clearTimeout(settle);
      settle = setTimeout(afterSettle, 140);
    }, { passive: true });
    window.addEventListener('resize', function () { sync(); normalise(); }, { passive: true });

    controls.hidden = false;
    buildLoop();
    sync();
    /* Web fonts land after first paint and change every measurement here. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { buildLoop(); home(); sync(); });
    }
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
    hero();
    var sections = document.querySelectorAll('.sect');
    for (var i = 0; i < sections.length; i++) rail(sections[i]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
