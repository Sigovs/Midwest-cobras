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
- **Three voices, three jobs.** Instrument Sans announces, IBM Plex Sans informs,
  IBM Plex Mono records. Mono carries figures, units and labels — never prose. A
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

**No smooth-scroll library.** Not Lenis, not Locomotive, nothing that replaces the
native transport. `MJ6` — the scrollbar is the one control every visitor already
owns, and a page does not get to re-implement it for the sake of its own timing.

**A tool is never a direction.** "A Three.js site" names an implementation, not an
aesthetic family; the family came from the brief and is recorded in the Design
Read.

**JS budget:** GSAP core + ScrollTrigger ≈ 110 KB gzipped, counted separately from
the **3.5 MB scene payload ceiling** declared in the Motion Read. Both are hard.
Exceeded means the scope is cut, not the budget.

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

1. **The 3D asset.** `COBRA.obj` is a SketchUp export — 83,951 faces, 199,375
   unshared vertices, 37 default SketchUp materials, no PBR — and it is a
   **generic Cobra, not a Backdraft RT4**. Presenting it as their car is a claim
   the geometry does not support. Three honest outcomes are listed in
   [docs/design-read.md](docs/design-read.md) §8; Alex chooses.
2. **Inventory vs Car Collection vs Gallery.** Three separate nav items about
   cars. Working assumption until told otherwise: Inventory = for sale now
   (2–4 cars, shown large); Car Collection = the owner's own cars, not for sale;
   Gallery = the photographic archive. Marked in the markup where it bites.
3. **Consignment.** In the navigation, placed low on the homepage, and marked
   `pending client approval` in the source. It is not deleted if the client cuts
   it — the component and a comment saying what went with it stay in the tree.
