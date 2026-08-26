#!/usr/bin/env python3
"""
Find the rear lamp faces inside `Interior` by what they are UV-mapped to, not by
where they happen to sit.

    blender -b --python dev/probe_tail.py -- <in.blend> <textures-dir>

WHY UV AND NOT A BOX. The headlight lenses were found with a measured box and it
worked, but only because a headlight is a big obvious lump at a known corner of
the car. The rear lamps are 3 cm ovals, and a box tight enough to catch only
them is a box I would be tuning by eye against a render — which is how the first
lens box ended up written in the wrong coordinate space.

The lamps have a property no box needs: their UVs land on the TYRE TREAD island
of the Internal atlas. That is the bug, and it is also the fingerprint. A face on
the tail of the car whose texture coordinates point at rubber is a lamp.
"""
import bpy
import sys
import os
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(argv[0]))
tex_dir = os.path.abspath(argv[1]) if len(argv) > 1 else None
if tex_dir:
    bpy.ops.file.find_missing_files(directory=tex_dir)

ob = bpy.data.objects['Interior']
me = ob.data
mw = ob.matrix_world
uv_layer = me.uv_layers.active.data

bb = [mw @ bpy.mathutils.Vector(c) for c in ob.bound_box] if hasattr(bpy, 'mathutils') else None
print('[bbox] Interior world bounds:')
from mathutils import Vector
mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
for v in me.vertices:
    w = mw @ v.co
    mn = Vector((min(mn.x, w.x), min(mn.y, w.y), min(mn.z, w.z)))
    mx = Vector((max(mx.x, w.x), max(mx.y, w.y), max(mx.z, w.z)))
print('       x {:.3f}..{:.3f}   y {:.3f}..{:.3f}   z {:.3f}..{:.3f}'.format(
    mn.x, mx.x, mn.y, mx.y, mn.z, mx.z))

# Faces on the tail half of the car, bucketed by their mean UV, so the islands
# are visible as numbers rather than guessed at.
print('[tail] faces with y > 1.60 (the tail), bucketed by mean UV:')
buckets = {}
for poly in me.polygons:
    c = mw @ poly.center
    if c.y < 1.60:
        continue
    us = [uv_layer[li].uv for li in poly.loop_indices]
    u = sum(p[0] for p in us) / len(us)
    v = sum(p[1] for p in us) / len(us)
    key = (round(u * 10) / 10, round(v * 10) / 10)
    b = buckets.setdefault(key, {'n': 0, 'mn': Vector((1e9, 1e9, 1e9)), 'mx': Vector((-1e9, -1e9, -1e9))})
    b['n'] += 1
    b['mn'] = Vector((min(b['mn'].x, c.x), min(b['mn'].y, c.y), min(b['mn'].z, c.z)))
    b['mx'] = Vector((max(b['mx'].x, c.x), max(b['mx'].y, c.y), max(b['mx'].z, c.z)))

for key in sorted(buckets, key=lambda k: -buckets[k]['n'])[:14]:
    b = buckets[key]
    print('       uv~{:>12}  {:>5} faces   x {:.2f}..{:.2f}  y {:.2f}..{:.2f}  z {:.2f}..{:.2f}'.format(
        '{:.1f},{:.1f}'.format(*key), b['n'],
        b['mn'].x, b['mx'].x, b['mn'].y, b['mx'].y, b['mn'].z, b['mx'].z))
