/* ============================================================================
   f9.js — direction J. The car photographed, not previewed.
   ----------------------------------------------------------------------------
   This file exists because the previous scene looked like a Three.js test page,
   and the three things that made it look like one were all environmental:

     · a visible horizon where a grey floor met a grey sky
     · a floor that read as a slab rather than as a surface
     · light arriving from everywhere, so nothing described the body

   None of those is fixed by adding more lights. They are fixed by building a
   room, and this file builds one.

   ── THE ENVIRONMENT IS PROCEDURAL, AND THAT IS THE CENTRAL DECISION ─────────
   A captured HDR of a real garage gives a real room, which is the right answer
   when the room is the subject. Here the CAR is the subject, and what a car
   needs is not a room — it is a rig. Long, straight, controlled bands of light
   that travel the length of a wing and break where the surface breaks: that is
   what makes a panel read as sheet metal instead of as a coloured shape, and it
   is the whole of automotive studio photography.

   So the environment is painted here, as an equirectangular canvas: an overhead
   strip, a soft front card, a narrow side rim, a weak opposite rim, and a rear
   separation glow. Every one of them is a number in this file, which means the
   highlight on the shoulder is a decision rather than an accident of what
   somebody photographed in a car park.

   It also costs nothing to download, which retires 1.47 MB of HDR.

   ── NO HORIZON, ANYWHERE ────────────────────────────────────────────────────
   The void is a sphere, not a backdrop plane, and the floor dissolves into it
   through an alpha ramp rather than ending. There is no line where one surface
   becomes another because there is no edge to make one.
   ========================================================================== */

import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../vendor/jsm/loaders/DRACOLoader.js';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;

/* Panels: what is painted. Everything else keeps its own atlas. */
const PANEL = /^(body|doar|trunk)/i;

/* ── the rig, as numbers ─────────────────────────────────────────────────────
   u is longitude across the equirect (0 = behind the car, 0.25 = its right,
   0.5 = in front, 0.75 = its left). v is latitude (0 = below, 1 = above).
   Every light is a soft-edged rectangle painted into that map.

   The overhead strip is the one that matters. It is long in u and narrow in v,
   which is exactly a ceiling softbox, and it is what draws the band down the
   length of the wing. Everything else is there to keep the car from going
   black where the strip cannot reach. */
const RIG = [
  // key: the long overhead strip, slightly to the car's right
  { u: 0.32, v: 0.86, w: 0.44, h: 0.13, i: 3.4, soft: 0.55 },
  // front card: fills the grille and the front of the bonnet without flattening
  { u: 0.52, v: 0.58, w: 0.20, h: 0.26, i: 0.55, soft: 0.9 },
  // side rim, narrow and hot: this is the line down the shoulder
  { u: 0.13, v: 0.62, w: 0.045, h: 0.42, i: 2.6, soft: 0.35 },
  // opposite rim, deliberately weak — it separates, it does not light
  { u: 0.78, v: 0.60, w: 0.05, h: 0.34, i: 0.85, soft: 0.5 },
  // rear separation, low and behind, so the tail edge leaves the void
  { u: 0.95, v: 0.44, w: 0.16, h: 0.16, i: 0.7, soft: 0.8 },
];

/* The void's three stops, from the brief: behind the car, the middle distance,
   and the corners. They are read as canvas colours rather than tokens because
   this is a texture, not a surface, and tokens.css has no channel for "the
   colour of nothing". */
const VOID_CORE = [0x30, 0x34, 0x3a];
const VOID_MID  = [0x18, 0x1b, 0x1f];
const VOID_EDGE = [0x08, 0x0a, 0x0c];

