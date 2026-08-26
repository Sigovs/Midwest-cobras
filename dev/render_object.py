#!/usr/bin/env python3
"""
Render one object of a .blend alone, on grey, with plain studio light — so what
the geometry actually is can be seen without any of this project's materials,
environment or exposure in the way.

    blender -b --python dev/render_object.py -- <in.blend> <object> <out.png> [angle]

angle: 'threequarter' (default), 'top', 'side'
"""
import bpy
import sys
import os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
src, name, out = os.path.abspath(argv[0]), argv[1], os.path.abspath(argv[2])
angle = argv[3] if len(argv) > 3 else 'threequarter'

bpy.ops.wm.open_mainfile(filepath=src)

keep = bpy.data.objects[name]
for o in list(bpy.data.objects):
    if o is not keep:
        bpy.data.objects.remove(o, do_unlink=True)

mat = bpy.data.materials.new('probe')
mat.use_nodes = True
b = mat.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value = (0.55, 0.56, 0.58, 1)
b.inputs['Roughness'].default_value = 0.5
if 'Metallic' in b.inputs:
    b.inputs['Metallic'].default_value = 0.0
keep.data.materials.clear()
keep.data.materials.append(mat)

mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
for v in keep.data.vertices:
    w = keep.matrix_world @ v.co
    mn = Vector((min(mn.x, w.x), min(mn.y, w.y), min(mn.z, w.z)))
    mx = Vector((max(mx.x, w.x), max(mx.y, w.y), max(mx.z, w.z)))
centre = (mn + mx) / 2
span = (mx - mn).length

cam_data = bpy.data.cameras.new('cam')
cam = bpy.data.objects.new('cam', cam_data)
bpy.context.collection.objects.link(cam)
bpy.context.scene.camera = cam
cam_data.lens = 55

if angle == 'top':
    cam.location = centre + Vector((0.01, -0.2, span * 0.75))
elif angle == 'side':
    cam.location = centre + Vector((span * 0.75, -0.05, span * 0.12))
else:
    cam.location = centre + Vector((span * 0.42, -span * 0.42, span * 0.30))
cam.rotation_euler = (centre - cam.location).to_track_quat('-Z', 'Y').to_euler()

for pos in ((3, -3, 4), (-3, -2, 3), (0, 3, 2)):
    d = bpy.data.lights.new('k', type='AREA')
    d.energy = 500
    d.size = 4
    L = bpy.data.objects.new('k', d)
    bpy.context.collection.objects.link(L)
    L.location = Vector(pos)
    L.rotation_euler = (centre - L.location).to_track_quat('-Z', 'Y').to_euler()

scn = bpy.context.scene
scn.render.engine = 'BLENDER_WORKBENCH'
scn.render.resolution_x = 1600
scn.render.resolution_y = 1100
scn.render.filepath = out
scn.render.image_settings.file_format = 'PNG'
bpy.ops.render.render(write_still=True)
print('[obj] {} — {} verts — wrote {}'.format(name, len(keep.data.vertices), out))
