/* ============================================================================
   f-story.js — the hero's nine beats, and the scroll that walks them.
   ----------------------------------------------------------------------------
   From Alex's storyboard, `donot git/refference/1.png`: nine framings of one car,
   each with a headline, one or two technical callouts on leader lines, and a
   ghost word behind. The last beat hands the page over to the rest of the site.

   THE SCROLL IS NOT TAKEN. The stage is `position: sticky`, not a ScrollTrigger
   pin, and ScrollTrigger is only asked what the progress is. That distinction is
   the whole of MJ6 here: the scrollbar stays real and lands where it says, the
   page has its true height, in-page anchors work, and a visitor who wants past
   the hero scrolls past it at their own speed. Nothing must be watched to the
   end.

   THE CAMERA MOVES, THE CAR DOES NOT. Every other interaction on this page turns
   the car — a turntable drags the room's strip lights along the wing, which is
   most of what makes the paint read as lacquer. A storyboard is the opposite
   job: it walks around a stationary object, and the light staying put is what
   makes nine frames read as one car rather than nine renders. `turn.yaw` is left
   at zero for the whole sequence and the pose supplies the camera.

   EVERY FRAME IS A COMPOSITION. Beats are interpolated, so the visitor can stop
   anywhere; the callouts are projected from real points on the car each frame
   rather than placed at fixed screen positions, which is why they stay attached
   when the camera is between beats.
   ========================================================================== */

/* ── the beats ───────────────────────────────────────────────────────────────
   `cam` and `target` are metres in scene space: the car's nose is at +Z, it is
   3.95 m long, and it stands on y = 0.

   `at` on a callout is a point ON THE CAR in the same space. It is projected
   every frame, so the leader line stays on the part it names instead of drifting
   off it between beats. `side` decides which edge the label sits against; the
   line is drawn from the label to the projected point.

   Copy is Alex's from the storyboard. Everything claim-shaped in it is in
   docs/content-ledger.md as `unverified — client to confirm`, under the
   compromise authorised on 2026-08-24: this is a client mock, so unverified
   claims may appear as ordinary copy provided the ledger records them. */
