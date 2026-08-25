/* ============================================================================
   scene/cinema.js — the pinned title sequence. Direction C only.
   ----------------------------------------------------------------------------
   DO NOT ROTATE THE CAR ON SCROLL. SHOOT THE CAR ON SCROLL.

   choreography.js, which drives directions A and B, is built on one rule:

     THE CAR TURNS TO FACE WHATEVER IS BEING SAID ABOUT IT.

   That rule is why those pages read as calm and why they also read as a
   turntable. Under it, a headlamp striking or a word crossing behind the car is
   a second competing temporal idea, and the rule says the newer idea is the one
   that goes. So this file does not inherit the rule. It replaces it:

     THE CAMERA TRAVELS. THE CAR RESPONDS — WITH LIGHT, AND WITH ITS PLACE IN
     THE FRAME. Movement, light and type are one event, not three.

   That is a deliberate amendment for one page, written down here rather than
   left to be inferred from the fact that this file ignores the old rule.

   HOW IT IS BUILT

   One master timeline, pinned, with named labels — heroReveal, classicProfile,
   sidePipe, wheelDive, rearReveal, typeInterruption, finalRelease. Everything
   else attaches to those labels, so the order of the film is readable in one
   place instead of scattered across a dozen ScrollTriggers.

   Camera position and camera target travel on SEPARATE CatmullRom curves. That
   separation is the whole difference between a fly-by and an orbit: an orbit
   keeps the subject centred, a fly-by lets the camera pass the car while the
   lens stays on a headlamp, a sill, a wheel. Each segment gets its own short
   path with its own control point, so no two moves have the same shape.
   ========================================================================== */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

gsap.registerPlugin(
  ScrollTrigger,
  ScrollSmoother,
  SplitText,
  MotionPathPlugin
);

import * as THREE from 'three';

const DEG = Math.PI / 180;

/* ── THE SHOT LIST ────────────────────────────────────────────────────────
   Metres, in the model's own frame: X across the car, Y up, Z along it with
   the nose at +Z. `rot` turns the car under the camera and is used sparingly —
   it is here to present a different flank, not to spin.

   `via` is the control point the camera passes through on its way in. It is
   what stops every move being a straight line, and it is different for every
   segment on purpose: the reveal arcs out and up, the dive drops and swings
   in, the orbit goes wide around the tail.

   `hold` is how much of the pinned scroll this shot is worth. They are not
   equal — a macro wants dwelling on and a fly-by wants to be over.           */
