/* ============================================================================
   scene/index8.js — direction H: direction B's page, driving the bought car.
   ----------------------------------------------------------------------------
   index8 is index2 with one thing swapped and one thing left alone.

   SWAPPED: the scene. index2 loads hero-scene.js, which re-assigns every mesh's
   material wholesale — correct for what it was written against, because that
   model arrived with SketchUp defaults and a game rip's naming and had nothing
   worth keeping. This page loads the bought car, whose two authored PBR atlases
   are the thing that was paid for and the thing a day was spent repairing. So it
   runs f-scene.js instead, which corrects only what an atlas cannot carry: glass
   and lenses by node name, and a clearcoat lobe the format has no channel for.

   LEFT ALONE: the choreography. choreography.js reads its poses out of the DOM —
   each note carries its own camera in data attributes — and holds exactly one
   temporal idea, that THE CAR TURNS TO FACE WHATEVER IS BEING SAID ABOUT IT.
   None of that is a property of which scene draws the car, so none of it is
   touched. It asks for five things: setPose, project, resize, start, stop.
   f-scene now offers all five; `project` moved into it from hero-scene rather
   than being reimplemented here, so the three callers read one implementation.

   The interesting part of this direction is that the swap is that small. If
   changing the renderer had meant rewriting the choreography, the two were never
   separate to begin with.
   ========================================================================== */

const scope   = document.querySelector('[data-scene-scope]');
const mount   = document.querySelector('[data-scene-mount]');
const canvas  = document.querySelector('[data-scene]');
const still   = document.querySelector('.hero__still');
const reveal  = document.querySelector('[data-reveal]');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow  = window.matchMedia('(max-width: 55.99rem)').matches;

/* The static path, unchanged from direction B and for the same reason: it is
   not "the animation, stopped" — it is a composed frame plus the same facts,
   arriving at once instead of one at a time. */
function stayStatic(why) {
  document.documentElement.setAttribute('data-scene-state', 'static');
  if (reveal) reveal.setAttribute('data-static', '');
  if (mount) mount.remove();
  console.info(`[scene H] static path: ${why}`);
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'))
        || !!(window.WebGLRenderingContext && c.getContext('webgl'));
  } catch (e) { return false; }
}

function tooLittleMachine() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  if (navigator.connection && navigator.connection.saveData) return 'data saver on';
  if (cores <= 3) return `${cores} cores`;
  if (mem < 3) return `${mem} GB reported memory`;
  return null;
}

async function boot() {
  if (!scope || !mount || !canvas) return stayStatic('no scene mount in this document');
  if (!hasWebGL()) return stayStatic('no WebGL');
  if (reduced) return stayStatic('prefers-reduced-motion');

  const thin = tooLittleMachine();
  if (thin) return stayStatic(thin);

  try {
    const [{ createFScene }, { mountChoreography }] = await Promise.all([
      import('./f-scene.js'),
      import('./choreography.js'),
    ]);

    const scene = createFScene({
      canvas,
      modelUrl: mount.dataset.model,
      envUrl: mount.dataset.env,
      quality: narrow ? 'lite' : 'full',
    });

    await scene.ready;

    mountChoreography({ scene, mount, still, scope, reveal, isNarrow: narrow });
    document.documentElement.setAttribute('data-scene-state', 'live');
    window.__h = scene;

    /* Absence raises no alarm, so it is asked about directly. A choreography
       that silently applied to nothing looks exactly like a page where none was
       ever designed. */
    if (reveal && !reveal.querySelector('[data-note]')) {
      console.info('[scene H] no [data-note] in the reveal — the choreography has nothing to turn toward');
    }
  } catch (err) {
    stayStatic(`failed to initialise — ${err && err.message ? err.message : err}`);
  }
}

if (document.readyState === 'complete') idle(boot);
else window.addEventListener('load', () => idle(boot), { once: true });

function idle(fn) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1200 });
  else setTimeout(fn, 200);
}
