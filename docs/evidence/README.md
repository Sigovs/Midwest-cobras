# Evidence — the 3D asset, in the order it was found

Four frames, because the verdict in `docs/design-read.md` §8 is a measurement
rather than an opinion and the measurement should be visible.

| | |
|---|---|
| `01-obj-normals-as-shipped.jpg` | The supplied OBJ rendered with its own stored normals. It reads as a hollow shell — you see the inside of the far panels through the near ones. **SketchUp lets a reversed face look correct in its own viewport, so the error ships and nothing announces it.** |
| `02-clay-geometry-only.jpg` | Every material stripped, normals recomputed. This is the honest test of a model: the form alone. Underneath the bad normals is a sound, recognisable Cobra — nose, grille, side pipes, roll bar, spoked wheels. |
| `03-normals-recomputed-62deg.jpg` | `dev/obj2glb.py` with a 62° crease angle, and materials assigned by group. Chrome is chrome, hide is hide, the body has a clearcoat. Usable. |
| `04-composed-hero-frame.jpg` | The composed hero — car right of the optical centre and low, air reserved upper-left, one key and a graded floor. **And the reason the asset is still a placeholder:** the body is low-polygon enough that faceting reads across the fenders at this scale, under any specular light. Diagram-grade, not hero-grade. |

The composition in frame 04 is the deliverable. The car in it is not.
