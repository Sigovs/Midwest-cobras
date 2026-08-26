"""
Rebuild the bought model's materials from its own maps, because the .blend's
materials are not the materials the car was rendered with.

Imported by dev/prep_shelby.py. Not run on its own.

────────────────────────────────────────────────────────────────────────────────
WHAT IS ACTUALLY WRONG, read out of the node graph rather than guessed

The vendor's preview renders come from the .max V-Ray scene. The .blend is a
courtesy conversion, and its Principled setup is wrong on its own terms —
`blender -b --python dev/inspect_blend.py` prints it:

    Reflection.png     ->  Principled.Specular IOR Level
    Diffuse.png        ->  Principled.Base Color
    Glossiness.png     ->  Invert  ->  Principled.Roughness
    Fresnel.png.ALPHA  ->  Invert  ->  Principled.Metallic

Two of those four are nonsense.

  · "Specular IOR Level" is a scalar dielectric strength, 0..1. Feeding a metal's
    REFLECTION COLOUR into it throws that colour away — and in a V-Ray
    specular/glossiness material a polished metal's colour is the only place it
    lives, because a conductor has no diffuse term and the author had to leave
    the diffuse black. Measured on this model: the side pipe's diffuse is
    rgb(44,44,44). That is why the exhaust rendered as a dark smear with no
    polish and no heat tint on the header.

  · Metallic from an inverted ALPHA channel of the Fresnel map is not a
    conversion of anything. What reached the GLB was metalness 1.0 on every
    texel of the External atlas and ~0.65 across the Internal one — which is how
    leather seats, a wood-rimmed wheel and a headlight reflector all became the
    same black hole. A dielectric at metalness 0.65 has almost no diffuse
    response left to shade.

────────────────────────────────────────────────────────────────────────────────
WHAT THIS DOES INSTEAD, AND THE TWO ATTEMPTS THAT DID NOT WORK

    baseColor  = diffuse, with the reflection mixed in where there is metal
    roughness  = the map named "Glossiness", used DIRECTLY
    metallic   = decided per ATLAS, not per texel threshold

The last line is the whole lesson and it cost two rebuilds.

ATTEMPT ONE used the textbook rule: metal is bright reflection over dark diffuse.
It is the correct rule for a specular/glossiness source and it is useless on this
one. dev/probe_atlas.py samples the maps at labelled UVs, and the Reflection map
reads exactly (1.00, 1.00, 1.00) on the seats, the cockpit floor, the side pipe,
the wheel rim AND the body paint. It is not a metal colour map at all — it is a
flat white specular-level mask with the falloff left to Fresnel, which is 0.667
on all five of those same points. So the rule fired on the leather, mixed white
into its base colour, and the cockpit arrived as pale grey metal slabs. Alex:
"where are the seats". They were there. They were chrome.

ATTEMPT TWO used dark-and-polished instead. It called 54.9% of the Internal atlas
metal and printed its own warning saying so.

WHAT SETTLED IT was not a better threshold. Raycasting the rendered car says
where the metal physically is: the side pipe, the chrome bezels, the grille
surround and the rims are all carried by `Body` and the wheels, which are on the
EXTERNAL atlas. The INTERNAL atlas carries the cockpit, the steering wheel, the
door cards and the tyres — leather, carpet, wood and rubber, and not one metal
part among them. So the internal atlas gets metalness 0 everywhere, because
there is nothing on it to be metal, and the external atlas keeps a mask.

That is a fact about the model rather than a number tuned until the picture
looked right, which is why it is allowed to decide.

ROUGHNESS IS NOT INVERTED, and this reverses what the .blend does. Sampled:
seats 0.73, tyre tread 0.70, wheel rim 0.41, side pipe 0.38, body paint 0.20.
Read as glossiness that ordering makes rubber glossier than a polished rim. Read
as roughness it is right on all five. The map's filename lies.

Coverage is printed on every run, with a warning past 45%. A mask claiming most
of a car is chrome is a mask that is wrong, and it says so instead of shipping.
"""
import bpy
import os
import struct
import zlib
import numpy as np

# ── atlas resolution, per atlas, and it is not the same number twice ────────
# The external atlas is body panels: a metre of paint across a few hundred
# texels reads fine, because paint has no texture to lose. The internal one
# carries a whole cockpit — carpet weave, leather grain, the pleats on two seat
# backs — inside the SAME 2048 the paint had, and at that density the baked bump
# stops reading as fabric and starts reading as gravel. Alex looked into the
# cockpit and said so.
#
# So the interior gets 4096 and the exterior keeps 2048. It costs about a
# megabyte, on a payload already over its ceiling, and that is recorded in
# CLAUDE.md rather than absorbed quietly.
SIZE_EXTERNAL = 2048
SIZE_INTERNAL = 4096
SIZE = SIZE_EXTERNAL          # default for anything that is neither

# The metal mask, and it applies to the EXTERNAL atlas only — see the module
# docstring for why the internal one gets no mask at all. On this atlas the rule
# does separate: paint is bright and saturated in diffuse, while chrome and the
# side pipe are dark in diffuse with their whole appearance carried by the
# reflection.
REFL_LO, REFL_HI = 0.22, 0.52   # reflection brightness
DIFF_LO, DIFF_HI = 0.10, 0.30   # diffuse brightness



