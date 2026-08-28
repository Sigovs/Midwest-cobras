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
| 10 | Address, telephone, domain | Footer | **sourced** | Client dealer form, read from Alex's screenshot 2026-08-28: Midwest Cobras, LLC · 14510 Parallel Lane · Basehor · Kansas · 66007 · 913-662-5000 · www.midwestcobras.com. The Fax field is empty on the form, so there is no fax on the page. |
| 10b | Contact person and direct line | Footer | **sourced** | Same form: **Kristi Kunard, 913-238-6803, kristi@midwestcobras.com**. This supersedes the earlier note that no email was supplied — there is one, and the footer carries it. |
| 10c | `Independent dealer` | Footer | **sourced** | Same form: *"Part of a group or other dealer: **No**."* |

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

**Nine of the eleven image slots are now our own renders. 2026-08-28.** Alex
confirmed the model licence the same day (Gate 4, item 0), and the moment that
closed, the scene could photograph the car itself.

| File | Where it is used |
|---|---|
| `assets/img/lot-rt4.jpg`, `lot-rt4b.jpg` | §02 inventory, the two cars on the floor |
| `assets/img/shop-01.jpg` … `shop-05.jpg` | §08 gallery rail, and two of them again in §04 |

**Their status is `own work — render, not photograph`**, and that is a third thing,
distinct from both *sourced* and *simulated*:

- They are **not borrowed.** Every pixel comes from
  `assets/model/shelby-cobra-427-v8.glb` under the licence Alex confirmed, lit by
  `assets/env/parking_garage_1k.hdr`, through this project's own
  `assets/js/scene/f9.js`. Nothing here is the four Hinderer images' problem.
- They are **not a photograph of a car this dealer owns.** The model is a Shelby
  Cobra 427, the inventory copy names an RT4 and an RT4B, and those are not the
  same car. A buyer looking at §02 is looking at a generic Cobra with the right
  silhouette and the wrong badge. **This is the line that matters and it is the
  one that gets replaced first when Alex supplies his own shoot.**
- They are **consistent with the hero, deliberately.** Same model, same room,
  same light. A page whose photographs and whose 3D disagree about the light
  reads as two pages stitched together.

**Two slots stay empty**, both in §05 services: a workshop bay and a car loaded
into an enclosed transporter. The scene has one car and no building, so those
are photographs or they are nothing. They still carry their labelled plates.

The four Hinderer images recorded above are unchanged: still on the older index
pages, still somebody else's property, still not shipping.

## Photography — Jonathan Motorcars, authorised by Alex 2026-08-28

Alex: *"no copyright issues это наша тоже дилерская. используй"* — Jonathan
Motorcars is part of the same group, and its photography may be used here. That
is the same standing as the model licence in Gate 4 item 0: the client contact
stating the position. **It is the only thing that makes these images usable and
it is worth a written line from whoever owns the group**, because a website is
where a permission gets tested.

Facebook was where he pointed first. It is login-walled and its photo pages
render in script, so nothing is fetchable from it. `jonathanmotorcars.com` is
the same photography and is a plain server, so that is the source.

| File | Source | Car |
|---|---|---|
| `car-rt4-side.jpg` | `/imagetag/2014/…` | Backdraft RT4, indigo blue, white stripes, stock ZT1017 |
| `car-rt4b-side.jpg` | `/imagetag/2016/…` | Backdraft RT4B, red, black stripes, stock ZT1166 |

**The two inventory cards no longer use these.** Replaced 2026-08-28 on Alex's
instruction — *"replace inventory cars. images in ref"* — with the two files he
put in `donot git/refference/`:

| File on the page | Source file | Note |
|---|---|---|
| `car-rt4-front.jpg` | `invenoitry1.png` | |
| `car-rt4b-front.jpg` | `invenoitry2.png` | |

Alex named `RT4_HP_top.jpg` / `RT4B_HP_top-1.jpg` first and then corrected it to
these two. The rejected pair carried a branding band across the lower third — a
large mark and a line of small type beneath the car — which is worth recording
because it is the trap in that folder: **anything off a manufacturer's homepage
arrives with the manufacturer's lockup on it.**