const SHOTS = [
  {
    label: 'heroReveal',
    rot: 30, fov: 34,
    cam: [1.95, 1.05, 5.90], target: [-0.35, 0.48, 0.35],
    via: [1.35, 0.70, 3.60], viaTarget: [0.15, 0.52, 1.35],
    hold: 1.35, ease: 'power2.out',
    key: { position: [-5.5, 8.5, 5.0], intensity: 2.6 },
    rim: { position: [6.5, 2.2, -6.5], intensity: 1.15 },
    sweep: { position: [2.4, 0.9, 2.6], intensity: 0 },
  },
  {
    label: 'classicProfile',
    rot: 96, fov: 28,
    cam: [0.10, 0.66, 7.60], target: [-0.45, 0.46, 0],
    via: [1.60, 0.80, 7.10], viaTarget: [-0.10, 0.50, 0.60],
    hold: 1.15, ease: 'power1.inOut',
    /* one long raking highlight down the flank */
    key: { position: [-7.0, 4.2, 2.0], intensity: 2.3 },
    rim: { position: [5.0, 1.6, -5.0], intensity: 1.5 },
    sweep: { position: [1.6, 0.7, 1.2], intensity: 0 },
  },
  {
    label: 'sidePipe',
    rot: 108, fov: 34,
    cam: [1.55, 0.27, 2.30], target: [0.62, 0.25, 0.10],
    via: [1.90, 0.46, 4.60], viaTarget: [0.40, 0.34, 0.70],
    hold: 1.30, ease: 'power2.inOut',
    /* low and warm: the pipe is the subject and metal wants a raking source */
    key: { position: [-3.0, 2.4, 3.4], intensity: 1.9 },
    rim: { position: [4.6, 0.9, -3.4], intensity: 1.9 },
    sweep: { position: [1.5, 0.34, 1.9], intensity: 9 },
  },
  {
    label: 'wheelDive',
    rot: 130, fov: 30,
    cam: [1.28, 0.22, 1.30], target: [0.58, 0.33, 1.00],
    via: [1.72, 0.20, 2.10], viaTarget: [0.60, 0.28, 0.55],
    hold: 1.10, ease: 'power3.inOut',
    key: { position: [-2.2, 3.0, 4.2], intensity: 2.2 },
    rim: { position: [3.6, 0.8, -2.6], intensity: 2.2 },
    sweep: { position: [1.2, 0.30, 1.35], intensity: 7 },
  },
  {
    label: 'rearReveal',
    rot: 216, fov: 30,
    cam: [1.30, 0.92, 5.55], target: [-0.30, 0.52, -0.50],
    via: [2.90, 0.55, 3.10], viaTarget: [0.40, 0.40, -0.20],
    hold: 1.40, ease: 'power2.out',
    /* edge light along the haunch, and the fill drops away behind it */
    key: { position: [-6.2, 5.0, -2.6], intensity: 1.7 },
    rim: { position: [4.2, 1.8, 5.6], intensity: 2.4 },
    sweep: { position: [0.9, 0.7, -1.8], intensity: 0 },
  },
  {
    label: 'typeInterruption',
    rot: 244, fov: 32,
    /* the car is pushed out of frame with setModelOffset, not faded: the
       composition genuinely loses its subject for a beat */
    cam: [1.30, 1.20, 6.60], target: [-2.60, 0.70, 0],
    via: [1.30, 1.05, 6.10], viaTarget: [-1.20, 0.60, -0.30],
    offset: [-3.4, 0, 0],
    hold: 1.25, ease: 'power2.inOut',
    key: { position: [-6.0, 6.0, 0], intensity: 1.1 },
    rim: { position: [5.0, 2.0, 2.0], intensity: 1.0 },
    sweep: { position: [0, 0.6, 0], intensity: 0 },
  },
  {
    label: 'finalRelease',
    /* it comes back from the other side, and from further away */
    rot: 336, fov: 40,
    cam: [-1.35, 1.30, 9.40], target: [0.55, 0.44, 0],
    via: [-3.20, 1.70, 6.20], viaTarget: [-0.60, 0.60, 0.30],
    hold: 1.45, ease: 'power2.out',
    key: { position: [-5.0, 7.0, 5.5], intensity: 2.5 },
    rim: { position: [6.0, 2.4, -5.0], intensity: 1.4 },
    sweep: { position: [0, 0.6, 3], intensity: 0 },
  },
];

/* Which lamps are lit at the end of each shot. The front strikes during the
   reveal; the tails are a separate beat entirely and wait for the rear. */
const LAMPS = {
  heroReveal:       { headL: 1, headR: 1, tailL: 0, tailR: 0 },
  classicProfile:   { headL: 1, headR: 1, tailL: 0, tailR: 0 },
  sidePipe:         { headL: 1, headR: 1, tailL: 0, tailR: 0 },
  wheelDive:        { headL: 1, headR: 1, tailL: 0, tailR: 0 },
  rearReveal:       { headL: 1, headR: 1, tailL: 1, tailR: 1 },
  typeInterruption: { headL: 1, headR: 1, tailL: 1, tailR: 1 },
  finalRelease:     { headL: 1, headR: 1, tailL: 1, tailR: 1 },
};

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const lerp = (a, b, t) => a + (b - a) * t;

