/* ============================================================================
   f-story-stage.js — the storyboard's runtime: scroll in, camera and text out.
   ----------------------------------------------------------------------------
   f-story.js holds the nine beats and the interpolation. This file is the wiring
   and the DOM, and it is deliberately the only place that knows about either.

   THE SCROLL STAYS THE VISITOR'S. The stage is `position: sticky` in CSS, not a
   ScrollTrigger pin. ScrollTrigger is asked one question — how far through the
   track are we — and answers it; it never takes the transport. The page keeps
   its true height, the scrollbar lands where it says, and scrolling past the
   hero at speed simply works.

   THE TURN AND THE STORY COMPOSE, they do not fight. f-scene keeps the pose and
   the visitor's turn as two separate things and adds them in `applyView`: the
   pose is the camera the page asks for, `turn` is what the visitor has done to
   it. So the storyboard writes poses on scroll and the drag keeps turning the
   car underneath, and neither has to know about the other.
   ========================================================================== */

import { BEATS, poseAt } from './f-story.js';

const SIDE_PAD = 0.06;      // how far a label sits in from the frame edge
const EDGE_FADE = 0.04;     // a callout fades out this close to the frame edge

export function mountStory({ scene, root, gsap, ScrollTrigger, THREE, reduced }) {
  const track = root;   // the hero itself carries the scroll length — see index6.css
  const stage = root.querySelector('[data-story-stage]');
  const ghost = root.querySelector('[data-story-ghost]');
  const num = root.querySelector('[data-story-num]');
  const kicker = root.querySelector('[data-story-kicker]');
  const head = root.querySelector('[data-story-head]');
  const body = root.querySelector('[data-story-body]');
  const marks = root.querySelector('[data-story-marks]');
  const layer = root.querySelector('[data-story-callouts]');
  const svg = root.querySelector('[data-story-lines]');
  if (!stage || !head) return null;

  /* ── the progress marks ───────────────────────────────────────────────────
     The storyboard's own device: a number, a rule, and a dot per beat. It is
     the one part of the overlay that says how long this is — a sequence with no
     visible length is a sequence the visitor cannot judge whether to sit
     through, and MJ6 says they must always be able to judge that. */
  const dots = BEATS.map((b, i) => {
    const li = document.createElement('li');
    li.className = 'f-story__mark';
    li.dataset.beat = b.id;
    li.setAttribute('aria-hidden', 'true');
    marks.appendChild(li);
    return li;
  });

  /* Callout nodes are built once and reused. Creating them per frame would
     churn the DOM sixty times a second for a label that has not changed. */
  const MAX_CALLOUTS = BEATS.reduce((n, b) => Math.max(n, b.callouts.length), 0);
  const slots = [];
  for (let i = 0; i < MAX_CALLOUTS; i++) {
    const el = document.createElement('div');
    el.className = 'f-story__callout';
    el.innerHTML = '<p class="f-story__callout-label t-label"></p>'
                 + '<p class="f-story__callout-note"></p>';
    layer.appendChild(el);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('class', 'f-story__line');
    svg.appendChild(line);
    slots.push({
      el, line,
      label: el.querySelector('.f-story__callout-label'),
      note: el.querySelector('.f-story__callout-note'),
    });
  }

  const v = new THREE.Vector3();
  let shownBeat = -1;

  function writeText(i) {
    if (i === shownBeat) return;
    shownBeat = i;
    const b = BEATS[i];
    num.textContent = b.num;
    kicker.textContent = b.kicker;
    head.textContent = b.head;               // \n handled by white-space: pre-line
    body.textContent = b.body;
    ghost.textContent = b.ghost || '';
    ghost.toggleAttribute('data-empty', !b.ghost);
    root.dataset.storyBeat = b.id;
    root.toggleAttribute('data-story-release', !!b.release);
    dots.forEach((d, k) => d.toggleAttribute('data-on', k <= i));
  }

  /* Callouts are projected from real points on the car, every frame, rather than
     parked at fixed screen positions. Between two beats the camera is somewhere
     neither of them chose, and a label placed by hand would be pointing at air
     for most of the scroll. */
  function placeCallouts(beat, strength) {
    const cam = scene.camera;
    const rect = stage.getBoundingClientRect();
    const list = BEATS[beat].callouts;
    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];
      const c = list[i];
      if (!c || strength <= 0.01) { s.el.removeAttribute('data-on'); s.line.removeAttribute('data-on'); continue; }

      v.set(c.at[0], c.at[1], c.at[2]).project(cam);
      const behind = v.z > 1;
      const x = (v.x * 0.5 + 0.5) * rect.width;
      const y = (-v.y * 0.5 + 0.5) * rect.height;
      const inFrame = v.x > -1 && v.x < 1 && v.y > -1 && v.y < 1;
      if (behind || !inFrame) { s.el.removeAttribute('data-on'); s.line.removeAttribute('data-on'); continue; }

      // fade near the edges rather than clipping a label in half
      const edge = Math.min(
        (v.x + 1) / 2, (1 - v.x) / 2, (v.y + 1) / 2, (1 - v.y) / 2
      );
      const alpha = strength * Math.min(1, edge / EDGE_FADE);

      const right = c.side === 'right';
      const lx = right ? rect.width * (1 - SIDE_PAD) : rect.width * SIDE_PAD;
      const ly = rect.height * (0.34 + i * 0.22);

      s.label.textContent = c.label;
      s.note.textContent = c.note || '';
      s.note.toggleAttribute('data-empty', !c.note);
      s.el.dataset.side = right ? 'right' : 'left';
      s.el.style.setProperty('--x', lx + 'px');
      s.el.style.setProperty('--y', ly + 'px');
      s.el.style.setProperty('--a', alpha.toFixed(3));
      s.el.setAttribute('data-on', '');

      // an elbow, not a diagonal: the storyboard's lines are horizontal into the
      // label and then a single angled run to the point
      const elbow = right ? lx - rect.width * 0.05 : lx + rect.width * 0.05;
      s.line.setAttribute('points', `${lx},${ly} ${elbow},${ly} ${x},${y}`);
      s.line.style.setProperty('--a', alpha.toFixed(3));
      s.line.setAttribute('data-on', '');
    }
  }

  /* The turn's hint belongs to beat one and to nothing after it. Two invitations
     on screen at once — scroll to see the car, drag to turn the car — is the
     visitor being asked to choose between the page's own two ideas, and while
     the sequence is running it is the one that has to win. The control itself
     stays available; only its advertisement steps back. */
  const hint = document.querySelector('[data-turn-hint]');

  function apply(progress) {
    if (hint) hint.toggleAttribute('data-story-quiet', progress > 0.02);
    const p = poseAt(progress);
    scene.setPose({ cam: p.cam, target: p.target, fov: p.fov });
    writeText(p.index);
    /* Callouts belong to a beat, so they are at full strength AT the beat and
       gone between them. A label sliding across the frame while the camera moves
       is the single fastest way to make a technical overlay look decorative. */
    const d = Math.abs(p.local - (p.index === p.from ? 0 : 1));
    placeCallouts(p.index, 1 - Math.min(1, d / 0.35));
  }

  if (reduced) {
    /* No scrub under reduced motion, and the track collapses. The stage shows
       the opening frame and stops; the other eight beats are written out as a
       list beneath it, from the same data, so nothing said by the sequence is
       only available to someone who can watch it move.

       This is the static equivalent the motion invariant asks for. It is not a
       degraded sequence — it is the same nine sentences with the camera taken
       out of them. */
    root.dataset.storyMode = 'static';
    const script = root.querySelector('[data-story-script]');
    if (script) {
      script.innerHTML = '';
      BEATS.forEach((b) => {
        const li = document.createElement('li');
        li.innerHTML = '<p class="t-label f-story__eyebrow"></p><h2></h2><p></p>';
        li.querySelector('.f-story__eyebrow').textContent = b.num + '  ' + b.kicker;
        li.querySelector('h2').textContent = b.head;
        li.querySelector('p:last-of-type').textContent =
          [b.body, ...b.callouts.map((c) => c.label + (c.note ? ' — ' + c.note : ''))].join('  ·  ');
        script.appendChild(li);
      });
      script.hidden = false;
    }
    apply(0);
    return { apply, destroy() {} };
  }

  root.dataset.storyMode = 'scroll';

  /* Pinned rather than sticky, and `--beat-length` is read off the hero so the
     scroll length stays a CSS decision — how much of the visitor's scroll this
     sequence may occupy is a composition question, and it belongs next to the
     rest of the page's proportions rather than in a script.

     `pinSpacing` is left on: the page keeps the height the pin consumes, so the
     scrollbar is honest, in-page anchors land where they point, and scrolling
     past the hero at speed simply works. */
  const beatLength = () => {
    const raw = getComputedStyle(root).getPropertyValue('--beat-length').trim();
    const n = parseFloat(raw) || 88;
    return window.innerHeight * (n / 100);
  };

  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => '+=' + Math.round(beatLength() * (BEATS.length - 1)),
    pin: true,
    pinSpacing: true,
    scrub: true,
    invalidateOnRefresh: true,
    onUpdate: (self) => apply(self.progress),
    onRefresh: (self) => apply(self.progress),
  });

  const onResize = () => { shownBeat = -1; apply(st.progress); };
  window.addEventListener('resize', onResize, { passive: true });

  apply(0);
  return {
    apply,
    destroy() {
      st.kill();
      window.removeEventListener('resize', onResize);
    },
  };
}
