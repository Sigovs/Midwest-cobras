/* consign.js — the photographs on consignment.html. The page works without
   it: the file input is a real one and takes files. This adds what a phone
   camera roll needs: a place to drop them, a preview of each, a way to take
   one back out, and the eight-file limit said out loud rather than enforced
   silently. */

(function () {
  'use strict';

  var drop = document.querySelector('[data-drop]');
  if (!drop) return;

  var input = drop.querySelector('input[type="file"]');
  var zone = drop.querySelector('.drop__zone');
  var list = drop.querySelector('[data-drop-list]');
  var note = drop.querySelector('[data-drop-note]');
  var max = parseInt(drop.getAttribute('data-drop-max'), 10) || 8;
  var files = [];
  var left = 0;

  /* The input carries the kept files, so the form sends what the previews
     show. Browsers without a writable FileList keep the last choice instead. */
  function sync() {
    if (typeof DataTransfer !== 'function') return;
    try {
      var dt = new DataTransfer();
      files.forEach(function (f) { dt.items.add(f); });
      input.files = dt.files;
    } catch (e) { /* the input keeps its own files */ }
  }

  function render() {
    list.textContent = '';
    files.forEach(function (f, i) {
      var li = document.createElement('li');
      li.className = 'drop__item';
      var img = document.createElement('img');
      img.alt = '';
      img.src = URL.createObjectURL(f);
      img.addEventListener('load', function () { URL.revokeObjectURL(img.src); });
      var name = document.createElement('span');
      name.className = 'drop__name';
      name.textContent = f.name;
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'drop__remove';
      rm.setAttribute('aria-label', 'Remove ' + f.name);
      rm.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      rm.addEventListener('click', function () {
        files.splice(i, 1);
        left = 0;
        sync();
        render();
        (list.querySelector('.drop__remove') || zone).focus();
      });
      li.appendChild(img);
      li.appendChild(name);
      li.appendChild(rm);
      list.appendChild(li);
    });

    var text = !files.length ? note.getAttribute('data-empty')
      : files.length + ' of ' + max + (files.length === 1 ? ' photograph.' : ' photographs.');
    if (left) text += ' ' + left + (left === 1 ? ' was' : ' were') + ' left out: ' + max + ' is the most this form takes.';
    note.textContent = text;
    drop.classList.toggle('is-full', files.length >= max);
  }

  function add(incoming) {
    left = 0;
    [].slice.call(incoming).forEach(function (f) {
      if (!/^image\//.test(f.type)) return;
      if (files.length >= max) { left++; return; }
      files.push(f);
    });
    sync();
    render();
  }

  input.addEventListener('change', function () { add([].slice.call(input.files)); });

  /* The drop. dragover has to be cancelled for drop to fire at all. */
  ['dragenter', 'dragover'].forEach(function (type) {
    zone.addEventListener(type, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function (type) {
    zone.addEventListener(type, function (e) {
      if (type === 'dragleave' && zone.contains(e.relatedTarget)) return;
      drop.classList.remove('is-over');
    });
  });
  zone.addEventListener('drop', function (e) {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files) add(e.dataTransfer.files);
  });
})();