export function mountCinema({ scene, mount, still, scope, reveal, isNarrow }) {
  const stage = scope;
  const smoothWrapper = document.querySelector('#smooth-wrapper');

  /* ── ScrollSmoother ─────────────────────────────────────────────────────
     ONE instance, for the page, created before any ScrollTrigger that pins.

     This is a departure from a written rule. CLAUDE.md says: no smooth-scroll
     library, MJ6, the scrollbar is the one control every visitor already owns.
     ScrollSmoother does take the transport — that is what it is for. It is
     here because the camera work in this direction is the point of the page and
     scrubbing it off raw wheel deltas reads as mechanical no matter how the
     easing is written. Smoothing is kept low for the same reason: 1.35, not
     the floaty 2+ that makes a page feel like it is on ice.

     Recorded as a yielded rule, not an oversight. It applies to index3 alone;
     index.html and index2.html still scroll natively. */
  let smoother = ScrollSmoother.get();
  if (!smoother && smoothWrapper) {
    smoother = ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.35,
      effects: true,
      smoothTouch: 0,          // never on touch: it fights the platform scroll
    });
  }

  /* ── curves ────────────────────────────────────────────────────────────
     Two per segment. Built once, never inside the render loop. */
  const segments = [];
  for (let i = 1; i < SHOTS.length; i++) {
    const a = SHOTS[i - 1], b = SHOTS[i];
    segments.push({
      shot: b,
      camPath: new THREE.CatmullRomCurve3(
        [v3(a.cam), v3(b.via || b.cam), v3(b.cam)], false, 'catmullrom', 0.4),
      tgtPath: new THREE.CatmullRomCurve3(
        [v3(a.target), v3(b.viaTarget || b.target), v3(b.target)], false, 'catmullrom', 0.4),
      from: a,
      to: b,
    });
  }

  /* Reused every frame. Nothing is allocated below this line. */
  const _p = new THREE.Vector3();
  const _t = new THREE.Vector3();

  function applySegment(seg, t) {
    seg.camPath.getPointAt(t, _p);
    seg.tgtPath.getPointAt(t, _t);
    const { from, to } = seg;
    scene.setPose({
      rotY: lerp(from.rot, to.rot, t) * DEG,
      cam: [_p.x, _p.y, _p.z],
      target: [_t.x, _t.y, _t.z],
      fov: lerp(from.fov, to.fov, t),
    });
    scene.setKey({
      position: [
        lerp(from.key.position[0], to.key.position[0], t),
        lerp(from.key.position[1], to.key.position[1], t),
        lerp(from.key.position[2], to.key.position[2], t),
      ],
      intensity: lerp(from.key.intensity, to.key.intensity, t),
    });
    scene.setRim({
      position: [
        lerp(from.rim.position[0], to.rim.position[0], t),
        lerp(from.rim.position[1], to.rim.position[1], t),
        lerp(from.rim.position[2], to.rim.position[2], t),
      ],
      intensity: lerp(from.rim.intensity, to.rim.intensity, t),
    });
    if (scene.setSweep) {
      const fs = from.sweep || { position: [0, 0.5, 0], intensity: 0 };
      const ts = to.sweep || { position: [0, 0.5, 0], intensity: 0 };
      scene.setSweep({
        position: [
          lerp(fs.position[0], ts.position[0], t),
          lerp(fs.position[1], ts.position[1], t),
          lerp(fs.position[2], ts.position[2], t),
        ],
        intensity: lerp(fs.intensity, ts.intensity, t),
      });
    }
    const fo = from.offset || [0, 0, 0];
    const to_ = to.offset || [0, 0, 0];
    scene.setModelOffset(lerp(fo[0], to_[0], t), lerp(fo[1], to_[1], t), lerp(fo[2], to_[2], t));
    drawCallout();
  }

  /* opening frame */
  const first = SHOTS[0];
  scene.setPose({ rotY: first.rot * DEG, cam: first.cam, target: first.target, fov: first.fov });
  scene.setKey(first.key);
  scene.setRim(first.rim);
  if (scene.setSweep) scene.setSweep(first.sweep);
  scene.setLights(0);
  scene.start();

  /* the still hands over once the scene can draw */
  gsap.set(mount, { autoAlpha: 0 });
  gsap.timeline()
    .to(mount, { autoAlpha: 1, duration: 0.5, ease: 'none' })
    .to(still, { autoAlpha: 0, duration: 0.5, ease: 'none' }, '<');

  /* ── the callout layer ─────────────────────────────────────────────────
     One line, one node, one label, and never two at once. Geometry comes from
     the car through scene.project(), so the leader turns with it and hides
     itself the moment its anchor faces away. */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const layer = (() => {
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', 'callouts');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVGNS, 'polyline');
    path.setAttribute('class', 'callouts__line');
    const ring = document.createElementNS(SVGNS, 'circle');
    ring.setAttribute('class', 'callouts__ring');
    ring.setAttribute('r', '5');
    const dot = document.createElementNS(SVGNS, 'circle');
    dot.setAttribute('class', 'callouts__dot');
    dot.setAttribute('r', '1.75');
    svg.append(path, ring, dot);
    mount.appendChild(svg);
    return { svg, path, ring, dot };
  })();

  let activeCallout = null;
  function drawCallout() {
    const el = activeCallout;
    if (!el || !el.__anchor) { layer.svg.classList.remove('is-on'); return; }
    const p = scene.project(el.__anchor);
    const body = el.querySelector('.cine-callout__body');
    if (!p || !p.onPlate || !body) { layer.svg.classList.remove('is-on'); return; }
    const m = mount.getBoundingClientRect();
    const r = body.getBoundingClientRect();
    const fromRight = p.x > (r.left - m.left) + r.width / 2;
    const fx = (fromRight ? r.right : r.left) - m.left;
    const fy = Math.max(24, Math.min(m.height - 24, r.top - m.top + 20));
    const ex = fx + (fromRight ? 1 : -1) * Math.min(60, Math.abs(p.x - fx) * 0.34);
    layer.path.setAttribute('points', `${fx},${fy} ${ex},${fy} ${p.x},${p.y}`);
    layer.ring.setAttribute('cx', p.x); layer.ring.setAttribute('cy', p.y);
    layer.dot.setAttribute('cx', p.x); layer.dot.setAttribute('cy', p.y);
    layer.svg.classList.add('is-on');
  }

  /* ── the type ──────────────────────────────────────────────────────────
     SplitText per word, so letters can be staggered and masked. Each giant word
     names the label it belongs to and the direction it enters from, in the
     markup, so the film can be re-cut without touching this file. */
  const words = Array.from(document.querySelectorAll('[data-word]'));
  const splits = new Map();
  for (const w of words) {
    const target = w.querySelector('.cine-word__text') || w;
    const split = new SplitText(target, { type: 'chars,words', charsClass: 'cine-char' });
    splits.set(w, split);
    gsap.set(w, { autoAlpha: 0 });
  }

  /* ── the route ─────────────────────────────────────────────────────────── */
  const route = document.querySelector('[data-route] path');
  if (route) {
    const len = route.getTotalLength();
    gsap.set(route, { strokeDasharray: len, strokeDashoffset: len });
  }
  const routeNode = document.querySelector('[data-route-node]');

  /* ── the master timeline ───────────────────────────────────────────────
     Pinned, scrubbed, and long enough for every move to breathe: the shot
     holds add up to the scroll length rather than the other way round. */
  const totalHold = SHOTS.reduce((n, s, i) => n + (i ? s.hold : 0), 0);
  const VH = isNarrow ? 420 : 640;

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage,
      start: 'top top',
      end: () => '+=' + (window.innerHeight * VH / 100),
      pin: stage,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: () => { if (routeNode) routeNode.style.opacity = ''; },
    },
  });

  tl.addLabel(SHOTS[0].label, 0);

  segments.forEach((seg, i) => {
    const holder = { t: 0 };
    const at = tl.duration();
    tl.to(holder, {
      t: 1,
      duration: seg.shot.hold,
      ease: seg.shot.ease,
      onUpdate: () => applySegment(seg, holder.t),
    }, at);
    tl.addLabel(seg.shot.label, at + seg.shot.hold);
  });

  /* ── lamps: a strike, not a ramp ───────────────────────────────────────
     A lamp coming up smoothly over several hundred pixels of scroll reads as
     the exposure changing. A real one strikes: over, under, over, settle. Four
     steps inside a fifteenth of a segment, so it lands as one event however
     fast the reader is moving. Scrubbed like everything else, so scrolling back
     turns it off again.

     The right headlamp is one step behind the left. That asymmetry is the whole
     reason lamps.js cuts the geometry into four. */
  const lampState = { headL: 0, headR: 0, tailL: 0, tailR: 0 };
  const pushLamps = () => scene.setLights(lampState);

  function strike(corner, at, target) {
    tl.to(lampState, { [corner]: target * 0.18, duration: 0.02, onUpdate: pushLamps }, at)
      .to(lampState, { [corner]: target * 0.62, duration: 0.025, onUpdate: pushLamps })
      .to(lampState, { [corner]: target * 0.28, duration: 0.02, onUpdate: pushLamps })
      .to(lampState, { [corner]: target, duration: 0.09, ease: 'power2.out', onUpdate: pushLamps });
  }

  /* front: during the reveal, left then right */
  strike('headL', tl.labels.heroReveal + 0.45, 1);
  strike('headR', tl.labels.heroReveal + 0.53, 1);
  /* rear: a beat of its own, when the camera has arrived behind the car */
  strike('tailL', tl.labels.rearReveal - 0.30, 1);
  strike('tailR', tl.labels.rearReveal - 0.24, 1);

  /* ── type choreography ─────────────────────────────────────────────────
     Never opacity alone. Every word is masked and every word travels, and the
     direction is declared in the markup so the film reads in one place. */
  for (const w of words) {
    const label = w.dataset.word;
    if (!(label in tl.labels)) continue;
    const at = Math.max(0, tl.labels[label] - (parseFloat(w.dataset.lead) || 0.85));
    const dur = parseFloat(w.dataset.hold) || 1.1;
    const dir = w.dataset.from || 'left';
    const split = splits.get(w);
    const chars = split ? split.chars : [w];

    const enter = {
      left:  { xPercent: -120, yPercent: 0, scale: 1 },
      right: { xPercent: 120, yPercent: 0, scale: 1 },
      up:    { xPercent: 0, yPercent: 130, scale: 1 },
      down:  { xPercent: 0, yPercent: -130, scale: 1 },
      scale: { xPercent: 0, yPercent: 0, scale: 0.62 },
    }[dir] || { xPercent: -120, yPercent: 0, scale: 1 };

    tl.set(w, { autoAlpha: 1 }, at)
      .fromTo(chars, enter, {
        xPercent: 0, yPercent: 0, scale: 1,
        duration: dur * 0.55,
        ease: 'expo.out',
        stagger: { each: 0.012, from: dir === 'right' ? 'end' : 'start' },
      }, at)
      /* the word keeps drifting against the camera for the rest of its life —
         this is the parallax, and it is what puts the letters behind the car
         rather than on the same plane as it */
      .fromTo(w, { xPercent: dir === 'right' ? 6 : -6 }, {
        xPercent: dir === 'right' ? -6 : 6,
        duration: dur, ease: 'none',
      }, at)
      .to(w, { autoAlpha: 0, duration: dur * 0.22 }, at + dur * 0.86);
  }

  /* ── callouts ──────────────────────────────────────────────────────────── */
  const callouts = Array.from(document.querySelectorAll('[data-callout]'));
  for (const c of callouts) {
    const label = c.dataset.callout;
    if (!(label in tl.labels)) continue;
    const a = (c.dataset.anchor || '').split(',').map(Number);
    c.__anchor = a.length === 3 && a.every((n) => !Number.isNaN(n)) ? a : null;
    const at = Math.max(0, tl.labels[label] - 0.55);
    const dur = 0.95;
    gsap.set(c, { autoAlpha: 0 });
    const lines = c.querySelectorAll('.cine-callout__line');
    gsap.set(lines, { yPercent: 115 });
    tl.call(() => { activeCallout = c; drawCallout(); }, null, at)
      .to(c, { autoAlpha: 1, duration: 0.18, onUpdate: drawCallout }, at)
      .to(lines, { yPercent: 0, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, at)
      .to(c, { autoAlpha: 0, duration: 0.18 }, at + dur)
      .call(() => { if (activeCallout === c) { activeCallout = null; drawCallout(); } }, null, at + dur + 0.18);
  }

  /* ── the route line ────────────────────────────────────────────────────
     Draws forward across the middle of the film and retires before the end. It
     is under the canvas, so the car crosses over it — which is the point. */
  if (route) {
    const len = route.getTotalLength();
    tl.to(route, { strokeDashoffset: 0, duration: 2.2, ease: 'none' }, tl.labels.classicProfile - 0.4)
      .to(route, { autoAlpha: 0, duration: 0.4 }, tl.labels.rearReveal + 0.2);
    if (routeNode) {
      tl.to(routeNode, {
        motionPath: { path: route, align: route, alignOrigin: [0.5, 0.5] },
        duration: 2.2, ease: 'none',
      }, tl.labels.classicProfile - 0.4)
        .to(routeNode, { autoAlpha: 0, duration: 0.3 }, tl.labels.rearReveal + 0.2);
    }
  }

  /* ── the hero copy retires ─────────────────────────────────────────────
     It is the opening title, not a caption, and leaving it up for all seven
     shots is what made every frame after the first read as the same frame with
     a different car in it. It leaves the way it would in a title sequence: up
     and out, while the camera is still moving. */
  const fore = document.querySelector('.cinema__fore');
  if (fore) {
    tl.to(fore, { autoAlpha: 0, yPercent: -8, duration: 0.5, ease: 'power2.in' },
      Math.max(0, tl.labels.classicProfile - 0.75));
  }

  /* ── the release ───────────────────────────────────────────────────────
     The pin does not simply end. Over the last stretch the stage lifts and
     fades a little as the section below arrives, so the film hands over instead
     of being switched off. */
  const bridge = document.querySelector('[data-bridge]');
  if (bridge) {
    tl.fromTo(bridge, { autoAlpha: 0, yPercent: 30 },
      { autoAlpha: 1, yPercent: 0, duration: 0.9, ease: 'power2.out' },
      tl.labels.finalRelease - 0.7);
  }

  /* ── housekeeping ──────────────────────────────────────────────────────── */
  ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: () => '+=' + (window.innerHeight * (VH / 100 + 2)),
    onToggle: (self) => {
      mount.classList.toggle('is-live', self.isActive);
      if (self.isActive) scene.start(); else scene.stop();
    },
  });

  ScrollTrigger.addEventListener('refreshInit', () => { scene.resize(); drawCallout(); });
  window.addEventListener('resize', drawCallout, { passive: true });

  /* Absence raises no alarm, so it is asked about directly. */
  if (!words.length) console.warn('[cinema] no [data-word] in this document — the typography layer is empty.');
  if (!callouts.length) console.warn('[cinema] no [data-callout] in this document — nothing points at the car.');

  return () => {
    tl.kill();
    ScrollTrigger.getAll().forEach((t) => t.kill());
    splits.forEach((s) => s.revert());
  };
}

/* index.js imports one name for either director. */
export { mountCinema as mountChoreography };
