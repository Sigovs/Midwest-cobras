/* ============================================================================
   scene/index5.js — the entry for direction E. Ten parts, then the lamps.
   ----------------------------------------------------------------------------
   Forked from index4.js rather than shared with it, for the same reason index4
   was forked from index.js: directions A through D all still boot, and this
   pass is not allowed to change how any of them behave. The guards below are
   the same guards on purpose — every path out of boot() leaves a complete page.

   WHAT IS DIFFERENT FROM D.

   D had six beats named after the configurator rows, and it lit the lamps as a
   side effect of finishing. E has ten, named after actual parts, and the lamps
   are the tenth STEP — fitted like everything else, and then switched on. The
   ignition is the event the whole sequence has been walking toward, so it is
   given its own stretch of scroll after the last part lands rather than firing
   on a threshold.

   THE POSE, AND THE THING IT COSTS.

   One frame is held for the whole page: a front three-quarter, nose toward the
   camera. That is the shot that reads the assembly — you can see into the
   engine bay, across the seats and along both flanks from it, which is more
   than a profile or a rear three-quarter gives.

   The price of a locked camera is that the far end of the car is the far end
   for the entire page. From this pose the HEADLAMPS face the viewer and the
   TAIL LAMPS face away, and no amount of gain changes that. So the red is not
   spent on a surface nobody sees: the tails come up at a little over half, and
   what reads is their reflection in the floor behind the car, which the
   reflector in hero-scene.js already draws. It is a smaller effect than the
   heads and it is meant to be — one end of a car is lit toward you and the
   other is lit away from you, which is also true of a real car in a dark hall.
   ========================================================================== */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import { resolveParts } from './parts.js';
import { createAssembly } from './assembly5.js';
import { laneFor, applyLane, makeOverlapAssert } from './lanes.js';

gsap.registerPlugin(ScrollTrigger);

const DEG = Math.PI / 180;

/* ONE FRAME, held. Written once and never tweened. Slightly wider and a touch
   lower than D's, because ten steps means parts arriving at the extremities —
   outboard brakes, a boot panel from behind — and D's framing cropped them. */
const FRAME = {
  rotY: 32 * DEG,
  cam: [0.30, 1.02, 7.85],
  target: [0, 0.48, 0],
  fov: 31,
};

const scope = document.querySelector('[data-scene-scope]');
const mount = document.querySelector('[data-scene-mount]');
const canvas = document.querySelector('[data-scene]');
const still = document.querySelector('.stage__still');
const stage = document.querySelector('[data-stage]');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = window.matchMedia('(max-width: 55.99rem)').matches;

/* The static path. Everything the sequence carries still arrives; it arrives
   already finished, which for an assembly sequence means the built car and all
   ten captions, at once. */
