"""Recolor the Leonida Atlas basemap into the Mundo Vice night palette.

Input:  public/assets/gta6-leonida-atlas/basemap.webp (10000 x 10000, CC BY 4.0, GTADB / Yanis v16)
Output: public/assets/mundovice/basemap-mundovice.webp (same bounds, SIZE x SIZE)

Water and the unknown western area become one dark night tone with a faint retro grid,
coastlines get a pink neon glow, land goes purple, urban areas follow the site's sunset
ramp (pink -> orange -> sun) and roads read as warm cream lines.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

Image.MAX_IMAGE_PIXELS = None
SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 6144
SRC = 'public/assets/gta6-leonida-atlas/basemap.webp'
DST = 'public/assets/mundovice/basemap-mundovice.webp'


def hexc(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


src = Image.open(SRC).convert('RGB').resize((SIZE, SIZE), Image.LANCZOS)
a = np.asarray(src)

# --- land mask (water = blue dominant; the unknown band is also blue-ish/dark) ---
r = a[..., 0].astype(np.int16)
g = a[..., 1].astype(np.int16)
b = a[..., 2].astype(np.int16)
water = (b > r + 12) & (b >= g - 8)
land = ~water
del r, g, b

mask = Image.fromarray((land * 255).astype(np.uint8))
small = mask.resize((SIZE // 4, SIZE // 4), Image.BILINEAR)
glow_wide = np.asarray(small.filter(ImageFilter.GaussianBlur(10)).resize((SIZE, SIZE), Image.BILINEAR)).astype(np.float32) / 255
glow_edge = np.asarray(mask.filter(ImageFilter.GaussianBlur(3))).astype(np.float32) / 255

out = np.empty((SIZE, SIZE, 3), np.uint8)
night, deep = hexc('#120e26'), hexc('#0e0b1e')
vd, vl = hexc('#241a46'), hexc('#3a2c66')
pink, orng, sun, cream = hexc('#ff3e9a'), hexc('#ff8a3d'), hexc('#ffc46b'), hexc('#fff1dc')
neon = hexc('#ff5aa9')

CH = 512
xs = np.linspace(0, 1, SIZE, dtype=np.float32)[None, :]
for y0 in range(0, SIZE, CH):
    y1 = min(SIZE, y0 + CH)
    blk = a[y0:y1].astype(np.float32)
    R, G, B = blk[..., 0], blk[..., 1], blk[..., 2]
    L = 0.299 * R + 0.587 * G + 0.114 * B
    mx, mn = blk.max(-1), blk.min(-1)
    sat = (mx - mn) / (mx + 1)
    lnd = land[y0:y1]
    urban = lnd & (L > 175) & (sat < 0.22)
    roads = lnd & (L > 228)

    ys = (np.arange(y0, y1, dtype=np.float32) / SIZE)[:, None]
    # water / unknown: night tone + faint grid
    wcol = np.broadcast_to(deep, blk.shape).copy()
    gy = (np.arange(y0, y1) % (SIZE // 48)) < max(1, SIZE // 4096)
    gx = (np.arange(SIZE) % (SIZE // 48)) < max(1, SIZE // 4096)
    grid = gy[:, None] | gx[None, :]
    gw = np.clip(glow_wide[y0:y1] * 1.5, 0, 1)[..., None]
    ge = np.clip(glow_edge[y0:y1] * 1.8, 0, 1)[..., None]
    wcol = wcol * (1 - .22 * gw) + pink * (.22 * gw)
    wcol = wcol * (1 - .75 * ge) + neon * (.75 * ge)

    Ln = np.clip((L - 90) / 120, 0, 1)[..., None]
    lcol = vd + (vl - vd) * Ln
    u = np.clip(.55 * ys + .45 * xs, 0, 1)[..., None]
    ucol = np.where(u < .5, pink + (orng - pink) * (u / .5), orng + (sun - orng) * ((u - .5) / .5))
    sh = (.42 + .5 * np.clip((L - 175) / 70, 0, 1))[..., None]
    lcol = np.where(urban[..., None], ucol * sh, lcol)
    lcol = np.where(roads[..., None], lcol * .5 + cream * .5, lcol)

    res = np.where(lnd[..., None], lcol, wcol)
    out[y0:y1] = np.clip(res, 0, 255).astype(np.uint8)
    print(f'{y1}/{SIZE}', end='\r', flush=True)

import os
os.makedirs(os.path.dirname(DST), exist_ok=True)
Image.fromarray(out).save(DST, 'WEBP', quality=82, method=6)
print('\n', DST, os.path.getsize(DST) // 1024, 'KB')
