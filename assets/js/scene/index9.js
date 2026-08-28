/* ============================================================================
   scene/index9.js — direction J. One stage, four acts.
   ----------------------------------------------------------------------------
   ALEX, 2026-08-26: the whole scroll happens inside the hero scene. Every act,
   every annotation, every line of copy, and nothing below the fold. That is a
   change of page grammar — BRIEF.md declared a SPLIT STAGE and this is a single
   pinned stage — and it is written into BRIEF.md rather than absorbed quietly.

   WHAT AN ACT IS. A camera position, a word standing in the room, a copy mass
   and at most one annotation. Those four things are declared together in one
   object because they are one decision: a headline placed for a frame the
   camera no longer holds is a headline in the wrong place, and splitting them
   across two files is how that happens without anyone noticing.

   HOW THE FRAMES WERE CHOSEN. By measuring the projected silhouette in the
   browser, not by nudging until it looked right. Each act states the band of
   the frame the car is allowed to occupy, and the copy takes what is left.

   EVERY ACT NOW CARRIES ITS OWN LIGHT AND ITS OWN WORD, AND THE REVIEW IS WHY.
   The first build lit the room once, for act 01, and moved the camera around it.
   Measured, the floor directly beneath the car read 131 at act 01, 2–7 at act 02
   — the bright patch had swung round to the SIDE — and 59 against an open floor
   of 26 at act 03, which is no separation at all. The car sat over empty
   darkness in the two middle acts.

   So the ground block is a per-act state, interpolated during a cut and arriving at a
   stated value for each hold. The backing pool is placed from the camera azimuth
   in f9.js rather than parked in the world, the rim goes with it, and a second
   weak pool — the bed — stays under the body so the contact shadow has some
   value to bite into.

   The same applies to the word. At 7–10% opacity it was wall texture, not
   typography, which made the signature device invisible at exactly the moments
   it should carry the frame. Each act's opacity is now set against ITS OWN
   background rather than copied from the last one.

   THE CAMERA MAY MOVE NOW, AND EARLIER IT MAY NOT HAVE. When the page was one
   held frame, translating the camera was measured and rejected: a 1.6 m lateral
   move slid the car's nose 180 px right while its tail came 50 px left, which
   destroyed a composition placed against column edges. With four composed
   frames instead of one, that same translation is not damage — it is the cut
   between two shots, and it is what carries the reader from one act to the
   next.
   ========================================================================== */

const mount = document.querySelector('[data-scene-mount]');
const canvas = document.querySelector('[data-scene]');
const stage = document.querySelector('[data-stage]');

/* ── the four ────────────────────────────────────────────────────────────────
   `cam` and `target` are metres. The car is 3.95 m long, its nose at +Z, and it
   stands on y = 0. FOV is 30° in every act — inside the heroic band (DNA51) and
   never animated, so the rule against moving position and FOV together cannot
   be reached. */
