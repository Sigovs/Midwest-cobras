# dev/ — verification harnesses, not part of the site

Nothing here ships. They exist so a claim about an asset can be checked instead
of asserted.

| | |
|---|---|
| `obj2glb.py` | OBJ → GLB, no dependencies. Welds by the OBJ's own v/vt/vn triple, triangulates, groups primitives by material, recentres and scales to 3.96 m, and **recomputes normals with a 62° crease angle** — the supplied SketchUp export's own normals are inverted, and a reversed face looks correct inside SketchUp, so the error ships silently. Run: `python3 dev/obj2glb.py "<path>/COBRA.obj" assets/model/cobra.glb` |
| `modelcheck.html` | Loads the GLB, exposes `__shoot(view)`, `__clay(recompute)` and `__paint()`. Clay mode is the honest test of geometry: strip every material and look at the form. |
| `herostill.html` | The composed hero frame at 2560×1440, parameterised through `__frame({rot,x,y,z,tx,ty,fov,exp,body})`. This is what produced the placeholder still and the reduced-motion fallback. |

Serve the project root and open `dev/modelcheck.html`. WebGL keeps no drawing
buffer between tasks, so call `__frame()` or `__shoot()` in the **same** task as
`canvas.toBlob()` — otherwise you capture an empty canvas and it looks like a
render failure.
