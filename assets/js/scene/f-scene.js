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

  let dirty = true, running = false, car = null;

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
    if (p.rotY !== undefined) { turn.angle = p.rotY; pivot.rotation.y = p.rotY; }
    if (p.fov !== undefined && p.fov !== camera.fov) {
      camera.fov = p.fov; camera.updateProjectionMatrix();
    }
    if (p.cam) camera.position.set(p.cam[0], p.cam[1], p.cam[2]);
    if (p.target) target.set(p.target[0], p.target[1], p.target[2]);
    dirty = true;
  }

  /* ── the turn ─────────────────────────────────────────────────────────────
     Driven by the visitor, never by a timer. An object that turns on its own is
     a display stand in a shop window; one that turns because somebody turned it
     is theirs. It also means there is no perpetual motion anywhere near this
     page's reading.

     Vertical drags are released deliberately: the page still scrolls under the
     thumb, which is the transport the visitor already owns.                  */
  const turn = { angle: 0, velocity: 0, dragging: false, hasTurned: false, lastX: 0 };
  const DAMPING = 0.92;
  const SENSITIVITY = 0.0068;      // radians per pixel

  function tickTurn() {
    if (turn.dragging) return false;
    if (Math.abs(turn.velocity) < 0.00015) { turn.velocity = 0; return false; }
    turn.angle += turn.velocity;
    turn.velocity *= DAMPING;
    pivot.rotation.y = turn.angle;
    return true;
  }

  function bindTurn(onFirstTurn) {
    let startX = 0, startY = 0, axis = null, id = null;

    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      id = e.pointerId; axis = null;
      startX = turn.lastX = e.clientX; startY = e.clientY;
      turn.dragging = true; turn.velocity = 0;
      canvas.setPointerCapture(id);
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!turn.dragging || e.pointerId !== id) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;

      // decide once what this gesture is; a drag that began as a scroll stays
      // a scroll
      if (axis === null) {
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis === 'y') {
          turn.dragging = false;
          try { canvas.releasePointerCapture(id); } catch (_) {}
          return;
        }
      }

      const step = (e.clientX - turn.lastX) * SENSITIVITY;
      turn.lastX = e.clientX;
      turn.angle += step;
      turn.velocity = step;
      pivot.rotation.y = turn.angle;
      dirty = true;
      if (!turn.hasTurned) { turn.hasTurned = true; onFirstTurn && onFirstTurn(); }
      e.preventDefault();
    });

    const up = (e) => {
      if (e.pointerId !== id) return;
      turn.dragging = false;
      try { canvas.releasePointerCapture(id); } catch (_) {}
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    /* Keyboard parity. A control that only answers a mouse is a control half
       the audience does not have. */
    canvas.tabIndex = 0;
    canvas.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      turn.angle += (e.key === 'ArrowLeft' ? -1 : 1) * 0.12;
      pivot.rotation.y = turn.angle;
      dirty = true;
      if (!turn.hasTurned) { turn.hasTurned = true; onFirstTurn && onFirstTurn(); }
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

  /* ── material corrections ─────────────────────────────────────────────────
     All of them are consequences of a V-Ray specular/glossiness source
     converted to metallic-roughness. None is a taste decision.

     1. doubleSided comes off everything but glass. It arrives from the
        exporter, doubles fragment work on a half-million-triangle car, and
        makes shadows wrong on closed panels.

     2. Glass becomes transmission rather than opacity. The difference is
        whether the cockpit behind it exists.

     3. THE PAINT IS NOT METAL, AND THE CONVERSION SAYS IT IS. glTF packs metal
        into the blue channel of one texture; converting a V-Ray set, that
        channel is written from the REFLECTION map, which for car paint is
        bright everywhere because lacquer reflects. Multiplied by the
        metallicFactor of 1.0 the exporter also wrote, every painted panel
        becomes metal — and a metal's base colour stops being its colour and
        becomes its reflectance. Blue paint turns into blue-tinted chrome and
        reads near-black. The panels drop the metal map and take metalness 0.

     4. Clearcoat goes back on the panels. V-Ray builds lacquer out of
        Reflection, Fresnel and IOR, and metallic-roughness has nowhere to put
        them, so converted straight the surface is dead even once the colour is
        right.                                                               */
  /* ── the metal mask ───────────────────────────────────────────────────────
     Correction 3 said the panels are not metal, and that was right about the
     PAINT and wrong about everything else on the same mesh. `Body` is one
     116,000-vertex object carrying the shell AND the headlight bezels, the
     grille surround, the overriders, the badges and the windscreen frame.
     Dropping the metal map to fix the paint stripped the chrome off all of
     them, and the car arrived undressed.

     The obvious repair — threshold the existing metal channel — does not work,
     and the histogram says why: the blue channel is 240–255 across 98% of the
     atlas. The V-Ray Reflection map it was written from is bright everywhere,
     because lacquer reflects, so there is no chrome-versus-paint information
     in it to recover.

     So the mask is derived from the BASE COLOUR instead, where the distinction
     does exist: chrome is bright and almost colourless, paint is saturated.
     Roughly an eighth of the atlas comes back as metal, and it is the eighth
     that should be. */
  function buildMetalMask(base, roughSource) {
    const img = base.image;
    if (!img || !img.width) return null;
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const id = g.getImageData(0, 0, c.width, c.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255, gg = d[i + 1] / 255, b = d[i + 2] / 255;
      const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
      // bright and near-colourless is chrome; anything with a hue is paint
      const metal = (mx - mn) < 0.10 && mx > 0.34 ? 255 : 0;
      d[i] = 255;          // red is unused by the standard material
      // green stays: it is the roughness channel and it was authored
      d[i + 2] = metal;
    }
    g.putImageData(id, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.flipY = base.flipY;
    t.wrapS = base.wrapS; t.wrapT = base.wrapT;
    t.colorSpace = THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  }

  function correctMaterials(root) {
    let paint = null;
    let metalMaskFrom = null;
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = false;

      const m = o.material;
      if (!m) return;

      /* The headlamp lenses, separated out of `Interior` by dev/prep_shelby.py.
         Before that surgery they were four thousand faces inside a forty
         thousand vertex object, mapped to a ten-pixel patch of leather grain
         that magnified into what looked exactly like tyre tread. There was
         nothing to address, so there was no material fix — only a geometry
         one. Now there is a node, and it can simply be given glass. */
      if (/^lens/i.test(o.name)) {
        o.material = new THREE.MeshPhysicalMaterial({
          color: 0xdfe6ea,
          roughness: 0.07,
          metalness: 0.0,
          transmission: 0.55,     // enough to show the reflector, not so much
          thickness: 0.02,        // that the lens stops being a surface
          ior: 1.52,
          clearcoat: 1.0,
          clearcoatRoughness: 0.03,
          envMapIntensity: 1.6,
          side: THREE.DoubleSide,
        });
        o.castShadow = false;
        return;
      }

      if (/glass|windscreen/i.test(o.name)) {
        const dark = /dark/i.test(o.name);
        o.material = new THREE.MeshPhysicalMaterial({
          color: dark ? 0x0e1113 : 0xc7d2d8,
          roughness: 0.05, metalness: 0,
          transmission: dark ? 0.22 : 0.92,
          thickness: 0.006, ior: 1.52,
          envMapIntensity: 1.0,
          side: THREE.DoubleSide,
        });
        o.castShadow = false;
        return;
      }

      if (PANEL.test(o.name)) {
        if (!paint) {
          metalMaskFrom = m;
          paint = m.isMeshPhysicalMaterial ? m.clone() : Object.assign(new THREE.MeshPhysicalMaterial(), {
            map: m.map, normalMap: m.normalMap, normalScale: m.normalScale,
            roughnessMap: m.roughnessMap, color: m.color, name: m.name,
          });
          paint.name = m.name + '__lacquer';
          paint.roughness = 0.24;
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

    if (paint && paint.map) {
      const mask = buildMetalMask(paint.map, metalMaskFrom);
      if (mask) {
        paint.metalnessMap = mask;
        paint.roughnessMap = mask;   // green channel is the authored roughness
        paint.metalness = 1.0;       // the mask decides; the factor only gates it
        paint.needsUpdate = true;
      } else {
        // no pixels to read — fall back to dielectric paint, which is right for
        // the shell and merely dull on the chrome
        paint.metalnessMap = null;
        paint.metalness = 0.0;
        paint.needsUpdate = true;
      }
    }
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
      car.position.set(-c.x, -box.min.y, -c.z);

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
