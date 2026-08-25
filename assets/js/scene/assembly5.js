/* ============================================================================
   scene/assembly5.js — plays the manifest. Direction E.
   ----------------------------------------------------------------------------
   THE CAR DOES NOT EXIST YET. SCROLLING BUILDS IT.

   The camera holds one frame. Nothing orbits, nothing drifts. The only thing
   that changes is how much car is there.

   Consequences accepted rather than worked around: the camera is locked, there
   is no rotation sweep, and the even-turn-rate checks that choreography.js
   carries are meaningless here — a shot list and a turn rate are both answers
   to a question this direction does not ask. They are not ported.

   WHAT THIS FILE OWNS: timing. Which flight is in the air at a given scroll
   position, and how many are allowed at once. What the car is MADE of lives in
   parts.js, because that is the part a person edits.

   AT MOST THREE FLIGHTS IN THE AIR. Above that the eye stops reading assembly
   and starts reading debris. The windows below are sized from that number, not
   chosen for looks: each flight owns a slice of its step, the slices overlap by
   a third, and a step with more flights than fit gets shorter windows rather
   than more simultaneous ones.
   ========================================================================== */

const MAX_IN_FLIGHT = 3;

export function createAssembly(resolved, THREE) {
  const steps = resolved.steps;
  if (!steps.length) {
    console.warn('[assembly] the manifest resolved to nothing — the page stays complete, but no car is built.');
    return { setProgress() {}, steps: [], stepCount: 0 };
  }

  /* Lay every flight on a single 0..1 line up front. Doing it here rather than
     per frame means setProgress allocates nothing and does no searching. */
  const line = [];
  const N = steps.length;

  steps.forEach((step, s) => {
    const start = s / N;
    const span = 1 / N;
    const F = step.flights.length || 1;

    /* window width: wide enough to overlap, narrow enough that no more than
       MAX_IN_FLIGHT are ever open together */
    const w = Math.min(0.62, MAX_IN_FLIGHT / Math.max(F, 1) * 0.34 + 0.28);
    const stride = F > 1 ? (1 - w) / (F - 1) : 0;

    step.flights.forEach((items, f) => {
      line.push({
        items,
        a: start + f * stride * span,
        b: start + (f * stride + w) * span,
        step: s,
      });
    });
  });

  const _v = new THREE.Vector3();

  /* Everything starts absent. A part that is present at progress 0 is a part
     the sequence never gets to fit. */
  for (const flight of line) {
    for (const item of flight.items) item.group.visible = false;
  }

  function setProgress(p) {
    const t = Math.max(0, Math.min(1, p));

    for (const flight of line) {
      const local = (t - flight.a) / (flight.b - flight.a);

      /* visible, not faded. A part at 40% opacity is a ghost of a part, and a
         ghost is not something being fitted. */
      const on = local > 0.001;

      for (const item of flight.items) {
        if (item.group.visible !== on) item.group.visible = on;
        if (!on) continue;
        const k = local >= 1 ? 1 : 1 - Math.pow(1 - local, 3);
        _v.copy(item.from).multiplyScalar(1 - k);
        item.group.position.copy(item.rest).add(_v);
      }
    }
  }

  /* Scrubbing backwards has to leave nothing floating. It does, because nothing
     here is stateful: every frame is computed from p alone, so p = 0 is an
     empty stage by construction rather than by a teardown that could be
     forgotten. */
  setProgress(0);

  /* Which step a given progress is inside — the captions read this rather than
     keeping their own schedule, so the two cannot drift apart. */
  function stepAt(p) {
    return Math.max(0, Math.min(N - 1, Math.floor(Math.max(0, Math.min(1, p)) * N)));
  }

  return { setProgress, stepAt, steps, stepCount: N };
}
