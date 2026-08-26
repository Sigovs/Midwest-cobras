#!/usr/bin/env python3
"""
Every object in a .blend, with what would stop it reaching an export.

    blender -b --python dev/list_objects.py -- <in.blend>

Written after an hour spent correcting the materials on seats that are not in
the export at all. Hidden, excluded, or on a disabled collection are three
separate switches and none of them is an error — the exporter simply skips the
object and says nothing, and a missing seat looks exactly like a badly converted
one from the outside.
"""
import bpy
import sys
import os

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(argv[0]))

vl = bpy.context.view_layer


def collections_of(obj):
    return [c.name for c in bpy.data.collections if obj.name in c.objects]


print('[obj] every object in the file:')
print('       {:<34} {:>9} {:>7} {:>7} {:>7}  {}'.format(
    'name', 'verts', 'hide_vp', 'hide_rn', 'in_VL', 'collections'))
for o in sorted(bpy.data.objects, key=lambda x: x.name):
    verts = len(o.data.vertices) if o.type == 'MESH' and o.data else 0
    try:
        in_vl = o.name in vl.objects
    except Exception:
        in_vl = '?'
    print('       {:<34} {:>9} {:>7} {:>7} {:>7}  {}'.format(
        o.name[:34], verts, str(o.hide_viewport), str(o.hide_render),
        str(in_vl), ', '.join(collections_of(o)) or '(none)'))

print('')
print('[col] collections and whether the view layer excludes them:')


def walk(layer_coll, depth=0):
    print('       {}{:<30} excluded={} hide_viewport={}'.format(
        '  ' * depth, layer_coll.name[:30], layer_coll.exclude,
        layer_coll.hide_viewport))
    for child in layer_coll.children:
        walk(child, depth + 1)


walk(vl.layer_collection)

print('')
print('[sum] {} objects, {} meshes, {} of them with zero vertices'.format(
    len(bpy.data.objects),
    sum(1 for o in bpy.data.objects if o.type == 'MESH'),
    sum(1 for o in bpy.data.objects if o.type == 'MESH' and o.data and len(o.data.vertices) == 0)))
