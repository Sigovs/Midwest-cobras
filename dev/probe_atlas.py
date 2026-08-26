#!/usr/bin/env python3
"""
Sample the bought model's raw maps at named UVs, so a threshold is chosen from
numbers instead of from a guess.

    blender -b --python dev/probe_atlas.py -- <textures-dir>

The UVs come from raycasting the rendered scene and reading `intersect.uv`. They
are written down here with what the surface at each one actually is, because a
coordinate with no label is a number nobody can check.
"""
import bpy
import sys
import os
import numpy as np

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
tex_dir = os.path.abspath(argv[0])

SIZE = 2048

# label -> (atlas, u, v)
POINTS = [
    ('seat / cockpit trim A', 'Internal', 0.357, 0.512),
    ('seat / cockpit trim B', 'Internal', 0.509, 0.480),
    ('seat / cockpit trim C', 'Internal', 0.397, 0.505),
    ('cockpit, near-black patch', 'Internal', 0.378, 0.822),
    ('cockpit floor', 'Internal', 0.508, 0.658),
    ('side pipe (polished)', 'Internal', 0.846, 0.438),
    ('tyre tread (rubber)', 'Internal', 0.450, 0.980),
    ('body paint', 'External', 0.259, 0.442),
    ('wheel rim (polished alloy)', 'External', 0.870, 0.431),
]


def load(atlas, kind):
    path = os.path.join(tex_dir, 'Shelby_{}_Orange_{}.png'.format(atlas, kind))
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = 'Non-Color'
    img.scale(SIZE, SIZE)
    buf = np.empty(SIZE * SIZE * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    return buf.reshape(SIZE, SIZE, 4)[..., :3]


maps = {}
for atlas in ('Internal', 'External'):
    for kind in ('Diffuse', 'Reflection', 'Glossiness', 'Fresnel'):
        maps[(atlas, kind)] = load(atlas, kind)

print('')
print('{:<28} {:>18} {:>18} {:>7} {:>7}'.format(
    'surface', 'diffuse', 'reflection', 'gloss', 'fresnel'))
print('-' * 84)
for label, atlas, u, v in POINTS:
    x = min(SIZE - 1, int(u * SIZE))
    y = min(SIZE - 1, int(v * SIZE))       # Blender rows run bottom-up, as does v
    d = maps[(atlas, 'Diffuse')][y, x]
    r = maps[(atlas, 'Reflection')][y, x]
    g = maps[(atlas, 'Glossiness')][y, x]
    f = maps[(atlas, 'Fresnel')][y, x]
    print('{:<28} {:>18} {:>18} {:>7.3f} {:>7.3f}'.format(
        label,
        '{:.2f},{:.2f},{:.2f}'.format(*d),
        '{:.2f},{:.2f},{:.2f}'.format(*r),
        float(g[0]), float(f[0])))
print('')
