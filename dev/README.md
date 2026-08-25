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
