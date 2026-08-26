#!/usr/bin/env python3
"""
Bucket the faces of one object inside a world-space region, by mean UV, so a
part can be located from numbers instead of from a screenshot.

    blender -b --python dev/probe_region.py -- <in.blend> <object> \
        <xmin> <xmax> <ymin> <ymax> <zmin> <zmax>

This is dev/probe_tail.py generalised, after it earned its keep twice. Blender
space: this model's nose is at -Y, its tail at +Y, Z is up.
"""
import bpy
import sys
import os
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(argv[0]))
name = argv[1]
xmin, xmax, ymin, ymax, zmin, zmax = [float(a) for a in argv[2:8]]

ob = bpy.data.objects[name]
me = ob.data
mw = ob.matrix_world
uvs = me.uv_layers.active.data

buckets = {}
for poly in me.polygons:
    c = mw @ poly.center
    if not (xmin <= c.x <= xmax and ymin <= c.y <= ymax and zmin <= c.z <= zmax):
        continue
    us = [uvs[li].uv for li in poly.loop_indices]
    u = sum(p[0] for p in us) / len(us)
    v = sum(p[1] for p in us) / len(us)
    key = (round(u * 20) / 20, round(v * 20) / 20)
    b = buckets.setdefault(key, {'n': 0, 'mn': Vector((1e9, 1e9, 1e9)), 'mx': Vector((-1e9, -1e9, -1e9))})
    b['n'] += 1
    b['mn'] = Vector((min(b['mn'].x, c.x), min(b['mn'].y, c.y), min(b['mn'].z, c.z)))
    b['mx'] = Vector((max(b['mx'].x, c.x), max(b['mx'].y, c.y), max(b['mx'].z, c.z)))

print('[region] {} faces of {} inside the box, in {} UV buckets:'.format(
    sum(b['n'] for b in buckets.values()), name, len(buckets)))
for key in sorted(buckets, key=lambda k: -buckets[k]['n'])[:16]:
    b = buckets[key]
    print('       uv~{:>13}  {:>5} faces   x {:.2f}..{:.2f}  y {:.2f}..{:.2f}  z {:.2f}..{:.2f}'.format(
        '{:.2f},{:.2f}'.format(*key), b['n'],
        b['mn'].x, b['mx'].x, b['mn'].y, b['mx'].y, b['mn'].z, b['mx'].z))
