#!/usr/bin/env python3
"""
OBJ -> GLB, no dependencies.

Welds by the OBJ's own v/vt/vn triple, triangulates n-gons by fan, groups
primitives by material, and writes a single binary glTF. Positions are
recentred on the model's own bounding box and scaled so the longest axis is
LENGTH_M metres, because a SketchUp export arrives in whatever unit the person
who drew it was using and a scene cannot light an object whose size is unknown.

Usage:  obj2glb.py <in.obj> <out.glb> [--quantize]
"""
import sys, os, json, struct
from collections import defaultdict

LENGTH_M = 3.96  # a 427 Cobra is about 156 in nose to tail

def parse_mtl(path):
    mats, cur = {}, None
    if not os.path.exists(path):
        return mats
    for line in open(path, 'r', errors='ignore'):
        p = line.split()
        if not p:
            continue
        if p[0] == 'newmtl':
            cur = ' '.join(p[1:])
            mats[cur] = {'kd': [0.8, 0.8, 0.8], 'd': 1.0, 'ns': 32.0}
        elif cur is None:
            continue
        elif p[0] == 'Kd' and len(p) >= 4:
            mats[cur]['kd'] = [float(p[1]), float(p[2]), float(p[3])]
        elif p[0] == 'd' and len(p) >= 2:
            mats[cur]['d'] = float(p[1])
        elif p[0] == 'Tr' and len(p) >= 2:
            mats[cur]['d'] = 1.0 - float(p[1])
        elif p[0] == 'Ns' and len(p) >= 2:
            mats[cur]['ns'] = float(p[1])
    return mats



CREASE = 62.0  # degrees. A car body is low-poly here; below this it must smooth.

def smooth_normals(prims, V):
    """Angle-limited vertex normals, computed from winding.

    The OBJ carries per-vertex normals and they are wrong — SketchUp lets a
    reversed face look correct in its own viewport, so the error ships. Winding
    is consistent enough to recompute from, which is what this does: average the
    face normals meeting at each position, then reject the average per corner
    when it departs from that face by more than the crease angle, so a wheel arch
    stays round and a panel gap stays sharp.
    """
    import math
    acc = {}          # position index -> summed normal
    face_n = []       # (prim, triangle offset) -> normal
    tris = []

    for name, p in prims.items():
        vs = p['verts']
        idx = p['idx']
        for k in range(0, len(idx), 3):
            a, b, c = idx[k], idx[k+1], idx[k+2]
            pa, pb, pc = vs[a][0], vs[b][0], vs[c][0]
            ux, uy, uz = pb[0]-pa[0], pb[1]-pa[1], pb[2]-pa[2]
            wx, wy, wz = pc[0]-pa[0], pc[1]-pa[1], pc[2]-pa[2]
            nx, ny, nz = uy*wz-uz*wy, uz*wx-ux*wz, ux*wy-uy*wx
            ln = math.sqrt(nx*nx+ny*ny+nz*nz)
            if ln == 0:
                n = (0.0, 1.0, 0.0)
            else:
                n = (nx/ln, ny/ln, nz/ln)          # area-weighted below
            tris.append((p, a, b, c, n, ln))
            for vi in (vs[a][3], vs[b][3], vs[c][3]):
                s0 = acc.get(vi)
                if s0 is None:
                    acc[vi] = [n[0]*ln, n[1]*ln, n[2]*ln]
                else:
                    s0[0] += n[0]*ln; s0[1] += n[1]*ln; s0[2] += n[2]*ln

    for vi, s0 in acc.items():
        ln = math.sqrt(s0[0]**2 + s0[1]**2 + s0[2]**2)
        if ln:
            s0[0] /= ln; s0[1] /= ln; s0[2] /= ln
        else:
            s0[0], s0[1], s0[2] = 0.0, 1.0, 0.0

    cos_lim = math.cos(math.radians(CREASE))
    for (p, a, b, c, n, _ln) in tris:
        vs = p['verts']
        for local in (a, b, c):
            vi = vs[local][3]
            avg = acc[vi]
            d = avg[0]*n[0] + avg[1]*n[1] + avg[2]*n[2]
            chosen = tuple(avg) if d >= cos_lim else n
            prev = vs[local][1]
            if prev is None:
                vs[local][1] = chosen
            elif prev != chosen:
                # two faces want different normals at one OBJ vertex; the hard
                # one wins, because a smoothed crease is the failure you see
                dp = avg[0]*prev[0] + avg[1]*prev[1] + avg[2]*prev[2]
                if d < dp:
                    vs[local][1] = chosen


