/* ============================================================================
   scene/index9-motion.js — direction J. The stage, cut as an edit.
   ----------------------------------------------------------------------------
   This file turns four articles in document flow into four moments in one place.
   It is loaded AFTER the scene reports live and everything in it is optional by
   construction: if the import fails, if GSAP is missing, if the machine is thin
   or the visitor has asked for less motion, what it leaves behind is four
   complete compositions in the right order with the car parked behind them
   (DNA39, MJ5, G7). Nothing here is load-bearing.

   ── THE EDIT, AND THE TWO WAYS IT HAS BEEN WRONG ───────────────────────────
   Version one spent each act's slot as |hold 34%|travel 32%|hold 34%|. Measured:
   68.7% of the pinned scroll changed NOTHING. Frozen picture, live scrollbar.

   Version two removed the plateaus entirely and eased the camera across every
   pixel. That fixed the hand and broke the eye. Measured on the pin:

       28.7% fully readable  ·  38.3% half-faded  ·  33.0% no copy at all

   Seven tenths of the scroll was transition. Stop anywhere but four exact points
   and you got a half-dissolved headline over a turning car — the look of a
   configurator, not of a photograph.

   VERSION THREE IS AN EDIT. Long composed holds, short decisive cuts, and the
   percentages are declared here rather than emerging from a per-slot remap:

       ACT 01  0–26   cut 26–37
       ACT 02 37–63   cut 63–74
       ACT 03 74–100

   78% held, 22% cut. Inside a hold the camera does not move and the copy is at
   full strength: pause anywhere in it and the frame is finished. Inside a cut
   the camera travels the whole distance in 11% of the pin — about 131 px — fast
   enough to read as an edit between two shots rather than as a drift.

   THREE ACTS, NOT FOUR, SINCE THE v4 MOCKUP. Act 04 was "Yours is not built
   yet." and it was the page's ending. The mockup gives that sentence to the
   commissioning desk below the fold, where it opens a section rather than
   closing a page — so the stage hands over one beat earlier and the ratio is
   held at 78/22 rather than the old 76/24. The pin is 132% instead of 198%; a
   hold is 309 px against B2's 321, and a cut 131 px against 143. The cadence a
   hand feels is unchanged.

   THE OLD DEAD-SCROLL COMPLAINT IS NOT BACK, AND THE ARITHMETIC IS WHY. Version
   one's motionless runs were 680 px each. A hold here is 321 px. The proportion
   went up; the length of any single motionless run halved, and that length is
   what a hand actually feels.

   ── WHAT MOVES, AND NOTHING ELSE DOES ──────────────────────────────────────
   Per cut: the camera on its arc, the grounding state, the word, the copy. No
   orbit outside a cut, no parallax, no decorative drift. The page is still.

   ── THE SIGNATURE ──────────────────────────────────────────────────────────
   The word is in the room and the car eclipses it. COBRA, 427, HANDCRAFTED and
   MIDWEST are geometry standing behind the vehicle, depth-tested, in the same
   light — so the body physically cuts the letterforms.

   ── MJ6 IS NOT YIELDED TO ──────────────────────────────────────────────────
   The pin is scrubbed, so it releases the instant the visitor keeps scrolling.
   No minimum watch time, nothing waits for an animation to finish, the scrollbar
   is real and lands where it says, and the stage is 1.32 viewport-heights. There
   is a whole page under it now, so the stage's share of the scroll matters more
   than it did when the stage was the page.
   ========================================================================== */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* The edit, as fractions of the pinned scroll. Four holds; the gaps between them
   are the cuts. Changing these changes the film. */
const HOLDS = [
  [0.00, 0.26],
  [0.37, 0.63],
  [0.74, 1.00],
];

/* Where inside a cut the outgoing copy has gone and the incoming copy has
   arrived. They meet at a point rather than overlapping: two headlines at once
   reads as a rendering fault, and a gap between them reads as an empty state. */
const COPY_OUT = 0.44;
const COPY_IN_END = 0.92;

/* How far the pin runs: three cuts and four holds inside two viewport-heights. */
const SLOT_VH = 66;

/* Scrub. 0.55 s put half a second between the wheel and the picture; 0.28 still
   absorbs the staircase of a wheel notch without the rubber band. */
