# Build the site's logo and favicon files from a rendered logo.
#   python3 favset.py logo-sunset.png logo-holo.png OUTDIR
import io, struct, sys
from PIL import Image
sun = Image.open(sys.argv[1]).convert("RGBA"); holo = Image.open(sys.argv[2]).convert("RGBA"); out = sys.argv[3]
def sz(im, n): return im.resize((n, n), Image.LANCZOS)
sz(sun, 1024).save(f"{out}/public/logo.png", optimize=True)
sz(holo, 1024).save(f"{out}/public/logo-holo-full.png", optimize=True)
sz(sun, 96).save(f"{out}/public/logo-sunset.png", optimize=True)
sz(holo, 96).save(f"{out}/public/logo-holo.png", optimize=True)
sz(sun, 512).save(f"{out}/src/app/icon.png", optimize=True)
a = Image.new("RGBA", (180, 180), "#FFF4EA"); a.alpha_composite(sz(sun, 150), (15, 15)); a.convert("RGB").save(f"{out}/src/app/apple-icon.png", optimize=True)
# 16 px, placed pixel by pixel: gold-to-coral tile, navy A, white Z, navy shadow
NAVY, WHITE = (27, 31, 75, 255), (255, 255, 255, 255)
ramp = [(255, 196, 107), (255, 158, 107), (255, 107, 107)]
def tile_col(y):
    t = y / 14 * 2; i = min(int(t), 1); f = t - i; a, b = ramp[i], ramp[i + 1]
    return tuple(round(a[k] + (b[k] - a[k]) * f) for k in range(3)) + (255,)
A = [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"]
Z = ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"]
p = Image.new("RGBA", (16, 16), (0, 0, 0, 0)); px = p.load()
tile = {(x, y) for x in range(15) for y in range(15)} - {(0, 0), (14, 0), (0, 14), (14, 14)}
for x, y in tile:
    if (x + 1, y + 1) not in tile: px[x + 1, y + 1] = NAVY
for x, y in tile: px[x, y] = tile_col(y)
def cells(g, ox): return [(ox + x, 4 + y) for y, r in enumerate(g) for x, ch in enumerate(r) if ch == "#"]
for x, y in cells(Z, 8): px[x + 1, y + 1] = NAVY   # white needs a drop shadow to read on the light tile
for x, y in cells(A, 2): px[x, y] = NAVY
for x, y in cells(Z, 8): px[x, y] = WHITE
imgs = [p, sz(sun, 32), sz(sun, 48)]; blobs = []
for im in imgs:
    b = io.BytesIO(); im.save(b, "PNG"); blobs.append(b.getvalue())
hdr = struct.pack("<HHH", 0, 1, len(imgs)); off = 6 + 16 * len(imgs); dirs = b""
for im, bl in zip(imgs, blobs):
    dirs += struct.pack("<BBBBHHII", im.width, im.height, 0, 0, 1, 32, len(bl), off); off += len(bl)
open(f"{out}/src/app/favicon.ico", "wb").write(hdr + dirs + b"".join(blobs))
p.resize((128, 128), Image.NEAREST).save("/tmp/fav16-preview.png")
print("ok")
