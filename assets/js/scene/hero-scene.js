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
import { Reflector } from '../vendor/jsm/objects/Reflector.js';

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

  /* The parts that can be switched on. Collected by what they ARE — a lamp, a
     lens, an instrument — never by index, because the next model will not
     number its materials the same way and a list of indices fails silently. */
  const lamps = [];

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

      /* Headlamps, their lenses, and the instruments behind the wheel. They
         start dark: a car standing in a lit room with its lights already on is
         a car nobody switched on, which is a different picture. */
      if (/lights|lightsglass|luz|lamp|glow/i.test(m.name || '')) {
        m.emissive = new THREE.Color(/glow/i.test(m.name) ? 0xffb95e : 0xfff2d6);
        m.emissiveIntensity = 0;
        m.toneMapped = true;
        lamps.push(m);
      }
    });

    /* Transmissive parts throw a shadow shaped like the pane, not like the
       light through it, so they are left out of the map. */
    const first = list[0];
    o.castShadow = !(first && (first.transmission > 0 || first.transparent));
    o.receiveShadow = false;
  });

  /* A model with no maps at all is a different job, not a broken one. The
     client's own SketchUp export is like this: 37 groups, every material a flat
     colour from the default library, nothing PBR anywhere. Left alone it renders
     as the plastic that anti-patterns D8 bans, so it gets dressed by what each
     group IS. A model that arrives with authored maps never reaches this. */
  if (textured === 0 && meshes > 0) {
    console.info(`[scene] ${meshes} meshes, no base maps — dressing by material name.`);
    dressUntextured(root, lamps);
  }

  return { meshes, textured, lamps };
}

/* Materials for a model that brought none.
   ---------------------------------------------------------------------------
   Routed by name, and the ORDER is the whole rule, because three of the names
   this asset carries are traps:

     'Hard Rough Plastic White'          says rough and is not a metal
     'Black Fabric Mesh'                 says mesh and is not a metal
     'Paint Metallic Orange peel Grey'   says orange and is not a lens

   So the specific test always precedes the general one, and no rule is ever
   widened to a bare word: 'metal', 'orange' and 'rough' each capture something
   they should not. */
