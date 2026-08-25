# dev/ — verification harnesses, not part of the site

Nothing here ships. They exist so a claim about an asset can be checked instead
of asserted.

| | |
|---|---|
| `obj2glb.py` | OBJ → GLB, no dependencies. Welds by the **resolved** v/vt/vn triple — never by the token text, because a negative OBJ index is relative and the same string means a different vertex each time it appears; keying on the text collapsed four wheels into one and kept the face count correct while doing it. Triangulates n-gons by fan, groups primitives by material, recentres and scales to 3.96 m, and **recomputes normals with a 62° crease angle** — the supplied SketchUp export's own normals are inverted, and a reversed face looks correct inside SketchUp, so the error ships silently. Run: `python3 dev/obj2glb.py "<path>/COBRA.obj" assets/model/cobra.glb` |
| `modelcheck.html` | Loads the GLB, exposes `__shoot(view)`, `__clay(recompute)` and `__paint()`. Clay mode is the honest test of geometry: strip every material and look at the form. |
| `herostill.html` | The composed hero frame at 2560×1440, parameterised through `__frame({rot,x,y,z,tx,ty,fov,exp,body})`. This is what produced the placeholder still and the reduced-motion fallback. |

## Downloaded models: convert before committing

A Sketchfab glTF is usually written in `KHR_materials_pbrSpecularGlossiness`, and
three.js **removed that extension in r160** — the revision vendored here. The
loader does not error on it. It falls back to the glTF default material, white
at metallic 1 / roughness 1, and renders a chrome blob with every texture
ignored, which reads as a bad model rather than a bad pipeline. Convert first:

```bash
npx @gltf-transform/cli metalrough in.glb  step1.glb   # spec-gloss -> metallic-roughness
npx @gltf-transform/cli prune     step1.glb step2.glb  # unused UV sets, vertex colours, textures
npx @gltf-transform/cli dedup     step2.glb out.glb
```

`prune` is not optional housekeeping. On `ac-cobra-427.glb` it removed six UV
sets no material referenced and a vertex-colour attribute nothing read — 1.8 MB,
or 35% of the file, on a 5 MB scene budget.

Serve the project root and open `dev/modelcheck.html`. WebGL keeps no drawing
buffer between tasks, so call `__frame()` or `__shoot()` in the **same** task as
`canvas.toBlob()` — otherwise you capture an empty canvas and it looks like a
render failure.

---

## The model pipeline — for a bought model, not the client's OBJ

```bash
dev/model-pipeline.sh ~/Downloads/shelby/Shelby.blend shelby-cobra-427
```

Four steps, each reporting as it goes: Blender import and glTF export →
`gltf-transform optimize` (prune, dedupe, weld, Draco, WebP textures capped at
2048) → a full report of what shipped → the payload measured against the 5 MB
ceiling, which refuses rather than rounds.

| | |
|---|---|
| `blender_to_glb.py` | Headless Blender. Imports `.blend` / `.fbx` / `.obj` / `.glb` and exports GLB **without joining, flattening, renaming or applying parent transforms** — every one of those would destroy the thing the model is being imported for. Options are filtered against the operator's own properties, so a Blender upgrade renaming a flag prints a note instead of crashing. |
| `glb_report.py` | Reads a GLB with no dependencies: triangles, materials with their factors and texture slots, image sizes, bbox, and **node-name prefix families** — which is what `parts.js` is written against. `--tree` prints the hierarchy. |
| `model-pipeline.sh` | The four steps above, in order. Refuses to overwrite an existing model. |

**Come in through `.blend` or `.fbx`, never `.obj`.** OBJ has no node tree, only
flat groups, and the assembly directions read the car through node names and
parent transforms — mesh at the origin, real translation on the group above it.
Convert through OBJ and every wheel lands at 0,0,0, silently.

**Read the names before writing anything against them.** A prefix that matches
nothing produces a part that never arrives, with no error, because nothing is
broken. `glb_report.py` prints the prefix families for exactly that reason.

**`.rar` is not readable on this machine.** No `unar`, no `unrar`, no `7z`, no
Homebrew, and macOS cannot open RAR natively. Unpack with an app, or install one
first — `brew` itself is not present either.
