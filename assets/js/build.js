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
  var totalMeter = meter(totalEl), barMeter = meter(barTotal);
  var seen = {}, lastTotal = null, lastModel = null;

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

      var chosen = group.querySelector('[data-chosen]');
      chosen.querySelector('strong').textContent = text;
      var old = chosen.querySelector('.cfg-num');
      if (old) old.remove();
      var cost = id === 'model' ? (model ? base : 0) : sum;
      if (cost > 0) {
        var span = document.createElement('span');
        span.className = 'cfg-num';
        span.textContent = money(cost);
        chosen.appendChild(span);
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
        lines.push(group.querySelector('.cfg-group__name').textContent + ': ' + text + (cost ? ' (' + money(cost) + ')' : ''));
      }
    });

    /* The label is the truth about the number under it: a starting price with
       no model, a partial sum while required groups are open, an estimate only
       when every one has an answer. */
    labelEl.textContent = !model ? 'Starting price' : (missing ? 'Configured so far' : 'Estimated price');
    var prefix = model ? '' : 'From';
    if (totalMeter) totalMeter.set(prefix, total, turn);
    if (barMeter) barMeter.set(prefix, total, turn);
    /* What the choice cost, beside the price. Not while a model is being
       picked for the first time or cleared: "From $66,900" becoming "$70,500"
       is a starting price turning into a price, not a charge. */
    if (loud && model && lastModel && total !== lastTotal) {
      if (totalMeter) totalMeter.delta(total - lastTotal);
      if (barMeter) barMeter.delta(total - lastTotal);
    }
    lastTotal = total; lastModel = model;

    modelEl.textContent = model ? model.value : 'Your Cobra';
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
    var card = e.target.closest ? e.target.closest('.cfg-opt') : null;
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
      groups.forEach(function (g, n) { g.open = n === 0; });
      paint(true);
      var first = groups[0] && groups[0].querySelector('.cfg-group__head');
      if (first) {
        first.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        first.focus({ preventScroll: true });
      }
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

  paint();
})();
