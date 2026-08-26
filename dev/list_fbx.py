#!/usr/bin/env python3
"""
List the objects in an FBX/OBJ, to compare a supplied format against the .blend.

    blender -b --python dev/list_fbx.py -- <in.fbx|in.obj>

Written because the .blend's `Interior` turned out not to contain the seats the
vendor's own preview renders show, and the question "which of the fifteen
supplied formats actually has them" is answerable rather than arguable.
"""
import bpy
import sys
import os

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
src = os.path.abspath(argv[0])
ext = os.path.splitext(src)[1].lower()

bpy.ops.wm.read_factory_settings(use_empty=True)
if ext == '.fbx':
    bpy.ops.import_scene.fbx(filepath=src, use_custom_normals=True, use_image_search=False)
elif ext == '.obj':
    try:
        bpy.ops.wm.obj_import(filepath=src)
    except AttributeError:
        bpy.ops.import_scene.obj(filepath=src)
else:
    print('unsupported: ' + ext)
    sys.exit(2)

print('[fbx] objects:')
total = 0
for o in sorted(bpy.data.objects, key=lambda x: x.name):
    v = len(o.data.vertices) if o.type == 'MESH' and o.data else 0
    total += v
    print('       {:6s} {:<40.40s} {:>9}v'.format(o.type, o.name, v))
print('[fbx] {} objects, {} vertices total'.format(len(bpy.data.objects), total))
