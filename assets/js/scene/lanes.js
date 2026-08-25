/* ============================================================================
   scene/lanes.js — one source of truth for where the text is and where the car is.
   ----------------------------------------------------------------------------
   THE DEFECT THIS EXISTS TO REMOVE.

   In direction C the caption is placed by CSS — `position: absolute`, pinned to
   a page edge, `max-width: min(30rem, 42vw)` — and the car is placed by a camera
   that has never heard of it. Two systems, no contract. On the rear shot the
   pose fills the plate and the two occupy the same pixels, and the vignette that
   was supposed to protect the text ends up darkening the car instead. A scrim
   cannot fix that, because the problem is not contrast. It is that nothing in
   the system was ever responsible for keeping them apart.

   So both sides are computed here, from one number.

   A note declares which lane its TEXT wants:

       data-lane="text-left"   or   data-lane="text-right"

   and this module returns, from that single declaration, both the CSS custom
   property that positions the caption and the camera target offset that pushes
   the car into the other lane. They cannot disagree, because there is nothing
   for them to disagree about — there is one input and two derived outputs.

   Below the two-lane breakpoint there are no lanes at all: the car takes the
   upper plate and the text sits under it in normal flow. Overlap is not
   prevented there, it is impossible.
   ========================================================================== */

/* The breakpoint is the one main.css already uses for the narrow build. A second
   number here would be a second truth. */
export const TWO_LANE_MIN = 56 * 16;   // 55.99rem, in px at the 16px root

/* Fractions of the plate. The gutter is not decoration: it is the margin of
   error for a camera whose framing is authored by eye, and it is why the
   assertion below can pass rather than merely usually pass. */
const LANE = {
  text: 0.40,
  gutter: 0.08,
  subject: 0.52,
};

/* How far, in metres of camera target offset, pushing the subject into a lane
   moves it. MEASURED, and then re-measured when the assertion disagreed: the
   first value here was 4.4 and the assertion caught it inside a minute — the car
   was still crossing into the text lane by about 170px at 2000 wide. One plate-
   width of lateral movement costs about 7 m of target offset at this framing:
   9.2 cleared the text but cropped the tail off the plate, 4.4 did not clear it.
   It is empirical and goes stale the moment the framing changes, which is
   precisely what the assertion is for. */
const METRES_PER_PLATE = 7.0;

/**
 * @param {Element} note      the element carrying data-lane
 * @param {number}  vw        viewport width in px
 * @returns {{ mode, side, textInset, textWidth, targetOffsetX }}
 */
export function laneFor(note, vw) {
  const wide = vw >= TWO_LANE_MIN;
  const want = (note && note.dataset && note.dataset.lane) || 'text-left';
  const side = want === 'text-right' ? 'right' : 'left';

  if (!wide) {
    return {
      mode: 'stacked',
      side,
      textInset: 0,
      textWidth: 1,
      targetOffsetX: 0,       // nothing to push it out of; the text is below
    };
  }

  /* The subject sits in the lane the text does not want. Its centre, measured
     from the plate centre, is what the camera has to be offset BY — with the
     sign inverted, because moving the aim left moves the subject right. */
  const subjectCentre = side === 'left'
    ? LANE.text + LANE.gutter + LANE.subject / 2
    : LANE.subject / 2;

  const fromCentre = subjectCentre - 0.5;

  return {
    mode: 'lanes',
    side,
    textInset: side === 'left' ? 0 : 1 - LANE.text,
    textWidth: LANE.text,
    targetOffsetX: -fromCentre * METRES_PER_PLATE,
  };
}

/** Write the lane onto the element as custom properties. CSS reads only these. */
export function applyLane(note, vw) {
  const l = laneFor(note, vw);
  note.style.setProperty('--lane-inset', (l.textInset * 100).toFixed(3) + '%');
  note.style.setProperty('--lane-width', (l.textWidth * 100).toFixed(3) + '%');
  note.dataset.laneMode = l.mode;
  return l;
}

/* ── THE ASSERTION ────────────────────────────────────────────────────────
   The contract above is only worth having if something checks it. A silent
   overlap is exactly what put the page here: it was visible in every recording
   for days and nothing in the code had an opinion about it.

   The car's screen box is built by projecting the eight corners of its bounding
   box, which is what scene.project() is already for. Corners behind the camera
   are dropped; if fewer than two survive the car is not really on the plate and
   there is nothing to test.                                                 */

export function makeOverlapAssert(scene, THREE) {
  const box = new THREE.Box3();
  const part = new THREE.Box3();
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  let warned = 0;

  return function assertNoOverlap(notes) {
    if (!scene.car || warned > 6) return;

    /* VISIBLE GEOMETRY ONLY. Box3.setFromObject traverses hidden children as
       well as shown ones, so on an assembly sequence it was measuring parts
       parked at their flight offsets — a box far larger than anything on the
       plate — and reporting an overlap against a car that was not there yet.
       An assertion that cries wolf is worse than none, because the first thing
       anyone does with it is stop reading it. */
    box.makeEmpty();
    scene.car.updateMatrixWorld(true);
    scene.car.traverse((o) => {
      if (!o.isMesh || !o.visible || !o.geometry) return;
      let p = o;
      while (p && p !== scene.car) { if (!p.visible) return; p = p.parent; }
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      part.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      box.union(part);
    });
    if (box.isEmpty()) return;

    let k = 0;
    for (const x of [box.min.x, box.max.x])
      for (const y of [box.min.y, box.max.y])
        for (const z of [box.min.z, box.max.z]) corners[k++].set(x, y, z);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, on = 0;
    for (const c of corners) {
      const p = scene.project([c.x, c.y, c.z]);
      if (!p || !p.onPlate) continue;
      on++;
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
    if (on < 2) return;

    for (const note of notes) {
      if (note.dataset.laneMode === 'stacked') continue;
      const body = note.querySelector('.stage-note__body');
      if (!body || getComputedStyle(note).visibility === 'hidden') continue;
      const r = body.getBoundingClientRect();
      if (r.width === 0) continue;
      const hit = r.right > minX && r.left < maxX && r.bottom > minY && r.top < maxY;
      if (hit) {
        warned++;
        console.warn(
          '[lanes] the caption and the car occupy the same pixels — lane "' +
          (note.dataset.lane || '?') + '" at ' + Math.round(innerWidth) + 'px. ' +
          'Text ' + [r.left, r.right].map(Math.round).join('..') +
          ', car ' + [minX, maxX].map(Math.round).join('..') + '. ' +
          'Either METRES_PER_PLATE is stale for this shot, or the shot is framed ' +
          'wider than the lane system assumes.'
        );
      }
    }
  };
}
