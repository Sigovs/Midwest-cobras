/* ============================================================================
   scene/index6.js — direction F's entry, and mostly its guards.
   ----------------------------------------------------------------------------
   The page is complete before this file is fetched. Every path out of it leaves
   a readable page: no scene, no missing content, nothing announcing a failure
   the visitor cannot act on.

   The pose below is the FIRST LOOK, not a hero declaration. Nothing has been
   composed into this stage yet — no identity mass, no record, no CTA — so the
   camera is placed to see the car honestly rather than to flatter it: front
   three-quarter from the left, eye height below the beltline so the car reads
   planted, and the subject sitting right of the optical centre with the upper
   left held empty, because that is where the identity mass goes when there is
   one.
   ========================================================================== */

const canvas = document.querySelector('[data-scene]');
const mount  = document.querySelector('[data-scene-mount]');
const still  = document.querySelector('[data-scene-still]');

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow  = window.matchMedia('(max-width: 55.99rem)').matches;

/* The model's front wheels sit at +Z, so +Z is the nose. Read from the node
   translations rather than guessed — a camera placed on the assumption that a
   car faces the other way produces a rear three-quarter that looks deliberate
   and is not. */
export const FIRST_LOOK = {
  desktop: { cam: [3.05, 0.82, 5.35], target: [-0.62, 0.52, 0], fov: 32 },
  narrow:  { cam: [2.55, 0.90, 4.55], target: [-0.05, 0.55, 0], fov: 44 },
};

function stayStatic(why) {
  document.documentElement.setAttribute('data-scene-state', 'static');
  if (mount) mount.setAttribute('data-fallback', '');
  console.info(`[scene F] static path: ${why}`);
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
  if (!canvas || !mount) return stayStatic('no scene mount in this document');
  if (!hasWebGL()) return stayStatic('no WebGL');

  const thin = tooLittleMachine();
  if (thin) return stayStatic(thin);

  try {
    const { createFScene } = await import('./f-scene.js');
    const scene = createFScene({
      canvas,
      modelUrl: mount.dataset.model,
      envUrl: mount.dataset.env,
      quality: narrow ? 'lite' : 'full',
    });

    const info = await scene.ready;
    console.info(`[scene F] model in — ${info.size.toArray().map(n => n.toFixed(2)).join(' × ')} m`);

    scene.setPose(narrow ? FIRST_LOOK.narrow : FIRST_LOOK.desktop);
    scene.start();
    if (still) still.setAttribute('data-hidden', '');
    document.documentElement.setAttribute('data-scene-state', 'live');
    window.__fscene = scene;   // the framing is being decided; this is the handle

    /* The turn is real, so it has to be discoverable — an affordance nobody can
       see is not an affordance, and one that has to be guessed costs the
       visitor an attempt and the page its credibility. The hint appears once
       the car is actually there and leaves the moment it has been used. */
    const hint = document.querySelector('[data-turn-hint]');
    scene.bindTurn(() => { if (hint) hint.setAttribute('data-used', ''); });
    if (hint) hint.removeAttribute('hidden');

    /* Nothing turns on its own. Under reduced motion the difference is only
       the inertia after a drag — the car itself is still turnable, because
       taking a control away from someone is not an accommodation. */
    if (reduced) {
      scene.turn.damping = 0;
      console.info('[scene F] reduced motion — the turn stays, its glide does not');
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
