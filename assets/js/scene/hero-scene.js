/* ============================================================================
   hero-scene.js — the three.js scene. Geometry, material, light, camera.
   ----------------------------------------------------------------------------
   It knows nothing about scroll. Choreography lives in choreography.js and
   drives this through setPose(); that separation is what lets the scene be
   tested, and replaced, without touching the timeline.

   Two rules this file exists to keep:

   1. It renders ON DEMAND. There is no permanent rAF loop — a frame is drawn
      when the pose changed and not otherwise. A car that keeps turning while
      nobody is scrolling is ambient motion, and ambient motion beside text
      that has to be read is banned outright, not discouraged.

   2. It never gates anything. The page is complete before this module is even
      fetched; if it fails, the authored still stays and nothing is missing.
   ========================================================================== */

import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';

/* A 427 Cobra is about 156 in nose to tail. Every camera position, every focal
   length and every pose in the markup is expressed in metres against this, so a
   model that arrives in inches, centimetres or Sketchfab units still lands the
   same size in frame. */
const LENGTH_M = 3.96;

/* The ground the scene sits in. Read from the stylesheet rather than repeated
   here, so the canvas and the CSS behind it can never disagree about what
   colour the page is. */
function groundColour() {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--graphite-900').trim();
  return new THREE.Color(v || '#1a1d21');
}

/* The model prep, and the rule it exists to keep: THE AUTHORED MATERIALS STAY.
   ---------------------------------------------------------------------------
   The first model here was a SketchUp export with no PBR and no textures, so
   the scene had to invent a material for every group. This one arrives with 30
   authored maps — base colour, metallic-roughness, normals — and re-assigning
   anything would throw them away and hand back the grey plastic we started
   with. So nothing is replaced. Only three things are touched, and each is a
   property of THIS SCENE rather than of the asset:

     envMapIntensity  how hard the room reflects, which is lighting, not paint
     anisotropy       tyre tread and carpet at a grazing angle, which is a
                      sampler setting the author cannot know our camera for
     castShadow       whether a part throws, which depends on our one key

   NOTE ON THE FORMAT. The download is written in KHR_materials_pbrSpecularGlossiness,
   and three.js removed that extension in r160 — the version vendored here. A
   loader that does not know the extension falls back to the glTF default:
   white, metallic 1, roughness 1, every texture ignored. It does not error; it
   just renders a chrome blob, which reads as a bad model rather than a bad
   pipeline. So the committed asset is converted to metallic-roughness first.
   dev/README.md carries the command. */
function prepareModel(root, renderer) {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const seen = new Set();
  let textured = 0, meshes = 0;

  root.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const list = Array.isArray(o.material) ? o.material : [o.material];

    list.forEach((m) => {
      if (!m || seen.has(m)) return;
      seen.add(m);
      if (m.map) textured++;

      m.envMapIntensity = 0.85;

      [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.aoMap, m.emissiveMap]
        .forEach((t) => { if (t) { t.anisotropy = maxAniso; t.needsUpdate = true; } });
    });

    /* Transmissive parts throw a shadow shaped like the pane, not like the
       light through it, so they are left out of the map. */
    const first = list[0];
    o.castShadow = !(first && (first.transmission > 0 || first.transparent));
    o.receiveShadow = false;
  });

  /* Absence raises no alarm. A model that lost its maps in conversion loads
     without an error and renders as untextured plastic, which is exactly what
     this scene existed to stop being. */
  if (textured === 0) {
    console.warn(`[scene] ${meshes} meshes and not one carries a base map — the model is loading untextured. If it is a Sketchfab download, it is probably still spec-gloss; see dev/README.md.`);
  }

  return { meshes, textured };
}

/* Put the car where the scene expects it, whatever unit it was drawn in.
   ---------------------------------------------------------------------------
   obj2glb.py used to do this at export. A downloaded model cannot be asked to,
   and this one arrives 4 cm long — so the scale is read off the model rather
   than typed in, and the car is centred on X/Z and stood on y = 0. A scene that
   has to guess where the floor is guesses wrong at every camera angle. */
