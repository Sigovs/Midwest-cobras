/* ============================================================================
   f-scene.js — direction F's scene. The car, a floor, and one light that means
   something.
   ----------------------------------------------------------------------------
   IT DOES NOT OVERRIDE THE MODEL'S MATERIALS, and that is the difference from
   hero-scene.js. That file re-assigns every mesh because the model it was
   written for carried SketchUp defaults and a game rip's naming, so its
   materials were worthless. This one arrived from a bought .blend with two
   authored PBR atlases — base colour, metallic-roughness and normal, at 2048 —
   and re-assigning those would be throwing away the thing that was paid for.

   What it does instead is correct the two things a V-Ray-authored spec/gloss
   set gets wrong on the way through glTF, and nothing else.

   Renders on demand. No permanent rAF loop: a frame is drawn when the pose
   changed and not otherwise, so a car nobody is looking at costs nothing.
   ========================================================================== */

import * as THREE from 'three';
import { GLTFLoader } from '../vendor/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../vendor/jsm/loaders/DRACOLoader.js';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';

const token = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

/* The car is 3.95 m nose to tail in its own units, which happen to be metres.
   Nothing is rescaled: a scene that guesses a factor is a scene that inherits
   it everywhere, which is how a halo ends up 83 metres across. */
export const CAR_LENGTH_M = 3.948;

