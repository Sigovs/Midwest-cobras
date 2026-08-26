#!/usr/bin/env python3
"""
Separate the headlight lenses out of `Interior`, then export.

    /Applications/Blender.app/Contents/MacOS/Blender -b \
        --python dev/prep_shelby.py -- <in.blend> <out.glb> <textures-dir>

WHY THIS EXISTS. The bought model ships the whole car on two baked atlases and
two materials. That is fine for everything except the headlights, and the reason
is measurable rather than aesthetic: the lens's front surface is UV-mapped to a
patch of the Internal atlas roughly ten pixels across, sitting on dark leather
grain. Magnified across a 30 cm lens that patch becomes a blocky pattern that
reads, unmistakably, as tyre tread. It is what Alex saw.

No material assignment can fix it while the lens is 4,000 faces inside a 40,000
vertex `Interior` object, because there is nothing to address. So the lens gets
separated into its own object, by geometry, and then it can simply be given
glass.

The selection is a measured box, not a guess: the lens front sits at
z ≈ 1.87 m, y ≈ 0.565 m, x ≈ ±0.53 m, read off a raycast into the rendered
scene. The box is deliberately tight in z so the reflector behind it — a
different surface with different UVs — stays where it is.
"""
import bpy
import sys
import os
import bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
src, dst = os.path.abspath(argv[0]), os.path.abspath(argv[1])
tex_dir = os.path.abspath(argv[2]) if len(argv) > 2 else None

bpy.ops.wm.open_mainfile(filepath=src)

# ── textures ────────────────────────────────────────────────────────────────
if tex_dir:
    missing = [i for i in bpy.data.images
               if i.source == 'FILE' and not os.path.exists(bpy.path.abspath(i.filepath))]
    if missing:
        bpy.ops.file.find_missing_files(directory=tex_dir)
    bpy.ops.file.pack_all()
    print(f'[tex] {len(bpy.data.images)} images packed')

# ── the surgery ─────────────────────────────────────────────────────────────
# BLENDER SPACE, NOT SCENE SPACE, and the first version of this box was written
# in the wrong one. The lens was measured by raycasting the rendered scene,
# where three.js is Y-up and the car's nose is at +Z; Blender is Z-up, this
# model's length runs along Y, and its nose is at -Y. The exporter converts on
# the way out, so numbers taken off the render select nothing here.
#
#     gltf.x =  blender.x        blender.x =  gltf.x
#     gltf.y =  blender.z        blender.y = -gltf.z
#     gltf.z = -blender.y        blender.z =  gltf.y
#
# Measured lens centre, scene space (0.53, 0.565, 1.87) -> Blender
# (0.53, -1.87, 0.565). The car's own bbox agrees: x +-0.894, y +-1.974 for the
# length, z 0..1.132 for the height.
LENSES = {
    'Lens_right': {'x': (0.36, 0.74),   'y': (-1.99, -1.79), 'z': (0.40, 0.74)},
    'Lens_left':  {'x': (-0.74, -0.36), 'y': (-1.99, -1.79), 'z': (0.40, 0.74)},
    # THE REAR LAMPS HAVE THE SAME DISEASE, and Alex found it before we did: the
    # tail lamp lens is UV-mapped onto the tyre-tread island as well, so a 3 cm
    # oval renders as a slab of Goodyear.
    #
    # dev/probe_tail.py located them by bucketing every tail-half face of
    # `Interior` by its mean UV and printing the result, rather than by tuning a
    # box against a screenshot — which is exactly how the FIRST lens box came to
    # be written in the wrong coordinate space. Both lamps land at
    # x ±0.55..0.59, y 1.90..1.92, z 0.43..0.55. The box below is that, loosened
    # by a couple of centimetres.
    'Lamp_rear_right': {'x': (0.46, 0.68),   'y': (1.84, 1.97), 'z': (0.36, 0.62)},
    'Lamp_rear_left':  {'x': (-0.68, -0.46), 'y': (1.84, 1.97), 'z': (0.36, 0.62)},
}

interior = bpy.data.objects.get('Interior')
if interior is None:
    print('[lens] no Interior object — nothing to separate')
else:
    for name, box in LENSES.items():
        bpy.ops.object.select_all(action='DESELECT')
        bpy.context.view_layer.objects.active = interior
        interior.select_set(True)

        bpy.ops.object.mode_set(mode='EDIT')
        bm = bmesh.from_edit_mesh(interior.data)
        bm.faces.ensure_lookup_table()
        for f in bm.faces:
            f.select = False

        mw = interior.matrix_world
        picked = 0
        for f in bm.faces:
            c = mw @ f.calc_center_median()
            if (box['x'][0] <= c.x <= box['x'][1]
                    and box['y'][0] <= c.y <= box['y'][1]
                    and box['z'][0] <= c.z <= box['z'][1]):
                f.select = True
                picked += 1
        bmesh.update_edit_mesh(interior.data)

        if picked == 0:
            print(f'[lens] {name}: no faces in the box — NOT separated')
            bpy.ops.object.mode_set(mode='OBJECT')
            continue

        bpy.ops.mesh.separate(type='SELECTED')
        bpy.ops.object.mode_set(mode='OBJECT')

        # the separated object is the newly selected one that is not Interior
        new = [o for o in bpy.context.selected_objects if o is not interior]
        if new:
            new[0].name = name
            print(f'[lens] {name}: {picked} faces separated')
        else:
            print(f'[lens] {name}: separate produced nothing')

print('[in ] objects after surgery:')
for o in sorted(bpy.data.objects, key=lambda x: x.name):
    v = len(o.data.vertices) if o.type == 'MESH' else 0
    print(f'       {o.type:6s} {o.name:34.34s} {v:8d}v')

# ── materials ───────────────────────────────────────────────────────────────
# The .blend's own Principled setup is a bad auto-conversion of the V-Ray
# material, not the material the preview renders were made with. dev/vray_to_pbr
# says exactly what is wrong with it and rebuilds it from the same five maps.
# Without this the seats, the headlight reflectors and the side pipe all arrive
# as rough black metal, which is not a lighting problem and cannot be lit out of.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import vray_to_pbr

work = os.path.join(os.path.dirname(dst), '_pbr-' + os.path.splitext(os.path.basename(dst))[0])
vray_to_pbr.rebuild(work)
bpy.ops.file.pack_all()
print(f'[tex] repacked after the material rebuild')

# ── export ──────────────────────────────────────────────────────────────────
# WEBP is written by Blender rather than by gltf-transform, and that is not a
# preference. gltf-transform's texture step is libvips, and libvips dies on this
# model's atlases with "value 32 of type gint is invalid for property 'space' of
# type VipsInterpretation" — an enum member that does not exist. It takes the
# whole compression stage down with it, so the choice was Blender's encoder or
# shipping 34 MB of PNG. Quality 85 rather than the default: two of these maps
# are normals, and lossy compression on a normal map shows up as faceting on
# exactly the long curved panels this car is made of.
wanted = dict(
    filepath=dst, export_format='GLB', use_selection=False,
    export_apply=True, export_yup=True, export_materials='EXPORT',
    export_image_format='WEBP', export_image_quality=85,
    export_cameras=False, export_lights=False,
    export_extras=False, export_animations=False,
    export_draco_mesh_compression_enable=False,
)
rna = bpy.ops.export_scene.gltf.get_rna_type().properties.keys()
bpy.ops.export_scene.gltf(**{k: v for k, v in wanted.items() if k in rna})
print(f'[out] {dst}  {os.path.getsize(dst)/1024/1024:.2f} MB')