const SCRUB = 0.28;

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const span = (v, a, b) => clamp01((v - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const lerp3 = (a, b, k, out) => { out[0] = lerp(a[0], b[0], k); out[1] = lerp(a[1], b[1], k); out[2] = lerp(a[2], b[2], k); return out; };

/* Cubic in-out, not sine. Over 143 px that is the difference between a move that
   lands and a move that merely arrives: cubic holds its ends tighter and spends
   more of its travel in the middle, which is what makes a short move decisive. */
const ease = (v) => { const t = clamp01(v); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

/* ── THE CAMERA TRAVELS ON AN ARC, NOT A LINE ────────────────────────────────
   Straight interpolation between two camera positions is a chord, and a chord
   between two points on opposite sides of a car goes through the car — the cut
   from act 03 to act 04 once put the reader four centimetres from a windscreen
   wiper. Position is carried in polar coordinates about the car's own axis, the
   angle taking the shorter way round, which is how a camera on a jib moves. */
const TAU = Math.PI * 2;

function polar(cam) {
  return { r: Math.hypot(cam[0], cam[2]), a: Math.atan2(cam[0], cam[2]), y: cam[1] };
}

function arc(a, b, k, out) {
  const A = polar(a), B = polar(b);
  let d = B.a - A.a;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  const ang = A.a + d * k;
  const rad = lerp(A.r, B.r, k);
  out[0] = Math.sin(ang) * rad;
  out[1] = lerp(A.y, B.y, k);
  out[2] = Math.cos(ang) * rad;
  return out;
}

/* Grounding is a bag of scalars, so it interpolates by name. */
const GROUND_KEYS = ['push', 'wide', 'deep', 'pool', 'bed', 'contact', 'rimAngle', 'rimY', 'rim'];
function lerpGround(a, b, k, out) {
  for (const key of GROUND_KEYS) {
    const av = a[key], bv = b[key];
    if (av === undefined && bv === undefined) continue;
    out[key] = lerp(av === undefined ? bv : av, bv === undefined ? av : bv, k);
  }
  return out;
}

export async function mountStage({ scene, frame, place, stage, acts }) {
  const heroEl = document.querySelector('.j-hero');
  const els = [...stage.querySelectorAll('.j-act')];
  if (!heroEl || els.length < 2) return 'no acts';

  const N = Math.min(acts.length, HOLDS.length, els.length);
  const weights = new Array(N).fill(0);

  /* ── reduced motion ───────────────────────────────────────────────────────
     Not a degraded path — a different, complete one. The four acts stay in
     document flow, every one readable at its composed size, and the car stays on
     screen behind them without moving at all. The stage is a scrubbed pin:
     movement bound to the visitor's own scrolling, which is the last place
     someone with a vestibular condition can get away from it. It is not offered
     in a gentler form. It is not offered. */
  if (REDUCED) return 'reduced — flow kept, camera parked on act 01';

  let gsap, ScrollTrigger;
  try {
    ({ gsap } = await import('gsap'));
    ({ ScrollTrigger } = await import('gsap/ScrollTrigger'));
    gsap.registerPlugin(ScrollTrigger);
  } catch (e) {
    return `no gsap — flow kept (${e && e.message ? e.message : e})`;
  }

  /* From here the document IS a stage, and the stylesheet is told so on the root
     rather than by this module reaching in and setting styles. */
  document.documentElement.setAttribute('data-stage', 'on');
  stage.setAttribute('data-stage', 'on');

  const camA = [0, 0, 0], tgtA = [0, 0, 0], grdA = {};
  let wordAt = -1;

  /* Where is p in the edit? Either inside a hold, or inside the cut after it. */
  function locate(p) {
    for (let i = 0; i < N; i++) {
      if (p <= HOLDS[i][1]) {
        if (p >= HOLDS[i][0]) return { hold: i };
        const prev = i - 1;
        return { cut: prev, u: span(p, HOLDS[prev][1], HOLDS[i][0]) };
      }
    }
    return { hold: N - 1 };
  }

  function apply(p) {
    const at = locate(clamp01(p));
    weights.fill(0);

    if (at.hold !== undefined) {
      /* A HOLD. The camera is exactly where the composition says, the grounding
         is exactly the state that composition was lit for, and the copy is at
         full strength. Pause here and the frame is finished. */
      const f = frame(at.hold);
      scene.setPose(f.pose);
      if (f.ground) scene.setGround(f.ground);
      if (wordAt !== at.hold) { scene.setGhost(f.ghost.text, f.ghost); wordAt = at.hold; }
      weights[at.hold] = 1;
    } else {
      /* A CUT. Everything travels together and lands together. */
      const a = frame(at.cut), b = frame(at.cut + 1);
      const k = ease(at.u);
      scene.setPose({
        cam: arc(a.pose.cam, b.pose.cam, k, camA),
        target: lerp3(a.pose.target, b.pose.target, k, tgtA),
        fov: lerp(a.pose.fov, b.pose.fov, k),
      });
      if (a.ground && b.ground) scene.setGround(lerpGround(a.ground, b.ground, k, grdA));

      /* The word swaps where the outgoing copy has gone, so no frame ever shows
         one act's headline over another act's word. */
      const want = at.u < COPY_OUT ? at.cut : at.cut + 1;
      if (want !== wordAt) { const g = frame(want).ghost; scene.setGhost(g.text, g); wordAt = want; }

      weights[at.cut] = 1 - span(at.u, 0, COPY_OUT);
      weights[at.cut + 1] = span(at.u, COPY_OUT, COPY_IN_END);
    }

    for (let i = 0; i < N; i++) {
      const w = weights[i];
      els[i].style.opacity = String(w);
      if (w > 0.02) els[i].setAttribute('data-on', '');
      else els[i].removeAttribute('data-on');
    }

    place(weights);
    scene.invalidate();
  }

  const ctx = gsap.context(() => {
    /* ── arrival ────────────────────────────────────────────────────────────
       The page-load exception CLAUDE.md names by hand — the one place a selector
       may address an instance rather than a role, because there is exactly one
       first paint and it belongs to this page. */
    const masses = [...els[0].children];
    gsap.set(masses, { opacity: 0, y: 18 });
    gsap.to(masses, { opacity: 1, y: 0, duration: 0.62, ease: 'power2.out', stagger: 0.09, delay: 0.12 });

    ScrollTrigger.create({
      trigger: heroEl,
      start: 'top top',
      end: () => `+=${(N - 1) * SLOT_VH}%`,
      pin: true,
      pinSpacing: true,
      scrub: SCRUB,
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: () => apply(0),
    });

    apply(0);
  }, heroEl);

  const held = HOLDS.reduce((n, h) => n + (h[1] - h[0]), 0);
  return `live — ${N} acts, pin ${(N - 1) * SLOT_VH}%, ${Math.round(held * 100)}% held / ${Math.round((1 - held) * 100)}% cut, scrub ${SCRUB}`;
}
