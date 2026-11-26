# Pack the rendered splash frames into one animated WebP that plays once and holds the logo.
#   python3 splash_webp.py sp/sunset out/splash-sunset.webp [size]
import glob, sys
from PIL import Image
frames = [Image.open(f).convert("RGBA") for f in sorted(glob.glob(sys.argv[1] + "_*.png"))]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 520
box = None   # one crop for every frame, so nothing jumps
for im in frames:
    b = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if b: box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
w, h = box[2] - box[0], box[3] - box[1]; s = int(max(w, h) * 1.04); cx, cy = (box[0] + box[2]) // 2, (box[1] + box[3]) // 2
out = []
for im in frames:
    c = Image.new("RGBA", (s, s), (0, 0, 0, 0)); c.alpha_composite(im.crop((cx - s // 2, cy - s // 2, cx + s - s // 2, cy + s - s // 2)))
    out.append(c.resize((size, size), Image.LANCZOS))
dur = [42] * (len(out) - 1) + [60000]
out[0].save(sys.argv[2], save_all=True, append_images=out[1:], duration=dur, loop=1, quality=80, method=6, minimize_size=True)
print(sys.argv[2], len(out), "frames")
