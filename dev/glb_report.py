#!/usr/bin/env python3
"""
Read a GLB and print what is actually inside it. No dependencies.

    python3 dev/glb_report.py assets/model/<file>.glb [--tree] [--depth N]

This exists because parts.js and the material system in hero-scene.js are both
written AGAINST NODE AND MATERIAL NAMES, and a name is not a thing you can
guess. Every time a model is replaced, the prefixes change, and a prefix that
matches nothing produces a part that never arrives — with no error, because
nothing is broken. So the names get printed and read before anything is written
against them.

It also reports the bounding box in the file's own units, which is the number
that decides the scale factor a scene has to apply — the same number that made
a halo sprite 83 metres across when it was inherited rather than divided out.
"""
import sys, json, struct, os
from collections import Counter, defaultdict

COMP = {5120: ('b', 1), 5121: ('B', 1), 5122: ('h', 2),
        5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
NCOMP = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4,
         'MAT2': 4, 'MAT3': 9, 'MAT4': 16}
MODE = {0: 'POINTS', 1: 'LINES', 4: 'TRIANGLES', 5: 'TRI_STRIP', 6: 'TRI_FAN'}


def read_glb(path):
    d = open(path, 'rb').read()
    magic, version, _length = struct.unpack('<III', d[:12])
    if magic != 0x46546C67:
        raise SystemExit('not a GLB')
    off, js, bin_ = 12, None, b''
    while off < len(d):
        clen, ctype = struct.unpack('<II', d[off:off + 8])
        chunk = d[off + 8:off + 8 + clen]
        if ctype == 0x4E4F534A:
            js = json.loads(chunk.decode('utf8'))
        elif ctype == 0x004E4942:
            bin_ = chunk
        off += 8 + clen + ((-clen) % 4)
    return js, bin_, version


def main():
    path = sys.argv[1]
    want_tree = '--tree' in sys.argv
    depth_cap = 3
    if '--depth' in sys.argv:
        depth_cap = int(sys.argv[sys.argv.index('--depth') + 1])

    g, blob, version = read_glb(path)
    size = os.path.getsize(path)

    nodes = g.get('nodes', [])
    meshes = g.get('meshes', [])
    mats = g.get('materials', [])
    texs = g.get('textures', [])
    imgs = g.get('images', [])
    accs = g.get('accessors', [])

    tris = 0
    verts = 0
    prim_count = 0
    modes = Counter()
    for m in meshes:
        for p in m.get('primitives', []):
            prim_count += 1
            modes[MODE.get(p.get('mode', 4), p.get('mode', 4))] += 1
            if 'indices' in p:
                n = accs[p['indices']]['count']
            else:
                n = accs[p['attributes']['POSITION']]['count']
            if p.get('mode', 4) == 4:
                tris += n // 3
            verts += accs[p['attributes']['POSITION']]['count']

    print(f'file            {path}')
    print(f'size            {size/1024/1024:.2f} MB   (glTF {version})')
    print(f'generator       {g.get("asset", {}).get("generator", "—")}')
    print(f'extensions      {", ".join(g.get("extensionsUsed", [])) or "—"}')
    print(f'nodes           {len(nodes)}')
    print(f'meshes          {len(meshes)}   primitives {prim_count}   {dict(modes)}')
    print(f'triangles       {tris:,}')
    print(f'vertices        {verts:,}')
    print(f'materials       {len(mats)}')
    print(f'textures        {len(texs)}   images {len(imgs)}')

    # bounding box over the POSITION accessors' declared min/max, which the
    # spec requires — no need to decode the buffer
    lo = [float('inf')] * 3
    hi = [float('-inf')] * 3
    for m in meshes:
        for p in m.get('primitives', []):
            a = accs[p['attributes']['POSITION']]
            if 'min' in a and 'max' in a:
                for i in range(3):
                    lo[i] = min(lo[i], a['min'][i]); hi[i] = max(hi[i], a['max'][i])
    if lo[0] != float('inf'):
        size3 = [round(hi[i] - lo[i], 4) for i in range(3)]
        print(f'bbox (mesh-local) {size3}')
        print('                  NOTE: node transforms are not applied here. A scene')
        print('                  that scales the root must divide sprite and offset')
        print('                  sizes by that factor or they inherit it.')

    if imgs:
        print('\nimages')
        for i, im in enumerate(imgs):
            mime = im.get('mimeType', '?')
            name = im.get('name', f'#{i}')
            bl = im.get('bufferView')
            n = g['bufferViews'][bl]['byteLength'] if bl is not None else 0
            print(f'  {name:38.38s} {mime:12s} {n/1024:8.0f} KB')

    print('\nmaterials')
    for i, m in enumerate(mats):
        pbr = m.get('pbrMetallicRoughness', {})
        base = pbr.get('baseColorFactor')
        bits = []
        if 'baseColorTexture' in pbr: bits.append('baseTex')
        if 'metallicRoughnessTexture' in pbr: bits.append('mrTex')
        if 'normalTexture' in m: bits.append('normal')
        if 'emissiveTexture' in m: bits.append('emisTex')
        if m.get('alphaMode', 'OPAQUE') != 'OPAQUE': bits.append(m['alphaMode'].lower())
        if m.get('doubleSided'): bits.append('2side')
        col = ''
        if base:
            col = '#%02x%02x%02x' % tuple(min(255, int(c ** (1 / 2.2) * 255)) for c in base[:3])
        print(f'  {i:3d}  {m.get("name", "—"):38.38s} {col:8s} '
              f'm{pbr.get("metallicFactor", 1):.2f} r{pbr.get("roughnessFactor", 1):.2f}  '
              f'{" ".join(bits)}')

    # Node names are the payload. Prefix families are what parts.js is written
    # against, so they are counted rather than eyeballed.
    print('\nnode name prefixes  (first token before _ - or space)')
    fam = defaultdict(int)
    for n in nodes:
        nm = n.get('name', '')
        if not nm:
            continue
        tok = nm.replace('-', '_').replace(' ', '_').split('_')[0]
        fam[tok] += 1
    for k, v in sorted(fam.items(), key=lambda kv: -kv[1])[:30]:
        print(f'  {v:4d}  {k}')

    if want_tree:
        print('\nnode tree')
        children = set()
        for n in nodes:
            for c in n.get('children', []):
                children.add(c)
        roots = [i for i in range(len(nodes)) if i not in children]

        def walk(i, d):
            if d > depth_cap:
                return
            n = nodes[i]
            has_mesh = 'mesh' in n
            t = n.get('translation')
            tt = f'  t={[round(x,3) for x in t]}' if t else ''
            print(f'  {"  " * d}{"◆" if has_mesh else "○"} {n.get("name", f"#{i}")}{tt}')
            for c in n.get('children', []):
                walk(c, d + 1)

        for r in roots:
            walk(r, 0)


main()