export const ACTS = [
  /* 01 · ARRESTED — low front three-quarter.
     Camera at 0.50 m, bumper height, so the car is looked up at: the cheapest
     honest way to make a low car read as heavy. Target above it at 1.00 m
     pitches the frame so the vehicle sits in the lower two thirds and the
     statement gets a black field rather than a floor. */
  {
    pose: { cam: [3.55, 0.50, 5.35], target: [-1.25, 1.00, 0.30], fov: 30 },
    /* The reference state. Measured at the tyres: 94 against an open floor of 3. */
    ground: { push: 0.30, wide: 8.4, deep: 8.4, pool: 1.00, bed: 0.55, contact: 1.00,
              rimAngle: 2.15, rimY: 1.9, rim: 0.55 },
    ghost: { text: 'COBRA', opacity: 0.225, rise: 0.15, scale: 0.30 },
    callouts: [
      { t: 'Front end', d: 'Grille, overriders, lamps. Nothing added since 1965.',
        at: [0.02, 0.42, 1.93], side: 'right', x: 0.86, y: 0.30 },
    ],
    narrow: {
      pose: { cam: [2.80, 0.42, 4.90], target: [-0.55, 0.15, 0.95], fov: 32 },
      ghost: { text: 'COBRA', opacity: 0.215, rise: 0.20, scale: 0.17 },
    },
  },

  /* 02 · UNDERSTOOD — the flank, from in front of it.
     Not a square profile: ninety degrees reads as a side elevation, which is
     informative and never arresting. The camera swings round to the front
     quarter of the flank so the sill and the side pipe run away from the
     viewer, which is the line the copy is about. */
  {
    pose: { cam: [7.30, 0.58, 2.85], target: [-1.10, 0.94, -0.30], fov: 30 },
    /* From the flank the car is the frame's horizontal, so the pool is wider than
       it is deep — a strip of lit floor the length of the sill rather than a disc.
       Pool and bed both come up hard: a side pipe two hundred millimetres off the
       floor needs the ground under it to exist, and this was the act the review
       found sitting over nothing. Measured at the tyres: 48 before, 84 after,
       against an open floor of 4. */
    ground: { push: 0.30, wide: 9.6, deep: 8.0, pool: 1.32, bed: 1.00, contact: 1.05,
              rimAngle: 2.50, rimY: 1.6, rim: 0.62 },
    ghost: { text: '427', opacity: 0.245, rise: 0.13, scale: 0.40 },
    callouts: [
      { t: 'Side exit exhaust', d: 'Ceramic-coated. It colours where it gets hot.',
        at: [0.84, 0.27, -0.45], side: 'right', x: 0.90, y: 0.72 },
    ],
    /* The first portrait flank sat so close it showed a sill and a door and
       nothing a reader could name. Backed off until the FRONT WHEEL enters at
       the left edge (0.11 of the width, measured) — a wheel is the fastest scale
       reference a car has — with the side pipe running right out of frame and
       the windscreen above it. Nose and tail are both outside the crop on
       purpose. */
    narrow: {
      pose: { cam: [7.60, 0.70, 2.80], target: [-0.40, 0.10, 0.05], fov: 32 },
      ghost: { text: '427', opacity: 0.235, rise: 0.21, scale: 0.24 },
    },
  },

  /* 03 · IMPLICATED — round the back.
     The tail is the Cobra's other silhouette and almost nobody shows it. The
     car sits high and right, clear of the heading's column and clear of the
     spec plate riveted along the foot of the frame.

     NO ANNOTATION HERE, AND THAT IS THE POINT. The first attempt put one on a
     wheel: the label landed on the headline and the leader crossed the entire
     frame to the far side of the car, because from behind the vehicle the near
     wheel and the named wheel are not the same wheel. The plate is this act's
     annotation. Two leaders across four acts is the restraint the frame was
     asking for. */
  {
    /* target x = 1.45 measured, not chosen: it puts the car's leftmost point at
       0.426 of the frame width, and the heading's longest line ends at 0.366.
       The two masses clear each other by six per cent of the frame, which is a
       gap rather than a near miss. */
    pose: { cam: [-3.10, 1.05, -5.65], target: [1.45, 0.62, 0.15], fov: 30 },
    /* The camera is a metre up and looking down, so far more floor is in shot and
       the frame greys out first if the pool is allowed to spread. It stays tight
       and goes bright instead, and the contact map comes up with it so the extra
       light does not simply lift everything. The flattest act in the review:
       42 before, 75 after, against an open floor of 2. */
    ground: { push: 0.30, wide: 8.6, deep: 8.0, pool: 1.50, bed: 1.15, contact: 1.15,
              rimAngle: 1.95, rimY: 2.2, rim: 0.70 },
    ghost: { text: 'HANDCRAFTED', opacity: 0.205, rise: 0.095, scale: 0.19 },
    callouts: [],
    narrow: {
      /* Measured: the car's silhouette occupies 0.271–0.627 of the frame
         height here, which puts the whole vehicle above the copy and leaves the
         bottom 37% black for the statement and the plate. At the first attempt
         it sat at 0.44–0.80 and the headline printed across the tail. */
      pose: { cam: [-3.90, 1.45, -7.10], target: [0.30, 0.10, 0.10], fov: 32 },
      ghost: { text: 'HANDCRAFTED', opacity: 0.195, rise: 0.115, scale: 0.11 },
    },
  },

  /* ── ACT 04 WAS HERE, AND THE v4 MOCKUP TOOK IT ─────────────────────────────
     It was the release: camera standing back, MIDWEST behind the car, "Yours is
     not built yet." closing the page. The mockup gives that sentence to the
     commissioning desk below the fold, where it OPENS a section instead of
     closing a page — and one page cannot say the same sentence twice.

     So the stage hands over one beat earlier. The pose is kept here rather than
     deleted, because the frame itself was good and the only thing wrong with it
     is that its copy now lives somewhere else:

         pose:   cam [5.20, 1.20, 6.95], target [-0.85, 1.05, 0.20], fov 30
         ground: push 0.35, wide 8.8, deep 8.8, pool 1.02, bed 0.75,
                 contact 1.05, rimAngle 2.25, rimY 2.0, rim 0.58
         ghost:  MIDWEST, opacity 0.215, rise 0.058, scale 0.22
         narrow: cam [3.90, 0.90, 5.30], target [-0.30, 0.45, 0.30], fov 32
   ────────────────────────────────────────────────────────────────────────── */
];