function stayStatic(why) {
  document.documentElement.setAttribute('data-scene-state', 'static');
  if (stage) stage.setAttribute('data-static', '');
  if (mount) mount.remove();
  console.info('[stage] static path: ' + why);
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'))
        || !!(window.WebGLRenderingContext && c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

function tooLittleMachine() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (navigator.connection && navigator.connection.saveData) return 'data saver on';
  if (cores <= 3) return cores + ' cores';
  if (mem < 3) return mem + ' GB reported memory';
  return null;
}

async function boot() {
  if (!canvas || !mount || !scope || !stage) return stayStatic('no stage in this document');
  if (reduced) return stayStatic('prefers-reduced-motion');
  if (!hasWebGL()) return stayStatic('no WebGL');
  const thin = tooLittleMachine();
  if (thin) return stayStatic(thin);

  try {
    const { createHeroScene } = await import('./hero-scene.js');

    const scene = createHeroScene({
      canvas,
      modelUrl: mount.dataset.model || 'assets/model/ac-cobra-427.glb',
      quality: narrow ? 'lite' : 'full',
    });

    await scene.ready;

    scene.setPose(FRAME);
    scene.setLights(0);
    scene.start();
    document.documentElement.setAttribute('data-scene-state', 'live');

    /* Manifest first, motion second. If the model is ever swapped, resolveParts
       reports every prefix it could not find by name and the sequence runs
       short rather than silently missing a step. */
    const resolved = resolveParts(scene.car, THREE);
    const assembly = createAssembly(resolved, THREE);

    const notes = Array.from(stage.querySelectorAll('[data-step]'));
    const assertNoOverlap = makeOverlapAssert(scene, THREE);

    if (notes.length !== assembly.stepCount) {
      console.warn(
        '[stage] ' + notes.length + ' captions for ' + assembly.stepCount + ' steps. ' +
        'They are matched by position, so the mismatch means some step is either ' +
        'silent or is described by the wrong caption. Add or remove a [data-step] ' +
        'article in index5.html to match parts.js.'
      );
    }

    const layoutLanes = () => { for (const n of notes) applyLane(n, window.innerWidth); };
    layoutLanes();

    gsap.set(mount, { autoAlpha: 0 });
    gsap.timeline()
      .to(mount, { autoAlpha: 1, duration: 0.5, ease: 'none' })
      .to(still, { autoAlpha: 0, duration: 0.5, ease: 'none' }, '<');

    /* ── the scrub ─────────────────────────────────────────────────────────
       Two values and one trigger. `built` is how much car there is; `head` and
       `tail` are the lamps. Nothing else about the render is driven by scroll,
       apart from `aimX`, which is the composition changing sides. */
    const state = { built: 0, aimX: 0, head: 0, tail: 0 };
    const N = assembly.stepCount;

    /* The strike is worth its own slice of scroll rather than a threshold at
       the end. STRIKE units on a timeline whose build runs for N. */
    const STRIKE = 1.6;

    const push = () => {
      assembly.setProgress(state.built);
      syncCaptions(state.built);
      scene.setLights({ head: state.head, tail: state.tail });
      scene.setPose({
        rotY: FRAME.rotY,
        cam: FRAME.cam,
        target: [FRAME.target[0] + state.aimX, FRAME.target[1], FRAME.target[2]],
        fov: FRAME.fov,
      });
    };

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage,
        start: 'top top',
        end: () => '+=' + (window.innerHeight * (narrow ? 4.4 : 7.6)),
        pin: stage,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    tl.to(state, { built: 1, duration: N, onUpdate: push }, 0);

    /* ── the lanes ─────────────────────────────────────────────────────────
       Ten steps do NOT mean ten lane swaps. Alternating every step would put
       the car in lateral motion for most of the page and turn a held frame
       into a slow pendulum, which is the one thing this direction promised not
       to do. So the ten are grouped into three compositions and the aim moves
       twice. Each note still declares its own lane, because that declaration is
       what the overlap assertion checks against; consecutive notes simply
       declare the same one. */
    /* The first composition is SET, not tweened. Tweening it from zero means
       the opening frame of the page has the car centred under a caption that
       is already in its lane, which is the exact overlap the lane system
       exists to prevent — and it was the first thing the assertion caught. */
    if (notes.length) state.aimX = laneFor(notes[0], window.innerWidth).targetOffsetX;

    let lastAim = notes.length ? state.aimX : null;
    notes.forEach((note, i) => {
      const lane = laneFor(note, window.innerWidth);
      if (lane.targetOffsetX === lastAim) return;
      lastAim = lane.targetOffsetX;
      tl.to(state, {
        aimX: lane.targetOffsetX,
        duration: 0.5,
        ease: 'power2.inOut',
        onUpdate: push,
      }, Math.max(0, i - 0.4));
    });

    /* ── the ignition ──────────────────────────────────────────────────────
       Four steps, not a fade. A filament does not ramp: it takes, gutters, and
       then holds. The middle dip is the whole reason this reads as a switch
       being thrown rather than a slider being dragged — remove it and the same
       stretch of scroll looks like a dissolve.

       Durations sum to STRIKE. The tails join only on the last step, because a
       car whose rear lamps come up before its heads is a car being braked, not
       a car being started. */
    tl.to(state, { head: 0.15, duration: STRIKE * 0.22, ease: 'power2.out', onUpdate: push }, N)
      .to(state, { head: 0.60, duration: STRIKE * 0.12, ease: 'power3.out', onUpdate: push })
      .to(state, { head: 0.25, duration: STRIKE * 0.14, ease: 'power2.inOut', onUpdate: push })
      .to(state, { head: 1.00, duration: STRIKE * 0.52, ease: 'power2.out', onUpdate: push })
      .to(state, { tail: 0.58, duration: STRIKE * 0.40, ease: 'power2.out', onUpdate: push }, '<0.1');

    /* ── captions ──────────────────────────────────────────────────────────
       DERIVED, not scheduled. Two earlier attempts on direction D scheduled
       them: first on ScrollTriggers anchored to the stage, which cannot work
       because pinning freezes the element and a start written `top top-=N`
       stays false for the rest of the page; then on timeline callbacks, whose
       firing order under a scrub that jumps is not worth reasoning about.

       So the active step is COMPUTED from the same number that drives the
       assembly, through assembly.stepAt — one source, no ordering, and
       scrubbing backwards is just a smaller number. The reveal itself stays
       unscrubbed: a caption caught at 43% because the reader stopped between
       steps is an unreadable frame. */
    const lines = notes.map((n) => n.querySelectorAll('.stage-note__line'));
    notes.forEach((n, i) => { gsap.set(n, { autoAlpha: 0 }); gsap.set(lines[i], { yPercent: 112 }); });

    const price = document.querySelector('[data-stage-price]');
    if (price) gsap.set(price, { autoAlpha: 0 });

    let shown = -1;
    let priced = false;

    function syncCaptions(built) {
      if (!notes.length) return;
      const idx = Math.min(notes.length - 1, assembly.stepAt(built));
      if (idx !== shown) {
        if (shown >= 0) {
          gsap.to(notes[shown], { autoAlpha: 0, duration: 0.2, overwrite: true });
          gsap.set(lines[shown], { yPercent: 112 });
        }
        gsap.to(notes[idx], { autoAlpha: 1, duration: 0.25, overwrite: true });
        gsap.to(lines[idx], { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07, overwrite: true });
        shown = idx;
      }

      /* The figure arrives with the last part, not with the light — it belongs
         to the finished car, and putting it under the ignition would make the
         reader choose which of the two to look at. */
      const done = built > 0.985;
      if (done !== priced) {
        priced = done;
        if (price) gsap.to(price, { autoAlpha: done ? 1 : 0, duration: done ? 0.6 : 0.3, ease: 'power2.out', overwrite: true });
      }
    }

    /* Apply the resting state once, so the first painted frame is the composed
       one rather than whatever the pose happened to be before the lanes were
       resolved. */
    push();

    ScrollTrigger.addEventListener('refreshInit', () => { scene.resize(); layoutLanes(); });
    ScrollTrigger.addEventListener('refresh', () => assertNoOverlap(notes));
    window.addEventListener('resize', () => { layoutLanes(); assertNoOverlap(notes); }, { passive: true });
    assertNoOverlap(notes);
  } catch (err) {
    stayStatic('failed to initialise — ' + (err && err.message ? err.message : err));
  }
}

if (document.readyState === 'complete') requestIdleCallbackSafe(boot);
else window.addEventListener('load', () => requestIdleCallbackSafe(boot), { once: true });

function requestIdleCallbackSafe(fn) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1200 });
  else setTimeout(fn, 200);
}
