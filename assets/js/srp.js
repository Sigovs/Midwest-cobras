/* srp.js — the search results on inventory.html. The page works without it:
   every car is listed, the filters are ordinary controls.

   The mechanics are Hinderer's (HINDERER/assets/js/main.js, "Search
   results"), carried over: the filters and the sort read the cards
   themselves — each <li> carries data-condition, -year, -make, -model,
   -price, -miles and -status — so a filter reads what the page already says
   rather than a second copy that could disagree with it. What is Midwest's:
   a saved car is remembered in this browser and can be the filter; Share
   uses the device's share sheet, or copies the link. */

(function () {
  'use strict';

  var form = document.querySelector('[data-facets]');
  var list = document.querySelector('[data-results]');
  if (!form || !list) return;

  var cards = [].slice.call(list.querySelectorAll('.car'));
  var arrival = cards.slice();
  var emptyEl = document.querySelector('[data-results-empty]');
  var pager = document.querySelector('[data-pager]');
  var sortEl = document.querySelector('[data-sort]');
  var clears = [].slice.call(document.querySelectorAll('[data-facets-clear]'));
  var panel = document.getElementById('facets');
  var activeEl = document.querySelector('[data-facets-active]');
  var narrow = window.matchMedia('(max-width: 61.99rem)');
  var num = function (el, attr) { return parseInt(el.getAttribute(attr), 10) || 0; };

  /* ── saved cars, remembered in this browser ─────────────────────────── */
  var KEY = 'midwest-cobras-saved';
  var saved = [];
  try { saved = JSON.parse(window.localStorage.getItem(KEY)) || []; } catch (e) { saved = []; }
  var keep = function () { try { window.localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* not kept */ } };

  cards.forEach(function (card) {
    var btn = card.querySelector('[data-save]');
    if (!btn) return;
    var paintSave = function () { btn.setAttribute('aria-pressed', saved.indexOf(card.id) > -1 ? 'true' : 'false'); };
    paintSave();
    btn.addEventListener('click', function () {
      var at = saved.indexOf(card.id);
      if (at > -1) saved.splice(at, 1); else saved.push(card.id);
      keep();
      paintSave();
      apply();
    });
  });

  /* ── share ────────────────────────────────────────────────────────────── */
  /* Alex, 2026-09-14: share to social media, "as you see fit". Where the
     pointer is a finger and the device has a share sheet — a phone — the
     sheet is the better menu and Share hands straight over to it. Elsewhere
     Share opens the menu beside the button (inventory.html, #share-pop):
     Copy link, then Facebook, X, WhatsApp and Email, each set for this car.
     The places open in a small centred window, as they are designed to.
     Focus goes to the first row, the arrow keys walk the rows, and when the
     menu goes focus returns to the button that opened it. */
  var pop = document.querySelector('[data-sharepop]');
  var coarse = window.matchMedia('(pointer: coarse)');
  var popBtn = null;
  var carLink = function (card) { return window.location.href.split('#')[0] + '#' + card.id; };
  var carName = function (card) { return card.querySelector('.car__title').textContent.trim(); };
  var popItems = function () { return [].slice.call(pop.querySelectorAll('.sharepop__item')); };

  var placePop = function () {
    if (!popBtn) return;
    var r = popBtn.getBoundingClientRect(), gap = 8;
    var w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.min(Math.max(gap, r.right - w), window.innerWidth - w - gap);
    var top = r.bottom + gap;
    if (top + h > window.innerHeight - gap) top = Math.max(gap, r.top - h - gap);
    pop.style.left = Math.round(left) + 'px';
    pop.style.top = Math.round(top) + 'px';
  };

  var fillPop = function (card) {
    var name = carName(card), url = carLink(card), text = name + ' — Midwest Cobras', e = encodeURIComponent;
    var to = {
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + e(url),
      x: 'https://x.com/intent/post?text=' + e(text) + '&url=' + e(url),
      whatsapp: 'https://wa.me/?text=' + e(text + ' ' + url),
      email: 'mailto:?subject=' + e(text) + '&body=' + e(name + '\n' + url)
    };
    pop.querySelector('[data-sharepop-name]').textContent = name;
    pop.querySelector('[data-share-copy-state]').textContent = '';
    pop.setAttribute('data-url', url);
    [].slice.call(pop.querySelectorAll('[data-share-to]')).forEach(function (a) { a.href = to[a.getAttribute('data-share-to')]; });
  };

  if (pop && typeof pop.showPopover === 'function') {
    pop.addEventListener('toggle', function (ev) {
      if (ev.newState !== 'closed' || !popBtn) return;
      popBtn.setAttribute('aria-expanded', 'false');
      /* Back to the button — unless the visitor has clicked on to something
         else, which keeps its focus. */
      if (!document.activeElement || document.activeElement === document.body || pop.contains(document.activeElement)) {
        popBtn.focus({ preventScroll: true });
      }
    });
    pop.addEventListener('keydown', function (ev) {
      var items = popItems(), at = items.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        var next = at < 0 ? 0 : (at + (ev.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next].focus();
      } else if (ev.key === 'Home' || ev.key === 'End') {
        ev.preventDefault();
        items[ev.key === 'Home' ? 0 : items.length - 1].focus();
      }
    });
    pop.querySelector('[data-share-copy]').addEventListener('click', function () {
      var state = pop.querySelector('[data-share-copy-state]'), url = pop.getAttribute('data-url');
      var said = function (ok) { state.textContent = ok ? 'Copied' : 'Copy failed'; };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { said(true); }, function () { said(false); });
      else said(false);
    });
    [].slice.call(pop.querySelectorAll('[data-share-to]')).forEach(function (a) {
      if (a.getAttribute('data-share-to') === 'email') {
        a.addEventListener('click', function () { pop.hidePopover(); });
        return;
      }
      a.addEventListener('click', function (ev) {
        var w = 600, h = 560;
        var x = Math.round(window.screenX + (window.outerWidth - w) / 2), y = Math.round(window.screenY + (window.outerHeight - h) / 2);
        var win = window.open(a.href, 'midwest-share', 'popup,width=' + w + ',height=' + h + ',left=' + x + ',top=' + y);
        if (win) { ev.preventDefault(); pop.hidePopover(); }
      });
    });
    window.addEventListener('scroll', function () { if (pop.matches(':popover-open')) placePop(); }, { passive: true });
    window.addEventListener('resize', function () { if (pop.matches(':popover-open')) placePop(); });
  }

  cards.forEach(function (card) {
    var btn = card.querySelector('[data-share]');
    if (!btn) return;
    var labelEl = btn.querySelector('[data-share-label]');
    /* The browser dismisses an open menu on the press itself, before this
       button's click runs — so whether the menu was open is read here, at
       the press, not afterwards. */
    var wasOpen = false;
    btn.addEventListener('pointerdown', function () {
      wasOpen = !!(pop && pop.matches && pop.matches(':popover-open') && popBtn === btn);
    });
    btn.addEventListener('click', function () {
      if (navigator.share && coarse.matches) {
        navigator.share({ title: carName(card) + ' — Midwest Cobras', url: carLink(card) }).catch(function () {});
        return;
      }
      if (!pop || typeof pop.showPopover !== 'function') {
        /* No popover support: the link goes to the clipboard, said on the button. */
        if (navigator.clipboard && labelEl) {
          navigator.clipboard.writeText(carLink(card)).then(function () {
            labelEl.textContent = 'Link copied';
            window.setTimeout(function () { labelEl.textContent = 'Share'; }, 2000);
          });
        }
        return;
      }
      /* A second press on the same Share closes the menu rather than opening
         it again: by pointer (read at the press) or by keyboard. */
      var openNow = pop.matches(':popover-open') && popBtn === btn;
      if (openNow || wasOpen) {
        if (openNow) pop.hidePopover();
        wasOpen = false;
        return;
      }
      popBtn = btn;
      fillPop(card);
      pop.showPopover();
      btn.setAttribute('aria-expanded', 'true');
      placePop();
      var first = popItems()[0];
      if (first) first.focus({ preventScroll: true });
    });
  });

  /* ── Text: send this car to a phone ─────────────────────────────────── */
  /* Alex, 2026-09-14: Text opens a panel from the side, as Contact does on
     the home page, with what the dealer platform offers there — the car sent
     to a phone, or a code to scan. v11.js opens and closes the panel for
     every [data-enquiry-open]; this fills it with the car that was pressed
     and draws the code for that car's link. Design only: nothing is sent. */
  var tcCar = document.querySelector('[data-textcar]');
  if (tcCar) {
    var tc = tcCar.closest('dialog');
    var tcPick = function (sel) { return tc.querySelector(sel); };
    var tcForm = tcPick('[data-textcar-form]'), tcPhone = tcForm.querySelector('input[type="tel"]');
    var tcStatus = tcPick('[data-textcar-status]'), tcHint = tcStatus.textContent;
    var tcQr = tcPick('[data-textcar-qr]');

    var drawCode = function (url) {
      var fig = tcQr.closest('figure');
      if (typeof window.qrcode !== 'function') { if (fig) fig.hidden = true; return; }
      var code = window.qrcode(0, 'M');
      code.addData(url);
      code.make();
      tcQr.innerHTML = code.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    };
    var digits = function (v) { return v.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').slice(0, 10); };
    var pretty = function (d) {
      if (d.length < 4) return d;
      if (d.length < 7) return '(' + d.slice(0, 3) + ') ' + d.slice(3);
      return '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6);
    };

    cards.forEach(function (card) {
      var trigger = card.querySelector('[data-enquiry-open]');
      if (!trigger) return;
      trigger.addEventListener('click', function () {
        var img = card.querySelector('.car__media img');
        var facts = [].slice.call(card.querySelectorAll('.car__meta > span:not([aria-hidden])')).map(function (x) { return x.textContent; });
        tcPick('[data-textcar-name]').textContent = card.querySelector('.car__title').textContent;
        tcPick('[data-textcar-price]').textContent = card.querySelector('.car__price').textContent;
        tcPick('[data-textcar-miles]').textContent = facts[0] || '';
        tcPick('[data-textcar-stock]').textContent = (facts[1] || '').replace(/^Stock\s+/i, '');
        tcPick('[data-textcar-shot]').src = img.currentSrc || img.src;
        tcPick('[data-textcar-sms]').href = trigger.getAttribute('href');
        drawCode(window.location.href.split('#')[0] + '#' + card.id);
        tcPhone.removeAttribute('aria-invalid');
        tcStatus.removeAttribute('data-state');
        tcStatus.textContent = tcHint;
      });
    });

    /* The number is written the way it is said, as it is typed. */
    tcPhone.addEventListener('input', function () { tcPhone.value = pretty(digits(tcPhone.value)); });
    tcForm.addEventListener('submit', function (e) {
      e.preventDefault();
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

  /* ── the filters ─────────────────────────────────────────────────────── */
  /* A blank endpoint is not a filter: read as 0, an empty "price from" would
     quietly exclude every car. */
  var bound = function (name, fallback) {
    var el = form.elements[name];
    if (!el || el.value === '') return fallback;
    var v = parseInt(el.value, 10);
    return isNaN(v) ? fallback : v;
  };
  var ticked = function (facet) {
    var el = form.querySelector('[data-facet="' + facet + '"]');
    return !!(el && el.checked);
  };

  var matches = function (card) {
    /* Condition switches, where the page has them (inventory.html dropped
       its own on Alex's word): none on the page means no condition filter,
       not "no condition allowed". */
    var switches = form.querySelectorAll('[data-facet="condition"]');
    if (switches.length) {
      var conditions = [].slice.call(form.querySelectorAll('[data-facet="condition"]:checked')).map(function (i) { return i.value; });
      if (conditions.indexOf(card.getAttribute('data-condition')) === -1) return false;
    }
    var year = num(card, 'data-year');
    if (year < bound('yearFrom', -Infinity) || year > bound('yearTo', Infinity)) return false;
    var make = form.elements.make.value, model = form.elements.model.value;
    if (make && card.getAttribute('data-make') !== make) return false;
    if (model && card.getAttribute('data-model') !== model) return false;
    /* Advanced. Read the same open or shut: a filter set and then folded away
       is still a filter. */
    var price = num(card, 'data-price');
    if (price < bound('priceFrom', -Infinity) || price > bound('priceTo', Infinity)) return false;
    if (num(card, 'data-miles') > bound('milesTo', Infinity)) return false;
    if (ticked('hide-sold') && card.getAttribute('data-status') === 'sold') return false;
    if (ticked('saved-only') && saved.indexOf(card.id) === -1) return false;
    return true;
  };

  /* How many filters differ from "show me everything" — the only condition
     under which Clear has work, and the number the phone's Filter carries. */
  var activeCount = function () {
    var n = form.querySelectorAll('[data-facet="condition"]:not(:checked)').length ? 1 : 0;
    if (ticked('hide-sold')) n++;
    if (ticked('saved-only')) n++;
    if (form.elements.yearFrom.value !== '' || form.elements.yearTo.value !== '') n++;
    if (form.elements.priceFrom.value !== '' || form.elements.priceTo.value !== '') n++;
    ['make', 'model', 'milesTo'].forEach(function (k) { if (form.elements[k].value !== '') n++; });
    return n;
  };

  var sortCards = function () {
    var mode = sortEl ? sortEl.value : 'arrival';
    var by = {
      'price-asc': function (a, b) { return num(a, 'data-price') - num(b, 'data-price'); },
      'price-desc': function (a, b) { return num(b, 'data-price') - num(a, 'data-price'); },
      'year-desc': function (a, b) { return num(b, 'data-year') - num(a, 'data-year'); },
      'miles-asc': function (a, b) { return num(a, 'data-miles') - num(b, 'data-miles'); }
    }[mode];
    var order = by ? cards.slice().sort(by) : arrival;
    /* One fragment, one reflow. */
    var frag = document.createDocumentFragment();
    order.forEach(function (c) { frag.appendChild(c); });
    list.appendChild(frag);
  };

  function apply() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = matches(c);
      c.hidden = !ok;
      if (ok) shown++;
    });
    if (pager) {
      pager.hidden = shown === 0;
      pager.innerHTML = '<strong>' + shown + '</strong> of <strong>' + cards.length + '</strong> shown';
    }
    if (emptyEl) emptyEl.hidden = shown !== 0;
    var n = activeCount();
    clears.forEach(function (b) { if (b.classList.contains('facets__clear')) b.hidden = n === 0; });
    if (activeEl) { activeEl.hidden = n === 0; activeEl.textContent = n; }
  }

  /* ── the two-handled ranges ──────────────────────────────────────────── */
  /* One value, two ways in: a handle writes its field, a field moves its
     handle. The handles cannot cross — a "from" above its "to" can never
     match anything. A handle on its extreme is no preference, so its field
     stays blank. */
  [].slice.call(form.querySelectorAll('[data-range]')).forEach(function (group) {
    var lo = group.querySelector('[data-range-min]');
    var hi = group.querySelector('[data-range-max]');
    var loField = form.elements[lo.getAttribute('data-target')];
    var hiField = form.elements[hi.getAttribute('data-target')];
    var span = (+lo.max - +lo.min) || 1;

    var fill = function () {
      group.style.setProperty('--lo', ((+lo.value - +lo.min) / span).toFixed(4));
      group.style.setProperty('--hi', ((+hi.value - +lo.min) / span).toFixed(4));
    };
    var push = function (e) {
      if (+lo.value > +hi.value) {
        if (e && e.target === lo) lo.value = hi.value; else hi.value = lo.value;
      }
      loField.value = lo.value === lo.min ? '' : lo.value;
      hiField.value = hi.value === hi.max ? '' : hi.value;
      fill();
      apply();
    };
    var pull = function () {
      lo.value = loField.value !== '' ? loField.value : lo.min;
      hi.value = hiField.value !== '' ? hiField.value : hi.max;
      fill();
    };
    lo.addEventListener('input', push);
    hi.addEventListener('input', push);
    loField.addEventListener('input', pull);
    hiField.addEventListener('input', pull);
    form.addEventListener('reset', function () { window.setTimeout(function () { lo.value = lo.min; hi.value = hi.max; fill(); }, 0); });
    fill();
  });

  form.addEventListener('change', apply);
  form.addEventListener('input', apply);
  /* Enter in a field would submit and reload, throwing every filter away. On
     a phone it also folds the panel, because the results are under it. */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    apply();
    if (panel && narrow.matches) panel.open = false;
  });
  clears.forEach(function (b) {
    b.addEventListener('click', function () {
      form.reset();
      window.setTimeout(function () {
        apply();
        var adv = document.getElementById('advanced');
        if (adv) adv.open = false;
      }, 0);
    });
  });
  if (sortEl) sortEl.addEventListener('change', function () { sortCards(); apply(); });

  /* Open in the markup, so a page without scripts shows every filter. Folded
     only where the panel would sit on top of the results, and opened again if
     the window widens — wide, it has no summary to open it by. */
  var fold = function () { if (panel) panel.open = !narrow.matches; };
  fold();
  if (narrow.addEventListener) narrow.addEventListener('change', fold);

  sortCards();
  apply();
})();
