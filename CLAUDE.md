# Midwest Cobras, LLC — static site

Builder-dealer of hand-assembled Backdraft Cobras. Static HTML / CSS / JS, no
build step, no framework. Serve with `npx serve .` or `python3 -m http.server`.

The page list and the tree are in [README.md](README.md). The direction — what
this site is, what it may not become, and why every token has the value it has —
is in [docs/design-read.md](docs/design-read.md). **Read that before changing
anything visual.** It is not documentation of the build; the build is downstream
of it.

---

## ⛔ Design DNA — read before any visual work

Before any design, layout, CSS, typography, colour, imagery or motion change,
read and obey **`TASTE.md` from `github.com/Sigovs/design_dna`** (branch
`master`): the two-tier model (invariants never yield, dialects yield for a
stated reason), the Design Read, the Composition Read, the Critique Panel,
EXPLORE vs BUILD, the delivery gates.

**Resolve it from git, never from an absolute path.** A path floats between
machines; an instruction pointing at a directory only one computer has is an
instruction that quietly stops being followed, and nothing announces it.

```
local clone:  <wherever design_dna is cloned>/TASTE.md
raw:          https://raw.githubusercontent.com/Sigovs/design_dna/master/TASTE.md
              …/master/skills/<skill>/SKILL.md
              …/master/dialects/<dialect>.md
              …/master/vault/sites.json        ← the vault query is not optional
```

If neither resolves, say so in the Design Read and work without the references
rather than inventing them.

Silent violations are the failure mode. Anything broken for a real external
constraint is named in the report under *Known compromises*; close calls under
*Judgment calls*.

---

## The direction, in the three lines that decide arguments

- **Anchor is `technical-luxury`.** Specification is content, not an appendix.
  Evidence outranks adjectives. If a claim can be made with a figure or a
  photograph of the real part, it is made that way.
- **Contrast is `cinematic-industrial`, and it owns the canvas and nothing else.**
  Light, depth, material, camera. It sets no type, owns no grid, styles no
  control, and never leaks into a section because that section felt flat.
- **`dimensionality: MAIN`.** The scene carries the dominant. Which means DM1–DM10
  bind at full weight, not as aspirations.

> **The structural decision specific to this content, and the one line that
> settles most questions:
> the car lives in the dark; its specification lives in the light.**

Two grounds, one system. `[data-ground='light']` re-points the semantic colour
aliases at the bone family and changes nothing else — same type, same hairlines,
same rhythm, same components. It is a split by **role**, never by section.

## Project-specific rules

- **[DS.html](DS.html) is the contract.** It is rendered by the site's own
  stylesheets, so it cannot drift. If a change makes DS.html wrong, the change is
  not finished.
- **Tokens first.** Every colour, size, space, radius, duration and easing lives
  in [assets/css/tokens.css](assets/css/tokens.css). Below that file there is no
  hex, no `rgb()`, no px length, no unitless line-height, no duration. Alpha comes
  from a channel token — `rgb(var(--graphite-950-rgb) / 0.55)` — never from a new
  colour. A token nothing uses is deleted, not kept for later.
- **Oxblood is text on light and fill on dark.** `#820007` measures 8.55:1 on bone
  and 2.18:1 on graphite. On the dark ground it is a filled mark with a
  `--bone-050` label at 10.76:1, and it is never a text colour there. This is a
  measurement, not a preference.
- **Three voices, three jobs.** Familjen Grotesk announces, Source Sans 3 informs,
  JetBrains Mono records. Mono carries figures, units and labels — never prose. A
  fourth voice has to state the systemic job the three cannot do.
- **Every number carries its unit and has a source.** A spec row whose value is a
  marketing phrase does not belong in a spec plate. See the ledger rule below.
- **Motion binds to roles, not to instances.** `[data-motion='…']` describes what
  a mass *is*. A selector naming `#hero-inventory` animates nothing on page two
  and raises no error while doing it. The page-load arrival is the one legitimate
  by-name exception.
- **`index.html` is the sterile master.** New pages are copies of it, loading the
  same stylesheets in the same order; the `<main>` blocks are what gets replaced.
- **`donot git_from client/` is the client hand-off folder and stays out of git.**
  284 MB of camera masters, a 20 MB OBJ, a 16 MB SketchUp file. Optimised
  derivatives under `assets/` are what ship.

## Stack, and why each piece is there

| | | |
|---|---|---|
| **three.js** | the scene | Real depth with full control of camera, material and light. The highest-cost option in the toolbox and it is earned here only because `dimensionality: MAIN` was declared — the buyer's decision is about form |
| **GSAP + ScrollTrigger** | the choreography | Binds scroll position to the camera and to the callout sequence. ScrollTrigger drives; it never takes the scroll |
| **CSS transitions from `tokens.css`** | the interface | Hover, focus, press, panel, crossfade. GSAP does not animate a button — a documented duration scale does |

