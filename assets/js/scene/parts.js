/* ============================================================================
   scene/parts.js — the manifest. What the car is made of, and in what order.
   ----------------------------------------------------------------------------
   Separated from the motion that plays it for one reason: this is the part a
   person edits. Re-ordering the build, changing which axis something arrives
   along, adding a step when the model gains a node — all of that happens here,
   in a table, without touching a timeline.

   WHAT THE MODEL ACTUALLY ALLOWS — measured, not assumed.

   The GLB has 89 nodes and 50 meshes, and THE TRANSFORMS ARE NOT ON THE MESHES.
   Every mesh node sits at the origin carrying the material name as a suffix
   (`ac_cobra_wheel_lf_loda_ac_cobra427_rim_0`); the real translation lives on
   its parent group (`ac_cobra_wheel_lf_loda`, at [0.715, 0.330, 1.143]). So a
   part is a GROUP found by prefix, and what gets animated is an OFFSET from the
   rest position that group already holds. Writing an absolute position instead
   collapses all four wheels onto the origin, which is the failure this comment
   exists to stop someone rediscovering.

   Suffixes are inconsistent — `_loda` on body, chassis and wheels, `_cpit` on
   everything in the cabin — so matching is by prefix and a miss is reported
   rather than silently skipped.

   THERE IS NO FLOOR. hero-scene.js grounds the car with a shadow catcher, a
   light pool and a reflector, so a part rising from below passes through the
   plane a floor would occupy and reads as emerging from a hole. Everything
   arrives from above or from the side.
   ========================================================================== */

/* Ten steps. The axis is the one the part would actually be fitted along in a
   shop — brakes and wheels outboard, body and panels lowered on, controls in
   from the front, boot in from behind. That is the whole point of the column,
   not decoration: a bonnet sliding in sideways is not a bonnet being fitted.

   Travel stays between 0.45 and 1.1 m. A part entering from off-plate reads as
   a rendering fault; a short travel reads as a part being placed. */
export const MANIFEST = [
  {
    id: 'chassis',
    label: 'Chassis',
    detail: 'Present already. Everything else happens to it.',
    nodes: ['ac_cobra_kit00_chassis'],
    from: [0, 0, 0],          // no flight — it is what the rest arrives onto
  },
  {
    id: 'brakes',
    label: 'Discs and calipers',
    detail: 'Four corners, outboard.',
    pairs: [
      { nodes: ['ac_cobra_disc_lf', 'ac_cobra_caliper_lf'], from: [0.45, 0, 0] },
      { nodes: ['ac_cobra_disc_rf', 'ac_cobra_caliper_rf'], from: [-0.45, 0, 0] },
      { nodes: ['ac_cobra_disc_lr', 'ac_cobra_caliper_lr'], from: [0.45, 0, 0] },
      { nodes: ['ac_cobra_disc_rr', 'ac_cobra_caliper_rr'], from: [-0.45, 0, 0] },
    ],
  },
  {
    id: 'wheels',
    label: 'Wheels and tyres',
    detail: 'Eighteen inch.',
    pairs: [
      { nodes: ['ac_cobra_wheel_lf', 'ac_cobra_tire_lf'], from: [0.9, 0, 0] },
      { nodes: ['ac_cobra_wheel_rf', 'ac_cobra_tire_rf'], from: [-0.9, 0, 0] },
      { nodes: ['ac_cobra_wheel_lr', 'ac_cobra_tire_lr'], from: [0.9, 0, 0] },
      { nodes: ['ac_cobra_wheel_rr', 'ac_cobra_tire_rr'], from: [-0.9, 0, 0] },
    ],
  },
  {
    id: 'body',
    label: 'Body',
    detail: 'Lowered on in one piece.',
    nodes: ['ac_cobra_kit00_body'],
    from: [0, 1.1, 0],
  },
  {
    id: 'interior',
    label: 'Interior',
    detail: 'Upholstery, carpet, shifter.',
    nodes: ['ac_cobra_kit00_interior', 'ac_cobra_kit00_intanim', 'ac_cobra_kit00_gearshift', 'ac_cobra_kit00_shift'],
    from: [0, 0.7, 0],
  },
  {
    id: 'controls',
    label: 'Controls',
    detail: 'Wheel, gauges, needles.',
    nodes: ['ac_cobra_kit00_steeringwheel', 'ac_cobra_kit00_gauges', 'ac_cobra_kit00_needle', 'ac_cobra_gauge_glass'],
    from: [0, 0, 0.5],
  },
  {
    id: 'bonnet',
    label: 'Bonnet',
    detail: 'Over the engine bay, last of the front.',
    nodes: ['ac_cobra_kit00_bonnet'],
    from: [0, 0.8, 0],
  },
  {
    id: 'boot',
    label: 'Boot',
    detail: 'In from behind.',
    nodes: ['ac_cobra_kit00_boot'],
    from: [0, 0, -0.9],
  },
  {
    id: 'glass',
    label: 'Glass and mirror',
    detail: 'A screen and the single mirror — there is only one node for it.',
    nodes: ['ac_cobra_kit00_windows', 'ac_cobra_kit00_mirror'],
    from: [0, 0.6, 0],
  },
  {
    id: 'lights',
    label: 'Lamps',
    detail: 'The last part fitted.',
    nodes: ['ac_cobra_kit00_lights'],
    from: [0, 0, 0.4],
  },
];

/* Groups only. A mesh node here would be the wrong object: it sits at the
   origin under a parent that holds the real position. */
function groupsFor(car, prefix) {
  const out = [];
  car.traverse((o) => {
    if (o.isMesh) return;
    if (o.name && o.name.startsWith(prefix)) out.push(o);
  });
  return out;
}

/**
 * Resolve the manifest against a loaded model.
 * Returns flights: the unit that moves together. A symmetric pair is one flight,
 * because a left wheel arriving before its right twin does not read as
 * sequencing — it reads as broken.
 */
export function resolveParts(car, THREE) {
  const steps = [];
  let missing = 0;
  let resolved = 0;

  for (const entry of MANIFEST) {
    const flights = [];

    const collect = (nodes, from) => {
      const items = [];
      for (const prefix of nodes) {
        const gs = groupsFor(car, prefix);
        if (!gs.length) {
          missing++;
          console.warn('[parts] nothing named "' + prefix + '*" in this model — that part will never arrive. Suffixes here are inconsistent (_loda on the body and chassis, _cpit in the cabin); match by prefix.');
          continue;
        }
        for (const g of gs) {
          items.push({
            group: g,
            rest: g.position.clone(),
            from: new THREE.Vector3(from[0], from[1], from[2]),
          });
          resolved++;
        }
      }
      if (items.length) flights.push(items);
    };

    if (entry.pairs) {
      for (const p of entry.pairs) collect(p.nodes, p.from);
    } else {
      collect(entry.nodes, entry.from);
    }

    steps.push({ id: entry.id, label: entry.label, detail: entry.detail, flights });
  }

  console.info('[parts] ' + resolved + ' groups across ' + steps.length + ' steps' + (missing ? ', ' + missing + ' prefixes unresolved' : ''));
  return { steps, resolved, missing };
}
