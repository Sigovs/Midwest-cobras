#!/usr/bin/env python3
"""
Blender -> GLB, run headless. Nothing about this is interactive.

    /Applications/Blender.app/Contents/MacOS/Blender -b \
        --python dev/blender_to_glb.py -- <in.blend|in.fbx|in.obj> <out.glb>

WHY BLENDER AND NOT THE CONVERTER NEXT DOOR. dev/obj2glb.py exists because the
client handed us an OBJ and nothing else. OBJ has no node tree — only flat
groups — and this project's assembly directions read the car through NODE NAMES
and PARENT TRANSFORMS: parts.js names prefixes, and every mesh sits at the
origin with its real translation on the group above it. Convert through OBJ and
that structure is gone, silently, and every wheel lands at 0,0,0.

So the rule for any bought model is: come in through .blend or .fbx, and let
Blender's glTF exporter — the reference implementation — carry the hierarchy.

WHAT THIS DOES NOT DO. It does not join meshes, apply parent transforms, rename
anything or "clean up" the scene. Every one of those would destroy the thing we
are importing the model for. It reports what it found and leaves it alone.
"""
import bpy
import sys
import os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
if len(argv) < 2:
    print('usage: blender_to_glb.py -- <in> <out.glb>')
    sys.exit(2)

src, dst = os.path.abspath(argv[0]), os.path.abspath(argv[1])
ext = os.path.splitext(src)[1].lower()

# ── load ────────────────────────────────────────────────────────────────────
if ext == '.blend':
    bpy.ops.wm.open_mainfile(filepath=src)
else:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if ext == '.fbx':
        # automatic bone orientation matters for rigs; this model has none, but
        # the flag also governs how empties are read, and empties are how a lot
        # of car models carry their part groups.
        bpy.ops.import_scene.fbx(filepath=src, use_custom_normals=True,
                                 use_image_search=True)
    elif ext == '.obj':
        try:
            bpy.ops.wm.obj_import(filepath=src)          # Blender 3.3+
        except AttributeError:
            bpy.ops.import_scene.obj(filepath=src)        # older
    elif ext in ('.gltf', '.glb'):
        bpy.ops.import_scene.gltf(filepath=src)
    else:
        print(f'unsupported input: {ext}')
        sys.exit(2)

# ── report what arrived, before touching anything ───────────────────────────
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
empties = [o for o in bpy.data.objects if o.type == 'EMPTY']
tris = 0
for o in meshes:
    m = o.data
    try:
        m.calc_loop_triangles()
        tris += len(m.loop_triangles)
    except Exception:
        tris += max(0, len(m.polygons))

print(f'[in ] objects        {len(bpy.data.objects)}')
print(f'[in ] mesh objects   {len(meshes)}')
print(f'[in ] empties/groups {len(empties)}')
print(f'[in ] materials      {len(bpy.data.materials)}')
print(f'[in ] images         {len(bpy.data.images)}')
print(f'[in ] triangles      {tris:,}')

# The bounding box in world space, because the size the model thinks it is and
# the size a scene needs it to be are two different numbers and the second one
# is decided later, not here.
lo = Vector((float('inf'),) * 3)
hi = Vector((float('-inf'),) * 3)
for o in meshes:
    for corner in o.bound_box:
        w = o.matrix_world @ Vector(corner)
        for i in range(3):
            lo[i] = min(lo[i], w[i]); hi[i] = max(hi[i], w[i])
if meshes:
    size = [round(hi[i] - lo[i], 4) for i in range(3)]
    print(f'[in ] world bbox     {size}   (units as authored, NOT normalised)')

print('[in ] top-level names, first 40:')
for o in sorted([o for o in bpy.data.objects if o.parent is None], key=lambda x: x.name)[:40]:
    kids = len(o.children_recursive) if hasattr(o, 'children_recursive') else len(o.children)
    print(f'       {o.type:6s} {o.name}   (+{kids} below)')

# ── export ──────────────────────────────────────────────────────────────────
# Options are filtered against the operator's own properties, so this script
# survives a Blender upgrade renaming a flag rather than dying on it.
wanted = dict(
    filepath=dst,
    export_format='GLB',
    use_selection=False,
    export_apply=True,            # modifiers baked; parent transforms untouched
    export_yup=True,
    export_materials='EXPORT',
    export_image_format='AUTO',
    export_cameras=False,
    export_lights=False,
    export_extras=False,
    export_animations=False,
    export_draco_mesh_compression_enable=False,   # gltf-transform does that step
)
rna = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
kwargs = {k: v for k, v in wanted.items() if k in rna}
dropped = [k for k in wanted if k not in rna]
if dropped:
    print(f'[note] this Blender does not have: {", ".join(dropped)}')

bpy.ops.export_scene.gltf(**kwargs)

size_mb = os.path.getsize(dst) / 1024 / 1024
print(f'[out] {dst}')
print(f'[out] {size_mb:.2f} MB  (before gltf-transform)')
