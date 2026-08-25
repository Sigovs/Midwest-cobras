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

/* GSAP ships as UMD and is loaded by a classic <script> in the document head,
   which runs before any module. Reading it off the window here — rather than
   vendoring a second ESM copy of the same library — keeps one file on disk and
   one version in play. If it is missing, this module says so and does nothing;
   the page is already complete without it. */
const { gsap, ScrollTrigger } = window;

if (!gsap || !ScrollTrigger) {
  throw new Error('[choreography] gsap/ScrollTrigger not on window — load assets/js/vendor/gsap.min.js and ScrollTrigger.min.js before the module.');
}

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
};

/* Where the car arrives from. Far, high and turned away — so the entrance is a
   car coming to a stop in a room, not an object being flown in. */
const ARRIVAL_POSE = {
  rotY: 4 * DEG,
  cam: [2.20, 3.20, 13.50],
  target: [-1.15, 0.46, 0],
  fov: 24,
};

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
  };
}

export function mountChoreography({ scene, mount, still, scope, reveal, isNarrow }) {
  /* GSAP tweens scalars, so the camera position and the aim point each carry a
     flat mirror of the vector above them. Both mirrors are seeded HERE rather
     than left to appear on their first tween: GSAP reads the start value off
     the object, a property it has never seen reads as 0, and an aim point
     starting at the origin swings the camera through the floor on the way into
     the first note. cx/cy/cz were covered by the arrival tween; tx/ty/tz were
     not, and that is the one the reader saw. */
  const state = {
    ...HERO_POSE,
    cam: [...HERO_POSE.cam],
    target: [...HERO_POSE.target],
    cx: HERO_POSE.cam[0], cy: HERO_POSE.cam[1], cz: HERO_POSE.cam[2],
    tx: HERO_POSE.target[0], ty: HERO_POSE.target[1], tz: HERO_POSE.target[2],
  };
  const push = () => scene.setPose(state);

  /* ── The handover ───────────────────────────────────────────────────────
     The still is on screen from the first paint and stays until the scene can
     actually draw the same frame. Only then do they cross. Nothing waits on
     this: if it never happens, the still is the design. */
  scene.setPose(HERO_POSE);
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
      rotY: HERO_POSE.rotY,
      fov: HERO_POSE.fov,
      cx: HERO_POSE.cam[0], cy: HERO_POSE.cam[1], cz: HERO_POSE.cam[2],
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
  if (notes.length > 1) {
    const rots = [HERO_POSE.rotY, ...notes.map((n) => readPose(n, isNarrow).rotY)];
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
    tl.to(state, {
      rotY: to.rotY,
      fov: to.fov,
      cx: to.cam[0], cy: to.cam[1], cz: to.cam[2],
      tx: to.target[0], ty: to.target[1], tz: to.target[2],
      ease: 'none',
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
      onEnter:     () => gsap.to(note, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }),
      onEnterBack: () => gsap.to(note, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }),
      onLeave:     () => gsap.to(note, { autoAlpha: 0, y: -12, duration: 0.3, ease: 'power2.in' }),
      onLeaveBack: () => gsap.to(note, { autoAlpha: 0, y: 12, duration: 0.3, ease: 'power2.in' }),
    });
  });

  /* A resize can change which notes are displayed at all — the narrow build
     shows fewer — so the timeline is rebuilt rather than stretched. */
  ScrollTrigger.addEventListener('refreshInit', () => scene.resize());

  return () => { tl.kill(); ScrollTrigger.getAll().forEach((t) => t.kill()); };
}