function dressUntextured(root, lamps) {
  const T = THREE;
  const body       = new T.MeshPhysicalMaterial({ color: 0x22262b, roughness: 0.24, metalness: 0.45, clearcoat: 1.0, clearcoatRoughness: 0.08 });
  const chrome     = new T.MeshStandardMaterial({ color: 0xdcdfe3, roughness: 0.14, metalness: 1.0 });
  const alloy      = new T.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.34, metalness: 1.0 });
  const metalRough = new T.MeshStandardMaterial({ color: 0x6b7076, roughness: 0.55, metalness: 0.9 });
  const hide       = new T.MeshStandardMaterial({ color: 0x121417, roughness: 0.78, metalness: 0.0 });
  const rubber     = new T.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.92, metalness: 0.0 });
  const plastic    = new T.MeshStandardMaterial({ color: 0x15171a, roughness: 0.68, metalness: 0.0 });
  const wood       = new T.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.45, metalness: 0.0 });
  const trim       = new T.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.50, metalness: 0.3 });
  const glass      = new T.MeshPhysicalMaterial({ color: 0xc9d4da, roughness: 0.06, metalness: 0.0, transmission: 0.86, thickness: 0.01, side: T.DoubleSide });
  const amber      = new T.MeshPhysicalMaterial({ color: 0xd97a1a, roughness: 0.15, metalness: 0.0, transmission: 0.70, thickness: 0.01, side: T.DoubleSide });
  const lamp       = new T.MeshStandardMaterial({ color: 0xf3f1ea, roughness: 0.12, metalness: 0.2, emissive: 0xfff2d6, emissiveIntensity: 0 });

  /* Everything in the glb is written doubleSided and obj2glb.py does that
     deliberately: a SketchUp export's winding cannot be trusted, and a face
     wound inwards is culled rather than drawn. Replacing materials throws that
     away, so it is put back. */
  [body, chrome, alloy, metalRough, hide, rubber, plastic, wood, trim, lamp]
    .forEach((m) => { m.side = T.DoubleSide; });

  const fellThrough = new Set();
  const pick = (name) => {
    const n = (name || '').toLowerCase();
    if (/glass ridges orange|ambar|pisca/.test(n)) return amber;
    if (n.includes('luz')) return lamp;
    if (n.includes('glass')) return glass;
    if (/rubber|tire|tyre|pneu/.test(n)) return rubber;
    if (/cuero|couro|bancos|costura|carpete|fabric|cloth/.test(n)) return hide;
    if (/wood|madeira/.test(n)) return wood;
    if (/plastic|plastico/.test(n)) return plastic;
    if (/magnesium|magnesio|alumin/.test(n)) return alloy;
    if (/rough|scratched|circular mesh|soporte/.test(n)) return metalRough;
    if (/cromado|chrome|steel|polished|exaustor/.test(n)) return chrome;
    if (/emblema|^cobra$/.test(n)) return chrome;
    if (/painel|botao|faichas|brilhante/.test(n)) return trim;
    fellThrough.add(name);
    return body;
  };

  root.traverse((o) => {
    if (!o.isMesh) return;
    const name = (o.material && o.material.name) || '';
    const m = pick(name);
    o.material = m;
    o.castShadow = m !== glass && m !== amber;
    o.receiveShadow = false;
  });

  lamps.length = 0;
  lamps.push(lamp);

  /* The paint default is legitimate — the panels belong on it — but a name this
     table has never seen is how 7,000 triangles of black plastic quietly become
     car paint. Silence would look identical to correctness. */
  if (fellThrough.size) {
    console.debug('[scene] materials on the paint default:', [...fellThrough].join(', '));
  }
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
  /* With no floor plane there is nothing left for fog to hide, so it is here
     for depth alone: the far end of the car and anything behind it fall away
     into the same colour the CSS paints, and the scene has no boundary at all. */
  scene.fog = new THREE.Fog(ground, 9, 26);

  /* ── THE ROOM ───────────────────────────────────────────────────────────
     A CAR IS A MIRROR. What reads as its shape is almost entirely the shape of
     the light around it, wrapped over the body — which is why three.js's
     RoomEnvironment, a generic soft box, made an expensive model look like a
     product shot of nothing in particular.

     So the room is built on purpose: a long dark hall with two tall strip
     lights down its sides and a low bar behind the car. The strips are what a
     photographer actually rigs, and they land on the body as two long
     highlights running nose to tail — those highlights are what describes the
     shoulder line, the arch and the sill. Chiaroscuro over fill.

     It is never rendered. PMREM bakes it once and it is thrown away, so it
     costs one prefilter at load, nothing per frame, and no HDRI file at all. */
  function buildRoom(T) {
    const room = new T.Scene();

    const panel = (w, h, d, x, y, z, colour, power) => {
      const m = new T.Mesh(new T.BoxGeometry(w, h, d),
        new T.MeshBasicMaterial({ color: colour }));
      m.material.color.multiplyScalar(power);
      m.position.set(x, y, z);
      room.add(m);
    };

    // the hall, seen from inside
    room.add(new T.Mesh(new T.BoxGeometry(26, 12, 26),
      new T.MeshBasicMaterial({ color: 0x0c0e10, side: T.BackSide })));

    // the pair of long highlights that describe the flanks
    panel(0.5, 5.2, 15, -7.0, 4.4,  0.5, 0xfff3e2, 5.0);
    panel(0.5, 5.2, 15,  7.0, 4.4, -0.5, 0xe8f0ff, 3.4);
    // a low bar behind: the silhouette is cut out of the dark, not lit out of it
    panel(14, 0.6, 0.5,  0.0, 1.1, -8.5, 0xdfe6ee, 2.2);
    // one narrow overhead, to draw the crown of the wings
    panel(3.2, 0.4, 12, -1.2, 5.6,  0.0, 0xfff6ea, 2.6);
    // a cold sliver near the floor — the industrial half of the dialect
    panel(9, 0.25, 0.4,  0.0, 0.18, 6.4, 0x9fc0e0, 1.4);

    return room;
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = buildRoom(THREE);
  scene.environment = pmrem.fromScene(room, 0.018).texture;
  room.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });

  /* ── THE LIGHTS THAT CAST ────────────────────────────────────────────────
     The room does the describing. These two only do what an environment cannot:
     throw a shadow, and put a hard edge along the top of the body. There is no
     ambient fill, deliberately — fill is what turns a lit object into a
     catalogue cut-out, and this direction is only worth having if the dark
     stays dark. */
  const key = new THREE.DirectionalLight(0xfff2dc, 2.6);
  key.position.set(-5.5, 8.5, 5.0);
  if (quality === 'full') {
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -4.2; key.shadow.camera.right = 4.2;
    key.shadow.camera.top = 4.2; key.shadow.camera.bottom = -4.2;
    key.shadow.camera.far = 26;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    key.shadow.radius = 2.5;
  }
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xa8c2dc, 1.15);
  rim.position.set(6.5, 2.2, -6.5);
  scene.add(rim);

  /* ── THE GROUND, AND WHY IT IS NOT A FLOOR ───────────────────────────────
     A floor plane always ends somewhere, and where it ends it draws a line
     across the frame. Fog softens that line; it does not remove it, and the eye
     finds it anyway — a horizon in the middle of a hero is the single loudest
     tell that a car is standing in a WebGL box.

     So there is no floor. There are three transparent layers over nothing, and
     the car is grounded by light rather than by a surface:

       1. a shadow catcher, which shows the key's shadow and nothing else
       2. an elliptical pool of light, painted as a radial gradient
       3. the reflection field, fading out well before it could reach an edge

     Nothing here is opaque, so nothing here has a rim, so there is no horizon
     to see. The CSS ground behind the canvas runs to the top of the page and
     the scene simply sits in it. */

  const groundGroup = new THREE.Group();
  scene.add(groundGroup);

  // 1 · the shadow, and only the shadow
  const shadowCatcher = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 26).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({ opacity: 0.52, transparent: true, depthWrite: false })
  );
  shadowCatcher.receiveShadow = quality === 'full';
  shadowCatcher.position.y = 0.0012;
  groundGroup.add(shadowCatcher);

  /* 2 · the pool. Elliptical rather than round because the car is long: a
         circular pool under a 4 m car reads as a spotlight, an ellipse reads as
         the floor happening to be lit here. Drawn once into a canvas, so it
         costs one texture and no shader. */
  function poolTexture(T) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const rg = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    rg.addColorStop(0.00, 'rgba(255,255,255,0.62)');
    rg.addColorStop(0.28, 'rgba(255,255,255,0.30)');
    rg.addColorStop(0.58, 'rgba(255,255,255,0.10)');
    rg.addColorStop(0.82, 'rgba(255,255,255,0.02)');
    rg.addColorStop(1.00, 'rgba(255,255,255,0)');
    g.fillStyle = rg;
    g.fillRect(0, 0, 256, 256);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    return t;
  }

  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      map: poolTexture(THREE),
      color: 0x39424c,
      transparent: true,
      depthWrite: false,
      toneMapped: true,
    })
  );
  pool.scale.set(17, 1, 11);
  pool.position.y = 0.0006;
  groundGroup.add(pool);

  let mirror = null;
  if (quality === 'full') {
    const reflectorShader = {
      uniforms: {
        color: { value: null },
        tDiffuse: { value: null },
        textureMatrix: { value: null },
        fadeStart: { value: 1.9 },
        fadeEnd: { value: 7.6 },
        strength: { value: 0.46 },
      },
      vertexShader: [
        'uniform mat4 textureMatrix;',
        'varying vec4 vUv;',
        'varying vec3 vWorld;',
        'void main() {',
        '  vUv = textureMatrix * vec4( position, 1.0 );',
        '  vWorld = ( modelMatrix * vec4( position, 1.0 ) ).xyz;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}',
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 color;',
        'uniform sampler2D tDiffuse;',
        'uniform float fadeStart;',
        'uniform float fadeEnd;',
        'uniform float strength;',
        'varying vec4 vUv;',
        'varying vec3 vWorld;',
        'void main() {',
        '  vec4 base = texture2DProj( tDiffuse, vUv );',
        '  float d = length( vWorld.xz );',
        '  float fade = 1.0 - smoothstep( fadeStart, fadeEnd, d );',
        '  gl_FragColor = vec4( base.rgb * color, strength * fade );',
        '  #include <tonemapping_fragment>',
        '  #include <colorspace_fragment>',
        '}',
      ].join('\n'),
    };

    mirror = new Reflector(new THREE.CircleGeometry(11, 64), {
      textureWidth: 512,
      textureHeight: 512,
      color: 0x5f666e,
      shader: reflectorShader,
    });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.y = 0.004;        // above the matte ground, under the tyres
    mirror.material.transparent = true;
    mirror.material.depthWrite = false;
    scene.add(mirror);
  }

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
  /* One value, 0 to 1, for everything that lights up. The choreography decides
     WHEN; this only knows how bright. */
  let lamps = [];
  function setLights(v) {
    const k = Math.max(0, Math.min(1, v || 0));
    for (const m of lamps) m.emissiveIntensity = k * (/glow/i.test(m.name) ? 1.6 : 2.4);
    dirty = true;
  }

  function setPose(p) {
    if (!p) return;
    if (p.lights !== undefined) setLights(p.lights);
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

  /* Screen position of a point ON THE CAR, for the callouts.
     ---------------------------------------------------------------------------
     A caption that says 'side pipe' beside a photograph is a claim. The same
     caption with a line drawn to the pipe is evidence, and it stays evidence
     while the car turns only if the anchor is a point in the car's own space
     rather than a position on the screen. Input is metres in the normalised
     model frame — the same frame data-cam and data-target are written in. */
  const _v = new THREE.Vector3();
  function project(local) {
    if (!car || !local) return null;
    camera.lookAt(target);
    camera.updateMatrixWorld();
    _v.set(local[0], local[1], local[2]);
    pivot.localToWorld(_v);
    const world = _v.clone();
    _v.project(camera);
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    return {
      x: (_v.x * 0.5 + 0.5) * w,
      y: (-_v.y * 0.5 + 0.5) * h,
      /* behind the camera, or off the plate by more than a hair: the caller
         hides rather than drawing a line to nowhere */
      onPlate: _v.z < 1 && _v.x > -1.15 && _v.x < 1.15 && _v.y > -1.15 && _v.y < 1.15,
      depth: world.distanceTo(camera.position),
    };
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
        lamps = prepareModel(car, renderer).lamps;
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

  return { renderer, scene, camera, pivot, ready, setPose, setLights, project, resize, start, stop, dispose,
           get car() { return car; } };
}