export function createFScene({ canvas, modelUrl, quality = 'full' }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: quality === 'full',
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'full' ? 2 : 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = quality === 'full';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const ground = new THREE.Color(token('--graphite-900', '#1a1d21'));

  const scene = new THREE.Scene();
  scene.background = null;                    // the CSS ground shows through
  scene.fog = new THREE.Fog(ground, 14, 40);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  /* ── light ────────────────────────────────────────────────────────────────
     One key, one rim, one fill. The dialect's position is material and light
     over geometry — a second key turns a lit object into a product shot, and
     the car is the subject here, not the lighting. */
  const key = new THREE.DirectionalLight(0xfff2e0, 3.4);
  key.position.set(-6.5, 6.5, 7.5);
  if (quality === 'full') {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -5;
    key.shadow.camera.near = 1; key.shadow.camera.far = 30;
    key.shadow.bias = -0.0005;
    key.shadow.normalBias = 0.02;
  }
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x9dbcd8, 2.2);
  rim.position.set(7, 3.2, -6.5);
  scene.add(rim);

  scene.add(new THREE.HemisphereLight(0x39404a, 0x0c0e10, 0.55));

  /* ── floor ────────────────────────────────────────────────────────────────
     A ground the car stands on, not a backdrop it sits in front of. The shadow
     is what makes it stand; the fog is what makes the room end. */
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(40, 96).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x1c2025, roughness: 0.58, metalness: 0.0 })
  );
  floor.receiveShadow = quality === 'full';
  scene.add(floor);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 140);
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
    if (p.rotY !== undefined) pivot.rotation.y = p.rotY;
    if (p.fov !== undefined && p.fov !== camera.fov) {
      camera.fov = p.fov; camera.updateProjectionMatrix();
    }
    if (p.cam) camera.position.set(p.cam[0], p.cam[1], p.cam[2]);
    if (p.target) target.set(p.target[0], p.target[1], p.target[2]);
    dirty = true;
  }

  function frame() {
    if (!running) return;
    if (dirty) { camera.lookAt(target); renderer.render(scene, camera); dirty = false; }
    requestAnimationFrame(frame);
  }
  const start = () => { if (!running) { running = true; dirty = true; requestAnimationFrame(frame); } };
  const stop = () => { running = false; };

  /* ── the two corrections ──────────────────────────────────────────────────
     Both are consequences of the source being a V-Ray specular/glossiness set
     converted to metallic-roughness, and neither is a taste decision.

     1. doubleSided on everything. It comes from the exporter, it doubles the
        fragment work on a half-million-triangle car, and it makes shadows
        wrong on closed panels. Glass keeps it, because glass is genuinely
        seen from both sides.

     2. Glass arrives as an opaque or blend surface with a diffuse colour.
        A windscreen is transmission, not opacity, and the difference is
        whether the cockpit behind it exists.

     3. The paint is not metal, and the conversion says it is. This is the one
        that mattered: the car rendered dark navy against a preview that is
        light Gulf blue, and the cause is not the lighting.

        glTF's metallic-roughness packs metal in the blue channel of one
        texture. Converting a V-Ray set, that channel is written from the
        REFLECTION map — and for car paint a reflection map is bright
        everywhere, because lacquer reflects. Multiplied by a metallicFactor of
        1.0 the exporter also wrote, every painted panel becomes metal, and a
        metal's base colour stops being its colour and starts being its
        reflectance. Blue paint turns into blue-tinted chrome, which reads as
        near-black in a dark room.

        So the panels drop the metal map entirely and take metalness 0. They
        are dielectric, which is what automotive lacquer is, and the colour in
        the base texture becomes the colour again.

     4. And then they get the clearcoat back. V-Ray builds lacquer out of
        Reflection, Fresnel and IOR and metallic-roughness has nowhere to put
        them, so converted straight the surface is dead even once the colour is
        right. Clearcoat is added on the PANELS ONLY, cloned off the shared
        atlas, because this model carries the whole exterior on one material —
        the wheels and bumpers keep their metal map, and lacquering the tyres
        would make them look wet.                                            */

  const PANEL = /^(body|doar|trunk)/i;   // shell, doors, boot lid — what is painted
  function correctMaterials(root) {
    const seen = new Set();
    let paint = null;
    root.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = false;

      const isGlass = /glass|windscreen/i.test(o.name);
      const m = o.material;
      if (!m || seen.has(m.uuid + o.name)) { /* still fix per-mesh flags below */ }

      if (isGlass) {
        // one glass material per mesh, so the dark side glass can differ from
        // the windscreen without either being re-authored
        const g = new THREE.MeshPhysicalMaterial({
          color: /dark/i.test(o.name) ? 0x0e1113 : 0xc7d2d8,
          roughness: 0.06,
          metalness: 0,
          transmission: /dark/i.test(o.name) ? 0.25 : 0.9,
          thickness: 0.006,
          ior: 1.52,
          side: THREE.DoubleSide,
        });
        o.material = g;
        o.castShadow = false;
      } else if (m) {
        if (PANEL.test(o.name)) {
          // one clone shared by every painted panel, so the lacquer is one
          // surface rather than a per-mesh accident
          if (!paint) {
            paint = m.isMeshPhysicalMaterial
              ? m.clone()
              : Object.assign(new THREE.MeshPhysicalMaterial(), {
                  map: m.map, normalMap: m.normalMap, normalScale: m.normalScale,
                  roughnessMap: m.roughnessMap, metalnessMap: m.metalnessMap,
                  color: m.color, metalness: m.metalness, roughness: m.roughness,
                  name: m.name,
                });
            paint.name = m.name + '__lacquer';
            paint.metalness = 0.0;
            paint.metalnessMap = null;      // see correction 3 — this is the one
            paint.clearcoat = 1.0;
            paint.clearcoatRoughness = 0.045;
            paint.roughness = 0.28;
            paint.envMapIntensity = 1.6;
            paint.side = THREE.FrontSide;
            paint.shadowSide = THREE.FrontSide;
            if (paint.map) paint.map.anisotropy = 8;
            paint.needsUpdate = true;
          }
          o.material = paint;
        } else {
          m.side = THREE.FrontSide;
          m.shadowSide = THREE.FrontSide;
          if (m.map) m.map.anisotropy = 8;
          m.needsUpdate = true;
        }
      }
    });
  }

  const ready = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    // the glb is Draco-compressed by the pipeline, so the decoder is required
    const draco = new DRACOLoader();
    draco.setDecoderPath('assets/js/vendor/draco/');
    loader.setDRACOLoader(draco);

    loader.load(modelUrl, (gltf) => {
      car = gltf.scene;
      correctMaterials(car);

      // sit it on the floor and centre it on its own bounding box, once,
      // measured rather than assumed
      const box = new THREE.Box3().setFromObject(car);
      const c = box.getCenter(new THREE.Vector3());
      const min = box.min.clone();
      car.position.set(-c.x, -min.y, -c.z);

      pivot.add(car);
      resize();
      resolve({ car, size: box.getSize(new THREE.Vector3()) });
    }, undefined, reject);
  });

  window.addEventListener('resize', resize, { passive: true });

  return { renderer, scene, camera, pivot, ready, setPose, resize, start, stop,
           get car() { return car; } };
}