def main():
    src, dst = sys.argv[1], sys.argv[2]
    mtl_path = os.path.splitext(src)[0] + '.mtl'
    mtl = parse_mtl(mtl_path)

    V, VT, VN = [], [], []
    prims = defaultdict(lambda: {'idx': [], 'map': {}, 'verts': []})
    cur = 'default'

    def vert_index(prim, token):
        m = prim['map']
        i = m.get(token)
        if i is not None:
            return i
        bits = token.split('/')
        vi = int(bits[0]); vi = vi - 1 if vi > 0 else len(V) + vi
        ti = None
        ni = None
        if len(bits) > 1 and bits[1]:
            ti = int(bits[1]); ti = ti - 1 if ti > 0 else len(VT) + ti
        if len(bits) > 2 and bits[2]:
            ni = int(bits[2]); ni = ni - 1 if ni > 0 else len(VN) + ni
        pos = V[vi]
        nrm = None  # recomputed below — see smooth_normals()
        uv = VT[ti] if ti is not None and ti < len(VT) else (0.0, 0.0)
        i = len(prim['verts'])
        prim['verts'].append([pos, nrm, uv, vi])
        m[token] = i
        return i

    with open(src, 'r', errors='ignore') as fh:
        for line in fh:
            if line.startswith('v '):
                p = line.split()
                V.append((float(p[1]), float(p[2]), float(p[3])))
            elif line.startswith('vt '):
                p = line.split()
                VT.append((float(p[1]), float(p[2])))
            elif line.startswith('vn '):
                p = line.split()
                VN.append((float(p[1]), float(p[2]), float(p[3])))
            elif line.startswith('usemtl'):
                cur = line.strip()[7:].strip() or 'default'
            elif line.startswith('f '):
                toks = line.split()[1:]
                prim = prims[cur]
                ids = [vert_index(prim, t) for t in toks]
                for k in range(1, len(ids) - 1):
                    prim['idx'].extend((ids[0], ids[k], ids[k + 1]))

    smooth_normals(prims, V)

    # bounding box over everything actually referenced
    lo = [float('inf')] * 3
    hi = [float('-inf')] * 3
    for p in prims.values():
        for (pos, _n, _t, _vi) in p['verts']:
            for a in range(3):
                lo[a] = min(lo[a], pos[a]); hi[a] = max(hi[a], pos[a])
    size = [hi[a] - lo[a] for a in range(3)]
    ctr = [(hi[a] + lo[a]) / 2 for a in range(3)]
    scale = LENGTH_M / max(size) if max(size) else 1.0
    # sit the model on y = 0 rather than centring it vertically: a car stands
    # on a floor, and a scene that has to guess where the floor is will guess
    # wrong at every camera angle.
    off = [-ctr[0], -lo[1], -ctr[2]]

    print(f'source bbox     {[round(s,3) for s in size]}')
    print(f'scale to {LENGTH_M} m  x{scale:.6f}')
    print(f'primitives      {len(prims)}')

    bin_parts, views, accessors, meshes_prims, materials = [], [], [], [], []
    offset = 0
    mat_index = {}

    def add_view(data, target=None):
        nonlocal offset
        pad = (-len(data)) % 4
        bin_parts.append(data + b'\0' * pad)
        v = {'buffer': 0, 'byteOffset': offset, 'byteLength': len(data)}
        if target:
            v['bufferViewTarget'] = target
            v['target'] = target
        offset += len(data) + pad
        views.append(v)
        return len(views) - 1

    total_tris = 0
    for name, p in sorted(prims.items()):
        if not p['idx']:
            continue
        verts = p['verts']
        n = len(verts)
        total_tris += len(p['idx']) // 3

        pos = bytearray(); nrm = bytearray(); uv = bytearray()
        pmin = [float('inf')] * 3; pmax = [float('-inf')] * 3
        for (P, N, T, _vi) in verts:
            x = (P[0] + off[0]) * scale
            y = (P[1] + off[1]) * scale
            z = (P[2] + off[2]) * scale
            pos += struct.pack('<3f', x, y, z)
            for a, val in enumerate((x, y, z)):
                pmin[a] = min(pmin[a], val); pmax[a] = max(pmax[a], val)
            ln = (N[0] ** 2 + N[1] ** 2 + N[2] ** 2) ** 0.5 or 1.0
            nrm += struct.pack('<3f', N[0] / ln, N[1] / ln, N[2] / ln)
            uv += struct.pack('<2f', T[0], 1.0 - T[1])

        if n <= 65535:
            idx = b''.join(struct.pack('<H', i) for i in p['idx']); ctype = 5123
        else:
            idx = b''.join(struct.pack('<I', i) for i in p['idx']); ctype = 5125

        vp = add_view(bytes(pos), 34962)
        vn_ = add_view(bytes(nrm), 34962)
        vu = add_view(bytes(uv), 34962)
        vi = add_view(idx, 34963)

        a_pos = len(accessors)
        accessors.append({'bufferView': vp, 'componentType': 5126, 'count': n,
                          'type': 'VEC3', 'min': pmin, 'max': pmax})
        a_nrm = len(accessors)
        accessors.append({'bufferView': vn_, 'componentType': 5126, 'count': n, 'type': 'VEC3'})
        a_uv = len(accessors)
        accessors.append({'bufferView': vu, 'componentType': 5126, 'count': n, 'type': 'VEC2'})
        a_idx = len(accessors)
        accessors.append({'bufferView': vi, 'componentType': ctype,
                          'count': len(p['idx']), 'type': 'SCALAR'})

        if name not in mat_index:
            m = mtl.get(name, {'kd': [0.8, 0.8, 0.8], 'd': 1.0, 'ns': 32.0})
            rough = max(0.08, min(1.0, 1.0 - (m['ns'] / 128.0)))
            gm = {
                'name': name,
                'pbrMetallicRoughness': {
                    'baseColorFactor': [m['kd'][0], m['kd'][1], m['kd'][2], m['d']],
                    'metallicFactor': 0.0,
                    'roughnessFactor': round(rough, 3),
                },
                'doubleSided': True,
            }
            if m['d'] < 1.0:
                gm['alphaMode'] = 'BLEND'
            mat_index[name] = len(materials)
            materials.append(gm)

        meshes_prims.append({
            'attributes': {'POSITION': a_pos, 'NORMAL': a_nrm, 'TEXCOORD_0': a_uv},
            'indices': a_idx,
            'material': mat_index[name],
        })

    blob = b''.join(bin_parts)
    for v in views:
        v.pop('bufferViewTarget', None)

    gltf = {
        'asset': {'version': '2.0', 'generator': 'obj2glb.py — Midwest Cobras'},
        'scene': 0,
        'scenes': [{'nodes': [0]}],
        'nodes': [{'mesh': 0, 'name': 'COBRA'}],
        'meshes': [{'name': 'COBRA', 'primitives': meshes_prims}],
        'materials': materials,
        'accessors': accessors,
        'bufferViews': views,
        'buffers': [{'byteLength': len(blob)}],
    }

    js = json.dumps(gltf, separators=(',', ':')).encode('utf8')
    js += b' ' * ((-len(js)) % 4)
    out = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(blob))
    out += struct.pack('<II', len(js), 0x4E4F534A) + js
    out += struct.pack('<II', len(blob), 0x004E4942) + blob
    open(dst, 'wb').write(out)

    print(f'triangles       {total_tris:,}')
    print(f'materials       {len(materials)}')
    print(f'glb             {len(out)/1024/1024:.2f} MB  -> {dst}')


main()
