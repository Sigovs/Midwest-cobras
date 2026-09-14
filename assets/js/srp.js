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

  /* ── share: the device's sheet, or the link on the clipboard ─────────── */
  cards.forEach(function (card) {
    var btn = card.querySelector('[data-share]');
    if (!btn) return;
    var labelEl = btn.querySelector('[data-share-label]');
    btn.addEventListener('click', function () {
      var url = window.location.href.split('#')[0] + '#' + card.id;
      var title = card.querySelector('.car__title').textContent;
      var said = function (text) {
        if (!labelEl) return;
        labelEl.textContent = text;
        window.setTimeout(function () { labelEl.textContent = 'Share'; }, 2000);
      };
      if (navigator.share) {
        navigator.share({ title: title + ' — Midwest Cobras', url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { said('Link copied'); }, function () { said('Copy failed'); });
      }
    });
  });

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
