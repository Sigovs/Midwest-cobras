#!/usr/bin/env python3
"""
Count what is actually inside the cockpit volume, and split it into connected
lumps, so "are the seats in this file" stops being a matter of squinting.

    blender -b --python dev/count_cockpit.py -- <in.blend>

Blender space for this model: nose at -Y, tail at +Y, Z up. The seat zone is the
box a pair of buckets would occupy in a car whose interior bbox is
x +-0.72, y -1.88..1.92, z 0.10..1.15.
"""
import bpy
import sys
import os
import bmesh
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
bpy.ops.wm.open_mainfile(filepath=os.path.abspath(argv[0]))

ob = bpy.data.objects['Interior']
mw = ob.matrix_world

SEAT_BOX = {'x': (-0.70, 0.70), 'y': (-0.10, 1.10), 'z': (0.30, 0.95)}

bm = bmesh.new()
bm.from_mesh(ob.data)
bm.verts.ensure_lookup_table()

inside = set()
for v in bm.verts:
    w = mw @ v.co
    if (SEAT_BOX['x'][0] <= w.x <= SEAT_BOX['x'][1]
            and SEAT_BOX['y'][0] <= w.y <= SEAT_BOX['y'][1]
            and SEAT_BOX['z'][0] <= w.z <= SEAT_BOX['z'][1]):
        inside.add(v.index)

print('[cockpit] {} of {} Interior vertices sit in the seat box'.format(
    len(inside), len(bm.verts)))

# connected lumps over the whole object, then report the ones that intersect the box
seen = set()
lumps = []
for v in bm.verts:
    if v.index in seen:
        continue
    stack = [v]
    seen.add(v.index)
    comp = []
    while stack:
        cur = stack.pop()
        comp.append(cur)
        for e in cur.link_edges:
            o = e.other_vert(cur)
            if o.index not in seen:
                seen.add(o.index)
                stack.append(o)
    lumps.append(comp)

print('[cockpit] Interior is {} connected lumps'.format(len(lumps)))
rows = []
for comp in lumps:
    n_in = sum(1 for v in comp if v.index in inside)
    if n_in == 0:
        continue
    mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
    for v in comp:
        w = mw @ v.co
        mn = Vector((min(mn.x, w.x), min(mn.y, w.y), min(mn.z, w.z)))
        mx = Vector((max(mx.x, w.x), max(mx.y, w.y), max(mx.z, w.z)))
    rows.append((len(comp), n_in, mn, mx))

rows.sort(key=lambda r: -r[1])
print('[cockpit] lumps touching the seat box, biggest first:')
for total, n_in, mn, mx in rows[:12]:
    print('       {:>7}v ({:>6} in box)  x {:6.2f}..{:5.2f}  y {:6.2f}..{:5.2f}  z {:5.2f}..{:5.2f}'
          .format(total, n_in, mn.x, mx.x, mn.y, mx.y, mn.z, mx.z))
bm.free()
