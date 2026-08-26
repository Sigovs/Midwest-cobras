/* ============================================================================
   f-scene.js — direction F. The car, a real room's light, and a turn the
   visitor performs.
   ----------------------------------------------------------------------------
   THE GOAL IS THAT NOBODY THINKS ABOUT THE 3D. A page that looks like a model
   viewer has told the visitor they are looking at a model; a page that looks
   photographed has told them they are looking at a car. Three things get it
   there, and none of them is an effect:

   1. LIGHT COMES FROM A ROOM, not from lamps. A captured HDR environment is
      what lays a garage's strip lights down the length of a wing. Directional
      lights arranged by hand cannot do it, and the giveaway is exactly the "3D
      look" — highlights that are round and even instead of long and
      interrupted. One directional light remains and its only job is the
      shadow, which an environment map cannot cast.

   2. THE CAR SITS ON THE FLOOR. A cast shadow alone leaves it hovering. The
      dense, tight darkness directly under a car is most of what "grounded"
      means in a photograph, and a shadow map is bad at it.

   3. THE PAINT IS DIELECTRIC. Correction 3 below, and it is the one that
      changed the colour of the car.

   It also does NOT override the model's materials wholesale, which is the
   difference from hero-scene.js. That file re-assigns every mesh because its
   model carried SketchUp defaults and a game rip's naming. This one came from a
   bought .blend with two authored PBR atlases, and replacing those would throw
   away the thing that was paid for.

   Renders on demand. No permanent rAF loop — a frame is drawn when something
   actually changed, so a car nobody is turning costs nothing.
   ========================================================================== */

import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../vendor/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from '../vendor/jsm/loaders/RGBELoader.js';

const token = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

export const CAR_LENGTH_M = 3.948;

/* Shell, doors, boot lid — what is painted. Wheels, bumpers and brake parts are
   deliberately outside it and keep their metal map. */
const PANEL = /^(body|doar|trunk)/i;

