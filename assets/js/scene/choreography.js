/* ============================================================================
   choreography.js — what the car does, and when.
   ----------------------------------------------------------------------------
   Scroll drives; scroll is never taken. No pin that cannot be left, no sequence
   that must be watched to the end, no smooth-scroll library standing between
   the reader and their own scrollbar. ScrollTrigger is used in `scrub` mode for
   exactly that reason: the timeline is a function of scroll position, so
   stopping stops the car and scrolling back rewinds it.

   One primary temporal idea, stated in a sentence:
   THE CAR TURNS TO FACE WHATEVER IS BEING SAID ABOUT IT.

   Everything else is subordinate to that. If a second idea starts competing —
   a drifting camera, an ambient float, an overhead departure — one of the two
   is wrong, and the rule says it is the newer one.

   Poses are read from the DOM, not written here: each note carries its own
   camera in data attributes, so a note added by an editor gets choreography
   without anyone touching this file.
   ========================================================================== */

/* GSAP resolves through the page's import map, the same way three does. It used
   to be read off the window because this direction loaded the UMD build; every
   direction is on the ESM path now, so there is one instance, one plugin
   registry and one ticker per page. */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const DEG = Math.PI / 180;

/* The opening pose. It matches assets/img/hero-still-placeholder.jpg frame for
   frame, which is what lets the canvas replace the still without the
   composition moving under the headline. */
export const HERO_POSE = {
  rotY: 38 * DEG,
  cam: [0.90, 0.92, 7.90],
  target: [-1.15, 0.46, 0],
  fov: 27,
  lights: 0,          // the car is standing in a lit room; nobody has switched it on
};

/* Where the car arrives from: far, high and turned away, so the entrance is a
   car coming to a stop in a room rather than an object being flown in.

   DERIVED from the hero pose, never typed beside it. Two directions on two
   models do not share a zero — the Sketchfab car points its nose at +Z, the
   client's SketchUp export at -X — and an arrival written as absolute numbers
   silently means something different on the second page while raising nothing. */
function arrivalFrom(hero) {
  return {
    rotY: hero.rotY - 34 * DEG,
    cam: [hero.cam[0] * 2.4 + 0.3, hero.cam[1] + 2.3, hero.cam[2] * 1.7],
    target: [...hero.target],
    fov: hero.fov - 3,
  };
}

function readPose(el, isNarrow) {
  const attr = (n, fallback) => {
    const narrow = isNarrow && el.dataset[n + 'Mobile'];
    const raw = narrow || el.dataset[n];
    return raw === undefined ? fallback : raw;
  };
  const nums = (s, fallback) => {
    if (s === undefined) return fallback;
    const parts = String(s).split(',').map((v) => parseFloat(v.trim()));
    return parts.length === 3 && parts.every((n) => !Number.isNaN(n)) ? parts : fallback;
  };
  return {
    rotY: parseFloat(attr('rot', 38)) * DEG,
    cam: nums(attr('cam'), HERO_POSE.cam),
    target: nums(attr('target'), HERO_POSE.target),
    fov: parseFloat(attr('fov', HERO_POSE.fov)),
    /* data-lights, 0 to 1. In the markup with the pose, for the same reason the
       pose is: a note that wants the lamps on says so where an editor can see
       it, and adding one costs nothing here. */
    lights: parseFloat(attr('lights', 0)) || 0,
    /* data-anchor: the point ON THE CAR this note is about, in metres in the
       model's own frame. The leader line is drawn to it, so it turns with the
       car instead of sitting at a fixed place on the screen. */
    anchor: nums(attr('anchor'), null),
  };
}

/* ── THE CALLOUTS ──────────────────────────────────────────────────────────
   A label with a line to the part it names. The brief asked for these and the
   rule that came with them was explicit: ONE AT A TIME, ON SCROLL. Six of them
   fanned out at once is a diagram of a car, not a reading of one, and every
   one of the six then has to be a slogan because there is no room for a fact.

   So: the active note owns the only callout on screen, its line is redrawn
   every time the pose changes, and it disappears the moment its anchor turns
   away from the camera. A line to a part you cannot see is worse than no line. */
const SVGNS = 'http://www.w3.org/2000/svg';

function makeCalloutLayer(mount) {
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('class', 'callouts');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVGNS, 'polyline');
  path.setAttribute('class', 'callouts__line');
  const ring = document.createElementNS(SVGNS, 'circle');
  ring.setAttribute('class', 'callouts__ring');
  ring.setAttribute('r', '5');
  const dot = document.createElementNS(SVGNS, 'circle');
  dot.setAttribute('class', 'callouts__dot');
  dot.setAttribute('r', '1.75');
  svg.append(path, ring, dot);
  mount.appendChild(svg);
  return { svg, path, ring, dot };
}

