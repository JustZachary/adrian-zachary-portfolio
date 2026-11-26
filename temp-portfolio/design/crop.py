# trim to the visible logo and pad to a square with a margin
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert("RGBA"); m = float(sys.argv[3]) if len(sys.argv) > 3 else .06
x0, y0, x1, y1 = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
w, h = x1 - x0, y1 - y0; s = int(max(w, h) * (1 + 2 * m))
out = Image.new("RGBA", (s, s), (0, 0, 0, 0)); out.alpha_composite(im.crop((x0, y0, x1, y1)), ((s - w) // 2, (s - h) // 2))
out.save(sys.argv[2])
