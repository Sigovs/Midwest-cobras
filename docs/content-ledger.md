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
| 7 | `Forty years…` | Who we are | **sourced** | Client brief, `docs/brief-midwest-cobras.pdf`: *"Emphasize 40 years of experience."* Confirmed by the client via Alex, 2026-08-27. No longer blocks Gate 4. |
| 8 | Customer reviews | Owners, index9 §07 | **unverified — client to confirm** | Both quotations and both attributions are transcribed from Alex's own v4 mockup, `donot git/midwest-cobras-v4.png`. **I have written none of them and added no name, city or chassis number that is not in that file** — which keeps this row's original rule that nothing is invented, while letting the client's draft stand as draft. It is not a source: a mockup is a design, and the named owners still have to be real people who said these words. |
| 9 | Event dates | Owners | **placeholder, visibly so** | None. Dates read `TBC`. |
| 10 | Address, phone | Footer | **sourced** | Client dealer form supplied by Alex, 2026-08-27: Midwest Cobras, LLC — 14510 Parallel Lane, Basehor, KS 66007 — 913-662-5000 — www.midwestcobras.com. No email address was given, so the footer carries none. |

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

## index9's below-the-fold — the v4 mockup, transcribed 2026-08-28

Alex supplied `donot git/midwest-cobras-v4.png` and asked for the below-fold to
be filled from it. **Every string in sections 02–09 of index9 is transcribed from
that file. None of it is written by me**, which is the same standing the hero
storyboard has above: the client's own draft copy, recorded here as draft.

**Nothing below is sourced.** All of it stands under the compromise Alex
authorised on 2026-08-24 — client mock, unverified claims may appear as ordinary
copy, the ledger records each one. That authorisation is not a source.

| Where | Claim in the render | Status |
|---|---|---|
| 02 | `Four cars, not four hundred.` | **unverified** — a production-volume claim, the exact class this ledger exists to catch. It is the section's headline, so it cannot be quietly softened; it needs the client's word or a different headline |
| 02 | `$144,500` · `$152,000` | **unverified** — the sourced figures are *from* $66,900 and *from* $70,500 (rows 1–2). These are specific cars at specific prices and nothing supports them |
| 02 | `BDR2084` · `BDR2112` | **unverified** — chassis numbers name individual vehicles |
| 02 | `Roush 427 SR (510 HP)` · `Tremec TKO600 5-Speed` · `Coyote 5.0L Gen 3 V8` | **unverified** — real products, but nothing establishes these cars carry them. A horsepower figure is a claim |
| 02 | `Guardsman Blue / White Stripes` · `Liquid Graphite / Black Accents` | **unverified** — colour names for specific cars |
| 02 | `In stock` · `Commission in progress` | **unverified** — availability is a statement a buyer acts on |
| 02, 05 | `our Basehor facility` · `transport from Basehor` | **CHANGED FROM THE MOCKUP.** v4 reads *Lake Forest*; row 10, sourced 2026-08-27, puts the company at Basehor, KS. The sourced address wins and the change is recorded rather than made quietly. If Lake Forest is a second, real facility, it goes back and gets its own row |
| 03 | `Guardsman Metallic Blue` · `18" Polished Halibrand Style` · `Polished Stainless Steel` · `Sabin Diamond-Stitched Leather` | **unverified** — configurator options. Any of these carrying a price or a lead time needs a source in the same commit as the figure. **`Sabin` is transcribed exactly as the mockup spells it and is probably meant to be `Satin`** — flagged rather than corrected, because a material name is the client's to fix |
| 03 | `Fig 3.1 — chassis specification diagram` · `Backdraft Racing Inc.` | descriptive; the Backdraft attribution is supported by row 6 |
| 04 | `a four-decade obsession` | **sourced** — same fact as row 7, confirmed 2026-08-27 |
| 04 | `Midwest Cobras was born from…` · `in partnership with Backdraft Racing` | **unverified** — the partnership is consistent with row 6's dealer listing; the origin story is not established |
| 04 | `brutally fast performance roadsters` | **unverified** — a performance superlative |
| 05 | `private, climate-controlled enclosed transporters` · `Fully insured white-glove transport` | **unverified, and insurance is the word to watch.** "Fully insured" is a coverage claim a customer would rely on. Flagged for the client rather than softened here |
| 05 | `dyno tuning` · `custom suspension geometry alignment` | **unverified** — a list of services offered |
| 06 | `Our global collector network` | **unverified** — a coverage claim |
| 07 | Both quotations, `David K.` / Chicago, IL / RT4 Classic #2044, `Harlan V.` / St. Charles, IL / RT4B Black #1988 | **unverified — client to confirm.** See the note under row 8 below |
| 07 | `Verified commissions` | **unverified** — it asserts the quotes have been verified, which is precisely what has not happened |
| 08 | `Chassis setup / Deerfield` | **unverified** — names a location that is neither Basehor nor Lake Forest |
| 09 | `Not affiliated with Carroll Shelby Licensing.` | **unverified — needs the client's legal position, not mine.** It is a disclaimer about a third party's trademark and it either is or is not the client's counsel's wording |
| 09 | address, telephone, `midwestcobras.com` | **sourced** — row 10 |