`invenoitry1/2` are clean. Measured row by row, both are flat background above
20% and below 73% of their height with no high-frequency band anywhere, so
nothing had to be cropped away — only 29px off 635 to reach 16:9, then scaled to
1728×972, the size the cards already declared.

**Their alt text is a placeholder and needs a person.** It reads *"RT4 Classic
Edition"* and *"RT4B Black Edition"* and nothing else, because this session
cannot open images and I will not describe a paint colour or a camera angle I
have not seen. The colour was sampled numerically and came back inconclusive for
both. Anyone who can look at the two files should write two real sentences.
| `shot-01.jpg` … `shot-05.jpg` | the same two galleries | crops of the above |

**These are photographs of cars in Jonathan Motorcars' inventory, not Midwest
Cobras'.** §02 presents them as the cars on Midwest's floor, which is the claim
to watch — the photography is authorised, the *placement* is a client mock
standing in for Midwest's own stock. Two prices sit under them, $66,900 and
$70,500, and those are Backdraft Racing's published base prices (rows 1 and 2),
not what these particular cars sell for. Jonathan lists them at $139,995.

**The specification rows are simulated, on Alex's instruction 2026-08-28** —
*"спеки не должны быть точные, симулируй"*. The real ones were available from the
listings (Roush 427IR 580HP, Tremec TKX 5-speed, caramel leather) and are
deliberately not used: they describe a specific car in New Jersey and would read
as Midwest's own build sheet.

**Frames showing the Jonathan Motorcars dealer plate were not used.** Several
rear three-quarters carry it legibly. Another dealership's plate on this page is
a different problem from copyright and it is not solved by permission.

**The renders are gone.** `shop-01`…`shop-05`, `lot-rt4`, `lot-rt4b` — deleted,
not kept. Real photographs of the actual product beat renders of a Shelby 427
wearing an RT4's name, which was the compromise recorded here this morning and is
now closed.

**Still not photographed:** the workshop bay and the enclosed transporter in §05.
Both plates stay.

## Build section — the five cut-outs, 2026-08-28

`build-01.webp` … `build-05.webp`, from `b1.png`…`b5.png` supplied by Alex.
Masked PNGs with alpha, so they are WebP rather than JPEG — a JPEG has no alpha
and would have put a rectangle around a car that was cut out precisely so it
would not have one. Provenance not stated by the client; **ask before launch**,
because these are the only images on the page whose origin this file cannot name.

## Hero video — `video_hero_final`, supplied by Alex 2026-08-28

Three Cobras in a lit shop, headlights coming up, eight seconds. Supplied by the
client, re-encoded here to 1920×1080 with the audio stripped: WebM 1.07 MB, MP4
2.13 MB as the Safari fallback. Provenance not stated; **same question as the
build cut-outs, and it should be answered by the same person.**

## Simulated content — Alex's instruction, 2026-08-28

> *"остальное что не знаешь симулируй"* — fill the remaining holes rather than
> leave them.

Done, and listed here rather than blended in. **Simulated is not sourced and it
is not "unverified — client to confirm" either**: those are the client's own
words waiting for a check, and this is mine, written to hold a shape. It is the
weakest status in this file and every line of it is replaced before anything
ships.

| Where | What | Note |
|---|---|---|
| index10 §07, card 04 | The fourth owner account | The v10 mockup clips it mid-sentence: only *"The side p… which is to… schedule."* and *"Ray T. · RT4B Black Edition"* are legible. The completion is written to match those fragments and nothing else. **A named person did not say this.** |

**Photography is still not simulated, and the renders are not an exception to
that.** A render carries its own honest status — recorded above as *own work —
render, not photograph* — because it depicts a model this project holds a licence
to, not a car sitting in Basehor. What remains forbidden is the thing that was
forbidden before: putting the Hinderer images back to fill a hole. That trades a
visible gap for an invisible one, and an invisible one is the kind that reaches a
client's live site.

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
2c. ~~**Basehor or Lake Forest.**~~ **Closed 2026-08-28.** The dealer form gives
   one address and one only — Basehor, Kansas. *Lake Forest* was the v4 mockup's
   invention and it is on no page. index9's two references were already changed
   to Basehor; index10 names no city in its body copy at all.
3. Any figure added to the configurator (option prices, lead times, engine
   specifications) arrives with a source in the same commit as the copy.
