/* ============================================================================
   scene/index.js — the entry, and mostly the guards.
   ----------------------------------------------------------------------------
   This file's real job is deciding NOT to run. The scene is the most expensive
   thing on the page and the most likely to fail, so every path out of here
   leaves a page that is complete: the authored still stays, the notes are all
   visible at once as a spec plate, and nothing is missing except the motion.

   That is also the reduced-motion answer. It is not "the animation, stopped" —
   it is a composed frame plus the same facts, arriving all together instead of
   one at a time.
   ========================================================================== */

const scope   = document.querySelector('[data-scene-scope]');
const mount   = document.querySelector('[data-scene-mount]');
const canvas  = document.querySelector('[data-scene]');
const still   = document.querySelector('.hero__still');
const reveal  = document.querySelector('[data-reveal]');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow  = window.matchMedia('(max-width: 55.99rem)').matches;

/* The static path. Everything the sequence was carrying still arrives — that is
   the whole test — it just arrives at once. */
function stayStatic(why) {
  document.documentElement.setAttribute('data-scene-state', 'static');
  if (reveal) reveal.setAttribute('data-static', '');
  if (mount) mount.remove();
  console.info(`[scene] static path: ${why}`);
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

/* A budget is only a budget if something refuses to spend it. The declared floor
   is 30 fps on an iPhone 12 and a mid-range 2022 Android; below the line drawn
   here the honest answer is that this device does not get a scene, which is a
   legitimate authored outcome and not a degradation. */
function tooLittleMachine() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const saver = navigator.connection && navigator.connection.saveData;
  if (saver) return 'data saver on';
  if (cores <= 3) return `${cores} cores`;
  if (mem < 3) return `${mem} GB reported memory`;
  return null;
}

async function boot() {
  if (!canvas || !mount || !scope) return stayStatic('no scene mount in this document');
  if (reduced) return stayStatic('prefers-reduced-motion');
  if (!hasWebGL()) return stayStatic('no WebGL');

  const thin = tooLittleMachine();
  if (thin) return stayStatic(thin);

  const quality = narrow ? 'lite' : 'full';

  try {
    /* WHICH DIRECTOR. Two of them exist and they are not variants of each
       other: choreography.js turns the car and holds one temporal idea;
       cinema.js travels the camera and treats movement, light and type as one
       event. The page says which it wants, because it is a directorial
       decision and not a property of this loader. */
    /* A whitelist, not a template. mount.dataset.director reaches this from
       the document, and turning attacker-controllable text into a module path
       is how a page ends up importing something nobody wrote. */
    const DIRECTORS = {
      cinema: './cinema.js',
      cinema4: './cinema4.js',
    };
    const director = DIRECTORS[mount.dataset.director] || './choreography.js';

    const [{ createHeroScene }, { mountChoreography }] = await Promise.all([
      import('./hero-scene.js'),
      import(director),
    ]);

    const scene = createHeroScene({
      canvas,
      modelUrl: mount.dataset.model || 'assets/model/cobra.glb',
      quality,
    });

    await scene.ready;

    mountChoreography({ scene, mount, still, scope, reveal, isNarrow: narrow });
    document.documentElement.setAttribute('data-scene-state', 'live');

    /* Absence raises no alarm, so it gets asked about directly. A scene that
       silently applied to nothing looks exactly like a page where none was
       ever designed. */
    if (reveal && !reveal.querySelector('[data-note]')) {
      console.warn('[scene] reveal section has no [data-note] children — the sequence took hold of nothing.');
    }
  } catch (err) {
    stayStatic(`failed to initialise — ${err && err.message ? err.message : err}`);
  }
}

/* Never on the critical path. The first read — what this is, what it costs,
   and both ways in — is done before this is even fetched. */
if (document.readyState === 'complete') {
  requestIdleCallbackSafe(boot);
} else {
  window.addEventListener('load', () => requestIdleCallbackSafe(boot), { once: true });
}

function requestIdleCallbackSafe(fn) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1200 });
  else setTimeout(fn, 200);
}
