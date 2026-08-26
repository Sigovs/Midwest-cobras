#!/usr/bin/env python3
"""
Isolate the two mirrored lumps that sit in the seat volume and render them
alone, so "are those the seats" is answered by a picture instead of by a
vertex count.

    blender -b --python dev/render_lumps.py -- <in.blend> <out.png>
"""
import bpy
import sys
import os
import bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
src = os.path.abspath(argv[0])
out = os.path.abspath(argv[1])

bpy.ops.wm.open_mainfile(filepath=src)

ob = bpy.data.objects['Interior']
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active = ob
ob.select_set(True)
bpy.ops.mesh.separate(type='LOOSE')
print('[lumps] Interior split into {} objects'.format(
    len([o for o in bpy.data.objects if o.name.startswith('Interior')])))

BOX = {'x': (-0.70, 0.70), 'y': (0.15, 0.95), 'z': (0.25, 0.80)}
keep = []
for o in list(bpy.data.objects):
    if o.type != 'MESH' or not o.name.startswith('Interior'):
        continue
    mw = o.matrix_world
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    for v in o.data.vertices:
        w = mw @ v.co
        mn = Vector((min(mn.x, w.x), min(mn.y, w.y), min(mn.z, w.z)))
        mx = Vector((max(mx.x, w.x), max(mx.y, w.y), max(mx.z, w.z)))
    n = len(o.data.vertices)
    fits = (BOX['x'][0] <= mn.x and mx.x <= BOX['x'][1]
            and BOX['y'][0] <= mn.y and mx.y <= BOX['y'][1]
            and BOX['z'][0] <= mn.z and mx.z <= BOX['z'][1])
    if fits and n > 1500:
        keep.append(o)
        print('[lumps] KEEP {:<28.28s} {:>6}v  x {:5.2f}..{:5.2f} y {:5.2f}..{:5.2f} z {:5.2f}..{:5.2f}'
              .format(o.name, n, mn.x, mx.x, mn.y, mx.y, mn.z, mx.z))

if not keep:
    print('[lumps] nothing matched — the seat volume has no self-contained lump')
    sys.exit(0)

for o in list(bpy.data.objects):
    if o not in keep:
        bpy.data.objects.remove(o, do_unlink=True)

# a plain grey so the shape is the only thing being read
mat = bpy.data.materials.new('probe')
mat.use_nodes = True
bsdf = mat.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (0.55, 0.56, 0.58, 1)
bsdf.inputs['Roughness'].default_value = 0.55
if 'Metallic' in bsdf.inputs:
    bsdf.inputs['Metallic'].default_value = 0.0
for o in keep:
    o.data.materials.clear()
    o.data.materials.append(mat)

cam_data = bpy.data.cameras.new('cam')
cam = bpy.data.objects.new('cam', cam_data)
bpy.context.collection.objects.link(cam)
bpy.context.scene.camera = cam
cam.location = (1.9, -1.7, 1.5)
cam_data.lens = 50

# aim at the lumps
mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
for o in keep:
    for v in o.data.vertices:
        w = o.matrix_world @ v.co
        mn = Vector((min(mn.x, w.x), min(mn.y, w.y), min(mn.z, w.z)))
        mx = Vector((max(mx.x, w.x), max(mx.y, w.y), max(mx.z, w.z)))
centre = (mn + mx) / 2
direction = centre - cam.location
cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()

light_data = bpy.data.lights.new('key', type='AREA')
light_data.energy = 400
light_data.size = 3
light = bpy.data.objects.new('key', light_data)
bpy.context.collection.objects.link(light)
light.location = (2.0, -2.0, 3.0)
light.rotation_euler = (Vector((0, 0, 0)) - Vector(light.location)).to_track_quat('-Z', 'Y').to_euler()

scn = bpy.context.scene
scn.render.engine = 'BLENDER_WORKBENCH'
scn.render.resolution_x = 1400
scn.render.resolution_y = 1000
scn.render.filepath = out
scn.render.image_settings.file_format = 'PNG'
bpy.ops.render.render(write_still=True)
print('[lumps] wrote {}'.format(out))