def _smoothstep(lo, hi, x):
    t = np.clip((x - lo) / (hi - lo), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def _raw(img, size):
    """The image's own bytes, scaled, with colour management kept out of it.

    Blender converts an sRGB-tagged image on read. This model tags the same kind
    of control map sRGB on one atlas and Non-Color on the other — the vendor was
    inconsistent — so every map is read raw and the encoding is put back on the
    way out.
    """
    img.colorspace_settings.name = 'Non-Color'
    if tuple(img.size) != (size, size):
        img.scale(size, size)
    buf = np.empty(size * size * 4, dtype=np.float32)
    img.pixels.foreach_get(buf)
    return buf.reshape(size, size, 4)


def _png(path, rgba8):
    """Write an 8-bit RGBA PNG with zlib and nothing else.

    Blender will read pixels and will not take them. In 5.2,
    `Image.pixels.foreach_set` on an image from `images.new()` returns without
    error and without effect: read back, it is (0,0,0,1) everywhere — mean 0.250,
    spread 0.000, the default fill. update(), pack() and a float buffer all
    behave the same. The first run of this script produced four different
    atlases at byte-identical 78,303 bytes because of it, and exported clean.

    So the bytes are encoded here. PNG is four chunks around a zlib stream, the
    stdlib has zlib, and a format written by hand is one that cannot be quietly
    ignored by an API that had other plans.
    """
    h, w, _ = rgba8.shape
    raw = np.zeros((h, w * 4 + 1), dtype=np.uint8)
    raw[:, 1:] = rgba8.reshape(h, w * 4)          # filter byte 0 on each scanline

    def chunk(tag, payload):
        return (struct.pack('>I', len(payload)) + tag + payload
                + struct.pack('>I', zlib.crc32(tag + payload) & 0xFFFFFFFF))

    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)))
        f.write(chunk(b'IDAT', zlib.compress(raw.tobytes(), 6)))
        f.write(chunk(b'IEND', b''))


def _write(name, rgba, out_dir, srgb):
    """Encode one atlas, prove it is not flat, then hand it back to Blender."""
    path = os.path.join(out_dir, name)

    # Blender counts rows from the bottom; PNG counts from the top.
    rgba8 = (np.clip(rgba, 0.0, 1.0) * 255.0 + 0.5).astype(np.uint8)[::-1]
    _png(path, rgba8)

    # Widest spread across the three colour channels, not the red one. An ORM
    # atlas has a constant red channel BY CONSTRUCTION — occlusion is unused
    # here — so a red-only check fails a correct file, which it duly did.
    spread = max(int(rgba8[..., c].max()) - int(rgba8[..., c].min()) for c in (0, 1, 2))
    written = os.path.getsize(path)
    print('[pbr]   {}: {:.0f} KB, mean {:.1f}/255, widest channel spread {}'.format(
        name, written / 1024, float(rgba8.mean()), spread))
    if spread < 3:
        raise RuntimeError(name + ' came out flat — nothing was computed into it')

    img = bpy.data.images.load(path)
    img.name = name
    img.colorspace_settings.name = 'sRGB' if srgb else 'Non-Color'
    return img


def _find(mat, needle):
    for n in mat.node_tree.nodes:
        if n.type == 'TEX_IMAGE' and n.image and needle.lower() in n.image.name.lower():
            return n.image
    return None


