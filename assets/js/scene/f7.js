/* ============================================================================
   f7.js — direction G. One live scene under a scrollcraft page.
   ----------------------------------------------------------------------------
   index7 is built on nateherkai/scroll-craft, vendored at
   design_dna/external/scrollcraft. The engine owns the page's scroll grammar —
   acts, spans, cues, kinetic type, the drifting ground — and publishes each
   act's progress as `--sc-p` on the act element. That property is the whole
   contract between the two halves: the engine never touches this file, and this
   file never touches the scroll.

   ONE SCENE, NOT ONE PER ACT. The car appears in two pinned acts a long way
   apart, and the obvious build gives each its own canvas. That is two WebGL
   contexts, two copies of a 3.8 MB model and two PMREM passes for a car nobody
   can see twice at once. Instead there is a single fixed canvas behind the page
   and the acts hand it back and forth: whichever act is live owns the camera,
   and the CSS fades the canvas out where no act wants it.

   Which also happens to be the grammar the skill calls a live surface, arrived
   at from the cheap direction rather than the clever one.
   ========================================================================== */

import * as THREE from 'three';
import { createFScene } from './f-scene.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ── act 1: the arrival ──────────────────────────────────────────────────────
   One unbroken move, which is what Alex asked for and which the skill warns is
   the most expensive and most fragile thing to build. It is affordable here for
   a reason the skill could not know: the camera is real, not a rendered clip, so
   there is no frame budget, no seam between shots, and no file to download. The
   fragility it warns about is a video pipeline's fragility.

   Far and high, falling in and settling low at the nose. The settle lands where
   the headline finishes assembling. */
const ARRIVAL = [
  { cam: [6.60, 4.20, 8.40], target: [0, 0.60, 0], fov: 34 },
  { cam: [3.60, 1.35, 5.60], target: [-0.55, 0.55, 0.25], fov: 32 },
  { cam: [2.55, 0.62, 4.05], target: [-0.85, 0.50, 0.45], fov: 31 },
];

/* ── act 4: the signature ────────────────────────────────────────────────────
   The car comes apart into the nodes it was bought as, and goes back together.
   It earns its place because it is the one thing on this page that could not be
   a photograph: a still can show a car, and a video can show a car turning, but
   only a live scene can be taken apart by the reader's own hand and put back.

   The directions are not decoration. Each group travels the way it comes off a
   real car: the shell lifts, the doors swing out sideways, the wheels go out on
   their own axes, the glass rises, the interior drops away with the floor. A
   part that flies off in an arbitrary direction reads as an explosion; a part
   that moves the way it is removed reads as a build. */
const EXPLODE = [
  { test: /^Body$/i,                       dir: [0, 1.15, 0.10], hold: 0.00 },
  { test: /^Doar_(left|covering_left)/i,   dir: [1.35, 0.10, 0], hold: 0.06 },
  { test: /^Doar_(right|covering_right)/i, dir: [-1.35, 0.10, 0], hold: 0.06 },
  { test: /^Trunk/i,                       dir: [0, 0.85, -1.05], hold: 0.10 },
  { test: /^Windscreen|^Glass/i,           dir: [0, 1.55, 0.35], hold: 0.03 },
  { test: /^Lens_left|^Lamp_rear_left/i,   dir: [0.65, 0.35, 0.55], hold: 0.14 },
  { test: /^Lens_right|^Lamp_rear_right/i, dir: [-0.65, 0.35, 0.55], hold: 0.14 },
  { test: /left$|_left/i,                  dir: [1.55, 0, 0], hold: 0.18 },
  { test: /right$|_right/i,                dir: [-1.55, 0, 0], hold: 0.18 },
  { test: /^Tires_rear|^Wheels_rear/i,     dir: [0, 0, -1.35], hold: 0.18 },
  { test: /^Seat|^Steering|^Interior/i,    dir: [0, -0.75, -0.55], hold: 0.22 },
];

