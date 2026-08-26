#!/usr/bin/env python3
"""
Read a bought .blend and say what its materials are actually made of, before
anything is converted.

    blender -b --python dev/inspect_blend.py -- <in.blend> [textures-dir]

There is no writing here and no fixing. It exists because the last three
material bugs on this project were all diagnosed by measuring the model rather
than by reading the material name, and each one took a round trip to find out
something the file would have said if asked.
"""
import bpy
import sys
import os

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
src = os.path.abspath(argv[0])
tex_dir = os.path.abspath(argv[1]) if len(argv) > 1 else None

bpy.ops.wm.open_mainfile(filepath=src)

if tex_dir:
    missing = [i for i in bpy.data.images
               if i.source == 'FILE' and not os.path.exists(bpy.path.abspath(i.filepath))]
    print(f'[tex] missing before remap: {len(missing)} of {len(bpy.data.images)}')
    if missing:
        bpy.ops.file.find_missing_files(directory=tex_dir)

print('[img] images in file:')
for i in bpy.data.images:
    if i.source != 'FILE':
        continue
    p = bpy.path.abspath(i.filepath)
    print(f'       {i.name:<58} {i.size[0]}x{i.size[1]}  '
          f'{"ok" if os.path.exists(p) else "MISSING"}  cs={i.colorspace_settings.name}')

print('[mat] materials and their node graphs:')
for m in bpy.data.materials:
    users = [o.name for o in bpy.data.objects
             if o.type == 'MESH' and m.name in [s.material.name for s in o.material_slots if s.material]]
    print(f'\n  ── {m.name}   ({len(users)} meshes: {", ".join(users[:6])}'
          f'{" …" if len(users) > 6 else ""})')
    if not m.use_nodes:
        print('       no nodes — legacy material')
        continue
    for n in m.node_tree.nodes:
        extra = ''
        if n.type == 'TEX_IMAGE':
            extra = f'  image={n.image.name if n.image else "NONE"}'
        print(f'       node {n.type:<16} "{n.name}"{extra}')
    print('       links into the output shader:')
    for l in m.node_tree.links:
        print(f'         {l.from_node.type}.{l.from_socket.name}'
              f'  ->  {l.to_node.type}.{l.to_socket.name}')
