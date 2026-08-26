/* ============================================================================
   scene/index7.js — direction G's entry, and mostly its guards.
   ----------------------------------------------------------------------------
   Same contract as every other entry here: the page is complete before this file
   is fetched, and every path out of it leaves a readable page. The difference is
   what "readable" means on this one — scrollcraft's acts, copy, figures and rail
   are all real HTML and all work with no WebGL at all. The car is the best thing
   on the page and it is not load-bearing, which is the only arrangement worth
   shipping.
   ========================================================================== */

const mount = document.querySelector('[data-g-mount]');
const canvas = document.querySelector('[data-g-canvas]');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = window.matchMedia('(max-width: 55.99rem)').matches;

function stayFlat(why) {
  document.documentElement.setAttribute('data-g-scene', 'static');
  console.info(`[scene G] flat path: ${why}`);
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
  if (!mount || !canvas) return stayFlat('no surface in this document');
  if (!hasWebGL()) return stayFlat('no WebGL');

  const thin = tooLittleMachine();
  if (thin) return stayFlat(thin);

  try {
    const { mountG } = await import('./f7.js');
    const scene = mountG({
      canvas, mount,
      quality: narrow ? 'lite' : 'full',
      reduced,
    });
    const info = await scene.ready;
    console.info(`[scene G] model in — ${info.size.toArray().map((n) => n.toFixed(2)).join(' × ')} m`);
    document.documentElement.setAttribute('data-g-scene', 'live');
    window.__g = scene;    // the signature is being tuned; this is the handle
  } catch (err) {
    stayFlat(`failed to initialise — ${err && err.message ? err.message : err}`);
  }
}

/* After load and at idle, like every other direction here: the acts, the copy
   and the rail are already on screen and already correct, so the scene has no
   reason to compete with them for the first paint. */
if (document.readyState === 'complete') idle(boot);
else window.addEventListener('load', () => idle(boot), { once: true });

function idle(fn) {
  if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1500 });
  else setTimeout(fn, 250);
}
