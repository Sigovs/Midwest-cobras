# Content ledger — Midwest Cobras

Every claim-shaped string in the render maps to a row here: prices, counts,
dates, durations, guarantees, coverage, superlatives. A prior concept, a design
read, or an agent's own output is **never** a source.

**Known compromise, authorised by Alex on 2026-08-24.** This build is a client
mock, not a final. Unverified claims may stand as ordinary copy rather than as
visible placeholders. The ledger still records each one, so the list exists
before the final build needs it. The gate is yielded out loud; it is not absent.

| # | Claim, as rendered | Where | Status | Source |
|---|---|---|---|---|
| 1 | `$66,900` | hero spec strip, Lot 01 | **sourced** | backdraftracing.com — RT4 Classic Edition "starts at", read 2026-08-24 |
| 2 | `$70,500` | Lot 02 | **sourced** | backdraftracing.com — RT4B Black Edition "starts at", read 2026-08-24 |
| 3 | `RT4 Classic Edition`, `RT4B Black Edition` | hero, inventory, build steps | **sourced** | backdraftracing.com nav — MODELS, read 2026-08-24 |
| 4 | `Ceramic-coated side pipes and roll bars` | Lot 01/02, build step 04 | **sourced** | backdraftracing.com — RT4B custom options, read 2026-08-24 |
| 5 | `18 in` rims, matte black | Lot 01/02, build step 03 | **sourced** | backdraftracing.com — RT4B custom options, read 2026-08-24 |
| 6 | `Built by Backdraft` | hero, footer | **sourced** | Backdraft logo supplied in the client asset folder; backdraftracing.com lists DEALERS |
| 7 | `Forty years…` | Who we are | **unverified — client to confirm** | Client brief, `docs/brief-midwest-cobras.pdf`: *"Emphasize 40 years of experience."* Whose forty years, and from what year, is not stated. **Blocks Gate 4 on the final build.** |
| 8 | Customer reviews | Owners | **placeholder, visibly so** | None. Copy reads "to be supplied" and nothing is invented. |
| 9 | Event dates | Owners | **placeholder, visibly so** | None. Dates read `TBC`. |
| 10 | Address, phone | Footer | **placeholder, visibly so** | None. Reads "to be supplied". |

## Not claims, and why they are still listed

| Item | Note |
|---|---|
| The hero still | Re-rendered 2026-08-25 from `assets/model/ac-cobra-427.glb`. The model it replaced rendered as one wheel out of four — but that was `dev/obj2glb.py` collapsing relative OBJ indices, not the client's file, which is 89.6% symmetric and has four wheels. Converter fixed the same day; see `docs/design-read.md` §8. The frames in `docs/evidence/` were taken before the fix and show the bug. |
| Lot and shop photography | **Borrowed, and it does not ship.** The four photographs now on the page — `photo-workshop`, `photo-cobra-black`, `photo-engine`, `photo-backdraft-mark` — are Hinderer Cobras' own photography, taken from `c:/____WORK/HINDERER COBRAS`. They are real Cobras and they read correctly, which is the point of using them in a mock; they are also a different dealer's cars and a different dealer's pictures. Every alt attribute says stand-in. They are replaced by Midwest's own shoot before anything is published. |
| The hero 3D model | A **1965 AC Shelby 427**, not a Backdraft RT4. The RT4 is a replica of exactly this car, so the silhouette is honest; the paint is not — a specific blue-with-white-stripes car rather than anything in the client's catalogue. |

## The hero storyboard — nine beats, added 2026-08-26

Alex's storyboard (`donot git/refference/1.png`) supplied the copy verbatim. The
beats live in `assets/js/scene/f-story.js`; every claim-shaped string in them is
listed here so the ledger and the render cannot drift apart.

**Nothing below is sourced.** All of it is under the compromise Alex authorised
on 2026-08-24: this is a client mock, unverified claims may appear as ordinary
copy rather than as visible placeholders, and the ledger records each one. That
authorisation is not a source and does not become one by being cited.

| Beat | Claim in the render | Status |
|---|---|---|
| 01 | "Handbuilt performance. No shortcuts. No compromise." | unverified — client to confirm |
| 02 | "Classic Cobra proportions with a purpose-built soul." | unverified — client to confirm |
| 02 | "427 foundation — everything starts here." | unverified — the model in the scene is a 427; whether every car Midwest builds is, is not established |
| 03 | "Built for grip and control." | unverified — client to confirm |
| 03 | "Side exit exhaust" | **true of the asset on screen** and of the RT4 as catalogued (backdraftracing.com, read 2026-08-24). Ceramic-coated side pipes are a listed RT4 feature |
| 04 | "427 badging — a nod to heritage." | descriptive of the model on screen; carries no claim about the client's cars |
| 05 | "Roll hoop — classic safety. Racer style." | **"safety" is the word to watch.** A styling hoop is not a certified roll-over structure and the copy must not be read as saying it is. Flagged for the client rather than softened unilaterally |
| 06 | "Tail lights — classic look." | descriptive |
| 06 | "Race ready — towing points where you need them." | unverified — "race ready" is a claim about a car's fitness for competition and needs the client's word |
| 07 | "Hood scoop — feeds the beast within." | descriptive of the model on screen |
| 08 | "Handbuilt in the Midwest. By craftsmen." | unverified — client to confirm |
| 09 | "Not a catalog. A limited world." | unverified — reads as a claim about production volume. The header's "2–4 at a time" in the storyboard is the same claim and is **not** in the build; it stays out until it is sourced |

Two decisions taken while transcribing, both recorded rather than made quietly:

- The storyboard's masthead line **"BUILT TO ORDER. 2–4 AT A TIME."** is not in
  the render. A production figure is exactly the kind of number this ledger
  exists to stop, and it is one sentence to add the moment the client confirms it.
- The storyboard's beat 06 reads **"LED tail lights — modern reliability,
  classic look."** The build says "Tail lights — classic look." The lamps on the
  bought model are not LED units and nobody has said the client's are; "modern
  reliability" is a warranty-shaped claim attached to a component we cannot see.

## What has to happen before this ledger can pass Gate 4

0. **The hero model is replaced with a commercially licensed one.** The current
   asset is `CC Attribution-NonCommercial-ShareAlike` (Ddiaz Design, Sketchfab).
   NonCommercial excludes a dealer's own website by any reading, and ShareAlike
   would put the same licence on the build. It stands in the client mock and it
   does not ship. An equivalent 427 with a royalty-free commercial licence is
   $30–150 on the Sketchfab Store, TurboSquid or CGTrader — the cheapest open
   item on this list, and the only one that is a legal exposure rather than a
   quality one.
0b. **The photography is Midwest's own.** Four borrowed images stand in. This
   is the same class of item as the model licence: it is not a quality problem,
   it is somebody else's property on a page that sells cars.
1. Row 7 gets a source or the sentence changes.
2. Rows 8–10 get real content or their sections are cut — and a cut section
   leaves its component and a comment saying what went with it.
3. Any figure added to the configurator (option prices, lead times, engine
   specifications) arrives with a source in the same commit as the copy.