function stayFlat(why) {
  document.documentElement.setAttribute('data-scene-state', 'static');
  console.info(`[scene J] flat path: ${why}`);
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

/* ── the annotations ─────────────────────────────────────────────────────────
   One elbow, one hairline, a ring at the point it names. The ring is the part
   that makes it read as a drawing rather than a pointer: a line that simply
   stops looks unfinished, and an arrowhead looks like an interface.

   Every act's annotations are built once and kept. They are shown by their own
   act's opacity, so an annotation can never outlive the frame that explains it
   — which is the failure mode of a stage where the copy changes and the
   pointers do not. */
function mountCallouts(scene, acts, root) {
  const svg = root.querySelector('[data-lines]');
  const layer = root.querySelector('[data-callouts]');
  svg.innerHTML = '';
  layer.innerHTML = '';

  const nodes = [];
  acts.forEach((act, i) => {
    (act.callouts || []).slice(0, 2).forEach((c) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      line.setAttribute('class', 'j-line');
      svg.appendChild(line);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('class', 'j-dot');
      dot.setAttribute('r', '3.5');
      svg.appendChild(dot);
      const el = document.createElement('div');
      el.className = 'j-callout';
      el.dataset.side = c.side;
      el.innerHTML = '<p class="j-micro j-callout__t"></p><p class="j-callout__d"></p>';
      el.querySelector('.j-callout__t').textContent = c.t;
      el.querySelector('.j-callout__d').textContent = c.d || '';
      layer.appendChild(el);
      nodes.push({ act: i, c, el, line, dot });
    });
  });

  /* `weights` is one opacity per act. Called every frame while the stage is
     scrubbing, so it does no allocation and no layout reads beyond the one
     rect it needs. */
  function place(weights) {
    const r = root.getBoundingClientRect();
    for (const n of nodes) {
      const w = weights ? (weights[n.act] || 0) : (n.act === 0 ? 1 : 0);
      if (w <= 0.001) {
        n.el.style.opacity = '0';
        n.line.style.opacity = '0';
        n.dot.style.opacity = '0';
        continue;
      }
      const p = scene.project(n.c.at);
      if (!p || !p.onPlate) {
        n.el.style.opacity = '0';
        n.line.style.opacity = '0';
        n.dot.style.opacity = '0';
        continue;
      }
      const lx = n.c.x * r.width;
      const ly = n.c.y * r.height;
      n.el.style.setProperty('--x', `${lx}px`);
      n.el.style.setProperty('--y', `${ly}px`);
      /* One elbow: horizontal out of the label, then a single run to the point.
         Two elbows is a diagram of a route; one is an annotation. */
      const right = n.c.side === 'right';
      const elbow = right ? lx - r.width * 0.055 : lx + r.width * 0.055;
      n.line.setAttribute('points', `${lx},${ly} ${elbow},${ly} ${p.x},${p.y}`);
      n.dot.setAttribute('cx', p.x);
      n.dot.setAttribute('cy', p.y);
      n.el.style.opacity = String(w);
      n.line.style.opacity = String(w);
      n.dot.style.opacity = String(w);
    }
  }
  return place;
}

async function boot() {
  if (!mount || !canvas || !stage) return stayFlat('no scene mount');
  if (!hasWebGL()) return stayFlat('no WebGL');
  const thin = tooLittleMachine();
  if (thin) return stayFlat(thin);

  const narrow = window.matchMedia('(max-width: 55.99rem)');
  /* One composition per orientation, resolved through the same media query the
     stylesheet uses, so the frame and the layout can never disagree. */
  const frame = (i) => (narrow.matches && ACTS[i].narrow)
    ? { ...ACTS[i], ...ACTS[i].narrow }
    : ACTS[i];

  try {
    const { createStudioScene } = await import('./f9.js');
    const scene = createStudioScene({
      canvas, modelUrl: mount.dataset.model, quality: narrow.matches ? 'lite' : 'full',
    });
    await scene.ready;

    const place = mountCallouts(scene, ACTS, document.querySelector('.j-hero'));

    /* Act 01 is the composed frame the page opens on, and it is what every
       reader sees whether the stage ever starts or not. */
    const rest = () => {
      const f = frame(0);
      scene.setGhost(f.ghost.text, f.ghost);
      if (f.ground) scene.setGround(f.ground);
      scene.setPose(f.pose);
    };
    rest();
    scene.start();

    narrow.addEventListener('change', () => { scene.resize(); });
    window.addEventListener('resize', () => { scene.resize(); }, { passive: true });

    document.documentElement.setAttribute('data-scene-state', 'live');
    window.__j = { scene, acts: ACTS, frame, place, rest };
    console.info('[scene J] scene live — 4 acts');

    /* The stage is what motion DOES to the document. Loaded last and separately,
       and its failure is not this page's failure: what it leaves behind is four
       complete compositions in document order with the car parked behind them. */
    let motion = 'not attempted';
    try {
      const { mountStage } = await import('./index9-motion.js');
      motion = await mountStage({ scene, frame, place, stage, acts: ACTS });
    } catch (e) {
      motion = `failed — flow kept (${e && e.message ? e.message : e})`;
    }
    window.__j.motion = motion;
    console.info(`[scene J] stage: ${motion}`);
  } catch (err) {
    stayFlat(`failed to initialise — ${err && err.message ? err.message : err}`);
  }
}

if (document.readyState === 'complete') boot();
else window.addEventListener('load', boot, { once: true });
