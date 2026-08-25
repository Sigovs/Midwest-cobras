/* ============================================================================
   scene/assembly.js — direction D.
   ----------------------------------------------------------------------------
   THE CAR DOES NOT EXIST YET. SCROLLING BUILDS IT.

   The camera holds one frame. Nothing orbits, nothing drifts, no shot cuts to
   another shot. The only thing that changes down the page is how much car is
   there.

   This replaces the rule the other directions run on. A turns the car to face
   whatever is being said about it; C travels a camera around it. Both present a
   finished object, and a finished object rotating is what a lot shows. The
   page's own headline says nobody buys one of these off a lot, and a page that
   says that while spinning a completed car is arguing with itself.

   WHAT THE MODEL ACTUALLY ALLOWS — measured, not assumed.

   The GLB has 89 nodes and 50 meshes, and the transforms are NOT on the meshes.
   Every mesh node sits at the origin and carries the material name as a suffix
   (`ac_cobra_wheel_lf_loda_ac_cobra427_rim_0`); the real translation lives on
   its parent group (`ac_cobra_wheel_lf_loda`, at [0.715, 0.330, 1.143]). So a
   part is a GROUP found by prefix, and the thing to animate is an offset from
   the rest position that group already has. Writing an absolute position instead
   collapses all four wheels onto the origin, which is the failure this comment
   exists to stop someone rediscovering.

   THERE IS NO EXHAUST NODE. The side pipes live inside the chassis mesh, on the
   `ac_cobra427_misc` material, and cannot be lifted out by name. The beat that
   the configurator calls "Pipes and roll bars" therefore fits the panels. It
   could be split the way scene/lamps.js splits the lamps — by partitioning the
   index buffer — but that is a separate job and inventing a node here would be
   worse than saying so.

   THERE IS ALSO NO FLOOR. hero-scene.js grounds the car with a shadow catcher,
   a light pool and a reflector, so a part rising from below passes through the
   plane a floor would occupy and looks like it is emerging from a hole.
   Everything therefore arrives from above or from the side.
   ========================================================================== */

/* The six beats, in the order the configurator lists them, so the film and the
   list further down the page are the same statement told twice rather than two
   unrelated documents.

   `from` is the offset in metres the part travels from. Short on purpose:
   0.6–1.2 m reads as a part being FITTED. A part flying in from off-plate reads
   as a rendering fault, and the eye is very sure about the difference. */
export const BEATS = [
  {
    id: 'model',
    index: '01',
    title: 'Model',
    note: 'RT4 Classic Edition. The car the rest of the decisions happen to.',
    lane: 'text-left',
    parts: [{ prefix: 'ac_cobra_kit00_chassis', from: [0, 0.9, 0] }],
  },
  {
    id: 'body',
    index: '02',
    title: 'Body and colour',
    note: 'Lowered onto the chassis in one piece, the way it is at the factory.',
    lane: 'text-right',
    parts: [{ prefix: 'ac_cobra_kit00_body', from: [0, 1.2, 0] }],
  },
  {
    id: 'wheels',
    index: '03',
    title: 'Wheels and stance',
    note: 'Eighteen inch. The last thing chosen and the first thing seen.',
    lane: 'text-left',
    /* Symmetric pairs share a frame. A left wheel arriving before its right
       twin does not read as sequencing, it reads as broken. */
    parts: [
      { prefix: 'ac_cobra_wheel_lf', from: [0.85, 0, 0], pair: 'front' },
      { prefix: 'ac_cobra_tire_lf', from: [0.85, 0, 0], pair: 'front' },
      { prefix: 'ac_cobra_disc_lf', from: [0.85, 0, 0], pair: 'front' },
      { prefix: 'ac_cobra_caliper_lf', from: [0.85, 0, 0], pair: 'front' },
      { prefix: 'ac_cobra_wheel_rf', from: [-0.85, 0, 0], pair: 'front' },
      { prefix: 'ac_cobra_tire_rf', from: [-0.85, 0, 0], pair: 'front' },
      { prefix: 'ac_cobra_disc_rf', from: [-0.85, 0, 0], pair: 'front' },
      { prefix: 'ac_cobra_caliper_rf', from: [-0.85, 0, 0], pair: 'front' },
      { prefix: 'ac_cobra_wheel_lr', from: [0.85, 0, 0], pair: 'rear' },
      { prefix: 'ac_cobra_tire_lr', from: [0.85, 0, 0], pair: 'rear' },
      { prefix: 'ac_cobra_disc_lr', from: [0.85, 0, 0], pair: 'rear' },
      { prefix: 'ac_cobra_caliper_lr', from: [0.85, 0, 0], pair: 'rear' },
      { prefix: 'ac_cobra_wheel_rr', from: [-0.85, 0, 0], pair: 'rear' },
      { prefix: 'ac_cobra_tire_rr', from: [-0.85, 0, 0], pair: 'rear' },
      { prefix: 'ac_cobra_disc_rr', from: [-0.85, 0, 0], pair: 'rear' },
      { prefix: 'ac_cobra_caliper_rr', from: [-0.85, 0, 0], pair: 'rear' },
    ],
  },
  {
    id: 'pipes',
    index: '04',
    title: 'Pipes and roll bars',
    note: 'Ceramic-coated. The two parts you hear and the two you grab getting in.',
    lane: 'text-right',
    /* See the note at the top: the pipes are welded into the chassis mesh, so
       this beat fits the panels. The label is the configurator's. */
    parts: [
      { prefix: 'ac_cobra_kit00_bonnet', from: [0, 0.75, 0.35] },
      { prefix: 'ac_cobra_kit00_boot', from: [0, 0.35, -0.9] },
    ],
  },
  {
    id: 'interior',
    index: '05',
    title: 'Interior',
    note: 'Upholstery, stitching, gauges, wheel. The part you actually sit in.',
    lane: 'text-left',
    parts: [
      { prefix: 'ac_cobra_kit00_interior', from: [0, 0.7, 0] },
      { prefix: 'ac_cobra_kit00_intanim', from: [0, 0.7, 0] },
      { prefix: 'ac_cobra_kit00_steeringwheel', from: [0, 0.6, -0.35] },
      { prefix: 'ac_cobra_kit00_gearshift', from: [0, 0.6, 0] },
      { prefix: 'ac_cobra_kit00_gauges', from: [0, 0.5, 0] },
      { prefix: 'ac_cobra_gauge_glass', from: [0, 0.5, 0] },
      { prefix: 'ac_cobra_kit00_needle', from: [0, 0.5, 0] },
      { prefix: 'ac_cobra_kit00_shift', from: [0, 0.6, 0] },
    ],
  },
  {
    id: 'trim',
    index: '06',
    title: 'Trim and details',
    note: 'Badging, glass, lamps. Everything that was decided last.',
    lane: 'text-right',
    parts: [
      { prefix: 'ac_cobra_kit00_windows', from: [0, 0.55, 0] },
      { prefix: 'ac_cobra_kit00_mirror', from: [0.5, 0.3, 0] },
      { prefix: 'ac_cobra_kit00_lights', from: [0, 0, 0.7] },
    ],
  },
];