const SIGNATURE_CAM = [
  { cam: [4.10, 1.60, 5.10], target: [0, 0.55, 0], fov: 31 },
  { cam: [5.40, 2.35, 4.10], target: [0, 0.75, 0], fov: 33 },
];

export function mountG({ canvas, mount, quality, reduced }) {
  const scene = createFScene({
    canvas,
    modelUrl: mount.dataset.model,
    envUrl: mount.dataset.env,
    quality,
  });

  const acts = [...document.querySelectorAll('[data-g-act]')];
  const parts = [];
  let live = null;

  scene.ready.then(() => {
    /* Every mesh keeps its own rest position. Reading it once and animating
       against it means the reader can scrub backwards through the signature and
       land the car back exactly where it started, which a cumulative offset
       cannot do. */
    scene.car.traverse((o) => {
      if (!o.isMesh) return;
      const rule = EXPLODE.find((r) => r.test.test(o.name));
      if (!rule) return;
      parts.push({
        o,
        rest: o.position.clone(),
        dir: new THREE.Vector3(rule.dir[0], rule.dir[1], rule.dir[2]),
        hold: rule.hold,
      });
    });
    console.info(`[scene G] ${parts.length} parts wired for the signature`);
  });

  function readP(el) {
    const raw = getComputedStyle(el).getPropertyValue('--sc-p');
    const n = parseFloat(raw);
    return Number.isFinite(n) ? clamp01(n) : 0;
  }

  function poseAlong(list, t) {
    const p = clamp01(t) * (list.length - 1);
    const i = Math.min(list.length - 2, Math.floor(p));
    const f = easeInOut(p - i);
    const a = list[i], b = list[i + 1];
    return { cam: lerp3(a.cam, b.cam, f), target: lerp3(a.target, b.target, f), fov: lerp(a.fov, b.fov, f) };
  }

  function setExplosion(t) {
    if (!parts.length) return;
    for (const p of parts) {
      /* Each group waits its turn and then travels. Staggering by a hold means
         the car comes apart in an order — shell first, then doors, then the
         small chrome — instead of every part leaving at once, which is the
         difference between a build and a bang. */
      const local = clamp01((t - p.hold) / (1 - p.hold));
      const d = easeInOut(local);
      p.o.position.set(
        p.rest.x + p.dir.x * d,
        p.rest.y + p.dir.y * d,
        p.rest.z + p.dir.z * d
      );
    }
  }

  function frame() {
    /* The live act is whichever pinned stage currently owns the viewport. The
       engine already knows; this only has to ask, and asking is one computed
       style read per act per frame on a page with two of them. */
    let best = null, bestP = 0;
    for (const el of acts) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      const p = readP(el);
      if (!best || Math.abs(p - 0.5) < Math.abs(bestP - 0.5)) { best = el; bestP = p; }
    }

    if (best !== live) {
      live = best;
      document.documentElement.dataset.gAct = best ? best.dataset.gAct : 'none';
    }

    if (best) {
      const kind = best.dataset.gAct;
      if (kind === 'arrival') {
        scene.setPose(poseAlong(ARRIVAL, bestP));
        setExplosion(0);
      } else if (kind === 'signature') {
        /* Apart on the way in, together on the way out. The reader who keeps
           scrolling gets the car back — a page that leaves the product in pieces
           has spent its best moment on a worse ending. */
        const apart = bestP < 0.62 ? bestP / 0.62 : 1 - (bestP - 0.62) / 0.38;
        scene.setPose(poseAlong(SIGNATURE_CAM, bestP));
        setExplosion(clamp01(apart));
      }
    }
    requestAnimationFrame(frame);
  }

  scene.ready.then(() => {
    scene.start();
    if (reduced) scene.turn.damping = 0;
    scene.bindTurn(() => {});
    requestAnimationFrame(frame);
  });

  return scene;
}