**Scroll smoothing is allowed, and it is one shared module.**
`assets/js/scene/smoother.js` — `smooth: 1.2`, `smoothTouch: 0.1`, one instance
per page, created before any ScrollTrigger that pins. The blanket ban that used
to sit here was lifted on Alex's instruction, 2026-08-25; the direction-C block
that was written as a yield to it is gone with it.

What the ban was standing in front of has not moved. MJ6 owns whether the
visitor still controls the transport, and these bind on every page, smoothed or
not: no pin the reader cannot scroll out of · no sequence that must be watched
to the end · a real, draggable scrollbar that lands where it says · in-page
anchors and the skip link going where they point, which is why the module
patches them rather than leaving them to be discovered by someone using them.

**Under `prefers-reduced-motion` there is no smoothing.** Kept deliberately and
it is not a taste position: smoothing is motion applied to the visitor's own
scrolling, which is the last place someone with a vestibular condition can get
away from it. It is one line in `smoother.js` if it is ever genuinely wanted,
and it should be argued rather than typed.

**1.2 is a judgement, not a rule.** Latency on the reader's own input is a real
cost; the number is low for that reason, and it is worth re-taking on any page
whose job is dense reading rather than a camera move.

**A tool is never a direction.** "A Three.js site" names an implementation, not an
aesthetic family; the family came from the brief and is recorded in the Design
Read.

**JS budget:** GSAP core + ScrollTrigger ≈ 110 KB gzipped, counted separately from
the **5 MB scene payload ceiling** declared in the Motion Read. Both are hard.
Exceeded means the scope is cut, not the budget.

**The ceiling was 3.5 MB and Alex raised it to 5 MB on 2026-08-24**, ahead of
knowing what the replacement model would weigh — the supplied SketchUp export was
one wheel and half a chassis, so the scene either got a real car or got cut.

**It then did not need the room.** `ac-cobra-427.glb` ships at **3.27 MB**, under
the ceiling it replaced, because `gltf-transform prune` removed six UV sets no
material referenced and a vertex-colour attribute nothing read — 1.8 MB of the
5.14 MB the conversion first produced. The raise stands as headroom for the
configurator, and it is recorded here rather than quietly reused: a budget only
works while something is willing to refuse it, and this one has now been widened
once without being spent.

## Content ledger — the rule, and its one authorised exception

Every price, count, date, duration, guarantee and superlative in the render maps
to an entry in `docs/content-ledger.md` with a source that is not a prior concept,
a design read, or an agent's own output.

**Sourced today:** RT4 Classic Edition from $66,900; RT4B Black Edition from
$70,500; ceramic-coated black side pipes and roll bars, 18" matte black rims —
all `backdraftracing.com`, read 2026-08-24.

**Unsourced today:** the brief's *"40 years of experience"*, every horsepower,
weight and build-duration figure.

**Known compromise, authorised by Alex 2026-08-24:** this build is a client mock,
not a final. Unverified claims may appear as ordinary copy rather than as visible
placeholders. The ledger still records each one as `unverified — client to
confirm`. The gate is yielded, out loud; it is not absent.

## Open — do not resolve these by guessing

1. **The hero model's licence — and the choice it forces.** The hero now uses
   `assets/model/ac-cobra-427.glb`, a 1965 AC Shelby 427 with 30 authored PBR
   maps. It is **CC BY-NC-SA**: NonCommercial excludes a dealer's own website, so
   it stands in the client mock and does not ship. A commercially licensed
   equivalent is $30–150.

   There is now a second route, and it exists because the reason we abandoned the
   client's own model was **our bug, not their file** — `dev/obj2glb.py` was
   collapsing relative OBJ indices and turning four wheels into one. Fixed
   2026-08-25. Re-converted, `COBRA.obj` is a whole symmetric car, and it is
   licence-clean because it is the client's own. It is also visibly coarser, has
   **no textures whatsoever**, and is still a generic Cobra rather than an RT4.
   Alex chooses: pay for a good model, or use theirs and accept the grade.
2. **Inventory vs Car Collection vs Gallery.** Three separate nav items about
   cars. Working assumption until told otherwise: Inventory = for sale now
   (2–4 cars, shown large); Car Collection = the owner's own cars, not for sale;
   Gallery = the photographic archive. Marked in the markup where it bites.
3. **Consignment.** In the navigation, placed low on the homepage, and marked
   `pending client approval` in the source. It is not deleted if the client cuts
   it — the component and a comment saying what went with it stay in the tree.