export const BEATS = [
  {
    id: 'reveal',
    num: '01',
    kicker: 'Hero reveal',
    head: 'Raw power\nin its purest form.',
    body: 'Handbuilt performance. No shortcuts. No compromise. Just the drive.',
    ghost: 'BUILT',
    pose: { cam: [2.15, 0.52, 3.55], target: [-0.10, 0.46, 0.55], fov: 31 },
    callouts: [
      { label: 'Iconic front end', at: [0.02, 0.42, 1.93], side: 'left' },
    ],
  },
  {
    id: 'profile',
    num: '02',
    kicker: 'The profile',
    head: 'Timeless shape.\nModern performance.',
    body: 'Classic Cobra proportions with a purpose-built soul.',
    ghost: '427',
    pose: { cam: [4.35, 1.05, 5.45], target: [-0.80, 0.56, 0.05], fov: 29 },
    callouts: [
      { label: 'Classic profile', note: 'Haunch to hood. Balanced. Iconic.', at: [0.62, 0.68, -0.95], side: 'right' },
      { label: '427 foundation', note: 'Everything starts here.', at: [0.70, 0.33, 1.22], side: 'left' },
    ],
  },
  {
    id: 'stance',
    num: '03',
    kicker: 'The stance',
    head: 'Low, wide,\nand ready.',
    body: 'A planted stance and perfect proportions built for the road or the track.',
    ghost: 'STANCE',
    pose: { cam: [8.30, 0.82, 0.05], target: [-0.95, 0.60, 0], fov: 25 },
    callouts: [
      { label: 'Perfect stance', note: 'Built for grip and control.', at: [0.86, 0.30, -0.10], side: 'right' },
      { label: 'Side exit exhaust', note: 'Roar with purpose.', at: [0.82, 0.27, -0.55], side: 'right' },
    ],
  },
  {
    id: 'details',
    num: '04',
    kicker: 'The details',
    head: 'Every detail\nearns its keep.',
    body: 'Function first. Beauty always.',
    ghost: null,
    pose: { cam: [2.85, 0.60, -0.55], target: [0.55, 0.40, -0.35], fov: 27 },
    callouts: [
      { label: '427 badging', note: 'A nod to heritage.', at: [0.78, 0.56, 0.52], side: 'right' },
      { label: 'Side pipe exhaust', note: 'Sound. Style. Substance.', at: [0.80, 0.26, -0.95], side: 'left' },
    ],
  },
  {
    id: 'behind',
    num: '05',
    kicker: 'From behind',
    head: 'Power from\nany angle.',
    body: 'Muscle, shape, and purpose in perfect harmony.',
    ghost: 'LOUDER',
    pose: { cam: [3.75, 1.35, -5.30], target: [-0.72, 0.58, -0.30], fov: 29 },
    callouts: [
      { label: 'Roll hoop', note: 'Classic safety. Racer style.', at: [-0.34, 0.96, -0.52], side: 'right' },
      { label: 'Wide rear', note: 'Built for traction and confidence.', at: [0.66, 0.52, -1.58], side: 'right' },
    ],
  },
  {
    id: 'rear',
    num: '06',
    kicker: 'Rear view',
    head: 'Simple.\nBold.\nUnmistakable.',
    body: 'Clean lines. Classic lights. Zero excess.',
    ghost: null,
    pose: { cam: [0.10, 0.98, -6.90], target: [-0.55, 0.56, 0], fov: 24 },
    callouts: [
      { label: 'Tail lights', note: 'Classic look.', at: [0.55, 0.50, -1.88], side: 'right' },
      { label: 'Race ready', note: 'Towing points where you need them.', at: [0.33, 0.18, -1.94], side: 'right' },
    ],
  },
  {
    id: 'top',
    num: '07',
    kicker: 'Hood and cockpit',
    head: 'Form follows\nfunction.',
    body: 'A driver-focused cockpit and a hood that means business.',
    ghost: null,
    /* NOT THE PLAN VIEW ANY MORE. The storyboard asked for top down and it was
       built that way; Alex killed it, and he was right for a reason worth
       keeping. Straight down, the whole frame is the cockpit floor — and the
       cockpit floor is the weakest surface on this model: one carpet texture
       stretched across a tub, with both seats foreshortened to nothing. A beat
       whose sentence is "form follows function" cannot be the single frame
       where the form is a grey rectangle.

       Down the bonnet instead. The scoop, the stripes, the screen, the wheel and
       the side pipe are all in it, both callouts still have something to point
       at, and the sentence lands harder than it did from above. */
    pose: { cam: [1.90, 2.58, 3.75], target: [-0.62, 0.55, -0.30], fov: 31 },
    callouts: [
      { label: 'Hood scoop', note: 'Feeds the beast within.', at: [0.02, 0.78, 0.98], side: 'right' },
      { label: 'Driver focused', note: 'Everything where it should be.', at: [0.32, 0.62, -0.38], side: 'right' },
    ],
  },
  {
    id: 'return',
    num: '08',
    kicker: 'Hero return',
    head: 'Legendary\nby design.',
    body: 'Handbuilt in the Midwest. Built to be driven.',
    ghost: null,
    pose: { cam: [3.55, 1.75, 5.30], target: [-0.78, 0.56, 0.15], fov: 29 },
    callouts: [
      { label: 'Hand built', note: 'In the Midwest. By craftsmen.', at: [-0.58, 0.74, 0.85], side: 'right' },
      { label: 'Timeless finish', note: 'Stripes that never fade in spirit.', at: [0.10, 0.80, 0.28], side: 'right' },
    ],
  },
  {
    id: 'release',
    num: '09',
    kicker: 'Built to order',
    head: 'Built to order.\nBuilt for you.',
    body: 'Not a catalog. A limited world. Start your build.',
    ghost: 'BUILT TO ORDER',
    pose: { cam: [3.55, 1.45, 6.55], target: [0, 0.50, 0], fov: 30 },
    callouts: [],
    release: true,
  },
];

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

/* Eased between beats, linear inside none of them. A constant-velocity camera
   reads as a machine; the ease is what makes each beat a place the camera
   arrives at and leaves, which is what a storyboard frame IS. */
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function poseAt(progress) {
  const p = clamp01(progress) * (BEATS.length - 1);
  const i = Math.min(BEATS.length - 2, Math.floor(p));
  const t = ease(p - i);
  const a = BEATS[i].pose, b = BEATS[i + 1].pose;
  return {
    cam: lerp3(a.cam, b.cam, t),
    target: lerp3(a.target, b.target, t),
    fov: lerp(a.fov, b.fov, t),
    index: p - i < 0.5 ? i : i + 1,   // which beat's TEXT is showing
    local: p - i,
    from: i,
  };
}