def rebuild(out_dir):
    """Replace every V-Ray-derived material with an honest metallic-roughness one."""
    os.makedirs(out_dir, exist_ok=True)
    done = []

    for mat in list(bpy.data.materials):
        if not mat.use_nodes:
            continue
        diffuse = _find(mat, 'Diffuse')
        reflect = _find(mat, 'Reflection')
        gloss = _find(mat, 'Glossiness')
        bump = _find(mat, 'bump_baked')
        alpha_img = _find(mat, 'refraction_invert')
        if not (diffuse and reflect and gloss):
            print('[pbr] {}: not a V-Ray triple (diffuse={} reflection={} gloss={})'
                  ' — left alone'.format(mat.name, bool(diffuse), bool(reflect), bool(gloss)))
            continue

        internal = 'internal' in mat.name.lower()
        size = SIZE_INTERNAL if internal else SIZE_EXTERNAL

        d = _raw(diffuse, size)[..., :3]
        g = _raw(gloss, size)[..., 0]

        rough = np.clip(g, 0.0, 1.0)
        d_max = d.max(axis=2)

        # ── which atlas this is, and why that is the whole decision ──────────
        # Raycasting the rendered car settles what nobody could settle from a
        # threshold: the side pipe, the chrome bezels, the grille surround and
        # the rims are all on the EXTERNAL atlas, carried by `Body` and the
        # wheels. The INTERNAL atlas carries the cockpit, the steering wheel,
        # the door cards and the tyres — leather, carpet, wood and rubber, and
        # not one metal part among them.
        #
        # So metalness is decided per atlas, by what is on it, instead of by a
        # number tuned until the picture looked right. Two attempts were made at
        # tuning that number. The first called the seats chrome. The second
        # called 55% of the interior chrome and said so itself.
        if internal:
            # The reflection map is not read here at all: nothing on this atlas
            # is metal, and at 4096 loading a map to ignore it costs 268 MB.
            metal = np.zeros_like(rough)
            base = d
            note = 'internal atlas at {}px — no metal parts on it, so none is invented'.format(size)
        else:
            # Bright reflection with a dark diffuse. On the External atlas this
            # does separate: paint is bright and saturated, chrome and the pipe
            # are dark in diffuse with the reflection carrying them.
            sref = _raw(reflect, size)[..., :3]
            s_max = sref.max(axis=2)
            metal = _smoothstep(REFL_LO, REFL_HI, s_max) * (1.0 - _smoothstep(DIFF_LO, DIFF_HI, d_max))
            base = d * (1.0 - metal[..., None]) + sref * metal[..., None]
            note = 'external atlas at {}px — mask from reflection over dark diffuse'.format(size)

        base_rgba = np.concatenate([base, np.ones((size, size, 1), np.float32)], axis=2)
        # glTF's ORM packing: R occlusion (unused), G roughness, B metalness.
        # One image, separated in the node tree — the shape the glTF exporter
        # recognises without re-baking anything.
        orm = np.stack([np.ones_like(rough), rough, metal, np.ones_like(rough)], axis=2)

        stem = mat.name.replace('/', '_')
        base_img = _write(stem + '__basecolor.png', base_rgba, out_dir, srgb=True)
        orm_img = _write(stem + '__orm.png', orm, out_dir, srgb=False)

        # The vendor's own normal and cutout maps go through the same encoder,
        # and not for tidiness. gltf-transform's texture step is libvips, and
        # libvips refuses these two files outright: "value 32 of type gint is
        # invalid for property 'space' of type VipsInterpretation" — VipsInterpretation
        # has no member 32. They are 16-bit, and the whole compression step dies
        # on them, which means either no WebP for anything or no bump at all.
        # Re-encoded to 8-bit RGBA they are ordinary files and the step runs.
        if bump is not None:
            bump = _write(stem + '__normal.png', _raw(bump, size), out_dir, srgb=False)
        if alpha_img is not None:
            alpha_img = _write(stem + '__cutout.png', _raw(alpha_img, size), out_dir, srgb=False)

        pct = 100.0 * float((metal > 0.5).mean())
        print('[pbr] {}: metal {:.1f}% of the atlas, mean roughness {:.2f} — {}'
              .format(mat.name, pct, float(rough.mean()), note))
        if pct > 45.0:
            print('[pbr]   ! {:.0f}% is too much of a car to be chrome — check the '
                  'REFL/DIFF thresholds before shipping this'.format(pct))

        _rewire(mat, base_img, orm_img, bump, alpha_img)
        done.append(mat.name)

    print('[pbr] rebuilt {} material(s): {}'.format(len(done), ', '.join(done)))
    return done


def _rewire(mat, base_img, orm_img, bump, alpha_img):
    """A clean Principled graph.

    Everything the old one had is discarded rather than edited around. An Invert
    left dangling off a socket nobody reads is exactly the kind of thing that
    survives three conversions and then explains a bug.
    """
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new('ShaderNodeOutputMaterial')
    out.location = (600, 0)
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.location = (260, 0)
    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])

    n_base = nt.nodes.new('ShaderNodeTexImage')
    n_base.image = base_img
    n_base.location = (-460, 300)
    nt.links.new(n_base.outputs['Color'], bsdf.inputs['Base Color'])

    n_orm = nt.nodes.new('ShaderNodeTexImage')
    n_orm.image = orm_img
    n_orm.location = (-460, 0)
    sep = nt.nodes.new('ShaderNodeSeparateColor')
    sep.location = (-180, 0)
    nt.links.new(n_orm.outputs['Color'], sep.inputs['Color'])
    nt.links.new(sep.outputs['Green'], bsdf.inputs['Roughness'])
    nt.links.new(sep.outputs['Blue'], bsdf.inputs['Metallic'])

    if bump:
        n_bump = nt.nodes.new('ShaderNodeTexImage')
        n_bump.image = bump
        n_bump.image.colorspace_settings.name = 'Non-Color'
        n_bump.location = (-460, -320)
        n_nrm = nt.nodes.new('ShaderNodeNormalMap')
        n_nrm.location = (-180, -320)
        nt.links.new(n_bump.outputs['Color'], n_nrm.inputs['Color'])
        nt.links.new(n_nrm.outputs['Normal'], bsdf.inputs['Normal'])

    # The windscreen and side glass are cut out of the Internal atlas by an alpha
    # map. f-scene.js overrides the glass parts by node name, but the map carries
    # small cutouts elsewhere on the same mesh, so it is kept.
    if alpha_img:
        n_a = nt.nodes.new('ShaderNodeTexImage')
        n_a.image = alpha_img
        n_a.image.colorspace_settings.name = 'Non-Color'
        n_a.location = (-460, -640)
        nt.links.new(n_a.outputs['Color'], bsdf.inputs['Alpha'])