export function mountChoreography({ scene, mount, still, scope, reveal, isNarrow }) {
  /* The hero pose may be declared on the mount, exactly the way a note declares
     its own. A second direction, on a second model, needs a different zero and
     a different frame; that is a property of the page, not of this module. With
     no attributes the exported HERO_POSE stands, so index1.html is unchanged. */
  const hero = mount.dataset.rot ? readPose(mount, isNarrow) : HERO_POSE;
  const ARRIVAL_POSE = arrivalFrom(hero);

  /* TWO CHOREOGRAPHIES, AND THEY ARE NOT THE SAME THING.

     'turn'  — one continuous rotation. The car is the subject and the scroll
               is the turntable, so the steps between poses must be even and
               the interpolation linear, or it stalls and snaps.

     'shots' — a sequence of composed frames. Each pose is a camera SET UP
               somewhere else: different angle, crop, scale, subject. Even
               steps would be wrong here, and linear interpolation would whip
               between them; each move eases out of one frame and settles into
               the next, the way a camera actually moves.

     The page says which it is, because it is a directorial decision and not a
     property of this file. */
  const mode = mount.dataset.sequence === 'shots' ? 'shots' : 'turn';
  const segmentEase = mode === 'shots' ? 'power2.inOut' : 'none';
  /* GSAP tweens scalars, so the camera position and the aim point each carry a
     flat mirror of the vector above them. Both mirrors are seeded HERE rather
     than left to appear on their first tween: GSAP reads the start value off
     the object, a property it has never seen reads as 0, and an aim point
     starting at the origin swings the camera through the floor on the way into
     the first note. cx/cy/cz were covered by the arrival tween; tx/ty/tz were
     not, and that is the one the reader saw. */
  const state = {
    ...hero,
    cam: [...hero.cam],
    target: [...hero.target],
    cx: hero.cam[0], cy: hero.cam[1], cz: hero.cam[2],
    tx: hero.target[0], ty: hero.target[1], tz: hero.target[2],
    lights: hero.lights,
  };
  const layer = makeCalloutLayer(mount);
  let activeNote = null;

  function drawCallout() {
    const note = activeNote;
    const pose = note && note.__pose;
    if (!note || !pose || !pose.anchor) { layer.svg.classList.remove('is-on'); return; }

    const p = scene.project(pose.anchor);
    const body = note.querySelector('.note__body');
    if (!p || !p.onPlate || !body) { layer.svg.classList.remove('is-on'); return; }

    const m = mount.getBoundingClientRect();
    const r = body.getBoundingClientRect();
    /* leave from whichever edge of the label faces the part, so the line never
       crosses back over its own text */
    const fromRight = p.x > (r.left - m.left) + r.width / 2;
    const fx = (fromRight ? r.right : r.left) - m.left;
    /* Leave from the label's first line, and never from outside the plate:
       a note that is still sliding in sits below the fold, and a line drawn to
       a point nobody can see reads as a rendering fault. */
    const fy = Math.max(28, Math.min(m.height - 28, r.top - m.top + 22));
    /* one elbow, not a curve: this is a technical drawing, not a swoosh */
    const ex = fx + (fromRight ? 1 : -1) * Math.min(56, Math.abs(p.x - fx) * 0.35);

    layer.path.setAttribute('points', `${fx},${fy} ${ex},${fy} ${p.x},${p.y}`);
    layer.ring.setAttribute('cx', p.x); layer.ring.setAttribute('cy', p.y);
    layer.dot.setAttribute('cx', p.x); layer.dot.setAttribute('cy', p.y);
    layer.svg.classList.add('is-on');
  }

  const push = () => { scene.setPose(state); drawCallout(); };

  /* ── The handover ───────────────────────────────────────────────────────
     The still is on screen from the first paint and stays until the scene can
     actually draw the same frame. Only then do they cross. Nothing waits on
     this: if it never happens, the still is the design. */
  scene.setPose(hero);
  scene.start();

  gsap.set(mount, { autoAlpha: 0 });
  gsap.timeline()
    .to(mount, { autoAlpha: 1, duration: 0.45, ease: 'none' })
    .to(still, { autoAlpha: 0, duration: 0.45, ease: 'none' }, '<');

  /* ── The arrival ────────────────────────────────────────────────────────
     It plays once, on load, and it is bound to this page by name because a
     page arrives once — that is the one legitimate exception to binding motion
     by role. It never gates anything: the headline, the price and both routes
     are readable before it starts and while it runs. */
  gsap.fromTo(state,
    {
      rotY: ARRIVAL_POSE.rotY,
      fov: ARRIVAL_POSE.fov,
      cx: ARRIVAL_POSE.cam[0], cy: ARRIVAL_POSE.cam[1], cz: ARRIVAL_POSE.cam[2],
    },
    {
      rotY: hero.rotY,
      fov: hero.fov,
      cx: hero.cam[0], cy: hero.cam[1], cz: hero.cam[2],
      duration: 1.9,
      ease: 'power3.out',
      onUpdate() {
        state.cam[0] = state.cx; state.cam[1] = state.cy; state.cam[2] = state.cz;
        push();
      },
    }
  );

  /* ── Visibility ─────────────────────────────────────────────────────────
     The canvas is fixed, so it would otherwise sit behind every section on the
     page burning frames for nobody. It renders only while the scope — hero plus
     reveal — is on screen. */
  ScrollTrigger.create({
    trigger: scope,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      mount.classList.toggle('is-live', self.isActive);
      if (self.isActive) scene.start(); else scene.stop();
    },
  });

  if (!reveal) return;

  /* ── The sequence ───────────────────────────────────────────────────────
     One scrubbed timeline across the whole reveal, with one segment per note.
     Each segment turns the car to the part its note is about — so the rotation
     and the text are one event rather than two things happening at once.

     Each note also delivers a fact the previous note did not. A stage that
     restates the last one at a different intensity is not a stage, and the
     first thing this timeline would be cut down to is the list of notes. */
  const notes = Array.from(reveal.querySelectorAll('[data-note]'))
    .filter((el) => getComputedStyle(el).display !== 'none');

  /* EVEN STEPS ARE NOT A PREFERENCE HERE, THEY ARE THE MECHANISM.
     Every segment below is given the same duration and the reveal gives every
     note the same screen, so the ANGLE BETWEEN CONSECUTIVE POSES *IS* THE TURN
     RATE. A sweep of 38 / 46 / 152 / 258 steps by 8, 106, 106 — the car sits
     almost still through the first screen and then snaps twice, which reads as
     a broken animation rather than a slow one. The poses in the markup step by
     a near-constant 66, so a constant scroll turns the car at a constant rate.

     Add a note and the whole sweep gets re-spaced; it is not a list you append
     to. The two checks below say that out loud instead of leaving it to be
     rediscovered from the symptom. */
  if (mode === 'turn' && notes.length > 1) {
    const rots = [hero.rotY, ...notes.map((n) => readPose(n, isNarrow).rotY)];
    const steps = rots.slice(1).map((r, i) => (r - rots[i]) / DEG);
    const mag = steps.map(Math.abs);
    const spread = Math.max(...mag) / Math.max(Math.min(...mag), 0.001);
    if (spread > 3) {
      console.warn('[choreography] uneven turn: steps of ' + mag.map(Math.round).join(', ') +
        ' degrees across equal screens. The car will stall and then snap. Re-space the data-rot values.');
    }
    if (steps.some((v, i) => i > 0 && Math.sign(v) !== Math.sign(steps[i - 1]))) {
      console.warn('[choreography] the sweep reverses direction. One continuous turn reads as choreography; a back-and-forth reads as a bug.');
    }
  }

  if (!notes.length) {
    console.warn('[choreography] reveal present but no visible [data-note] — the sequence is a no-op here.');
    return;
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: reveal,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,          // catches up with the reader; never leads them
      invalidateOnRefresh: true,
    },
  });

  notes.forEach((note) => {
    const to = readPose(note, isNarrow);
    note.__pose = to;
    tl.to(state, {
      rotY: to.rotY,
      fov: to.fov,
      cx: to.cam[0], cy: to.cam[1], cz: to.cam[2],
      tx: to.target[0], ty: to.target[1], tz: to.target[2],
      /* Scrubbed with everything else, deliberately. The lamps coming up as the
         nose swings round is ONE event with the turn, not a second idea running
         beside it — scroll back and the car turns away and goes dark again. */
      lights: to.lights,
      ease: segmentEase,
      duration: 1,
      onUpdate() {
        state.cam[0] = state.cx ?? state.cam[0];
        state.cam[1] = state.cy ?? state.cam[1];
        state.cam[2] = state.cz ?? state.cam[2];
        state.target[0] = state.tx ?? state.target[0];
        state.target[1] = state.ty ?? state.target[1];
        state.target[2] = state.tz ?? state.target[2];
        push();
      },
    });
  });

  /* ── The notes themselves ───────────────────────────────────────────────
     Each fades to full while its own screen is the one being read, and back
     out as it leaves. Deliberately NOT scrubbed: a caption at 43% opacity
     because the reader stopped between two screens is an unreadable frame, and
     every frame someone can stop on is a frame that has to read. */
  notes.forEach((note) => {
    gsap.set(note, { autoAlpha: 0, y: 12 });
    ScrollTrigger.create({
      trigger: note,
      start: 'top 58%',
      end: 'bottom 42%',   // tight enough that two notes are never both up:
                           // an overlap is a stoppable frame with two claims on it
      onEnter:     () => { activeNote = note; gsap.to(note, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', onUpdate: drawCallout }); },
      onEnterBack: () => { activeNote = note; gsap.to(note, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out', onUpdate: drawCallout }); },
      onLeave:     () => { if (activeNote === note) activeNote = null; gsap.to(note, { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in', onUpdate: drawCallout }); },
      onLeaveBack: () => { if (activeNote === note) activeNote = null; gsap.to(note, { autoAlpha: 0, y: 12, duration: 0.3, ease: 'power2.in', onUpdate: drawCallout }); },
    });
  });

  /* A resize can change which notes are displayed at all — the narrow build
     shows fewer — so the timeline is rebuilt rather than stretched. */
  ScrollTrigger.addEventListener('refreshInit', () => { scene.resize(); drawCallout(); });
  window.addEventListener('resize', drawCallout, { passive: true });

  return () => { tl.kill(); ScrollTrigger.getAll().forEach((t) => t.kill()); };
}
