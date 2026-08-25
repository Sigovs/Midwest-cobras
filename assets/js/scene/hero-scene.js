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

/* The ground the scene sits in. Read from the stylesheet rather than repeated
   here, so the canvas and the CSS behind it can never disagree about what
   colour the page is. */
function groundColour() {
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--graphite-900').trim();
  return new THREE.Color(v || '#1a1d21');
}

/* The material system. The supplied model carries SketchUp's default library —
   "Glass Basic White #1", "Magnesium Rough #1" — which is not PBR and renders
   as plastic. Every mesh is re-assigned here by what the group actually is.
   The names are Portuguese/Spanish because the model is; that is the export we
   were given, not a choice. */
function applyMaterials(root, THREEns) {
  const T = THREEns;
  const body = new T.MeshPhysicalMaterial({
    color: 0x2a3037, roughness: 0.26, metalness: 0.5,
    clearcoat: 1.0, clearcoatRoughness: 0.08,
  });
  const chrome = new T.MeshStandardMaterial({ color: 0xdcdfe3, roughness: 0.14, metalness: 1.0 });
  const hide = new T.MeshStandardMaterial({ color: 0x121417, roughness: 0.78, metalness: 0.0 });
  const glass = new T.MeshPhysicalMaterial({
    color: 0xc9d4da, roughness: 0.06, metalness: 0.0,
    transmission: 0.86, thickness: 0.01, side: T.DoubleSide,
  });
  const lamp = new T.MeshStandardMaterial({
    color: 0xf3f1ea, roughness: 0.12, metalness: 0.2,
    emissive: 0x201f1b, emissiveIntensity: 0.5,
  });
  const trim = new T.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.5, metalness: 0.3 });

  const pick = (name) => {
    const n = name.toLowerCase();
    if (n.includes('glass')) return glass;
    if (n.includes('luz')) return lamp;
    if (/cromado|steel|chrome|magnesium|iron|exaustor/.test(n)) return chrome;
    if (/cuero|bancos|costura|carpete|fabric/.test(n)) return hide;
    if (/painel|botao/.test(n)) return trim;
    return body;
  };

  root.traverse((o) => {
    if (!o.isMesh) return;
    const name = (o.material && o.material.name) || '';
    const m = pick(name);
    o.material = m;
    o.castShadow = m !== glass;
    o.receiveShadow = false;
  });

  return { body, chrome, hide, glass, lamp, trim };
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
  scene.fog = new THREE.Fog(ground, 13, 34);

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
    new THREE.CircleGeometry(30, 64).rotateX(-Math.PI / 2),
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
        applyMaterials(car, THREE);
        // The glb is already centred on X/Z and sitting on y = 0 — obj2glb.py
        // does that at export, because a scene that has to guess where the
        // floor is guesses wrong at every camera angle.
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
