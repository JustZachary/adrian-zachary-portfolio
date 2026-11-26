# The portfolio logo in 3D: the "AZ" pixel monogram built from bevelled blocks on a
# tomato tile, rendered in Cycles. One grid unit = one pixel of the 16x16 favicon mark.
#   python3 logo3d.py OUT.png SIZE SAMPLES [az el] [bg], colours from env vars:
#   TILE, GRAD (tile gradient, bottom to top), LET (A), LET2 (Z), LETGRAD (blocks by column), SHADOW
# The site's two themes:
#   sunset: TILE="#FF6B6B" GRAD="#FF6B6B,#FF9E6B,#FFC46B" LET="#1B1F4B" LET2="#FFFFFF" SHADOW="#1B1F4B"
#   holo:   TILE="#FFFFFF" GRAD="#FFC6E8,#D9C6FF,#B8F0FF" LET="#1B1F4B" LET2="#7B3FE4" SHADOW="#FF4FA3"
# then: python3 crop.py OUT.png logo-sunset.png .04 (same for holo), and
#       python3 favset.py logo-sunset.png logo-holo.png <repo>/temp-portfolio   (needs pip install bpy pillow)
import sys, math, bpy
from mathutils import Vector

out, size, samples = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
az = float(sys.argv[4]) if len(sys.argv) > 4 else 18
el = float(sys.argv[5]) if len(sys.argv) > 5 else 12
bg = sys.argv[6] if len(sys.argv) > 6 else "none"

def hexc(h, a=1.0):
    h = h.lstrip("#"); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [((v + .055) / 1.055) ** 2.4 if v > .04045 else v / 12.92 for v in c] + [a]
import os
TOM = os.environ.get("TILE", "#FF5A36"); CREAM = os.environ.get("LET", "#FFF8EC"); LET2 = os.environ.get("LET2", CREAM)
INK = os.environ.get("SHADOW", "#2B1D16"); GRAD = os.environ.get("GRAD", "")

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(name, color, rough, coat=0.0, sheen=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hexc(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = .15
    return m
M_TILE = mat("tile", TOM, .42, coat=.35)
M_LET = mat("letters", CREAM, .38, coat=.2)
M_LET2 = mat("letters2", LET2, .38, coat=.2)
M_INK = mat("ink", INK, .55)
if GRAD:
    nt = M_TILE.node_tree; tc = nt.nodes.new("ShaderNodeTexCoord"); sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    mr = nt.nodes.new("ShaderNodeMapRange"); mr.inputs[1].default_value = -8; mr.inputs[2].default_value = 8
    ramp = nt.nodes.new("ShaderNodeValToRGB"); cols = GRAD.split(",")
    els = ramp.color_ramp.elements
    while len(els) < len(cols): els.new(0)
    for i, c in enumerate(cols): els[i].position = i / (len(cols) - 1); els[i].color = hexc(c)
    nt.links.new(tc.outputs["Object"], sep.inputs[0]); nt.links.new(sep.outputs["Z"], mr.inputs[0])
    nt.links.new(mr.outputs[0], ramp.inputs[0]); nt.links.new(ramp.outputs[0], nt.nodes["Principled BSDF"].inputs["Base Color"])

def box(name, loc, dims, m, bevel, segs=4):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = name; o.scale = dims
    bpy.ops.object.transform_apply(scale=True)
    bv = o.modifiers.new("bevel", "BEVEL"); bv.width = bevel; bv.segments = segs; bv.limit_method = "ANGLE"
    o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    o.modifiers.new("wn", "WEIGHTED_NORMAL")
    return o

# The tile stands upright, facing the camera (-Y). Grid x -> world x, grid y -> world -z.
T = 15.0
box("tile", (0, 1.5, 0), (T, 3.0, T), M_TILE, 1.4, 6)
# the site's hard ink shadow, as a slab behind the tile, offset down and right
box("shadow", (1.3, 3.4, -1.3), (T, 3.0, T), M_INK, 1.4, 6)

A = [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"]
Z = ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"]
cells = [(2 + x, 4 + y) for y, r in enumerate(A) for x, c in enumerate(r) if c == "#"] + \
        [(8 + x, 4 + y) for y, r in enumerate(Z) for x, c in enumerate(r) if c == "#"]
D = 1.7   # how far the blocks stand out of the tile
# LETGRAD="#c1,#c2,...": colour the blocks column by column, left to right, instead of per letter
LETGRAD = [c for c in os.environ.get("LETGRAD", "").split(",") if c]
def lerp_hex(cols, t):
    t = min(1, max(0, t)) * (len(cols) - 1); i = min(int(t), len(cols) - 2); f = t - i
    a = [int(cols[i][k:k + 2], 16) for k in (1, 3, 5)]; b = [int(cols[i + 1][k:k + 2], 16) for k in (1, 3, 5)]
    return "#" + "".join(f"{round(x + (y - x) * f):02X}" for x, y in zip(a, b))
col_mats = {}
def block_mat(gx):
    if not LETGRAD: return M_LET if gx < 8 else M_LET2
    if gx not in col_mats: col_mats[gx] = mat(f"col{gx}", lerp_hex(LETGRAD, (gx - 2) / 10), .38, coat=.2)
    return col_mats[gx]
for i, (gx, gy) in enumerate(cells):
    # grid is 15 wide (0..14); centre it on the tile
    wx, wz = gx - 7.0 + .5 - .5, -(gy - 7.0)
    box(f"px{i}", (wx, -D / 2 + .05, wz), (.96, D, .96), block_mat(gx), .14, 3)

# studio: a big soft key from top-left-front, a fill from the right, a rim from behind-top
def area(name, loc, size, energy, color="#FFFFFF"):
    bpy.ops.object.light_add(type="AREA", location=loc)
    l = bpy.context.object; l.name = name; l.data.size = size; l.data.energy = energy; l.data.color = hexc(color)[:3]
    d = Vector((0, 0, 0)) - l.location; l.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
area("key", (-24, -30, 28), 9, 52000, "#FFF4E6")
area("fill", (30, -22, -2), 26, 14000, "#E8EEFF")
area("rim", (6, 26, 30), 14, 26000)

w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = hexc("#FFF8EC")
w.node_tree.nodes["Background"].inputs[1].default_value = .35

# camera, orthographic so the mark keeps its proportions
bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
cam.data.type = "ORTHO"; cam.data.ortho_scale = 21.5
r = 80; a, e = math.radians(az), math.radians(el)
cam.location = (r * math.sin(a) * math.cos(e) * -1, -r * math.cos(a) * math.cos(e), r * math.sin(e))
cam.rotation_euler = (Vector((0.3, 0, -0.3)) - cam.location).to_track_quat("-Z", "Y").to_euler()

sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = samples; sc.cycles.use_denoising = True
sc.render.resolution_x = sc.render.resolution_y = size
sc.render.film_transparent = bg == "none"
sc.view_settings.view_transform = "Standard"; sc.view_settings.look = "None"
sc.render.image_settings.file_format = "PNG"; sc.render.image_settings.color_mode = "RGBA"
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("RENDERED", out)
