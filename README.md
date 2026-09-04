# Midwest Cobras, LLC

Static site for a builder-dealer of hand-assembled Backdraft Cobras. No build
step, no framework, no dependencies to install.

```bash
npx serve .            # or
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

---

## The tree

```
.
├── CLAUDE.md                  the rules a change has to keep
├── README.md                  this file
├── DS.html                    the design system — the contract
├── index1.html                the sterile master; every page is a copy of it
│
├── inventory.html             for sale now — 2–4 cars, shown large
├── build.html                 CONFIGURE. the configurator, and the reason
│                              the 3D scene exists
├── service.html               tune-up / service
├── transportation.html        enclosed transport
├── collection.html            car collection — the owner's own cars
├── consignment.html           pending client approval; in nav, low on the page
├── finance.html
├── gallery.html
├── about.html                 who we are — the full page the homepage CTA links to
│
├── assets/
│   ├── css/
│   │   ├── tokens.css         the only file with a raw value in it
│   │   ├── system.css         elements, primitives, shared components
│   │   ├── main.css           page-specific composition
│   │   └── ds.css             DS.html's own layout — never loaded by a page
│   ├── js/
│   │   ├── main.js            nav, motion roles, small interface behaviour
│   │   ├── scene/             three.js — geometry, material, light, camera
│   │   └── build/             the configurator: groups, state, price, summary
│   ├── model/                 cobra.glb and friends — derived, committed
│   ├── img/
│   ├── video/                 encoded deliverables; masters stay out of git
│   ├── fonts/
│   └── icons/
│
├── docs/
│   ├── design-read.md         the direction. Read before anything visual
│   ├── content-ledger.md      every claim, its status, its source
│   └── brief-midwest-cobras.pdf   the client brief, as received
│
├── .gates/
│   └── declare.json           what this build commits to, written BEFORE it is
│                              measured. The rest of .gates/ is generated
│
└── donot git_from client/     client masters. Ignored by git, entirely
```

## The nav, as the brief specifies it

```
Home · Inventory · Build · Service ▾ · Car Collection · Consignment · Finance · Gallery
                                └── Tune-Up / Service
                                └── Transportation
```

**Build is the configurator.** Same slot the word occupies on every builder site
worth copying the idea from, and the reason `dimensionality` was declared MAIN.

**Consignment** stays in the navigation and sits low on the homepage until the
client approves it. If it is cut, the component and its assets stay in the tree
with a comment where the section stood saying what went with it and how to
restore it — a diff cannot give back the reasoning for a section.

## Adding a page

1. Copy `index1.html`. Keep the header, the footer and the stylesheet order
   verbatim; replace the blocks inside `<main>`.
2. Set `[data-ground]` on each section — dark for scene and marque surfaces,
   `light` for anything the visitor has to read a list of facts on.
3. Give each animated mass a `data-motion` role. Never a page-specific id: a
   motion system bound to `#hero-inventory` animates nothing on page two and
   raises no error while failing.
4. Add any new claim to `docs/content-ledger.md` in the same commit as the copy
   that makes it.
5. Re-render `DS.html` in a browser. If the change made it wrong, the change is
   not finished.

## Gates

The chain lives in the design-DNA repo, not here:

```bash
npm run gates -- "/path/to/Midwest Cobras, LLC" --page index1.html
npm run gate5 -- "/path/to/Midwest Cobras, LLC"
```

`.gates/declare.json` must exist first — a build declares what it commits to
before it is measured, which is the whole point of Gate 1. Gate 5 is Alex's
verdict on clean screenshots, and the system may never record it for him.
