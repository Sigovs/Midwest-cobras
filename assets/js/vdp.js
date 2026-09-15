/* vdp.js — a car's own page, vehicle-*.html. The page works without it: the
   first photograph is shown, every panel is a native <details> that opens by
   itself, the estimators show their starting figure, Text is a message to
   the shop.

   The stage: the photograph at the top, its thumbnails, the arrows and the
   Gallery further down all move one stage. Save shares the inventory's list
   in this browser; Share and Text are the inventory's menu and panel, set
   for this one car. Then the record's panels: links that open them, the
   financing estimate, and the question to Evan. */

(function () {
  'use strict';

  var page = document.querySelector('[data-vdp]');
  if (!page) return;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var carId = page.getAttribute('data-vdp');
  var pageUrl = window.location.href.split('#')[0];
  var nameEl = page.querySelector('[data-vdp-name]');
  var carName = nameEl ? nameEl.textContent.trim() : document.title;

  /* ── the gallery ─────────────────────────────────────────────────────── */
  /* Thumbnails are real buttons carrying the full photograph, so the strip is
     keyboard-operable and each announces what it shows. The arrow keys move
     through the photographs once the gallery has focus, and only then. */
  var stage = page.querySelector('[data-stage]');
  if (stage) {
    var stageImg = stage.querySelector('[data-stage-img]');
    var thumbs = [].slice.call(stage.querySelectorAll('[data-thumb]'));
    var indexEl = stage.querySelector('[data-stage-index]');
    var at = 0;
    var upright = function () { stageImg.toggleAttribute('data-portrait', stageImg.naturalHeight > stageImg.naturalWidth); };
    stageImg.addEventListener('load', upright);
    if (stageImg.complete) upright();

    var show = function (i) {
      if (!thumbs.length) return;
      at = (i + thumbs.length) % thumbs.length;
      var t = thumbs[at];
      stageImg.src = t.getAttribute('data-src');
      stageImg.alt = t.getAttribute('data-alt') || '';
      thumbs.forEach(function (b, n) { b.setAttribute('aria-current', n === at ? 'true' : 'false'); });
      if (indexEl) indexEl.textContent = (at + 1) + ' / ' + thumbs.length;
    };
    thumbs.forEach(function (b, n) { b.addEventListener('click', function () { show(n); }); });
    var prev = stage.querySelector('[data-stage-prev]');
    var next = stage.querySelector('[data-stage-next]');
    if (prev) prev.addEventListener('click', function () { show(at - 1); });
    if (next) next.addEventListener('click', function () { show(at + 1); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(at - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { show(at + 1); e.preventDefault(); }
    });
    /* A photograph at the foot opens in the gallery, and the page goes to it. */
    [].slice.call(page.querySelectorAll('[data-photo]')).forEach(function (b) {
      b.addEventListener('click', function () {
        show(parseInt(b.getAttribute('data-photo'), 10) || 0);
        stage.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        stage.focus({ preventScroll: true });
      });
    });
  }

  /* ── save: the inventory's list, in this browser ─────────────────────── */
  var KEY = 'midwest-cobras-saved';
  var saved = [];
  try { saved = JSON.parse(window.localStorage.getItem(KEY)) || []; } catch (e) { saved = []; }
  var saveBtn = page.querySelector('[data-save]');
  if (saveBtn) {
    var saveLabel = saveBtn.querySelector('[data-save-label]');
    var paintSave = function () {
      var on = saved.indexOf(carId) > -1;
      saveBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (saveLabel) saveLabel.textContent = on ? 'Saved' : 'Save';
    };
    paintSave();
    saveBtn.addEventListener('click', function () {
      var i = saved.indexOf(carId);
      if (i > -1) saved.splice(i, 1); else saved.push(carId);
      try { window.localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* not kept */ }
      paintSave();
    });
  }

  /* ── share ───────────────────────────────────────────────────────────── */
  /* The inventory's: the phone's sheet where there is one and a finger is the
     pointer, otherwise the menu beside the button, set once for this page. */
  var pop = document.querySelector('[data-sharepop]');
  var shareBtn = page.querySelector('[data-share]');
  var coarse = window.matchMedia('(pointer: coarse)');
  if (shareBtn) {
    var shareText = carName + ' — Midwest Cobras';
    var hasPop = !!(pop && typeof pop.showPopover === 'function');
    var popItems = function () { return [].slice.call(pop.querySelectorAll('.sharepop__item')); };
    var placePop = function () {
      var r = shareBtn.getBoundingClientRect(), gap = 8, w = pop.offsetWidth, h = pop.offsetHeight;
      var left = Math.min(Math.max(gap, r.right - w), window.innerWidth - w - gap);
      var top = r.bottom + gap;
      if (top + h > window.innerHeight - gap) top = Math.max(gap, r.top - h - gap);
      pop.style.left = Math.round(left) + 'px';
      pop.style.top = Math.round(top) + 'px';
    };

    if (hasPop) {
      var e = encodeURIComponent;
      var to = {
        facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + e(pageUrl),
        x: 'https://x.com/intent/post?text=' + e(shareText) + '&url=' + e(pageUrl),
        whatsapp: 'https://wa.me/?text=' + e(shareText + ' ' + pageUrl),
        email: 'mailto:?subject=' + e(shareText) + '&body=' + e(carName + '\n' + pageUrl)
      };
      pop.querySelector('[data-sharepop-name]').textContent = carName;
      [].slice.call(pop.querySelectorAll('[data-share-to]')).forEach(function (a) {
        var place = a.getAttribute('data-share-to');
        a.href = to[place];
        a.addEventListener('click', function (ev) {
          if (place === 'email') { pop.hidePopover(); return; }
          var w = 600, h = 560;
          var x = Math.round(window.screenX + (window.outerWidth - w) / 2), y = Math.round(window.screenY + (window.outerHeight - h) / 2);
          var win = window.open(a.href, 'midwest-share', 'popup,width=' + w + ',height=' + h + ',left=' + x + ',top=' + y);
          if (win) { ev.preventDefault(); pop.hidePopover(); }
        });
      });
      pop.addEventListener('toggle', function (ev) {
        if (ev.newState !== 'closed') return;
        shareBtn.setAttribute('aria-expanded', 'false');
        if (!document.activeElement || document.activeElement === document.body || pop.contains(document.activeElement)) {
          shareBtn.focus({ preventScroll: true });
        }
      });
      pop.addEventListener('keydown', function (ev) {
        var items = popItems(), i = items.indexOf(document.activeElement);
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          ev.preventDefault();
          items[i < 0 ? 0 : (i + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
        } else if (ev.key === 'Home' || ev.key === 'End') {
          ev.preventDefault();
          items[ev.key === 'Home' ? 0 : items.length - 1].focus();
        }
      });
      pop.querySelector('[data-share-copy]').addEventListener('click', function () {
        var state = pop.querySelector('[data-share-copy-state]');
        var said = function (ok) { state.textContent = ok ? 'Copied' : 'Copy failed'; };
        if (navigator.clipboard) navigator.clipboard.writeText(pageUrl).then(function () { said(true); }, function () { said(false); });
        else said(false);
      });
      window.addEventListener('scroll', function () { if (pop.matches(':popover-open')) placePop(); }, { passive: true });
      window.addEventListener('resize', function () { if (pop.matches(':popover-open')) placePop(); });
    }

    var wasOpen = false;
    shareBtn.addEventListener('pointerdown', function () { wasOpen = hasPop && pop.matches(':popover-open'); });
    shareBtn.addEventListener('click', function () {
      if (navigator.share && coarse.matches) {
        navigator.share({ title: shareText, url: pageUrl }).catch(function () {});
        return;
      }
      if (!hasPop) {
        var label = shareBtn.querySelector('[data-share-label]');
        if (navigator.clipboard && label) {
          navigator.clipboard.writeText(pageUrl).then(function () {
            label.textContent = 'Link copied';
            window.setTimeout(function () { label.textContent = 'Share'; }, 2000);
          });
        }
        return;
      }
      var openNow = pop.matches(':popover-open');
      if (openNow || wasOpen) {
        if (openNow) pop.hidePopover();
        wasOpen = false;
        return;
      }
      pop.querySelector('[data-share-copy-state]').textContent = '';
      pop.showPopover();
      shareBtn.setAttribute('aria-expanded', 'true');
      placePop();
      var first = popItems()[0];
      if (first) first.focus({ preventScroll: true });
    });
  }

  /* ── text: the car sent to a phone ───────────────────────────────────── */
  /* The panel is filled for this car in the markup; v11.js opens and closes
     it. This draws the code for this page and minds the number. Design only:
     nothing is sent. */
  var tcForm = document.querySelector('[data-textcar-form]');
  if (tcForm) {
    var qr = document.querySelector('[data-textcar-qr]');
    if (qr && typeof window.qrcode === 'function') {
      var code = window.qrcode(0, 'M');
      code.addData(pageUrl);
      code.make();
      qr.innerHTML = code.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } else if (qr) {
      var scan = qr.closest('.textcar__scan');
      if (scan) scan.hidden = true;
    }
    var tcPhone = tcForm.querySelector('input[type="tel"]');
    var tcStatus = document.querySelector('[data-textcar-status]');
    var digits = function (v) { return v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').slice(0, 10); };
    var pretty = function (d) {
      if (d.length < 4) return d;
      if (d.length < 7) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
      return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
    };
    tcPhone.addEventListener('input', function () { tcPhone.value = pretty(digits(tcPhone.value)); });
    tcForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = digits(tcPhone.value);
      if (d.length !== 10) {
        tcPhone.setAttribute('aria-invalid', 'true');
        tcStatus.setAttribute('data-state', 'error');
        tcStatus.textContent = 'Enter a ten-digit US number.';
        tcPhone.focus();
        return;
      }
      tcPhone.removeAttribute('aria-invalid');
      tcStatus.setAttribute('data-state', 'sent');
      tcStatus.textContent = 'Sent. The link is on its way to ' + pretty(d) + '.';
    });
  }

  /* ── the record's panels, and the links into them ────────────────────── */
  /* A <details> does not open because a link points into it, so a link to a
     closed panel — Enquire, Ask for a walkaround — opens it first, and a link
     that carries an opening line puts it in the message. In-page links travel
     rather than jump (Alex, 2026-09-14: "navigation from here must be smooth,
     not jump"): the browser's own smooth scroll, landing under the bar by
     html's scroll-padding; under reduced motion the plain jump, and a
     modified click is left to the browser. A page arriving with #finance in
     its address opens that panel too. */
  var openPanel = function (el) {
    var d = el.matches('details') ? el : el.closest('details');
    if (d) d.open = true;
  };
  var askMsg = document.querySelector('#a-msg');
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('main a[href^="#"]');
    if (!a || ev.defaultPrevented || ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
    var id = a.getAttribute('href').slice(1);
    var el = id && document.getElementById(id);
    if (!el) return;
    ev.preventDefault();
    openPanel(el);
    if (askMsg && a.hasAttribute('data-ask-msg')) askMsg.value = a.getAttribute('data-ask-msg');
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', '#' + id);
  });
  if (window.location.hash.length > 1) {
    var arrived = document.getElementById(window.location.hash.slice(1));
    if (arrived) {
      openPanel(arrived);
      window.setTimeout(function () { arrived.scrollIntoView({ block: 'start' }); }, 60);
    }
  }

  var num = function (el) {
    var v = parseFloat(String(el.value).replace(/[^\d.]/g, ''));
    return isFinite(v) ? v : 0;
  };

  /* ── financing: an estimate on the reader's own numbers ──────────────── */
  /* Standard amortisation on the four values the reader sets. A zero rate is
     worked separately because the formula divides by it. The panel's head
     carries the same figure, so it is readable closed. */
  var calc = document.querySelector('[data-calc]');
  if (calc) {
    var cPrice = calc.querySelector('[data-calc-price]');
    var cDown = calc.querySelector('[data-calc-down]');
    var cTerm = calc.querySelector('[data-calc-term]');
    var cApr = calc.querySelector('[data-calc-apr]');
    var cOut = calc.querySelector('[data-calc-out]');
    var cHeads = [].slice.call(document.querySelectorAll('[data-rec-val]'));
    var runCalc = function () {
      var principal = Math.max(0, num(cPrice) - num(cDown));
      var n = parseInt(cTerm.value, 10) || 60;
      var r = num(cApr) / 100 / 12;
      var m = r > 0 ? principal * r / (1 - Math.pow(1 + r, -n)) : principal / n;
      var ok = principal > 0 && isFinite(m);
      var fig = '$' + Math.round(m).toLocaleString('en-US');
      cOut.textContent = ok ? fig + ' / mo' : '—';
      cHeads.forEach(function (h) { h.textContent = ok ? 'Est. ' + fig + ' / mo' : ''; });
    };
    /* Money fields keep their thousands separators as the reader types. */
    [cPrice, cDown].forEach(function (el) {
      el.addEventListener('blur', function () {
        var v = Math.round(num(el));
        el.value = v ? v.toLocaleString('en-US') : '';
      });
    });
    calc.addEventListener('input', runCalc);
    calc.addEventListener('change', runCalc);
    calc.addEventListener('submit', function (ev) { ev.preventDefault(); runCalc(); });
    runCalc();
  }


  /* ── ask: the question goes to Evan with the stock number ────────────── */
  /* Design only: nothing is sent. The two fields Evan needs to answer are
     checked, and the answer to the reader names where it went. */
  var ask = document.querySelector('[data-ask]');
  if (ask) {
    var askStatus = ask.querySelector('[data-ask-status]');
    ask.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var missing = [].slice.call(ask.querySelectorAll('[required]')).filter(function (el) {
        var bad = !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
        return bad;
      });
      askStatus.hidden = false;
      if (missing.length) {
        askStatus.setAttribute('data-state', 'error');
        askStatus.textContent = 'Add your first name and an email address, so Evan can answer.';
        missing[0].focus();
        return;
      }
      askStatus.setAttribute('data-state', 'sent');
      askStatus.textContent = 'Sent. Evan has your message about ' + carName + '.';
    });
  }
})();