function normalise(root, THREEns, lengthM) {
  const T = THREEns;
  let box = new T.Box3().setFromObject(root);
  const size = box.getSize(new T.Vector3());
  const longest = Math.max(size.x, size.y, size.z);
  if (!longest || !isFinite(longest)) return null;

  root.scale.setScalar(lengthM / longest);
  root.updateMatrixWorld(true);

  box = new T.Box3().setFromObject(root);
  const c = box.getCenter(new T.Vector3());
  root.position.set(-c.x, -box.min.y, -c.z);
  root.updateMatrixWorld(true);

  return new T.Box3().setFromObject(root);
}

export function createHeroScene({ canvas, modelUrl, quality = 'full' }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality === 'full',
    powerPreference: 'high-performance',
  });

  // Device pixel ratio is capped rather than trusted. A 3× phone renders nine
  // times the pixels of a 1× one for a difference nobody can see on a car
  // silhouette, and the frame budget is spent before anything moves.
  const dprCap = quality === 'full' ? 2 : 1.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = quality === 'full';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const ground = groundColour();
  const scene = new THREE.Scene();
  scene.background = null;                 // the CSS ground shows through
  /* Fog far has to sit INSIDE the floor, not past it. The floor used to end at
     30 with fog reaching 34, so its rim was still legible and drew a hard line
     across the frame at roughly the height of the car. Now the ground runs well
     beyond the fog, which means the plane fades to exactly the colour the CSS
     paints behind the canvas and no edge is left to see. */
  scene.fog = new THREE.Fog(ground, 14, 40);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

  // One key, one rim, one bounce. A workshop after hours, not a studio: the
  // dialect's position is material and light over geometry, and a second key
  // is how a lit object turns into a product shot.
  const key = new THREE.DirectionalLight(0xfff4e6, 3.1);
  key.position.set(-5.5, 7.5, 6.5);
  if (quality === 'full') {
    key.castShadow = true;
    key.shadow.mapSize.set(1536, 1536);
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    key.shadow.camera.far = 30;
    key.shadow.bias = -0.0006;
  }
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9fb6cc, 1.6);
  rim.position.set(6, 2.4, -6);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight(0x3a4048, 0x0d0f11, 0.5));

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(140, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x1d2126, roughness: 0.62, metalness: 0.0 })
  );
  floor.receiveShadow = quality === 'full';
  scene.add(floor);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 120);
  const target = new THREE.Vector3(0.45, 0.55, 0);

  const pivot = new THREE.Group();
  scene.add(pivot);

  let dirty = true;
  let running = false;
  let car = null;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  /* The single input this module takes. Choreography computes a pose; the
     scene draws it. Nothing here decides when. */
  function setPose(p) {
    if (!p) return;
    if (p.rotY !== undefined) pivot.rotation.y = p.rotY;
    if (p.fov !== undefined && p.fov !== camera.fov) {
      camera.fov = p.fov;
      camera.updateProjectionMatrix();
    }
    if (p.cam) camera.position.set(p.cam[0], p.cam[1], p.cam[2]);
    if (p.target) target.set(p.target[0], p.target[1], p.target[2]);
    if (p.lift !== undefined) pivot.position.y = p.lift;
    dirty = true;
  }

  function frame() {
    if (!running) return;
    if (dirty) {
      camera.lookAt(target);
      renderer.render(scene, camera);
      dirty = false;
    }
    requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    dirty = true;
    requestAnimationFrame(frame);
  }

  function stop() { running = false; }

  function dispose() {
    stop();
    renderer.dispose();
    pmrem.dispose();
    scene.traverse((o) => {
      if (o.isMesh) {
        o.geometry && o.geometry.dispose();
        if (o.material) {
          const list = Array.isArray(o.material) ? o.material : [o.material];
          list.forEach((m) => m.dispose && m.dispose());
        }
      }
    });
  }

  const ready = new Promise((resolve, reject) => {
    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        car = gltf.scene;
        prepareModel(car, renderer);
        normalise(car, THREE, LENGTH_M);
        pivot.add(car);
        resize();
        resolve({ car });
      },
      undefined,
      reject
    );
  });

  window.addEventListener('resize', resize, { passive: true });

  return { renderer, scene, camera, pivot, ready, setPose, resize, start, stop, dispose,
           get car() { return car; } };
}
