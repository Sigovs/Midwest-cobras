/* ============================================================================
   scene/index4.js — the entry for direction D. A fork of scene/index.js.
   ----------------------------------------------------------------------------
   Forked rather than extended because directions A, B and C all boot through
   scene/index.js and this pass is not allowed to change how they behave. The
   guards below are the same guards, deliberately: every path out of here still
   leaves a page that is complete, because that is the part of the original that
   is worth copying exactly.

   What is different is what it mounts. There is no camera choreography here at
   all — see assembly.js. The camera POSITION never changes for the whole page.
   The only thing the scroll drives is how much car exists, and a lateral shift
   of the aim so the subject changes lane when the caption does.

   That lateral shift is the one motion the camera is allowed, and it is not
   drift: it is the composition swapping sides, derived from the same lane
   declaration that positions the text, so the two can never disagree.
   ========================================================================== */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

import { createAssembly } from './assembly.js';
import { laneFor, applyLane, makeOverlapAssert } from './lanes.js';

gsap.registerPlugin(ScrollTrigger);

const DEG = Math.PI / 180;

/* ONE FRAME, held. Written once here and never tweened. */
const FRAME = {
  rotY: 34 * DEG,
  cam: [0.35, 1.08, 7.30],
  target: [0, 0.50, 0],
  fov: 30,
};

const scope = document.querySelector('[data-scene-scope]');
const mount = document.querySelector('[data-scene-mount]');
const canvas = document.querySelector('[data-scene]');
const still = document.querySelector('.stage__still');
const stage = document.querySelector('[data-stage]');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = window.matchMedia('(max-width: 55.99rem)').matches;

/* The static path. Everything the sequence carries still arrives; it just
   arrives already finished, which for an assembly sequence means the built car
   and every caption, at once. */
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

    const assembly = createAssembly(scene.car, THREE);
    const notes = Array.from(stage.querySelectorAll('[data-beat]'));
    const assertNoOverlap = makeOverlapAssert(scene, THREE);

    if (!notes.length) {
      console.warn('[stage] no [data-beat] captions — the assembly runs with nothing said over it.');
    }

    /* lanes, applied on load and on every reflow */
    const layoutLanes = () => {
      for (const n of notes) applyLane(n, window.innerWidth);
    };
    layoutLanes();

    gsap.set(mount, { autoAlpha: 0 });
    gsap.timeline()
      .to(mount, { autoAlpha: 1, duration: 0.5, ease: 'none' })
      .to(still, { autoAlpha: 0, duration: 0.5, ease: 'none' }, '<');

    /* ── the scrub ─────────────────────────────────────────────────────────
       One value, one trigger. `built` is the whole state of the scene: how much
       car there is. Nothing else about the render is driven by scroll. */
    const state = { built: 0, aimX: 0 };
    const N = assembly.beats.length;

    const push = () => {
      assembly.setProgress(state.built);
      if (typeof syncCaptions === 'function') syncCaptions(state.built);
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
        end: () => '+=' + (window.innerHeight * (narrow ? 3.2 : 5.4)),
        pin: stage,
        pinSpacing: true,
        anticipatePin: 1,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    tl.to(state, { built: 1, duration: N, onUpdate: push }, 0);

    /* The aim swaps lanes with the caption, once per beat, and settles well
       before the beat's parts land so the move is never competing with them. */
    notes.forEach((note, i) => {
      const lane = laneFor(note, window.innerWidth);
      tl.to(state, {
        aimX: lane.targetOffsetX,
        duration: 0.35,
        ease: 'power2.inOut',
        onUpdate: push,
      }, Math.max(0, i - 0.3));
    });

    /* ── captions and the finish ───────────────────────────────────────────
       DERIVED, not scheduled. Two earlier attempts scheduled them: one on
       ScrollTriggers anchored to the stage, which cannot work because pinning
       freezes the element and every start written as `top top-=N` stays false
       for the rest of the page; then on timeline callbacks, whose firing order
       under a scrub that jumps is not something worth reasoning about.

       So the active beat is COMPUTED from the same number that drives the
       assembly. One source, no ordering, and scrubbing backwards is just a
       smaller number. The reveal itself is still unscrubbed — a caption caught
       at 43% because the reader stopped between beats is an unreadable frame.
    */
    const lines = notes.map((n) => n.querySelectorAll('.stage-note__line'));
    notes.forEach((n, i) => { gsap.set(n, { autoAlpha: 0 }); gsap.set(lines[i], { yPercent: 112 }); });

    const price = document.querySelector('[data-stage-price]');
    if (price) gsap.set(price, { autoAlpha: 0 });

    let shown = -1;
    let lit = false;

    function syncCaptions(built) {
      /* which beat is on screen: the same slicing assembly.js uses */
      const idx = Math.max(0, Math.min(notes.length - 1, Math.floor(built * notes.length)));
      if (idx !== shown) {
        if (shown >= 0) {
          gsap.to(notes[shown], { autoAlpha: 0, duration: 0.2, overwrite: true });
          gsap.set(lines[shown], { yPercent: 112 });
        }
        gsap.to(notes[idx], { autoAlpha: 1, duration: 0.25, overwrite: true });
        gsap.to(lines[idx], { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07, overwrite: true });
        shown = idx;
      }

      /* the lamps and the one display figure are the same beat: the car is
         finished, it switches on, and the price is what it costs */
      const done = built > 0.97;
      if (done !== lit) {
        lit = done;
        scene.setLights(done ? { head: 1, tail: 0.55 } : 0);
        if (price) gsap.to(price, { autoAlpha: done ? 1 : 0, duration: done ? 0.6 : 0.3, ease: 'power2.out', overwrite: true });
      }
    }

    ScrollTrigger.addEventListener('refreshInit', () => {
      scene.resize();
      layoutLanes();
    });
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
