# Design Read — Midwest Cobras, LLC

Written before any token, grid or component existed. Everything under
`assets/css/` is downstream of this file; if the two disagree, one of them is
wrong and it is not automatically this one.

Procedure: [TASTE.md](https://github.com/Sigovs/design_dna) §2. Skills read for
this Read: `dimensionality`, `motion-judgment`, `anti-patterns`,
`academic-composition`, plus `dialects/HYBRID.md`, `technical-luxury.md`,
`auction-editorial.md`.

---

## 0 · Delivery mode

```
Delivery: BUILD
```

Three directions were put to Alex on 2026-08-24 — **A** spec-led (the rotation is
the configuration), **B** assembly (the car builds itself on scroll), **C** patient
camera (light moves, not the car). He selected **A**. EXPLORE is closed; this is
one direction taken to completion.

## 1 · The four lines

```
Reading this as a marque site for a builder-dealer of hand-assembled Cobras,
  for a buyer who is commissioning a car rather than picking one off a lot,
  leaning workshop-technical.

Mandate: REDESIGN — but read the carrier list, it is unusually short.

Style mode: HYBRID — anchor technical-luxury / contrast cinematic-industrial /
  signature none; unifying principle: a specification that has been given light.

Dimensionality: MAIN — the buyer's decision is a decision about form, so the form
  is shown in space and the scene carries the dominant.
```

### What REDESIGN carries, named before anything was designed

`midwestcobras.com` is a **"Coming Soon" placeholder** — checked 2026-08-24. There
is no prior site, no prior navigation, no prior composition. The carrier list is
therefore almost empty, and saying so out loud is the point: an unnamed carrier is
a carrier that gets quietly replaced.

| Carried | Treatment |
|---|---|
| The script wordmark | Letterforms kept exactly. Recoloured; the Cobra silhouette beneath it is **dropped** on Alex's instruction — recorded below as a yield |
| The wordmark's colour `#820007` | Leaves the mark and becomes the system's single accent |
| Backdraft Racing as the manufacturer | Present as a manufacturer badge, never as a second brand voice |

**Yield — the silhouette.** `academic-composition` would keep an identity's own
mark intact; Alex judged the lockup weak and instructed that the type be used
alone at this stage. Recorded, not silent. The silhouette file is preserved at
`assets/img/` and can be restored.

**Judgment call, flagged not asked.** Dropping a lockup element and re-colouring
the mark sits close to the REBRAND boundary. It stays REDESIGN because the
letterforms — the only thing a returning visitor would recognise — are untouched.
If the wordmark is later redrawn, the mandate is renegotiated rather than widened
in silence.

## 2 · The hybrid block

```
STYLE MODE:                HYBRID  (Alex named no dialect)
CENTRAL IDEA:              a buyer is not choosing a car, they are writing its
                           specification — and the site lets them see the thing
                           their specification makes
ANCHOR DIALECT:            technical-luxury   (~70%)
ANCHOR RESPONSIBILITIES:   composition, grid, hierarchy, density, typographic
                           voices, spacing, containers, geometry, information
                           presentation, interface motion
CONTRAST DIALECT:          cinematic-industrial   (~30%)
CONTRAST RESPONSIBILITIES: light, depth, material, image behaviour, the scene
                           camera. It stops at the edge of the canvas — it owns
                           no type, no grid, no control, no spacing value
SIGNATURE INFLUENCE:       none
UNIFYING PRINCIPLE:        a specification that has been given light
```

`auction-editorial` was considered as the Signature — the car as a composed lot
record — and **dropped**. Its one candidate device is the spec plate, which
technical-luxury already owns and does better. Incompatibility test Q7: nothing
would be lost by its removal, so it is removed. The house dialect is not a
silent default and it is not here.

**technical-luxury is `provisional`.** Selecting it for this brief neither
promotes it nor counts toward its confirmation, and no record from this project
may be read back as its third support.

### CONTROL MAP — one owner per domain, page-wide

```
composition / grid        → technical-luxury
hierarchy / density       → technical-luxury
typography voices         → technical-luxury
spacing / rhythm          → technical-luxury
colour / contrast         → technical-luxury
image behaviour           → cinematic-industrial
containers / geometry     → technical-luxury
depth / materiality       → cinematic-industrial
motion — interface        → technical-luxury
motion — scene camera     → cinematic-industrial
information presentation  → technical-luxury
task means / CTA rank     → the task. Never a dialect
```

A domain whose owner changes between sections is the failure this map exists to
catch. The scene may not start setting type on the About page because that page
felt flat.

### COLLISION RISKS

- **The named one, from the pairing table: two dark, atmospheric systems merge
  into one mood with no facts in it.** This is precisely the failure of the first
  sketch — a black studio, a glossy car, and six callouts reading *Driver
  Focused · Built by Artisans*. Guardrail: **every callout carries a unit, a
  figure or a named part.** A callout that could be printed on a t-shirt is cut.
- The scene's register leaks into the record surfaces and the specification stops
  being readable. Guardrail: the ground inversion below, and the rule that the
  canvas owns no type.
- The accent turns decorative. Guardrail: remove the accent — the information
  must still be classified.

### REJECTED ALTERNATIVES

- **PURE `cinematic-industrial`** — it would build the sketch as drawn, and the
  page would have atmosphere and no evidence.
- **Anchor `auction-editorial`** — compatible with the brief's *"2–4 vehicles,
  shown large, not a dense grid"*, but it makes the car a lot to be admired, and
  the product here is a commission, not a lot.
- **Signature `expressive-poster`** — one scale collision where the car meets its
  own model name. Held in reserve; it would be a fourth idea in a page that
  already has three.

## 3 · The structural decision specific to this content

Required by `anti-patterns` D10 — one, nameable in a line:

> **The car lives in the dark; its specification lives in the light.**

Two grounds, one system. Scene surfaces are graphite; record surfaces —
configurator, spec plates, finance, service — are bone. Same type, same
hairlines, same rhythm, inverted ground. It is a split by **role**, not by
section, which is what keeps it out of `U11` (sections as competing microsites):
a single page carries both, and a reader who scrolls from the hero into the
configurator watches the light change on the same object.

It also settles a real usability question honestly. A long option list read on
near-black is worse than the same list on paper, and a car photographed on paper
is worse than a car in a lit room. Rather than compromise both, each gets its
own ground.

## 4 · Self-repetition check

`design_dna/projects/` exists so this system can see its own repeats. Read against
it before choosing anything:

| Project | Ground | Display | Accent |
|---|---|---|---|
| lux-cars | near-black `#0B0B0D` | Inter | red |
| 360-auto-care | near-black `#090c0d` | Archivo 900 | orange `#f47a17` |
| hinderer | warm near-black `#1f1d19` | Degular | bronze `#a86537` |
| chicago-motor-cars c2 | bone `#F2EEE7` | Big Shoulders | red `#CB141D` |
| sports-car-rescue | warm paper `#FBF6EA` | Oswald | rust `#A8472A` |

**A fourth near-black car site with a red accent is the repeat this check
exists to prevent.** Hence: the ground is *graphite* `#1A1D21`, measurably
lighter and cooler than all three near-blacks; the accent is oxblood `#820007`,
sampled from the client's own wordmark rather than chosen; the display face is
none of Inter, Archivo, Degular, Big Shoulders or Oswald; and the ground
inversion above exists in none of them.

## 5 · Hero declaration

Required whenever a hero exists. **Full-screen scene, not full-frame object.**

| | |
|---|---|
| **viewport ownership** | The hero owns the first screen entirely, outside persistent chrome |
| **scene treatment** | Constructed: a lit floor plane and a graduated field. Not a photographic studio, not a void — the register of a workshop after hours, with one directional key |
| **object scale** | The car occupies ≈55% of the frame width and sits **below** the optical centre, with air above it. It is not scaled to the viewport edges |
| **focal point** | The front-left quarter — grille, headlight, the wheel arch line |
| **negative-space region** | The upper-left third. It carries the identity mass and the proposition, and it is reserved before the camera is placed, not found afterwards |
| **text safe zone** | Upper-left third on desktop; upper band, full width, on mobile |
| **desktop crop** | Camera decided at 1440×900 first |
| **mobile crop** | Authored separately at 390×844 — a different camera, a different subject scale, not the desktop shot narrowed |
| **asset suitability** | **Unresolved, and named as such.** See §8 |

### The governing event, as named components

| | |
|---|---|
| **event statement** | One car, currently specified this way, standing in the light with its price and its next decision beside it |
| **primary subject** | The car — the live configuration, not a stock render |
| **identity / headline mass** | Wordmark plus the proposition, upper left |
| **supporting evidence mass** | The live spec strip: model, engine, price-from — three facts, mono, tabular |
| **CTA cluster** | *Configure* as primary; *View inventory* as the secondary route, part of the composition rather than parked in the corner |
| **active field** | The lit floor and its graduated falloff — an authored ground, not a backdrop image |
| **intentional negative space** | Upper-left third: it is what the identity mass stands in, and it is the reason the car reads as an object in a room rather than a cut-out |
| **excluded** | The sticky header, the skip link, any consent layer. Named, and not counted toward event coverage |

Each of those maps to a rendered selector before Gate 1 measures anything; the
mapping goes in `.gates/declare.json`, not here.

## 6 · Composition Read — short form

```
Artistic image   a machine standing where it was made, described rather than sold
Masses           1 car+field · 2 identity/proposition · 3 spec strip · 4 CTA pair
                 · 5 the record surface arriving from below
Centres          semantic = the car; optical = front quarter; declared to govern:
                 the optical centre, because the buyer reads a shape before a claim
Dominance        the car, by area, contrast and isolation. The type is second by
                 a wide margin and is meant to be
Direction        down-left → the identity mass, then right along the sill to the
                 CTA, then down into the record surface
Rhythm           one long hold (the scene), then a fast, even meter (the spec
                 rows), then a long hold again (the inventory). Slow-fast-slow
Negative space   upper-left third, active; the falloff behind the rear wheel, active
Tension          the car's mass is right-of-centre and low; the identity mass
                 counterweights high-left. Neither is centred
Edges            the floor plane runs out of frame at both sides; the car's
                 silhouette is never cut
Unity            the light. One key, one falloff, one material logic, everywhere
Type as mass     the wordmark is a shape before it is a word, and it is sized as one
Responsive       at 390px the counterweight cannot be lateral — it becomes
                 vertical: type above, car below, spec strip under the car
Diagnosis        the risk is that the callouts become the composition. They are
                 subordinate by construction: one at a time, anchored to a part
```

## 7 · Motion Read

Runs after the Composition Read, before a line of animation.

```
Subject          a hand-built car and the specification that produces it.
                 Not temporal in itself — but assembly and configuration are
Journey          arrive → understand what this is → see the car → learn three
                 real things about it → configure or go to inventory
Static verdict   the page must read complete with the canvas deleted. The hero
                 falls back to an authored still and the spec strip is HTML
Time adds        rotation binds a fact to the part it is about. A caption saying
                 "side exhaust" next to a photograph is a claim; the same caption
                 with the car turned so the pipe is under it is evidence
Register         heightened — the reason is the commission, not the word luxury:
                 a buyer spending $66,900+ on an object that does not exist yet
                 is buying a picture of it, and the picture is the argument
Primary idea     one, and only one: the car turns to face what is being said
Stable           the header, the identity mass, the spec strip, all body copy,
                 all controls, all prices
Roles            hero scene       → spatial explanation
                 callout sequence → narrative progression
                 configurator     → state change + feedback
                 section entrances→ continuity
Transport        the reader's, entirely. Scroll drives; scroll is never taken.
                 No pin that cannot be left, no sequence that must complete
Learning         nothing. The car, the price and both routes are legible before
                 anything moves. The scene is depth, and depth may be learned;
                 the entrance may not
Mobile           re-authored. Fewer callouts, a shorter arc, a nearer camera —
                 and "no scene at all below a measured frame budget" stays a
                 legal outcome, decided on the device, not in this file
Reduced motion   an authored still: the hero's best frame, composed as a
                 photograph, with all callouts present at once as a spec plate.
                 Not the animation, stopped
Cost             a payload the page must not wait on; a frame budget that will
                 be tight on mid Android; attention spent on rotation that is not
                 spent reading; and a real risk that the sequence reads as a
                 showreel on the second visit
Cut              — the page-load fly-in as a gate. It plays, but the first read
                    never waits for it
                  — the "drives away / overhead view" ending. It is a second
                    spatial idea in one view (DM6) and it buys nothing the
                    configurator transition does not already buy
                  — ambient rotation while idle. Scroll-linked only, so the car
                    stands still while a callout is being read
                  — the scroll-cue chevron. A page that must announce it scrolls
                    has a different problem
```

**Frame and payload budget, declared before building** (`DM3`):

| | |
|---|---|
| Target | 60 fps desktop (M1 / mid discrete GPU) |
| Floor | 30 fps on iPhone 12 and a mid-range 2022 Android |
| Scene payload ceiling | **3.5 MB** — geometry + textures + loader, compressed |
| Load order | the scene is fetched **after** first paint and after the fallback still is on screen |

Exceeded means scope is cut. Not the budget.

## 8 · The asset problem, stated rather than discovered later

`COBRA.obj` is a SketchUp export: **83,951 faces, 199,375 vertices with no
sharing, 37 materials** whose names are the SketchUp defaults —
`Glass Basic White #1`, `Magnesium Rough #1`, `Iron Rough #2`. There is no PBR
material in it. Untouched, it renders as the exact plastic that
`anti-patterns` D8 bans.

Second, and larger: **it is a generic Cobra, not a Backdraft.** Midwest Cobras
sells Backdraft RT4 and RT4B, which have their own side pipes, roll bars, wheels
and interior. A scene that presents this geometry as *their* car is a claim about
a real product that the geometry does not support.

Three honest outcomes, and the choice is Alex's:

1. Re-material and re-detail the model toward the RT4 — real cost, real result.
2. Keep it, and label the scene as an illustration of the type, not the car.
3. Build the hero on the client's own footage and let 3D live only inside the
   configurator, where the geometry is a diagram and nobody reads it as a photograph.

Until one is chosen, the hero's **asset suitability** field above stays
unresolved, and no gate can pass on it.

## 9 · Content ledger status

Sourced so far, and citable: two models and their starting prices — RT4 Classic
Edition from **$66,900**, RT4B Black Edition from **$70,500** — and named options:
ceramic-coated black side pipes and roll bars, 18" matte black rims, interior
options. Source: `backdraftracing.com`, read 2026-08-24.

Unsourced and therefore not yet allowed into the render as fact: the *"40 years of
experience"* in the brief, any horsepower or weight figure, any build duration.

**Known compromise, authorised by Alex on 2026-08-24:** this build is a client
mock, not a final. Unverified claims may appear as ordinary copy rather than as
visible placeholders. The ledger still records every one of them as
`unverified — client to confirm`, so the list exists before the final build needs
it. This is a named yield of `content-provenance`, not an absent gate.