const rgb = (c, k = 1) =>
  `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;

export function createStudioScene({ canvas, modelUrl, quality = 'full' }) {
  const full = quality === 'full';

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: full, alpha: false, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, full ? 2 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = full;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(new THREE.Color(rgb(VOID_EDGE)), 1);

  const scene = new THREE.Scene();

  /* ── the light map ────────────────────────────────────────────────────────
     Painted at 2048 × 1024 and run through PMREM. The softness of each source
     is done with a radial gradient rather than a blur pass: a blur costs a
     framebuffer and a gradient costs nothing, and at this size the difference
     is invisible once PMREM has convolved it anyway. */
  function studioEnvTexture() {
    const W = 2048, H = 1024;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    // the room itself: dark, with the floor half darker than the sky half
    const base = g.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0.00, rgb(VOID_MID, 0.75));
    base.addColorStop(0.48, rgb(VOID_MID, 1.05));
    base.addColorStop(0.52, rgb(VOID_EDGE, 1.6));
    base.addColorStop(1.00, rgb(VOID_EDGE, 0.7));
    g.fillStyle = base;
    g.fillRect(0, 0, W, H);

    for (const L of RIG) {
      const x = L.u * W, y = (1 - L.v) * H;
      const rw = L.w * W, rh = L.h * H;
      /* An ellipse, drawn as a scaled radial gradient. Painting the source as a
         hard rectangle and blurring it is the same picture at four times the
         cost, and a hard-edged source in an env map produces a hard-edged
         highlight, which is the single clearest tell of a fake studio. */
      g.save();
      g.translate(x, y);
      g.scale(rw, rh);
      const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      const k = L.i;
      grad.addColorStop(0, `rgba(255,252,246,${clamp01(k)})`);
      grad.addColorStop(L.soft * 0.55, `rgba(255,250,242,${clamp01(k) * 0.45})`);
      grad.addColorStop(1, 'rgba(255,250,242,0)');
      g.fillStyle = grad;
      g.beginPath();
      g.arc(0, 0, 1, 0, Math.PI * 2);
      g.fill();
      g.restore();

      // sources brighter than white have to be painted twice: canvas clamps at
      // 1.0 and a studio strip is several stops above its room
      if (k > 1) {
        g.globalCompositeOperation = 'lighter';
        for (let n = 1; n < Math.min(4, Math.ceil(k)); n++) {
          g.save();
          g.translate(x, y);
          g.scale(rw * 0.8, rh * 0.8);
          const gg = g.createRadialGradient(0, 0, 0, 0, 0, 1);
          gg.addColorStop(0, 'rgba(255,253,250,0.5)');
          gg.addColorStop(1, 'rgba(255,253,250,0)');
          g.fillStyle = gg;
          g.beginPath(); g.arc(0, 0, 1, 0, Math.PI * 2); g.fill();
          g.restore();
        }
        g.globalCompositeOperation = 'source-over';
      }
    }

    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = studioEnvTexture();
  const envRT = pmrem.fromEquirectangular(envTex);
  scene.environment = envRT.texture;
  envTex.dispose();

  /* ── the void ─────────────────────────────────────────────────────────────
     A sphere, seen from inside. It is not the same image as the light map: the
     light map is what the paint reflects, this is what the reader sees, and
     conflating the two is why a scene lit by a photograph of a car park looks
     like a photograph of a car park.

     Brighter behind the car and falling to almost nothing at the corners, with
     the vertical falling faster than the horizontal so the frame has a top. */
  function voidTexture() {
    const W = 1024, H = 512;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    g.fillStyle = rgb(VOID_EDGE);
    g.fillRect(0, 0, W, H);

    // the pool of light the car stands in front of, centred behind it
    const cx = W * 0.5, cy = H * 0.60;
    const glow = g.createRadialGradient(cx, cy, 0, cx, cy, W * 0.42);
    glow.addColorStop(0.00, rgb(VOID_CORE));
    glow.addColorStop(0.42, rgb(VOID_MID));
    glow.addColorStop(1.00, 'rgba(8,10,12,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);

    // vertical: the ceiling goes to black faster than the walls
    const vert = g.createLinearGradient(0, 0, 0, H);
    vert.addColorStop(0.00, 'rgba(4,5,6,0.92)');
    vert.addColorStop(0.30, 'rgba(4,5,6,0.30)');
    vert.addColorStop(0.62, 'rgba(4,5,6,0.00)');
    vert.addColorStop(1.00, 'rgba(4,5,6,0.55)');
    g.fillStyle = vert;
    g.fillRect(0, 0, W, H);

    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  scene.background = voidTexture();

  /* ── the floor ────────────────────────────────────────────────────────────
     Polished dark concrete, and the reason it does not produce a horizon is the
     alpha ramp: it is fully present under the car and gone before it reaches
     anywhere the eye could call an edge. A plane that ends draws a line. A
     plane that dissolves does not.

     MEASURED, NOT JUDGED BY EYE. Pass 1 read #4a4c51 to #5a5c61 off this
     floor with a colour picker — a mid grey, two stops above the darkest wall,
     and the exact thing the brief names as making a page look like a dev
     preview. Roughness came down to 0.26 and envMapIntensity to 0.62 so the
     overhead strip lands as a narrow streak rather than a wash: on a real
     polished floor THE BRIGHTNESS IS THE REFLECTION and the surface itself is
     close to black. Target off the open floor is #14171a. */
  function floorAlpha() {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, S, S);
    const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    r.addColorStop(0.00, '#ffffff');
    r.addColorStop(0.26, '#ffffff');
    r.addColorStop(0.52, '#4a4a4a');
    r.addColorStop(0.86, '#000000');
    r.addColorStop(1.00, '#000000');
    g.fillStyle = r;
    g.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  }

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(30, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x06070a,
      roughness: 0.26,
      metalness: 0.0,
      envMapIntensity: 0.62,
      transparent: true,
      alphaMap: floorAlpha(),
      depthWrite: false,
    })
  );
  floor.receiveShadow = full;
  floor.renderOrder = -10;
  scene.add(floor);

  /* The pool of light on the floor, additive, and separate from the floor's own
     reflection: the reflection says what is above, the pool says where the car
     is standing. Without it a large dark plane reads as nothing at all. */
  function poolTexture() {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    r.addColorStop(0.00, 'rgba(104,111,122,0.72)');
    r.addColorStop(0.26, 'rgba(72,78,88,0.46)');
    r.addColorStop(0.55, 'rgba(30,34,40,0.16)');
    r.addColorStop(1.00, 'rgba(0,0,0,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, S, S);
    return new THREE.CanvasTexture(c);
  }

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: poolTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
  );
  /* THE POOL FOLLOWS THE LENS, AND THE OLD ONE DID NOT. It used to be a fixed
     patch of floor at z = -1.35, which is behind the car from ONE camera. The
     review measured what that costs: at act 01 the floor under the body peaked
     at 131 against an open floor of 5, but at act 02 the bright patch had swung
     round to the SIDE of the car (2–7 directly beneath it) and at act 03 it
     peaked at 59 against an open floor of 26 — almost no separation at all. The
     car sat over empty darkness in the two middle acts.

     A gaffer does not leave the floor light where it was when the camera moves;
     they walk it round to stay behind the subject. So this one is placed from
     the camera azimuth every frame — see placeGround(). Its position and scale
     here are only the values it starts at. */
  pool.position.y = 0.002;
  pool.renderOrder = -9;
  scene.add(pool);

  /* THE BED. A second, much weaker pool that stays directly under the car
     whatever the camera does, and its only job is to give the floor beneath the
     body some VALUE for the contact shadow to bite into. A multiply shadow over
     a black floor multiplies nothing — that is the whole reason the car floated
     once the floor was crushed, and the backing pool alone cannot fix it
     because a backing pool is by definition not underneath. */
  const bed = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: poolTexture(),
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      toneMapped: false,
    })
  );
  bed.position.set(0, 0.0015, 0);
  /* 6.6 x 5.6 rather than 5.4 x 4.2. The pool texture's bright core covers only
     the middle 26% of its own footprint, so at the smaller size the core stopped
     short of the axles and the wheels stood on the falloff. */
  bed.scale.set(6.6, 1, 5.6);
  bed.renderOrder = -9;
  scene.add(bed);

  /* The contact shadow. Painted, because a shadow map is bad at the dense tight
     darkness directly under a car and that darkness is most of what "planted"
     means. WHITE is leave-alone and black is full shadow: written as
     transparent black instead, multiply blending paints a hard rectangle. */
  function contactTexture() {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, S, S);
    const r = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    r.addColorStop(0.00, 'rgb(2,2,3)');
    r.addColorStop(0.22, 'rgb(6,7,9)');
    r.addColorStop(0.44, 'rgb(46,50,56)');
    r.addColorStop(0.72, 'rgb(168,173,180)');
    r.addColorStop(1.00, 'rgb(255,255,255)');
    g.fillStyle = r;
    g.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: contactTexture(),
      blending: THREE.MultiplyBlending,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      toneMapped: false,
    })
  );
  contact.position.y = 0.004;
  contact.renderOrder = -8;
  scene.add(contact);

  /* ── the only real lights ─────────────────────────────────────────────────
     The env map does the lighting. These two exist for the one thing an
     environment map cannot do, which is cast a shadow, and for a rim the map
     cannot make hot enough at grazing angles. */
  const key = new THREE.DirectionalLight(0xfff6ea, full ? 1.15 : 0.8);
  key.position.set(-4.2, 7.6, 4.4);
  if (full) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4.4; key.shadow.camera.right = 4.4;
    key.shadow.camera.top = 4.4; key.shadow.camera.bottom = -4.4;
    key.shadow.camera.near = 2; key.shadow.camera.far = 22;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 4;
  }
  scene.add(key);

  /* The rim exists to put a hot edge between the body and the dark, which is
     the single thing that stops a dark car on a dark floor reading as a hole.
     A rim fixed in world space does that from one camera and lights the wrong
     edge from the next, so this one is also placed off the camera azimuth every
     frame. */
  const rim = new THREE.DirectionalLight(0xdfe8ff, 0.55);
  rim.position.set(5.6, 1.9, -6.2);
  scene.add(rim);

  /* Cockpit fill, kept from direction F for the reason recorded there: an
     environment map has no way to be inside a tub, and black leather in a dark
     room renders as a hole. Cone stops at the scuttle. */
  const cockpit = new THREE.SpotLight(0xfff1de, full ? 22 : 15, 4.5, 0.8, 0.9, 2);
  cockpit.position.set(0.15, 2.15, -0.35);
  cockpit.target.position.set(0, 0.42, -0.55);

  /* ── the word in the room ─────────────────────────────────────────────────
     It has to be geometry, not a DOM layer, for one reason that decides it: the
     car must pass IN FRONT of it. A word behind an opaque canvas is invisible;
     a word on top of the canvas is a caption. Only a plane standing in the room
     lets the body crop the letterforms, and that crop is the whole device.

     Held square to the camera and sized off its distance, so it keeps one size
     on screen whatever the lens does. Scenery that swells with the camera stops
     being scenery. */
  const ghost = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, depthWrite: false, toneMapped: false,
    })
  );
  ghost.renderOrder = 20;
  ghost.visible = false;
  scene.add(ghost);

  let ghostText = null, ghostOpacity = 0.10, ghostRise = 0.16, ghostScale = 0.34;

  function setGhost(text, opts = {}) {
    if (opts.opacity !== undefined) ghostOpacity = opts.opacity;
    if (opts.rise !== undefined) ghostRise = opts.rise;
    if (opts.scale !== undefined) ghostScale = opts.scale;
    if (text === ghostText) { dirty = true; return; }
    ghostText = text || null;
    if (!ghostText) { ghost.visible = false; dirty = true; return; }

    const px = 340, pad = 90;
    const face = '"Barlow Condensed", system-ui, sans-serif';
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = `700 ${px}px ${face}`;
    const w = Math.ceil(probe.measureText(ghostText).width) + pad * 2;
    const h = Math.ceil(px * 1.14) + pad * 2;

    const c = document.createElement('canvas');
    c.width = Math.min(4096, w); c.height = h;
    const g = c.getContext('2d');
    g.font = `700 ${px}px ${face}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#ffffff';
    g.fillText(ghostText, c.width / 2, c.height / 2, c.width - pad);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    if (ghost.material.map) ghost.material.map.dispose();
    ghost.material.map = t;
    ghost.material.opacity = ghostOpacity;
    ghost.material.needsUpdate = true;
    ghost.userData.aspect = c.width / c.height;
    ghost.visible = true;
    dirty = true;
  }

  /* ── grounding, per act ───────────────────────────────────────────────────
     One number set per composition rather than one set for the whole page.
     `push` is how far behind the car the backing pool sits, in metres, along
     the camera's own axis; `wide`/`deep` are its footprint; `pool`, `bed` and
     `contact` are strengths; `rimAngle` is where the rim stands relative to the
     lens, in radians. All of them interpolate during a transition and arrive at
     a stated value for the hold. */
  const ground = {
    push: 1.6, wide: 7.4, deep: 6.6,
    pool: 1.0, bed: 0.5, contact: 1.0,
    rimAngle: 2.15, rimY: 1.9, rim: 0.55,
  };

  function setGround(g) {
    if (!g) return;
    for (const k of Object.keys(ground)) if (g[k] !== undefined) ground[k] = g[k];
    dirty = true;
  }

  function placeGround() {
    /* the unit vector pointing from the camera towards the car, on the floor */
    const dx = -camera.position.x, dz = -camera.position.z;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len, uz = dz / len;

    /* PUSH IS SMALL, AND THE FIRST ATTEMPT AT THIS GOT IT BACKWARDS. Reasoning
       from "a pool in front of the car erases its shadow", it was pushed 1.3–1.7 m
       away from the lens — and measured, that put the pool's far edge behind the
       car and its NEAR edge, where the gradient is already zero, exactly where
       the visible floor begins. From a low camera the floor you can see is the
       floor on your own side of the car. The shadow is the contact map's job, not
       the pool's; the pool's job is to put value on the ground the lens can see. */
    pool.position.set(ux * ground.push, 0.002, uz * ground.push);
    /* Turned so its long axis lies ACROSS the frame. A pool stretched along the
       view axis is a corridor; stretched across it, it is a floor. */
    pool.rotation.y = Math.atan2(ux, uz);
    pool.scale.set(ground.wide, 1, ground.deep);
    pool.material.opacity = ground.pool;

    bed.material.opacity = ground.bed;
    contact.material.opacity = ground.contact;

    const a = Math.atan2(camera.position.x, camera.position.z) + ground.rimAngle;
    rim.position.set(Math.sin(a) * 7.4, ground.rimY, Math.cos(a) * 7.4);
    rim.intensity = ground.rim;
  }

  const _toCam = new THREE.Vector3();

  function placeGhost() {
    if (!ghost.visible) return;
    ghost.material.opacity = ghostOpacity;
    _toCam.copy(camera.position).sub(target);
    const dist = _toCam.length() || 1;
    _toCam.divideScalar(dist);
    const gd = dist * 1.12 + 2.0;
    ghost.position.copy(target).addScaledVector(_toCam, -gd);
    ghost.position.y = target.y + gd * ghostRise;
    ghost.quaternion.copy(camera.quaternion);
    const hh = gd * ghostScale;
    ghost.scale.set(hh * (ghost.userData.aspect || 4), hh, 1);
  }

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 160);
  const target = new THREE.Vector3(0, 0.55, 0);
  const pivot = new THREE.Group();
  scene.add(pivot);
  pivot.add(cockpit, cockpit.target);

  let dirty = true, running = false, car = null;
  const pose = { cam: new THREE.Vector3(4, 1.2, 6) };

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  function setPose(p) {
    if (!p) return;
    if (p.rotY !== undefined) pivot.rotation.y = p.rotY;
    if (p.fov !== undefined && p.fov !== camera.fov) {
      camera.fov = p.fov; camera.updateProjectionMatrix();
    }
    if (p.cam) pose.cam.set(p.cam[0], p.cam[1], p.cam[2]);
    if (p.target) target.set(p.target[0], p.target[1], p.target[2]);
    if (p.exposure !== undefined) renderer.toneMappingExposure = p.exposure;
    camera.position.copy(pose.cam);
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    placeGround();
    placeGhost();
    dirty = true;
  }

  const _v = new THREE.Vector3();

  function project(local) {
    if (!car || !local) return null;
    camera.lookAt(target);
    camera.updateMatrixWorld();
    _v.set(local[0], local[1], local[2]);
    pivot.localToWorld(_v);
    const depth = _v.distanceTo(camera.position);
    _v.project(camera);
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    return {
      x: (_v.x * 0.5 + 0.5) * w,
      y: (-_v.y * 0.5 + 0.5) * h,
      onPlate: _v.z < 1 && _v.x > -1.1 && _v.x < 1.1 && _v.y > -1.1 && _v.y < 1.1,
      depth,
    };
  }

  function frame() {
    if (!running) return;
    if (dirty) {
      camera.lookAt(target);
      placeGround();
      placeGhost();
      renderer.render(scene, camera);
      dirty = false;
    }
    requestAnimationFrame(frame);
  }

  const start = () => { if (!running) { running = true; dirty = true; requestAnimationFrame(frame); } };
  const stop = () => { running = false; };
  const invalidate = () => { dirty = true; };

  /* ── materials ────────────────────────────────────────────────────────────
     The atlases are correct — dev/vray_to_pbr.py rebuilt them — so only what an
     atlas cannot carry is touched: glass and lenses by node name, and a
     clearcoat lobe metallic-roughness has no channel for. */
  function correctMaterials(root) {
    let paint = null, seat = null;
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = false;
      const m = o.material;
      if (!m) return;

      if (/^windscreen/i.test(o.name)) {
        o.material = new THREE.MeshPhysicalMaterial({
          color: 0xd7e2e6, roughness: 0.02, metalness: 0,
          transmission: 0.86, thickness: 0.008, ior: 1.52,
          envMapIntensity: 1.8, side: THREE.DoubleSide,
        });
        o.castShadow = false; return;
      }
      if (/^lamp_rear/i.test(o.name)) {
        o.material = new THREE.MeshPhysicalMaterial({
          color: 0x8c0d10, roughness: 0.06, metalness: 0,
          transmission: 0.55, thickness: 0.02, ior: 1.55,
          clearcoat: 1, clearcoatRoughness: 0.04,
          envMapIntensity: 1.5, side: THREE.DoubleSide,
        });
        o.castShadow = false; return;
      }
      if (/^lens/i.test(o.name)) {
        o.material = new THREE.MeshPhysicalMaterial({
          color: 0xeef3f6, roughness: 0.02, metalness: 0,
          transmission: 0.92, thickness: 0.01, ior: 1.52,
          clearcoat: 1, clearcoatRoughness: 0.03,
          envMapIntensity: 1.8, side: THREE.DoubleSide,
        });
        o.castShadow = false; return;
      }
      if (/glass/i.test(o.name)) {
        const dark = /dark/i.test(o.name);
        o.material = new THREE.MeshPhysicalMaterial({
          color: dark ? 0x6d757a : 0xc7d2d8,
          roughness: 0.05, metalness: 0,
          transmission: dark ? 0.78 : 0.92,
          thickness: 0.006, ior: 1.52,
          envMapIntensity: 1.2, side: THREE.DoubleSide,
        });
        o.castShadow = false; return;
      }
      if (/^seat_/i.test(o.name)) {
        if (!seat) {
          seat = m.clone();
          seat.name = m.name + '__leather';
          seat.envMapIntensity = 1.3;
          seat.needsUpdate = true;
        }
        o.material = seat; o.castShadow = false; return;
      }
      if (PANEL.test(o.name)) {
        if (!paint) {
          paint = m.isMeshPhysicalMaterial ? m.clone() : new THREE.MeshPhysicalMaterial({
            map: m.map, normalMap: m.normalMap, normalScale: m.normalScale,
            roughnessMap: m.roughnessMap, metalnessMap: m.metalnessMap,
            roughness: m.roughness, metalness: m.metalness,
            color: m.color, name: m.name,
          });
          paint.name = m.name + '__lacquer';
          paint.clearcoat = 1.0;
          paint.clearcoatRoughness = 0.035;
          paint.envMapIntensity = 1.35;
          paint.side = THREE.FrontSide;
          paint.shadowSide = THREE.FrontSide;
          if (paint.map) paint.map.anisotropy = 8;
          paint.needsUpdate = true;
        }
        o.material = paint; return;
      }

      m.side = THREE.FrontSide;
      m.shadowSide = THREE.FrontSide;
      m.envMapIntensity = 1.25;
      if (m.map) m.map.anisotropy = 8;
      m.needsUpdate = true;
    });
  }

  const ready = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('assets/js/vendor/draco/');
    loader.setDRACOLoader(draco);
    loader.load(modelUrl, (gltf) => {
      car = gltf.scene;
      correctMaterials(car);
      const box = new THREE.Box3().setFromObject(car);
      const c = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      /* Four millimetres of air: a rigid tyre coplanar with the floor plane is
         sliced by it, not touched by it, and the slice opens a gap the far
         wheel shows through. */
      car.position.set(-c.x, -box.min.y + 0.004, -c.z);
      contact.scale.set(size.x * 1.42, 1, size.z * 1.06);
      pivot.add(car);
      resize();
      resolve({ car, size });
    }, undefined, reject);
  });

  window.addEventListener('resize', resize, { passive: true });

  return {
    renderer, scene, camera, pivot, ready,
    setPose, resize, start, stop, project, invalidate, setGhost, setGround,
    lights: { key, rim, cockpit }, floor, pool, bed, contact,
    get car() { return car; },
  };
}
