/* build.js — the configurator on build.html. The page works without it:
   every option is a real radio or checkbox, every group a native accordion,
   and the summary shows where the price starts.

   The mechanics are the Hinderer build's (HINDERER/assets/js/main.js,
   "Configurator"), carried over whole. What is Midwest's: the model is the
   first decision and it sets the base, so there is no single BASE constant —
   the price starts at the cheaper model until one is chosen. */

(function () {
  'use strict';

  var root = document.querySelector('.cfg');
  if (!root) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var groups = [].slice.call(root.querySelectorAll('[data-group]'));
  var modelInputs = [].slice.call(root.querySelectorAll('[data-group="model"] input'));
  var q = function (sel) { return root.querySelector(sel); };
  var totalEl = q('[data-total]'), labelEl = q('[data-total-label]'), remainEl = q('[data-remaining]');
  var modelEl = q('[data-sum-model]'), shotEl = q('[data-sum-shot]');
  var configField = q('[data-config-field]'), submitEl = q('[data-submit]'), attachedEl = q('[data-attached]');
  var progressBox = q('[data-progress]'), progressFill = q('[data-progress-fill]');
  var progressDone = q('[data-progress-done]'), progressTotal = q('[data-progress-total]');
  var bar = document.querySelector('[data-cfg-bar]');
  var barTotal = bar && bar.querySelector('[data-bar-total]');
  var barCount = bar && bar.querySelector('[data-bar-count]');

  var money = function (n) { return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 }); };
  var lowestBase = modelInputs.reduce(function (m, i) {
    return Math.min(m, parseInt(i.getAttribute('data-base'), 10) || Infinity);
  }, Infinity);

  /* ── motion: variant C ──────────────────────────────────────────────────
     Alex's pick, 2026-09-14, from the genjutsu cast of this page: the home
     page's Green flag at a tool's tempo. Each answer is confirmed where the
     eye already is — the photograph settles into its frame, the price drums
     turn, what the choice cost rises beside the price, and the lines it
     changed roll in. None of it is needed to read the page; under reduced
     motion none of it runs and every figure is simply right. */
  function restart(el, cls) {
    if (!el || reduced) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* A price as drums (v11.css's odometer): one per figure, the dollar sign
     and the comma static. The reading is a hidden span beside them, so a
     screen reader hears "$70,500", not a column of digits. When the figure
     changes shape — a sixth digit — the drums are rebuilt without a turn. */
  function meter(el) {
    if (!el) return null;
    el.textContent = '';
    var make = function (tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; };
    var sr = make('span', 'v11-sr');
    var face = make('span', 'cfg-odo'), pre = make('span', 'cfg-odo__pre'), drums = make('span', 'odo');
    var delta = make('span', 'cfg-delta');
    face.setAttribute('aria-hidden', 'true');
    delta.setAttribute('aria-hidden', 'true');
    face.appendChild(pre); face.appendChild(drums);
    el.appendChild(sr); el.appendChild(face); el.appendChild(delta);
    var shape = '';

    return {
      set: function (prefix, n, turn) {
        var s = money(n), digits = s.replace(/\D/g, '');
        sr.textContent = (prefix ? prefix + ' ' : '') + s;
        pre.textContent = prefix;
        if (s.replace(/\d/g, '#') !== shape) {
          shape = s.replace(/\d/g, '#');
          turn = false;
          drums.textContent = '';
          s.split('').forEach(function (ch) {
            if (!/\d/.test(ch)) { var c = make('span', 'cfg-odo__ch'); c.textContent = ch; drums.appendChild(c); return; }
            var dg = make('span', 'odo__dg'), strip = make('span');
            for (var d = 0; d < 10; d++) { var b = make('b'); b.textContent = d; strip.appendChild(b); }
            dg.appendChild(strip); drums.appendChild(dg);
          });
        }
        var strips = [].slice.call(drums.querySelectorAll('.odo__dg > span'));
        strips.forEach(function (st, i) {
          /* The last figure turns first, as on a counter. */
          st.style.setProperty('--k', String(strips.length - 1 - i));
          if (!turn) st.style.transition = 'none';
          st.style.setProperty('--n', digits[i]);
        });
        if (!turn) {
          void drums.offsetWidth;
          strips.forEach(function (st) { st.style.transition = ''; });
        }
      },
      delta: function (d) {
        if (!d || reduced) return;
        delta.textContent = (d > 0 ? '+' : '−') + money(Math.abs(d));
        restart(delta, 'is-on');
      }
    };
  }
  /* The card on the base picture carries the same number: Alex, 2026-09-14,
     "the price there has to change with the choice". */
  var baseLabel = q('[data-base-label]'), baseNext = q('[data-base-next]');
  var totalMeter = meter(totalEl), barMeter = meter(barTotal), baseMeter = meter(q('[data-base-price]'));
  var seen = {}, lastTotal = null, lastModel = null;

  /* The base picture follows the model: Alex, 2026-09-14, "logically it has
     to change". Each model input names its picture in data-hero; with no
     model chosen the page's own picture stands. The next picture is decoded
     before it is shown and then settles in out of the dark, so a swap never
     flashes an empty frame; a quicker second choice wins over a slow first. */
  var heroEl = q('.cfg-base__img');
  var heroDefault = heroEl && { src: heroEl.getAttribute('src'), alt: heroEl.getAttribute('alt'), fit: '' };
  var heroWant = heroDefault && heroDefault.src;
  function hero(model, animate) {
    if (!heroEl) return;
    var next = model && model.getAttribute('data-hero')
      ? { src: model.getAttribute('data-hero'), alt: model.getAttribute('data-hero-alt') || '', fit: model.getAttribute('data-hero-fit') || '' }
      : heroDefault;
    if (next.src === heroWant) return;
    heroWant = next.src;
    var show = function () {
      if (heroWant !== next.src) return;
      heroEl.setAttribute('src', next.src);
      heroEl.setAttribute('alt', next.alt);
      if (next.fit) heroEl.setAttribute('data-fit', next.fit); else heroEl.removeAttribute('data-fit');
      if (animate) restart(heroEl, 'is-swap');
    };
    var probe = new Image();
    probe.src = next.src;
    if (probe.decode) probe.decode().then(show, show); else show();
  }

  function read(group) {
    return [].slice.call(group.querySelectorAll('input:checked')).map(function (i) {
      return { label: i.value, price: parseInt(i.getAttribute('data-price'), 10) || 0 };
    });
  }

  /* `quiet` is Start over: the price still turns back, but ten lines rolling
     at once would be noise, not an answer. */
  function paint(quiet) {
    var model = root.querySelector('[data-group="model"] input:checked');
    var base = model ? parseInt(model.getAttribute('data-base'), 10) : lowestBase;
    /* The first paint is the page arriving: figures are set, nothing turns. */
    var turn = lastTotal !== null && !reduced;
    var loud = turn && quiet !== true;
    /* `missing` is REQUIRED groups still open, which decides whether the number
       is an estimate; `answered` is every group with a decision, which is what
       the progress reports. Two groups are optional, so one count cannot do
       both jobs. */
    var total = base, added = 0, missing = 0, answered = 0, lines = [];

    groups.forEach(function (group) {
      var id = group.getAttribute('data-group');
      var picks = read(group);
      var sum = picks.reduce(function (a, p) { return a + p.price; }, 0);
      total += sum;
      /* "Standard" is an answer, so it counts — but it is not an upgrade. */
      added += picks.filter(function (p) { return p.price > 0; }).length;
      if (group.hasAttribute('data-required') && !picks.length) missing++;
      if (picks.length) answered++;

      var text = picks.length ? picks.map(function (p) { return p.label; }).join(', ') : 'Not selected';
      if (picks.length) group.setAttribute('data-answered', ''); else group.removeAttribute('data-answered');

      var cost = id === 'model' ? (model ? base : 0) : sum;
      /* The model has no head of its own any more — it is chosen on the
         picture — so only the groups in the list write their choice there. */
      var chosen = group.querySelector('[data-chosen]');
      if (chosen) {
        chosen.querySelector('strong').textContent = text;
        var old = chosen.querySelector('.cfg-num');
        if (old) old.remove();
        if (cost > 0) {
          var span = document.createElement('span');
          span.className = 'cfg-num';
          span.textContent = money(cost);
          chosen.appendChild(span);
        }
      }

      var row = root.querySelector('[data-row="' + id + '"]');
      if (row) {
        row.querySelector('[data-value]').textContent = text;
        /* An em dash where nothing is answered, "Included" where the answer
           costs nothing — the word the card itself uses — and the figure where
           there is one. */
        row.querySelector('[data-cost]').textContent = !picks.length ? '—' : (cost > 0 ? money(cost) : 'Included');
        row.classList.toggle('cfg-line--empty', !picks.length);
      }

      /* Only what changed rolls in: the group's head, and its line in the
         summary with a brief wash behind it. */
      var mark = text + '|' + cost;
      if (loud && seen[id] !== undefined && seen[id] !== mark) {
        restart(group, 'is-new');
        if (row) { restart(row, 'is-new'); restart(row, 'is-flash'); }
      }
      seen[id] = mark;

      if (picks.length) {
        lines.push((group.querySelector('.cfg-group__name') || { textContent: 'Model' }).textContent + ': ' + text + (cost ? ' (' + money(cost) + ')' : ''));
      }
    });

    /* The label is the truth about the number under it: a starting price with
       no model, a partial sum while required groups are open, an estimate only
       when every one has an answer. */
    labelEl.textContent = !model ? 'Starting price' : (missing ? 'Configured so far' : 'Estimated price');
    var prefix = model ? '' : 'From';
    if (totalMeter) totalMeter.set(prefix, total, turn);
    if (barMeter) barMeter.set(prefix, total, turn);
    if (baseMeter) baseMeter.set(prefix, total, turn);
    if (baseLabel) baseLabel.textContent = labelEl.textContent;
    if (baseNext) baseNext.hidden = !model;
    /* What the choice cost, beside the price. Not while a model is being
       picked for the first time or cleared: "From $66,900" becoming "$70,500"
       is a starting price turning into a price, not a charge. */
    if (loud && model && lastModel && total !== lastTotal) {
      if (totalMeter) totalMeter.delta(total - lastTotal);
      if (barMeter) barMeter.delta(total - lastTotal);
      if (baseMeter) baseMeter.delta(total - lastTotal);
    }
    lastTotal = total; lastModel = model;

    modelEl.textContent = model ? model.value : 'Your Cobra';
    hero(model, turn);
    if (model && shotEl) {
      var src = model.getAttribute('data-shot');
      if (src && shotEl.getAttribute('src') !== src) shotEl.setAttribute('src', src);
    }

    remainEl.textContent = missing
      ? missing + (missing === 1 ? ' group still needs an answer.' : ' groups still need an answer.')
      : 'Every group has an answer. This estimate excludes tax, title and delivery.';

    progressDone.textContent = answered;
    progressTotal.textContent = groups.length;
    progressFill.style.setProperty('--done', (answered / groups.length).toFixed(4));
    progressFill.parentNode.style.setProperty('--steps', groups.length);
    progressBox.setAttribute('aria-valuenow', answered);
    progressBox.setAttribute('aria-valuetext', answered + ' of ' + groups.length + ' chosen');

    /* Nothing is disabled — a half-built car is still an enquiry Evan wants —
       but the button stops claiming an estimate there is not yet. */
    submitEl.textContent = missing ? 'Send this build' : 'Send my estimate';
    attachedEl.textContent = missing
      ? 'Your ' + answered + ' of ' + groups.length + ' choices travel with this message. Evan will price the rest with you.'
      : 'All ' + groups.length + ' choices travel with this message, so you do not have to list them again.';

    if (barCount) {
      barCount.textContent = !model ? 'Choose a model'
        : (added ? added + (added === 1 ? ' option added' : ' options added') : 'Base only');
    }
    if (configField) {
      configField.value = (model ? model.value : 'Model not chosen') + ' — ' + money(total) + '\n' + lines.join('\n');
    }
  }

  root.addEventListener('change', function (e) {
    var t = e.target;
    /* The photograph of what was just chosen settles into its frame. */
    /* Step 01 answered on the picture: the list's first group opens, so the
       build rolls straight on. It is not scrolled to — the reader moves on. */
    if (t.name === 'model' && t.checked) {
      var next = root.querySelector('details.cfg-group');
      if (next && !root.querySelector('details.cfg-group[open]')) next.open = true;
    }
    if (t.checked && t.closest) {
      var card = t.closest('.cfg-opt');
      restart(card && card.querySelector('.cfg-opt__frame img'), 'is-just');
    }
    paint();
  });

  /* Each flourish takes its class off when it ends, so the next paint starts
     clean — the head's price is rebuilt on every paint and would otherwise
     roll in again under a class left behind. Cancelled counts as ended: a
     group that closes mid-settle cancels its photograph's animation, and the
     class left on it would replay the settle when the group reopens. */
  function done(e) {
    var t = e.target, host;
    if (e.animationName === 'cfg-roll') { host = t.closest('.is-new'); if (host) host.classList.remove('is-new'); }
    else if (e.animationName === 'cfg-flash') t.classList.remove('is-flash');
    else if (e.animationName === 'cfg-settle') t.classList.remove('is-just');
    else if (e.animationName === 'cfg-delta') t.classList.remove('is-on');
    else if (e.animationName === 'cfg-swap') t.classList.remove('is-swap');
  }
  document.addEventListener('animationend', done);
  document.addEventListener('animationcancel', done);
  /* A closed <details> pauses what is inside it rather than ending it, so a
     group that closes mid-settle is cleared here — else the photograph would
     finish its settle whenever the group is opened again. */
  groups.forEach(function (g) {
    g.addEventListener('toggle', function () {
      if (g.open) return;
      [].slice.call(g.querySelectorAll('.is-just, .is-new')).forEach(function (n) { n.classList.remove('is-just', 'is-new'); });
      g.classList.remove('is-new');
    });
  });

  /* ONE GROUP OPEN AT A TIME — native, through the shared `name` on every
     <details>. The fallback is for browsers that predate it. */
  if (!('name' in document.createElement('details'))) {
    groups.forEach(function (g) {
      g.addEventListener('toggle', function () {
        if (!g.open) return;
        groups.forEach(function (other) { if (other !== g) other.open = false; });
      });
    });
  }

  /* When the group that opens sits below the one that closes, the page folds
     up under the cursor. The head's position is measured before the toggle and
     restored after it, instantly — a correction that animates is a second jump. */
  groups.forEach(function (g) {
    var head = g.querySelector('.cfg-group__head');
    if (!head) return;
    head.addEventListener('click', function () {
      var before = head.getBoundingClientRect().top;
      requestAnimationFrame(function () {
        var delta = head.getBoundingClientRect().top - before;
        if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: 'instant' });
      });
    });
  });

  /* A radio cannot be unset by clicking it again, so a second click on the
     chosen card clears the group — a visitor who opened Stitching out of
     curiosity should not be left holding $1,875 they never wanted. */
  root.addEventListener('mousedown', function (e) {
    var card = e.target.closest ? e.target.closest('.cfg-opt, .cfg-model') : null;
    if (!card) return;
    var field = card.querySelector('input[type="radio"]');
    if (field && field.checked) {
      setTimeout(function () { field.checked = false; paint(); }, 0);
    }
  });
  /* And from the keyboard. */
  root.addEventListener('keydown', function (e) {
    if (e.key !== 'Backspace' && e.key !== 'Delete') return;
    var f = document.activeElement;
    if (f && f.type === 'radio' && f.checked && root.contains(f)) { f.checked = false; paint(); e.preventDefault(); }
  });

  /* Start over: every choice off, back to the first group. */
  var reset = q('[data-cfg-reset]');
  if (reset) {
    reset.addEventListener('click', function () {
      [].slice.call(root.querySelectorAll('.cfg__main input:checked')).forEach(function (i) { i.checked = false; });
      groups.forEach(function (g) { if (g.tagName === 'DETAILS') g.open = false; });
      paint(true);
      /* Back to step 01, on the picture. */
      var baseFig = q('.cfg-base'), first = q('input[name="model"]');
      if (baseFig) baseFig.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      if (first) first.focus({ preventScroll: true });
    });
  }

  /* The phone bar carries the number; the list it belongs to is one tap away. */
  if (bar) {
    bar.hidden = false;
    var open = bar.querySelector('[data-bar-open]');
    if (open) {
      open.addEventListener('click', function () {
        var panel = document.getElementById('summary');
        if (panel) panel.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
    }
  }

  /* The foot of the summary: more below. Shown while the panel has more to
     show and the estimate form is not yet in view; the button takes the
     panel to the form. On a phone the panel does not scroll, so it never
     shows (and CSS hides it there as well). */
  var sum = q('.cfg-sum'), more = q('[data-sum-more]'), estimate = q('.cfg-form');
  if (sum && more && estimate) {
    var foot = function () {
      var room = sum.scrollHeight - sum.clientHeight;
      var formTop = estimate.getBoundingClientRect().top - sum.getBoundingClientRect().top;
      more.classList.toggle('is-done', room < 8 || sum.scrollTop >= room - 8 || formTop < sum.clientHeight * 0.75);
    };
    sum.addEventListener('scroll', foot, { passive: true });
    window.addEventListener('resize', foot);
    root.addEventListener('toggle', foot, true);
    foot();
    more.querySelector('button').addEventListener('click', function () {
      var top = estimate.getBoundingClientRect().top - sum.getBoundingClientRect().top + sum.scrollTop - 16;
      sum.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* Sticky to the end, and the form in reach — Alex, 2026-09-14: sticky the
     whole length of the list; at the end "don't hide the form, carry on down
     the page and make it visible"; and the panel hangs on past the list a
     little — "that's ok". While the list runs on, the panel holds still and
     scrolls inside only when the reader scrolls it. When the end of the list
     reaches the panel's foot, the panel stops being a window and rides with
     the page: the foot of its contents is pinned to the end of the column,
     so carrying on down shows the rest — the form — in full. The hand-over
     keeps the contents where they are on screen, and scrolling back up
     returns the panel to exactly where the reader left it. The column runs
     on past the list by what the panel still has to show, and no further.
     Nothing runs where the panel is not sticky (a phone). */
  if (sum) {
    var fitQueued = false, riding = false, held = 0;
    var fit = function () {
      fitQueued = false;
      var cs = getComputedStyle(sum);
      if (cs.position !== 'sticky') {
        sum.style.maxBlockSize = ''; sum.style.top = ''; root.style.minBlockSize = '';
        riding = false;
        return;
      }
      sum.style.top = '';
      var top = parseFloat(getComputedStyle(sum).top) || 0;
      var whole = sum.scrollHeight + (sum.offsetHeight - sum.clientHeight);
      var full = window.innerHeight - top - (parseFloat(cs.paddingTop) || 0);
      var shown = riding ? held : sum.scrollTop;
      if (!riding) {
        var list = root.querySelector('.cfg__main').offsetHeight;
        root.style.minBlockSize = Math.max(whole, list + Math.max(0, whole - full - shown)) + 'px';
      }
      var end = root.getBoundingClientRect().bottom;
      if (end < top - shown + whole) {
        if (!riding) { riding = true; held = shown; sum.style.maxBlockSize = 'none'; sum.scrollTop = 0; }
        sum.style.top = (end - whole) + 'px';
      } else if (riding) {
        riding = false;
        sum.style.maxBlockSize = '';
        sum.scrollTop = held;
      }
      if (foot) foot();
    };
    var queueFit = function () {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(fit);
    };
    window.addEventListener('scroll', queueFit, { passive: true });
    sum.addEventListener('scroll', queueFit, { passive: true });
    window.addEventListener('resize', queueFit);
    root.addEventListener('toggle', queueFit, true);
    fit();
  }

  paint();
})();