**Three things from the mockup are deliberately NOT on the page:**

- `inquire@midwestcobras.com` — row 10 records that no email address was
  supplied. A mailto that bounces is worse than no mailto.
- `847.555.0184` — **555 is the reserved fictional exchange**, which is the tell
  that the mockup's contact block was filler. The sourced number is used instead.
- `© 2024` — the mockup's footer year. The page reads 2026.

**All photography is absent and says so.** Alex is supplying it. Every image slot
is an empty plate carrying its own subject and aspect in mono type — eleven of
them. Nothing on this page is a borrowed photograph, which is a step forward from
the four Hinderer images recorded above: those are still on the older index
pages, and they are still somebody else's property.

## What has to happen before this ledger can pass Gate 4

0. ~~The hero model is replaced with a commercially licensed one.~~ **DONE.**

   *History, kept because it is the reason the rule exists.* The build once ran
   on a `CC Attribution-NonCommercial-ShareAlike` asset (Ddiaz Design,
   Sketchfab). NonCommercial excludes a dealer's own website by any reading and
   ShareAlike would have put the same licence on the build. It was replaced by
   the purchased *Shelby Cobra 1965 Racing Model* — but the pack shipped with no
   LICENSE file, no readme and no terms across fifteen archives, so the tier was
   unknown and the entry stayed open as *paid for and unverified*.

   **Alex confirmed the licence on 2026-08-28.** That is the same standing as
   rows 7 and 10: the client contact, who holds the receipt and the product page,
   stating the position. This entry no longer blocks Gate 4.

   *One thing would still make the record stronger and it is not a challenge to
   the confirmation:* the ledger names a source for everything else — a URL, a
   document, a date. If the receipt or the product page names the tier in words
   ("Royalty Free", "Editorial Use Only", and so on), that sentence written into
   this row is what a future reader needs, because in a year nobody will
   remember which of the two it was.
0b. **The photography is Midwest's own.** Four borrowed images stand in. This
   is the same class of item as the model licence: it is not a quality problem,
   it is somebody else's property on a page that sells cars.
1. ~~Row 7 gets a source or the sentence changes.~~ **Done** — confirmed by the client via Alex, 2026-08-27.
2. ~~Rows 8–10 get real content or their sections are cut.~~ Row 10 is **done**
   (2026-08-27). Rows 8 and 9 stand: the testimonials are the client's draft, not
   confirmed accounts, and a cut section leaves its component and a comment
   saying what went with it.
2b. **The v4 below-fold block above is settled, line by line.** The three that
   matter most are the production headline (*"Four cars, not four hundred."*),
   *"Fully insured"*, and the Carroll Shelby disclaimer — a volume claim, a
   coverage claim and a trademark position. None of them is mine to soften.
2c. **Basehor or Lake Forest.** The mockup and the sourced dealer form disagree
   about where the company is. The sourced address is on the page; if there are
   two facilities, both get rows.
3. Any figure added to the configurator (option prices, lead times, engine
   specifications) arrives with a source in the same commit as the copy.