/* Groups only. A mesh node here would be the wrong object: it sits at the
   origin under a parent that holds the real position. */
function findGroups(car, prefix) {
  const out = [];
  car.traverse((o) => {
    if (!o.name || !o.name.startsWith(prefix)) return;
    if (o.isMesh) return;
    out.push(o);
  });
  return out;
}

export function createAssembly(car, THREE) {
  if (!car) {
    console.warn('[assembly] no model — the page stays complete, but nothing is built.');
    return { setProgress() {}, beats: BEATS, found: 0 };
  }

  const tracked = [];
  let missing = 0;

  for (const beat of BEATS) {
    beat._parts = [];
    for (const spec of beat.parts) {
      const groups = findGroups(car, spec.prefix);
      if (!groups.length) {
        missing++;
        console.warn('[assembly] no group named "' + spec.prefix + '*" in this model — that part will never arrive. Suffixes in this GLB are inconsistent (_loda on body and chassis, _cpit on interior); match by prefix.');
        continue;
      }
      for (const g of groups) {
        const rest = g.position.clone();
        const item = { group: g, rest, from: new THREE.Vector3(spec.from[0], spec.from[1], spec.from[2]), pair: spec.pair || null };
        g.visible = false;
        tracked.push(item);
        beat._parts.push(item);
      }
    }
  }

  console.info('[assembly] ' + tracked.length + ' groups tracked across ' + BEATS.length + ' beats' + (missing ? ', ' + missing + ' prefixes missing' : ''));

  /* Each beat owns an equal slice, and inside its slice the parts are dealt out
     in at most three overlapping flights. Any more than three in the air at
     once and the eye stops reading it as assembly and starts reading it as
     debris. Pairs share a flight, so a wheel and its twin land together. */
  const N = BEATS.length;
  const _v = new THREE.Vector3();

  function setProgress(p) {
    const clamped = Math.max(0, Math.min(1, p));
    for (let b = 0; b < N; b++) {
      const beat = BEATS[b];
      const start = b / N;
      const span = 1 / N;
      const local = (clamped - start) / span;

      /* group the beat's parts into flights, pairs kept together */
      const flights = [];
      const byPair = new Map();
      for (const item of beat._parts) {
        if (item.pair) {
          if (!byPair.has(item.pair)) { byPair.set(item.pair, []); flights.push(byPair.get(item.pair)); }
          byPair.get(item.pair).push(item);
        } else {
          flights.push([item]);
        }
      }

      const F = flights.length || 1;
      for (let f = 0; f < F; f++) {
        /* overlapping windows: each flight occupies 45% of the beat, offset so
           no more than about three are ever moving */
        const w = 0.45;
        const step = F > 1 ? (1 - w) / (F - 1) : 0;
        const a = f * step;
        const t = Math.max(0, Math.min(1, (local - a) / w));
        const eased = t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);

        for (const item of flights[f]) {
          /* visible rather than faded. A part at 40% opacity is a ghost of a
             part, and a ghost is not a thing being fitted. */
          const on = t > 0.001;
          if (item.group.visible !== on) item.group.visible = on;
          if (!on) continue;
          _v.copy(item.from).multiplyScalar(1 - eased);
          item.group.position.copy(item.rest).add(_v);
        }
      }
    }
  }

  setProgress(0);

  return { setProgress, beats: BEATS, found: tracked.length };
}
