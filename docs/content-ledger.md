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
| The hero still | Rendered from the supplied SketchUp model. It depicts a **generic Cobra, not a Backdraft RT4**, and is marked in `index.html` as a declared placeholder. Presenting it as a photograph of their car would be a claim this asset cannot support. |
| Lot and shop photography | The same placeholder stands in. Alt text says so. |

## What has to happen before this ledger can pass Gate 4

1. Row 7 gets a source or the sentence changes.
2. Rows 8–10 get real content or their sections are cut — and a cut section
   leaves its component and a comment saying what went with it.
3. Any figure added to the configurator (option prices, lead times, engine
   specifications) arrives with a source in the same commit as the copy.
