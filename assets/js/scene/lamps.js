/* ============================================================================
   scene/lamps.js — every lamp on the car as FOUR independent sources.
   ----------------------------------------------------------------------------
   WHY THIS FILE EXISTS.

   In ac-cobra-427.glb the whole of the car's lighting is one mesh with the
   material `ac_cobra427_lights`, and its bounding box runs the full length of
   the car. Headlamps and tail lamps are the same surface. One surface means one
   material, and one material means one brightness and one colour for all four
   corners at once — so the old single-scalar setLights() could not turn the
   tail lights red even in principle. That was never a weak effect; it was the
   wrong colour in the wrong place.

   So the geometry is divided at load. Not by cloning it four times — that would
   quadruple the vertex data — but by reordering the index buffer into four
   contiguous runs and giving the mesh a material ARRAY, one entry per run.
   Three.js draws each group with its own material, which is exactly what is
   wanted and costs one extra draw call per lamp mesh.

   Divided twice:
     along Z  — front lamps from rear lamps, so red is only ever at the back
     along X  — left from right, so one can strike before the other

   The halo sprites are placed at the measured centroid of each cluster rather
   than at typed coordinates, so they stay on the lens if the model is ever
   swapped. They exist because emissiveIntensity on its own makes a lamp look
   like paler plastic, not like a lamp: without a bloom pass there is nothing to
   spill light into the pixels around the lens, and a bloom pass costs a second
   full-screen draw every frame for the sake of two lamps.

   Original two-bucket implementation by Alex; extended here to four so the
   left headlamp can strike before the right one.
   ========================================================================== */

function haloTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0.00, 'rgba(255,255,255,1)');
  g.addColorStop(0.28, 'rgba(255,255,255,0.55)');
  g.addColorStop(1.00, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const HEAD_COLOUR = 0xfff2d6;
const TAIL_COLOUR = 0xff2410;

/* Red reads darker than warm white at the same emissive value, so it is given
   more gain. This is a perceptual correction, not a preference. */
const HEAD_GAIN = 2.4;
const TAIL_GAIN = 3.2;

const CORNERS = ['headL', 'headR', 'tailL', 'tailR'];

/**
 * @param root  the normalised model (after normalise())
 * @param THREE the three namespace
 */
export function createLamps(root, THREE) {
  /* THE SPRITES INHERIT THE MODEL'S SCALE, AND THE MODEL IS NOT AT SCALE 1.

     normalise() sizes the car by whatever its native units happen to be — for
     this asset that is a factor of about 98. A sprite parented to the car and
     given scale 0.85 therefore ends up 83 metres across, which fills the whole
     frame with white the moment the lamps come up and the camera is far enough
     back to see it. It looks like the renderer has broken; it is a unit error.

     So the size is divided by the root's world scale, and the sprites stay the
     size they are written as, in metres, wherever the model came from. */
  const worldScale = new THREE.Vector3();
  root.updateMatrixWorld(true);
  root.getWorldScale(worldScale);
  const unit = 1 / (worldScale.x || 1);

  const bucket = {};
  for (const k of CORNERS) bucket[k] = { mats: [], halos: [] };
  const halo = haloTexture(THREE);

  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const src = mats[0];
    if (!src || !/lights/i.test(src.name || '')) return;

    const geo = o.geometry;
    geo.computeBoundingBox();
    const mid = geo.boundingBox.getCenter(new THREE.Vector3());

    let index = geo.index;
    if (!index) {
      const n = geo.attributes.position.count;
      index = new THREE.BufferAttribute(
        n > 65535 ? new Uint32Array(n) : new Uint16Array(n), 1
      );
      for (let i = 0; i < n; i++) index.setX(i, i);
      geo.setIndex(index);
    }

    const pos = geo.attributes.position;
    const arr = index.array;
    const runs = { headL: [], headR: [], tailL: [], tailR: [] };

    /* `lightsglass` is the front optic only — there is no rear half to find,
       so every triangle goes to a head bucket and only the sides are split. */
    const glassOnly = /lightsglass/i.test(src.name);

    for (let i = 0; i < arr.length; i += 3) {
      const a = arr[i], b = arr[i + 1], c = arr[i + 2];
      const z = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3;
      const x = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3;
      const end = glassOnly || z > mid.z ? 'head' : 'tail';
      const side = x < mid.x ? 'L' : 'R';
      runs[end + side].push(a, b, c);
    }

    /* One contiguous run per corner, in a fixed order, then a group per run. */
    let cursor = 0;
    const groups = [];
    const materials = [];
    for (const corner of CORNERS) {
      const run = runs[corner];
      if (!run.length) continue;
      for (let i = 0; i < run.length; i++) index.setX(cursor + i, run[i]);
      const m = src.clone();
      m.name = src.name + '__' + corner;
      m.emissive = new THREE.Color(corner.startsWith('head') ? HEAD_COLOUR : TAIL_COLOUR);
      m.emissiveIntensity = 0;
      m.toneMapped = true;
      groups.push({ start: cursor, count: run.length, mat: materials.length, corner, run });
      materials.push(m);
      bucket[corner].mats.push(m);
      cursor += run.length;
    }
    index.needsUpdate = true;

    geo.clearGroups();
    for (const g of groups) geo.addGroup(g.start, g.count, g.mat);
    o.material = materials.length === 1 ? materials[0] : materials;

    /* Halo per corner, at the measured centre of that corner's own vertices. */
    const centre = (run) => {
      const v = new THREE.Vector3();
      const seen = new Set();
      for (const k of run) {
        if (seen.has(k)) continue;
        seen.add(k);
        v.x += pos.getX(k); v.y += pos.getY(k); v.z += pos.getZ(k);
      }
      return seen.size ? v.divideScalar(seen.size) : null;
    };

    for (const g of groups) {
      const p = centre(g.run);
      if (!p) continue;
      const front = g.corner.startsWith('head');
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: halo,
        color: front ? HEAD_COLOUR : TAIL_COLOUR,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }));
      s.scale.setScalar((front ? 0.85 : 0.55) * unit);
      o.localToWorld(p);
      root.worldToLocal(p);
      s.position.copy(p);
      s.visible = false;
      root.add(s);
      bucket[g.corner].halos.push(s);
    }
  });

  if (!bucket.headL.mats.length && !bucket.headR.mats.length) {
    console.warn('[lamps] no /lights/ material in this model — the lamps are not split, and nothing will switch on.');
  }

  const clamp = (v) => Math.max(0, Math.min(1, v || 0));
  const level = { headL: 0, headR: 0, tailL: 0, tailR: 0 };

  function apply(corner) {
    const k = level[corner];
    const b = bucket[corner];
    const gain = corner.startsWith('head') ? HEAD_GAIN : TAIL_GAIN;
    for (const m of b.mats) m.emissiveIntensity = k * gain;
    /* The halo opens as the lamp comes up rather than tracking it linearly: a
       faint filament does not throw a halo, a lit one does. Below the threshold
       there is emissive and no spill, which is what a dim lamp looks like. */
    const o = Math.max(0, (k - 0.35) / 0.65) * 0.9;
    for (const s of b.halos) { s.material.opacity = o; s.visible = o > 0.004; }
  }

  const found = CORNERS.reduce((n, c) => n + bucket[c].mats.length, 0) > 0;

  return {
    /* The caller needs to know, because a model whose lamps are named
       something else entirely — LUZES, in the client's own export — finds
       nothing here and has to fall back to a single shared material. */
    found,
    /** Accepts a scalar, or {head,tail}, or any of the four corners by name. */
    setLights(v) {
      if (typeof v === 'number' || v == null) {
        const k = clamp(v);
        for (const c of CORNERS) level[c] = k;
      } else {
        if (v.head !== undefined) { level.headL = level.headR = clamp(v.head); }
        if (v.tail !== undefined) { level.tailL = level.tailR = clamp(v.tail); }
        for (const c of CORNERS) if (v[c] !== undefined) level[c] = clamp(v[c]);
      }
      for (const c of CORNERS) apply(c);
    },
    get level() { return { ...level }; },
  };
}