export function createFScene({ canvas, modelUrl, envUrl, quality = 'full' }) {
  const full = quality === 'full';

  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: full, alpha: false, powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, full ? 2 : 1.5));
  /* ACES, and AgX was tried first and rejected. AgX rolls highlights off more
     gracefully, which is the better instinct for a lit object — but it pulls
     saturation out of the midtones, and it turned Gulf blue into grey-teal and
     the stripe into salmon. On this car the colour is the point, so the
     highlight roll-off loses the argument. */
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = full;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const pivotLightHost = [];

  const ground = new THREE.Color(token('--graphite-900', '#1a1d21'));

  /* Cleared to the page's own ground rather than left transparent. Fog fades
     the floor toward this exact colour, so the floor's far edge disappears
     instead of cutting a horizon across the frame — with a transparent canvas
     the opaque fogged floor met the transparent sky and the seam was a line. */
  renderer.setClearColor(ground, 1);

  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.Fog(ground, 14, 34);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  /* ── the cockpit, and a stated exception to "the room does the lighting" ──
     A captured environment map has no occlusion in three.js, but it also has no
     way to be *inside* anything: the cockpit is black leather in a dim garage,
     and it renders as a hole. Alex asked where the seats were three times. They
     were always there — 4,680 and 4,584 vertices, pleated, correctly placed —
     and flagging them red proves it in one frame. Black on black is not a
     missing part, but on a page whose job is to sell the car it may as well be.

     So there is a second light, it is aimed into the cockpit, and it is named
     rather than smuggled in. Its cone stops at the scuttle: raising
     envMapIntensity instead did nothing at 4.0, and a point light bright enough
     to reach the seats blew out the windscreen frame and the roll bar.

     It casts no shadow, and it is the ONLY hand-placed light on this page that
     is not the shadow key. If a third one is ever wanted, that is the moment to
     stop and re-read the Motion Read instead. */
  const cockpit = new THREE.SpotLight(0xfff1de, full ? 26 : 18, 4.5, 0.8, 0.9, 2);
  cockpit.position.set(0.15, 2.15, -0.35);
  cockpit.target.position.set(0, 0.42, -0.55);

  /* One light, and it is here for the shadow. The room does the lighting. */
  const key = new THREE.DirectionalLight(0xfff4e6, full ? 1.35 : 0.9);
  key.position.set(-5.5, 8.5, 6.0);
  if (full) {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4.2; key.shadow.camera.right = 4.2;
    key.shadow.camera.top = 4.2; key.shadow.camera.bottom = -4.2;
    key.shadow.camera.near = 2; key.shadow.camera.far = 24;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = 3;
  }
  scene.add(key);

  // the cockpit light travels with the car, so it is parented to the pivot
  // rather than to the scene: turn the car and the seats stay lit.
  pivotLightHost.push(cockpit, cockpit.target);

  /* ── floor ────────────────────────────────────────────────────────────────
     Rough enough to read as sealed concrete, smooth enough to hold a soft
     smear of the room. A mirror floor is the fastest way to look like a 3D
     demo, so this is not one. */
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(46, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: 0x191d21, roughness: 0.42, metalness: 0.0, envMapIntensity: 0.55,
    })
  );
  floor.receiveShadow = full;
  scene.add(floor);

  /* ── contact shadow ───────────────────────────────────────────────────────
     Painted, not computed. It sits a millimetre above the floor and does the
     job a shadow map is bad at. */
  function contactShadowTexture() {
    const s = 512;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const g = c.getContext('2d');
    /* WHITE is "leave the floor alone" and black is "full shadow". Writing the
       fade as transparent black instead — the obvious way — multiplies the
       floor by zero everywhere the texture is empty, which paints a hard black
       rectangle the size of the plane. */
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, s, s);
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0.00, 'rgb(38,42,47)');
    grad.addColorStop(0.38, 'rgb(96,102,110)');
    grad.addColorStop(0.68, 'rgb(198,202,208)');
    grad.addColorStop(1.00, 'rgb(255,255,255)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }

  const contact = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: contactShadowTexture(), depthWrite: false,
      blending: THREE.MultiplyBlending,
    })
  );
  contact.position.y = 0.002;
  contact.renderOrder = -1;
  scene.add(contact);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 160);
  const target = new THREE.Vector3(0, 0.5, 0);
  const pivot = new THREE.Group();
  scene.add(pivot);
  pivotLightHost.forEach((n) => pivot.add(n));

  let dirty = true, running = false, car = null;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  /* ── what the visitor owns, kept apart from what the page asks for ────
     `pose` is the camera the choreography wants. `turn` is what the visitor has
     done to it. The frame is the second applied to the first, every time, and
     the two are never folded together — fold them and a scroll move erases a
     tilt, or the tilt has to be re-derived from a camera position and drifts a
     little further from the truth on every pass. */
  const pose = { cam: new THREE.Vector3(3, 1, 5) };

  const turn = {
    yaw: 0, pitch: 0,          // pitch is an OFFSET from whatever the pose framed
    vYaw: 0, vPitch: 0,
    dragging: false, hasTurned: false, returning: false, homeYaw: 0,
    lastX: 0, lastY: 0,
    damping: 0.92,             // a property, not a constant: index6 turns it off
                               // under reduced motion, and used to be talking to
                               // nothing while this was `const DAMPING`
  };

  const SENSITIVITY = 0.0068;        // radians of yaw per pixel
  const PITCH_SENSITIVITY = 0.0052;  // radians of elevation per pixel
  const MIN_CLEARANCE = 0.12;        // metres of air left between camera and floor
  const MAX_ELEVATION = 1.43;        // ~82°, short of straight down, where lookAt
                                     // with a +Y up vector inverts the picture

  const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

  function setPose(p) {
    if (!p) return;
    if (p.rotY !== undefined) turn.yaw = p.rotY;
    if (p.fov !== undefined && p.fov !== camera.fov) {
      camera.fov = p.fov; camera.updateProjectionMatrix();
    }
    if (p.cam) pose.cam.set(p.cam[0], p.cam[1], p.cam[2]);
    if (p.target) target.set(p.target[0], p.target[1], p.target[2]);
    applyView();
  }

  /* ── the turn ───────────────────────────────────────
     Driven by the visitor, never by a timer. An object that turns on its own is
     a display stand in a shop window; one that turns because somebody turned it
     is theirs. It also means there is no perpetual motion anywhere near this
     page's reading.

     YAW TURNS THE CAR. PITCH MOVES THE CAMERA. That reads inconsistent written
     down and it is the right way round. A car coming round on a turntable drags
     the room's strip lights along the length of the wing, and that sweep is most
     of what makes the surface read as lacquer rather than as a coloured shape.
     Orbiting the camera in yaw instead leaves every highlight pinned where it is
     and changes only the angle it is seen from: identical silhouette, dead
     surface. Pitch has no such choice to make — a car does not tilt, so the
     viewer is the thing that rises.

     Which of the two is happening is invisible to the visitor. It is very
     visible on the paint.                                                    */

  const _off = new THREE.Vector3();

  function applyView() {
    pivot.rotation.y = turn.yaw;

    _off.copy(pose.cam).sub(target);
    const radius = _off.length() || 1;
    const azimuth = Math.atan2(_off.x, _off.z);
    const base = Math.asin(clamp(_off.y / radius, -1, 1));

    /* THE FLOOR IS WHY YOU CANNOT GET UNDER THE SILLS, and it is a real reason
       rather than a timid one: there is a floor, the car is standing on it, and
       the only way below is through it. So the bottom of the range is wherever
       this camera would touch the concrete — computed from the pose rather than
       picked, because a camera further out can drop further before it lands. */
    const floorLimit = Math.asin(clamp((MIN_CLEARANCE - target.y) / radius, -1, 1));

    /* Clamp the STORED pitch, not the elevation derived from it. Clamping the
       result instead lets the number keep climbing past the stop while the
       picture stands still, and then the visitor has to drag the whole way back
       before anything answers. The control goes numb, and numb reads as broken
       rather than as a limit. */
    const lo = floorLimit - base, hi = MAX_ELEVATION - base;
    if (turn.pitch < lo) { turn.pitch = lo; turn.vPitch = 0; }
    if (turn.pitch > hi) { turn.pitch = hi; turn.vPitch = 0; }

    const e = base + turn.pitch;
    const cosE = Math.cos(e), sinE = Math.sin(e);
    camera.position.set(
      target.x + radius * cosE * Math.sin(azimuth),
      target.y + radius * sinE,
      target.z + radius * cosE * Math.cos(azimuth)
    );
    dirty = true;
  }

  function tickTurn() {
    if (turn.dragging) return false;

    if (turn.returning) {
      /* Home. Not a snap: a snap from the far side of the car is a cut, and a
         cut is the one thing a page pretending to be a photograph cannot do. */
      turn.yaw += (turn.homeYaw - turn.yaw) * 0.14;
      turn.pitch += (0 - turn.pitch) * 0.14;
      if (Math.abs(turn.homeYaw - turn.yaw) < 0.002 && Math.abs(turn.pitch) < 0.002) {
        turn.yaw = turn.homeYaw; turn.pitch = 0; turn.returning = false;
      }
      applyView();
      return true;
    }

    if (!turn.damping) { turn.vYaw = turn.vPitch = 0; return false; }

    let moved = false;
    if (Math.abs(turn.vYaw) >= 0.00015) {
      turn.yaw += turn.vYaw; turn.vYaw *= turn.damping; moved = true;
    } else turn.vYaw = 0;
    if (Math.abs(turn.vPitch) >= 0.00015) {
      turn.pitch += turn.vPitch; turn.vPitch *= turn.damping; moved = true;
    } else turn.vPitch = 0;

    if (moved) applyView();
    return moved;
  }

  function bindTurn(onFirstTurn) {
    let startX = 0, startY = 0, axis = null, id = null;
    turn.homeYaw = turn.yaw;

    const first = () => {
      if (turn.hasTurned) return;
      turn.hasTurned = true;
      onFirstTurn && onFirstTurn();
    };

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; axis = null;
      turn.returning = false;
      startX = turn.lastX = e.clientX;
      startY = turn.lastY = e.clientY;
      turn.dragging = true; turn.vYaw = turn.vPitch = 0;
      // release is already guarded; capture can throw too, on a pointer the
      // browser considers gone by the time the handler runs
      try { canvas.setPointerCapture(id); } catch (_) {}
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!turn.dragging || e.pointerId !== id) return;

      /* BOTH AXES FOR A MOUSE, ONE FOR A THUMB, and that is not a preference
         about pointers. A mouse has a wheel, so taking its drag costs the
         visitor nothing — the page still scrolls with the hand already on the
         device. A thumb has no wheel: on a touch screen the vertical drag IS
         the transport, and a canvas the size of this hero with both axes
         captured is a first screen the visitor cannot get out of. MJ6, and it
         is the whole reason the axis lock below survives rather than leaving
         with the single-axis turn it was written for. */
      const twoAxis = e.pointerType !== 'touch';

      if (!twoAxis && axis === null) {
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        // a drag that began as a scroll stays a scroll
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') {
          turn.dragging = false;
          try { canvas.releasePointerCapture(id); } catch (_) {}
          return;
        }
      }

      const stepYaw = (e.clientX - turn.lastX) * SENSITIVITY;
      turn.lastX = e.clientX;
      turn.yaw += stepYaw;
      turn.vYaw = stepYaw;

      /* Drag DOWN and the camera rises. The hand is on the car, not on the
         camera: pulling the near edge of an object toward you is what tips its
         roof into view, and it is what every 3D tool anyone has already used
         does. The other way round feels like dragging the sky. */
      const beforePitch = turn.pitch;
      if (twoAxis) {
        turn.pitch += (e.clientY - turn.lastY) * PITCH_SENSITIVITY;
        turn.lastY = e.clientY;
      }

      applyView();

      /* Pitch velocity is read back AFTER applyView has clamped, never from the
         mouse. At a stop the mouse is still travelling and the picture is not,
         and inertia taken from the mouse would sit on a dead limit and then
         fling the camera the instant the limit let go. */
      turn.vPitch = turn.pitch - beforePitch;

      first();
      e.preventDefault();
    });

    const up = (e) => {
      if (e.pointerId !== id) return;
      turn.dragging = false;
      try { canvas.releasePointerCapture(id); } catch (_) {}
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    /* Back to the framing the page opened on. Once a car can be tumbled it can
       be tumbled somewhere useless, and a control with no way home is a trap
       wearing the clothes of a feature. */
    const home = () => {
      if (turn.pitch === 0 && turn.yaw === turn.homeYaw) return;
      turn.returning = true; turn.vYaw = turn.vPitch = 0;
      dirty = true;
    };
    canvas.addEventListener('dblclick', (e) => { home(); e.preventDefault(); });

    /* Keyboard parity. A control that only answers a mouse is a control half
       the audience does not have.

       The arrows mirror the DRAG, not a camera move: ArrowRight already turned
       the car the way dragging right does, and up and down join that sentence
       rather than starting a second one running the other way. So ArrowDown
       raises the camera, exactly as dragging down does. */
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', (e) => {
      const STEP = 0.12;
      if (e.key === 'ArrowLeft')       turn.yaw -= STEP;
      else if (e.key === 'ArrowRight') turn.yaw += STEP;
      else if (e.key === 'ArrowUp')    turn.pitch -= STEP;
      else if (e.key === 'ArrowDown')  turn.pitch += STEP;
      else if (e.key === 'Escape' || e.key === 'Home') { home(); e.preventDefault(); return; }
      else return;
      turn.returning = false;
      applyView();
      first();
      e.preventDefault();
    });
  }

  function frame() {
    if (!running) return;
    const moved = tickTurn();
    if (dirty || moved) {
      camera.lookAt(target);
      renderer.render(scene, camera);
      dirty = false;
    }
    requestAnimationFrame(frame);
  }
  const start = () => { if (!running) { running = true; dirty = true; requestAnimationFrame(frame); } };
  const stop = () => { running = false; };

  /* ── material corrections ───────────────────────────────────
     THIS BLOCK USED TO BE MUCH LONGER, AND ALL OF WHAT LEFT IT MOVED UPSTREAM.

     Two corrections here were repairing a V-Ray specular/glossiness conversion
     at render time: metalness rebuilt from a canvas mask derived from the base
     colour, and metalness forced off the painted panels. Both were correct
     about the symptom and neither could reach the disease, because the disease
     was in the .blend: `Reflection` wired into "Specular IOR Level" (which
     discards it) and `Metallic` wired to an inverted alpha channel. Every metal
     on the car therefore arrived with a near-black base colour — a conductor
     has no diffuse term, so its colour is in the reflection map by
     construction — and every dielectric arrived at metalness 0.65 or 1.0.
     Seats, headlight reflector and side pipe all rendered as the same black.

     dev/vray_to_pbr.py now does the conversion properly, before export, from
     the same five maps the vendor shipped. The atlas that reaches this file is
     already correct, so a runtime correction on top of it would be a second
     wrong answer stacked on a right one.

     WHAT LEGITIMATELY REMAINS is only what an atlas cannot carry:

     1. doubleSided comes off everything but glass. It arrives from the
        exporter, doubles fragment work on a half-million-triangle car, and
        makes shadows wrong on closed panels.

     2. Glass and headlamp lenses become transmission rather than opacity. Both
        are chosen BY NODE NAME, which is why prep_shelby.py separates the
        lenses out of `Interior` in the first place — a surface with no node of
        its own cannot be addressed, whatever is wrong with it.

     3. Clearcoat goes back on the painted panels. A lacquer coat is a second
        specular lobe over the pigment; metallic-roughness has one lobe and no
        channel to put the other in, so it has to be asked for here. This is a
        real gap in the format, not a leftover from the conversion.        */
  function correctMaterials(root) {
    let paint = null;
    let seat = null;

    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = false;

      const m = o.material;
      if (!m) return;

      /* The headlamp lenses, separated out of `Interior` by prep_shelby.py.
         Before that surgery they were 906 faces inside a 40,000-vertex object,
         mapped to a ten-pixel patch of leather grain that magnified into what
         looked exactly like tyre tread. There was nothing to address, so there
         was no material fix — only a geometry one. Now there is a node.

         Transmission is 0.55 rather than a windscreen's 0.92 because there is
         a reflector behind this one and it is worth seeing. It was worth
         nothing while the reflector was black metal; it is worth something
         now. */
      if (/^lens/i.test(o.name)) {
        o.material = new THREE.MeshPhysicalMaterial({
          color: 0xeef3f6,
          roughness: 0.02,
          metalness: 0.0,
          transmission: 0.92,
          thickness: 0.01,
          ior: 1.52,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          envMapIntensity: 1.6,
          side: THREE.DoubleSide,
        });
        o.castShadow = false;
        return;
      }

      /* The tail lamps, separated by the same pass and for the same reason as
         the headlight lenses — their UVs land on the tyre-tread island, so
         before the surgery each 3 cm oval rendered as a slab of Goodyear.

         Red glass with a dark interior behind it, not an emissive: the car is
         parked. A tail lamp that glows on a stationary car in a dark garage is
         a car with its foot on the brake, and it reads as a mistake rather
         than as a detail. */
      if (/^lamp_rear/i.test(o.name)) {
        o.material = new THREE.MeshPhysicalMaterial({
          color: 0x8c0d10,
          roughness: 0.06,
          metalness: 0.0,
          transmission: 0.55,
          thickness: 0.02,
          ior: 1.55,
          clearcoat: 1.0,
          clearcoatRoughness: 0.04,
          envMapIntensity: 1.4,
          side: THREE.DoubleSide,
        });
        o.castShadow = false;
        return;
      }

      /* `Glass_dark` was 0.22 transmission and near-black, which on a car with
         no side windows means the two wind deflectors above the scuttle read as
         solid black rectangles sitting in the cockpit. They are tinted glass,
         not panels. Raised until they are glass that happens to be dark. */
      if (/glass|windscreen/i.test(o.name)) {
        const dark = /dark/i.test(o.name);
        o.material = new THREE.MeshPhysicalMaterial({
          color: dark ? 0x6d757a : 0xc7d2d8,
          roughness: 0.05, metalness: 0,
          transmission: dark ? 0.78 : 0.92,
          thickness: 0.006, ior: 1.52,
          envMapIntensity: 1.0,
          side: THREE.DoubleSide,
        });
        o.castShadow = false;
        return;
      }

      /* THE SEATS, and the only reason they get a branch is that Alex could not
         see them and was right not to. They are 4,680 and 4,584 vertices of
         pleated bucket, correctly placed, correctly black — and black leather at
         the bottom of an unlit tub is indistinguishable from the tub.

         The cockpit spot does most of the work. This lifts the leather itself a
         little further, and it stops well short of turning it grey: the gain is
         on the material's colour multiplier, not on the atlas, so the pleats keep
         their own shading and the seats stay the darkest thing in the frame. */
      if (/^seat_/i.test(o.name)) {
        if (!seat) {
          seat = m.clone();
          seat.name = m.name + '__leather';
          /* NO COLOUR LIFT. The first version multiplied the leather by 1.9 to
             get it out of the dark, and on a white ground it turned two pleated
             buckets into flat pale slabs — Alex saw exactly that. A gain on the
             base colour flattens the pleats, because it raises the shadowed side
             of every fold by as much as the lit side. The cone above does the
             work instead; the leather keeps its own value. */
          seat.envMapIntensity = 1.4;
          seat.side = THREE.FrontSide;
          seat.shadowSide = THREE.FrontSide;
          if (seat.map) seat.map.anisotropy = 8;
          seat.needsUpdate = true;
        }
        o.material = seat;
        o.castShadow = false;
        return;
      }

      /* The painted panels share one material instance, cloned once from
         whichever panel arrives first. They also carry the chrome bezels and
         the grille surround on the same mesh — which is exactly why the metal
         decision is no longer made here. It is in the atlas, per texel, where
         the distinction actually exists. */
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
          paint.clearcoatRoughness = 0.04;
          paint.envMapIntensity = 1.0;
          paint.side = THREE.FrontSide;
          paint.shadowSide = THREE.FrontSide;
          if (paint.map) paint.map.anisotropy = 8;
          paint.needsUpdate = true;
        }
        o.material = paint;
        return;
      }

      m.side = THREE.FrontSide;
      m.shadowSide = THREE.FrontSide;
      m.envMapIntensity = 1.0;
      if (m.map) m.map.anisotropy = 8;
      m.needsUpdate = true;
    });
  }

  /* ── loading ──────────────────────────────────────────────────────────────
     The room and the car in parallel. Neither gates the page, and the page was
     complete before either was asked for. */
  const envReady = new Promise((resolve) => {
    if (!envUrl) return resolve(null);
    new RGBELoader().load(envUrl, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      const rt = pmrem.fromEquirectangular(tex);
      scene.environment = rt.texture;
      tex.dispose();
      dirty = true;
      resolve(rt.texture);
    }, undefined, () => resolve(null));
  });

  const carReady = new Promise((resolve, reject) => {
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
      /* FOUR MILLIMETRES OF AIR UNDER THE TYRES, and it is not a fudge.
         Sitting the model exactly on y = 0 puts the tyre's contact patch in the
         same plane as the floor, and a rigid cylinder coplanar with a plane does
         not touch it — it is sliced by it. Alex sent a crop of the result: the
         tread cut off along a hard straight line with a torn seam, and what
         looked like a second ghost tyre underneath, which is the far side's
         wheel showing through the gap the slice opened.

         Hiding the floor makes the wheel whole again, which is the proof. So the
         car is lifted by the smallest distance that separates the two surfaces.
         The grounding is not lost: it was never the floor doing it, it is the
         painted contact shadow, and four millimetres is far below what that
         gradient resolves. */
      car.position.set(-c.x, -box.min.y + 0.004, -c.z);

      // sized from the car it belongs to, measured rather than picked
      contact.scale.set(size.x * 2.1, 1, size.z * 1.32);

      pivot.add(car);
      resize();
      resolve({ car, size });
    }, undefined, reject);
  });

  const ready = Promise.all([carReady, envReady]).then(([c]) => c);

  window.addEventListener('resize', resize, { passive: true });

  return {
    renderer, scene, camera, pivot, ready, setPose, resize, start, stop,
    bindTurn, turn,
    get car() { return car; },
  };
}
