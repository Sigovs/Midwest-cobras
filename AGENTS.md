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
- **`index1.html` is the sterile master.** New pages are copies of it, loading the
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
the **5 MB scene payload ceiling** declared in the Motion Read. Both are hard.
Exceeded means the scope is cut, not the budget.

**The ceiling was 3.5 MB and Alex raised it to 5 MB on 2026-08-24**, ahead of
knowing what the replacement model would weigh — the supplied SketchUp export was
one wheel and half a chassis, so the scene either got a real car or got cut.

**The room was needed, and then some. Direction F is over the ceiling.**
Measured 2026-08-25, gzipped, counting everything the hero fetches before it can
draw a frame:

| | |
|---|---|
| `assets/model/shelby-cobra-427-v8.glb` | 8.64 MB |
| `assets/env/parking_garage_1k.hdr` | 1.47 MB |
| Draco decoder — `.wasm` + wrapper | 0.10 MB |
| **Total** | **10.21 MB** |

Raw, off a server that does not compress binaries, 10.71 MB.

**THIS IS 2.04× THE CEILING AND IT WAS BOUGHT ON PURPOSE.** Alex looked into the
cockpit at close range on 2026-08-26, saw the carpet rendering as crushed gravel,
and chose the interior atlas at 4096 over the payload. The exterior stays at
2048: body paint has no texture to lose, and a metre of lacquer across a few
hundred texels reads fine.

What it bought, and what it cost:

| | 2048 interior | 4096 interior |
|---|---|---|
| Carpet and leather at close range | crushed gravel | reads as fabric |
| `shelby-cobra-427.glb` | 3.70 MB | **8.64 MB** |
| Total scene payload, gzipped | 5.27 MB | **10.21 MB** |

**4096 is the ceiling of the source.** The vendor's PNGs are 4096 × 4096, so
anything above this is upscaling with no new detail in it. There is nothing
further to buy here at any payload.

The run of measurements, kept because the middle one was the worst: v2 5.45 MB
with a black interior · v3 5.88 MB, materials fixed · v4 5.26 MB, the invented
metal channel removed · v6 10.21 MB, interior at source resolution.

The account of how is short and it is not flattering. The HDR arrived in
direction F as the light source, and nobody counted it. The figure this paragraph
used to carry — 3.27 MB — was true, and it was true about a model this build no
longer loads, and it was a glb-only number sitting in a budget whose own
definition reads *geometry + textures + loader*. A captured room is a texture. It
counts, and it always did.

The earlier boast is deleted rather than footnoted: it measured the wrong thing on
a scene that no longer exists, and a budget line that congratulates itself is the
exact line nobody re-takes.

**It is recorded over the line and it stays over the line** until Alex cuts scope
or raises the ceiling a second time, out loud. Both cuts that exist, and what each
costs:

- **Interior normal map back to 2048** — the single biggest file in the model at
  22 MB of source PNG, and the one that fixed the gravel. Roughly 2 MB back, and
  it gives the gravel back with it. Named first because it is the obvious cut and
  it is the wrong one.
- **Interior ORM at 2048, base colour and normal at 4096** — roughly 1.5 MB, and
  it costs the least: roughness varies slowly across leather and carpet, so it is
  the one map in the set that does not need the density.
- **Environment at 512×256** — about 0.41 MB, saving ~1.06. It gives up some of the
  sharpness in the long interrupted strip highlights, which were the whole reason
  for lighting from a captured room instead of three lamps — and those highlights
  are now doing more work than they were, because there is polished metal on this
  car for them to lie along.
- **Atlases at 1024 instead of 2048** — roughly 2 MB saved, and it is the wrong
  cut. `SIZE` in `dev/vray_to_pbr.py` is one line, but the Goodyear lettering,
  the 427 badge and the gauge faces all live in that resolution, and this build
  just spent a day putting detail back.
- **Fold the cutout map into the base colour's alpha** — about 0.1 MB, and it
  removes a texture rather than degrading one. The smallest honest saving on the
  list.

A budget only works while something is willing to refuse it. This one was widened
once, on 2026-08-24, and it is now spent and overspent — which is worth more
written down than a number nobody re-measured.

**`empty_warehouse_01_1k.hdr` was deleted on 2026-08-25.** Nothing referenced it:
1.67 MB of environment map that never reached a page. Not payload, but the same
failure one step earlier — an asset kept for later, in a tree whose rule is that
an unused token is deleted.

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

1. **The hero model — bought, and the licence document is the open part.**
   Direction F runs on `assets/model/shelby-cobra-427-v8.glb`, built from the
   purchased *Shelby Cobra 1965 Racing Model* pack in `donot git/purchased cobra
   final/`. That closes the CC BY-NC-SA problem the old `ac-cobra-427.glb`
   carried — NonCommercial excluded a dealer's own website, and this is a paid
   asset instead.

   **What is still open is narrow and it is not rhetorical: the pack contains no
   licence file.** Fifteen archives, no LICENSE, no readme, no terms. Marketplace
   models are usually sold under a royalty-free licence that covers a commercial
   website, but "usually" is not a record, and the ledger rule on this project
   does not accept an assumption as a source. Alex has the purchase receipt and
   the product page; one of those names the tier. Until it is written into
   `docs/content-ledger.md` this is *paid for and unverified*, which is a much
   better place than where it was and is still not finished.

   The client's own `COBRA.obj` remains the licence-certain fallback. It is
   visibly coarser, has no textures at all, and is a generic Cobra rather than an
   RT4 — worth keeping in mind only if the licence tier turns out to be personal-use.
2. **Inventory vs Car Collection vs Gallery.** Three separate nav items about
   cars. Working assumption until told otherwise: Inventory = for sale now
   (2–4 cars, shown large); Car Collection = the owner's own cars, not for sale;
   Gallery = the photographic archive. Marked in the markup where it bites.
3. **Consignment.** In the navigation, placed low on the homepage, and marked
   `pending client approval` in the source. It is not deleted if the client cuts
   it — the component and a comment saying what went with it stay in the tree.
