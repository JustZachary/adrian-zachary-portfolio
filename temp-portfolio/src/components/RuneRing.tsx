"use client";
/* eslint-disable react-hooks/purity, react-hooks/immutability --
   this file is a three.js render loop: it seeds geometry with random
   numbers once and mutates its own typed-array buffers every frame,
   which is how WebGL scenes work, not a React state bug. */
/* The page IS a spiral stair in an underground well.
 *
 * You arrive through a gated archway at the top — the dungeon entrance —
 * onto a stone landing with a seal of gold light on it. From there stone
 * steps wind down around a central pillar inside a round shaft:
 * balustrade and handrail on the outer edge, corbels under each tread,
 * pilasters and arched torch niches on the wall, rune bands on the
 * pillar at every full turn, a vault overhead, and a lit floor at the
 * bottom.
 *
 * You walk it in first person. The page's scroll is a timeline of walks
 * and pauses (see useDescent in page.tsx): it gives this file a position
 * `u` along the stair (0 top, 1 bottom) and this file puts the camera on
 * that step, looking down the stair. The site's sections are quest
 * panels that hang in the air at their landings: every frame their 3D
 * anchors are projected to the screen and the DOM panels are moved
 * there, scaled by distance — so they come toward you as you walk, sit
 * still while you read, and fall behind when you move on.
 *
 * Built on three.js via react-three-fiber. Lamp + two nearest torches
 * for light, fog for depth, additive sprites for anything that glows.
 * No drei, no postprocessing.
 */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const GOLD = new THREE.Color("#F6BC7C");
const SILVER = new THREE.Color("#D9EAFA");
const EMBER = new THREE.Color("#ff9a3c");
const STONE = "#7a6d55";
const STONE_LIGHT = "#948468";
const STONE_DARK = "#5e5446";
const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

/* The well's shape. */
export const RING_R = 2.9;       // outer radius of the steps
export const PILLAR_R = 0.75;    // the central pillar
export const WALL_R = 4.1;       // the shaft wall
export const TURNS = 8;          // how many times the stair winds
export const DEPTH = 38;         // how far down it goes
export const STEPS_PER_TURN = 16;
export const STEPS = Math.round(TURNS * STEPS_PER_TURN);
const WEDGE = (Math.PI * 2) / STEPS_PER_TURN;
const STEP_THICK = 0.16;
const WALK_R = (RING_R + PILLAR_R) / 2 + 0.3;  // where you walk
const EYE = 1.62;                               // eye height above the tread
const AHEAD = 1.05;                             // radians you look ahead
const GATE_A = -WEDGE * 2.2;                    // where the entrance is, just above step 0

/* Shared driver state — written by the page every scroll, read every
   frame in here. A ref, not React state, so nothing rerenders. */
export type QuestPanel = {
  el: HTMLElement | null;
  h: number;           // cached offsetHeight (measured by the page, not per frame)
  u: number;           // where on the stair it hangs (0..1)
  screen?: boolean;    // true: fixed centre-screen (the hero), not projected
  shift: number;       // px the page scrolls the panel up while you read it
  fade: number;        // 0..1 extra fade set by the timeline
};
export type RingDriver = {
  u: number;           // 0..1 down the stair
  hero: number;        // 0 = standing in the gate, 1 = walking the stair
  hold: number;        // 1 while paused at a landing (dampens mouse-look)
  mouseX: number;
  mouseY: number;
  panels: QuestPanel[];
};

export function treadY(u: number) { return -0.2 - u * DEPTH; }
export function angleAt(u: number) { return u * TURNS * Math.PI * 2; }

function makeGlowTexture() {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* A soft irregular blob: damp patches on the wall, smoke, flame bodies. */
function makeBlobTexture() {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  for (let i = 0; i < 9; i++) {
    const x = size / 2 + (Math.random() - 0.5) * 40, y = size / 2 + (Math.random() - 0.5) * 40, r = 22 + Math.random() * 26;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRuneTexture(rune: string) {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.font = "bold 84px 'Cinzel', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(246,188,124,0.9)";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#F6BC7C";
  ctx.fillText(rune, size / 2, size / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Masonry, three kinds, generated off the main thread.
 *
 * stoneGen is self-contained on purpose: it is stringified into a Web
 * Worker, so it may not touch THREE, closures or imports. It builds a
 * height field — blocks with recessed mortar, domain-warped noise for
 * the grain, pits, hairline cracks — and from it a colour map, a
 * normal map (Sobel) and a roughness map. Everything is periodic so
 * the tile repeats without seams.
 *
 *   ashlar  the shaft wall: courses of uneven blocks, chipped corners,
 *           each block tilted a fraction, water runs and lichen
 *   flag    treads and floor: irregular flagstones with worn centres
 *   drum    the pillar: big drums with heavy chamfers
 */
type StoneKind = "ashlar" | "flag" | "drum";
function stoneGen(kind: StoneKind, size: number, seed: number) {
  const P = 8; // noise lattice period, in cells per tile
  const rnd = (x: number, y: number, z = 0) => {
    const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 0.37) * 43758.5453;
    return n - Math.floor(n);
  };
  const sm = (t: number) => t * t * (3 - 2 * t);
  const pr = (x: number, y: number, per: number, z = 0) => rnd(((x % per) + per) % per, ((y % per) + per) % per, z);
  const noise = (x: number, y: number, per: number, z = 0) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = pr(xi, yi, per, z), b = pr(xi + 1, yi, per, z), c = pr(xi, yi + 1, per, z), d = pr(xi + 1, yi + 1, per, z);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  };
  const fbm = (u: number, v: number, per: number, oct: number, z = 0) => {
    let n = 0, amp = 0.5, f = per, tot = 0;
    for (let o = 0; o < oct; o++) { n += noise(u * f, v * f, f, z + o) * amp; tot += amp; amp *= 0.5; f *= 2; }
    return n / tot;
  };
  // domain-warped grain: veins and swirls rather than static
  const grain = (u: number, v: number) => {
    // a gentle warp: rough stone, not carved scrollwork
    const q = fbm(u, v, P, 2, 11);
    return 0.35 * fbm(u + 0.12 * q, v + 0.08 * q, P, 3, 23) + 0.65 * fbm(u, v, P * 3, 4, 37);
  };
  // Worley cells with a period, for flagstones and cracks
  const worley = (u: number, v: number, per: number, z: number) => {
    const cx = Math.floor(u * per), cy = Math.floor(v * per);
    let f1 = 9, f2 = 9, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const gx = cx + i, gy = cy + j;
      const px = gx + pr(gx, gy, per, z), py = gy + pr(gx, gy, per, z + 5);
      const dx = u * per - px, dy = v * per - py;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < f1) { f2 = f1; f1 = d; id = ((gx % per) + per) % per + (((gy % per) + per) % per) * per; }
      else if (d < f2) f2 = d;
    }
    return { f1, f2, id };
  };

  const N = size * size;
  const H = new Float32Array(N), T = new Float32Array(N), RG = new Float32Array(N), LICH = new Float32Array(N), WET = new Float32Array(N);
  const FACE = new Int32Array(N);
  const px = 1 / size;
  for (let y = 0; y < size; y++) {
    const v = y * px;
    for (let x = 0; x < size; x++) {
      const u = x * px;
      const i = y * size + x;
      let mortar = 0, tone = 1, tilt = 0, faceId = 0, wear = 0;
      if (kind === "ashlar" || kind === "drum") {
        // courses of two heights — a tall course, a short course — like coursed rubble
        const courseEdges = kind === "ashlar" ? [0, 0.3, 0.5, 0.8, 1] : [0, 0.34, 0.67, 1];
        let row = 0; while (v >= courseEdges[row + 1]) row++;
        const c0 = courseEdges[row], c1 = courseEdges[row + 1];
        const perCourse = kind === "ashlar" ? (row % 2 ? 3 : 2) : 3;
        const off = kind === "ashlar" ? (row % 2 ? 0.5 : 0.15) : (row % 3) * 0.33;
        const bu = (u + off / perCourse) * perCourse;
        const k = Math.floor(bu), lu = bu - k;
        // uneven block widths, and split (not sawn) edges: the boundary wanders
        const sL = (pr(k, row, perCourse * 4, 3) - 0.5) * 0.28 + (noise(y * 0.08, k * 7, size, 91) - 0.5) * 0.05;
        const sR = (pr(k + 1, row, perCourse * 4, 3) - 0.5) * 0.28 + (noise(y * 0.08, (k + 1) * 7, size, 91) - 0.5) * 0.05;
        const ex = Math.min(lu - sL, 1 + sR - lu) * (size / perCourse);
        const lv = (v - c0) / (c1 - c0);
        const jog = (noise(x * 0.08, row * 5, size, 93) - 0.5) * 0.06;
        const ey = Math.min(lv - jog, 1 - lv + jog) * (size * (c1 - c0));
        faceId = k + row * 31;
        const chamfer = kind === "drum" ? 26 : 11;
        const wobble = 0.7 + 0.6 * noise(x * 0.03, y * 0.03, size * 0.03, 41);
        const edge = Math.min(ex, ey);
        // tumbled: the recess has a rounded profile, not a straight bevel
        const m0 = 1 - Math.min(1, edge / (chamfer * (size / 512) * wobble));
        mortar = m0 * m0 * (3 - 2 * m0);
        // chipped corners
        const corner = Math.max(0, 1 - Math.hypot(ex, ey) / (34 * (size / 512)));
        if (corner > 0 && pr(faceId, 7, 997, 9) < 0.45) mortar = Math.max(mortar, corner * corner * 0.8);
        tone = 0.78 + pr(faceId, 1, 997, 2) * 0.44;
        if (kind === "ashlar") tilt = ((pr(faceId, 2, 997, 4) - 0.5) * (lu - 0.5) + (pr(faceId, 3, 997, 6) - 0.5) * (lv - 0.5)) * 0.35;
      } else {
        // flagstones: irregular cells, mortar along the borders
        const w = worley(u, v, 3, 17);
        const border = w.f2 - w.f1;
        const wobble = 0.8 + 0.4 * noise(x * 0.05, y * 0.05, size * 0.05, 43);
        mortar = 1 - Math.min(1, border / (0.085 * wobble));
        faceId = w.id;
        tone = 0.8 + pr(faceId, 1, 997, 2) * 0.4;
        tilt = ((pr(faceId, 2, 997, 4) - 0.5) * 0.25) * (0.5 - w.f1);
        wear = Math.max(0, 1 - w.f1 / 0.32); // smoother, paler toward each stone's middle
      }
      const g = grain(u, v);
      // fine speckle, like granite grit in the surface
      const speck = (rnd(x, y, 17) - 0.5) * 0.08;
      // faint sinuous veins
      const vn = 1 - Math.abs(2 * fbm(u * 1.3, v * 0.7, P, 3, 101) - 1);
      const vein = Math.max(0, vn - 0.86) * 4 * (1 - mortar);
      const pits = Math.pow(noise(x * 0.09 / (size / 512), y * 0.09 / (size / 512), size * 0.09 / (size / 512), 51), 5) * 0.7;
      // hairline cracks: the borders of a large Worley, only on some cells
      const cw = worley(u, v, 5, 61);
      const crack = (cw.f2 - cw.f1 < 0.012 && pr(cw.id, 9, 997, 13) < 0.35) ? 0.35 : 0;
      const h = (1 - mortar * 0.92) * (0.68 + g * 0.22 + tilt) - pits * (1 - mortar) - crack;
      H[i] = h;
      FACE[i] = Math.abs(Math.floor(faceId));
      // water runs: dark, slightly glossy vertical streaks (walls only)
      const run = kind === "ashlar" ? Math.pow(noise(x * 0.9 / (size / 512), y * 0.015 / (size / 512), size, 71), 3) * (0.3 + 0.7 * v) : 0;
      WET[i] = run;
      // lichen: pale patches on some faces
      const lichen = kind === "flag" ? 0 : Math.max(0, fbm(u, v, 3, 3, 83) - 0.58) * 3 * (1 - mortar);
      LICH[i] = Math.min(1, lichen);
      T[i] = tone * (0.72 + g * 0.35 + speck) * (1 - mortar * 0.5) * (1 - run * 0.45) * (1 + wear * 0.12) * (1 - vein * 0.35);
      RG[i] = mortar > 0.5 ? 0.98 : 0.62 + (1 - g) * 0.3 - wear * 0.25 - run * 0.3 + pits * 0.5;
    }
  }
  const at = (x: number, y: number) => H[((y + size) % size) * size + ((x + size) % size)];
  const col = new Uint8ClampedArray(N * 4), nor = new Uint8ClampedArray(N * 4), rgh = new Uint8ClampedArray(N * 4);
  const HUE = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    // each stone leans warm tan, grey-beige or pale, by its id
    const pick = FACE[i] % 3;
    const t3 = pick === 0 ? [1.06, 0.98, 0.9] : pick === 1 ? [0.96, 0.98, 1.02] : [1.02, 1.02, 0.98];
    HUE[i * 3] = t3[0]; HUE[i * 3 + 1] = t3[1]; HUE[i * 3 + 2] = t3[2];
  }
  const base = kind === "flag" ? [0x90, 0x82, 0x68] : kind === "drum" ? [0x84, 0x7a, 0x64] : [0x88, 0x7c, 0x64];
  const lich = [0x7c, 0x86, 0x5a];
  const M = size / 512;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, o = i * 4;
    const t = T[i], l = LICH[i];
    const warm = 0.97 + rnd(x, y, 5) * 0.06;
    for (let c = 0; c < 3; c++) {
      const b = base[c] * (1 - l) + lich[c] * l;
      const w = c === 0 ? warm : c === 2 ? 2 - warm : 1;
      col[o + c] = b * t * w * HUE[i * 3 + c];
    }
    col[o + 3] = 255;
    const dx = (at(x + 1, y) - at(x - 1, y)) * 4 * M, dy = (at(x, y + 1) - at(x, y - 1)) * 4 * M;
    const len = Math.hypot(dx, dy, 1);
    nor[o] = ((-dx / len) * 0.5 + 0.5) * 255; nor[o + 1] = ((-dy / len) * 0.5 + 0.5) * 255; nor[o + 2] = ((1 / len) * 0.5 + 0.5) * 255; nor[o + 3] = 255;
    const r = Math.min(1, Math.max(0.2, RG[i]));
    rgh[o] = rgh[o + 1] = rgh[o + 2] = r * 255; rgh[o + 3] = 255;
  }
  return { col, nor, rgh, size };
}

type StoneMaps = { map: THREE.Texture; normalMap: THREE.Texture; roughnessMap: THREE.Texture; all: THREE.Texture[] };

/* A placeholder set of textures that a worker fills in when the real
   masonry is ready. Clones (for different tilings) are registered so
   they can be re-uploaded when the data arrives. */
function makeStoneMaps(kind: StoneKind, size: number, seed: number): StoneMaps {
  const flat = (r: number, g: number, b: number, srgb: boolean) => {
    const t = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  };
  const maps: StoneMaps = { map: flat(0x6a, 0x60, 0x4c, true), normalMap: flat(128, 128, 255, false), roughnessMap: flat(240, 240, 240, false), all: [] };
  maps.all.push(maps.map, maps.normalMap, maps.roughnessMap);
  if (typeof window !== "undefined") {
    const src = `const gen = ${stoneGen.toString()}; self.onmessage = (e) => { const r = gen(e.data.kind, e.data.size, e.data.seed); self.postMessage(r, [r.col.buffer, r.nor.buffer, r.rgh.buffer]); };`;
    const worker = new Worker(URL.createObjectURL(new Blob([src], { type: "application/javascript" })));
    worker.onerror = (e) => console.error("stone worker:", e.message, e.lineno);
    worker.onmessage = (e: MessageEvent<{ col: Uint8ClampedArray; nor: Uint8ClampedArray; rgh: Uint8ClampedArray; size: number }>) => {
      const { col, nor, rgh, size: sz } = e.data;
      const fill = (t: THREE.Texture, data: Uint8ClampedArray) => { t.image = { data: new Uint8Array(data.buffer), width: sz, height: sz }; };
      fill(maps.map, col); fill(maps.normalMap, nor); fill(maps.roughnessMap, rgh);
      // the 1×1 placeholder was uploaded as immutable GL storage, so the
      // GPU copy must be dropped and made afresh at the real size
      for (const t of maps.all) { t.dispose(); t.needsUpdate = true; }
      worker.terminate();
    };
    worker.postMessage({ kind, size, seed });
  }
  return maps;
}
function tiledStone(src: StoneMaps, rx: number, ry: number): StoneMaps {
  const c = (t: THREE.Texture) => { const k = t.clone(); k.repeat.set(rx, ry); k.needsUpdate = true; src.all.push(k); return k; };
  return { map: c(src.map), normalMap: c(src.normalMap), roughnessMap: c(src.roughnessMap), all: src.all };
}
function stoneMaterial(maps: StoneMaps, color: string, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, map: maps.map, normalMap: maps.normalMap, normalScale: new THREE.Vector2(1.35, 1.35), roughnessMap: maps.roughnessMap, roughness: 1, metalness: 0.02, envMapIntensity: 0.35, ...extra });
}

/* The handrail follows the stair: a helix. */
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private r: number, private lift: number, private from = 0) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const u = this.from + (1 - this.from) * t;
    const a = angleAt(u);
    return target.set(Math.cos(a) * this.r, treadY(u) + this.lift, Math.sin(a) * this.r);
  }
}

function stepPose(k: number) {
  const u = k / STEPS;
  return { u, angle: angleAt(u), y: treadY(u) };
}

/* The seal on the top landing: a particle ring. */
function makeSeal(n: number) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), sz = new Float32Array(n), seed = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = (RING_R - 0.45) + (Math.random() - 0.5) * 0.3 * (Math.random() < 0.85 ? 1 : 3);
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 0.08 + Math.random() * 0.15; pos[i * 3 + 2] = Math.sin(a) * r;
    const c = Math.random() < 0.82 ? GOLD : SILVER;
    const b = 0.6 + Math.random() * 0.4;
    col[i * 3] = c.r * b; col[i * 3 + 1] = c.g * b; col[i * 3 + 2] = c.b * b;
    sz[i] = 0.01 + Math.random() * 0.022;
    seed[i] = Math.random() * Math.PI * 2;
  }
  return { pos, col, sz, seed };
}

function makeSealShader(glow: THREE.Texture) {
  return {
    uniforms: { uTime: { value: 0 }, uTex: { value: glow }, uPixelRatio: { value: 1 }, uOpacity: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute float aSize; attribute float aSeed;
      varying vec3 vColor; varying float vAlpha;
      uniform float uTime; uniform float uPixelRatio;
      void main() {
        vColor = color;
        vAlpha = 0.65 + 0.35 * sin(uTime * 1.8 + aSeed);
        vec3 p = position; p.y += sin(uTime * 0.9 + aSeed) * 0.03;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = aSize * uPixelRatio * (260.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uTex; uniform float uOpacity;
      varying vec3 vColor; varying float vAlpha;
      void main() { vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(vColor * 1.6, t.a * vAlpha * uOpacity); }`,
  };
}

/* Standing on the stair at u: where your eyes are and what you look at.
   You walk the middle of the tread and look down the stair along it, a
   little below level. hero=0 is standing in the gate at the top looking
   across the landing into the well; it blends into the walk. */
function poseAt(u: number, hero: number, mx: number, my: number, eye: THREE.Vector3, aim: THREE.Vector3) {
  /* Both poses are described in cylindrical terms — angle round the
     pillar, radius, height — and blended there, so the path from the
     gate onto the stair sweeps round the landing. Blending x/y/z would
     cut a straight chord through the middle of the shaft (and the
     pillar) whenever the stair target is already round the bend. */
  const b = 1 - hero;
  const e = b * b * (3 - 2 * b); // 1 = in the gate, 0 = walking
  // walking: on the tread, looking down the stair a little below level
  const wa = angleAt(u);
  const wr = WALK_R;
  const wy = treadY(u) + STEP_THICK / 2 + EYE;
  const wLookDa = AHEAD, wLookR = WALK_R;
  const wLookY = treadY(u + AHEAD / (TURNS * Math.PI * 2)) + STEP_THICK / 2 + EYE - 0.05;
  // in the gate: at the threshold, high, looking across the seal into the well
  const ga = GATE_A;
  const gr = WALL_R - 0.6;
  const gy = treadY(0) + STEP_THICK / 2 + EYE + 0.5;
  const gLookDa = 0.9 + Math.PI * 0.35, gLookR = 0.9; // toward the far side, past the seal
  const gLookY = treadY(0) - 2.6;
  // the eye's angle unwinds from the gate onto the stair the short way
  const ea = wa + (ga - wa) * e;
  const er = wr + (gr - wr) * e;
  const ey = wy + (gy - wy) * e;
  eye.set(Math.cos(ea) * er, ey, Math.sin(ea) * er);
  const la = ea + (wLookDa + (gLookDa - wLookDa) * e) + mx * 0.4;
  const lr = wLookR + (gLookR - wLookR) * e;
  const ly = wLookY + (gLookY - wLookY) * e - my * 0.5;
  aim.set(Math.cos(la) * lr, ly, Math.sin(la) * lr);
}

/* Where a quest panel hangs for a landing at u: exactly where you look
   when you stand there, so it sits centre-screen while you read. */
export function anchorAt(u: number, out: THREE.Vector3) {
  const a = angleAt(u) + AHEAD;
  out.set(Math.cos(a) * WALK_R, treadY(u + AHEAD / (TURNS * Math.PI * 2)) + STEP_THICK / 2 + EYE - 0.05, Math.sin(a) * WALK_R);
  return out;
}

function Well({ driver }: { driver: React.RefObject<RingDriver> }) {
  const runeGroup = useRef<THREE.Group>(null);
  const pillarRuneGroup = useRef<THREE.Group>(null);
  const torchGroup = useRef<THREE.Group>(null);
  const torchLight = useRef<THREE.PointLight>(null);
  const torchLight2 = useRef<THREE.PointLight>(null);
  const lamp = useRef<THREE.PointLight>(null);
  const wispGroup = useRef<THREE.Group>(null);
  const embers = useRef<THREE.Points>(null);
  const floor = useRef<THREE.Mesh>(null);
  const portcullis = useRef<THREE.Group>(null);

  const glow = useMemo(() => makeGlowTexture(), []);
  const blob = useMemo(() => makeBlobTexture(), []);
  const { scene, gl: renderer } = useThree();
  /* A neutral room environment so iron and wet stone have something to reflect. */
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.22;
    return () => { scene.environment = null; env.dispose(); pmrem.dispose(); };
  }, [scene, renderer]);
  const ashlar = useMemo(() => makeStoneMaps("ashlar", 1024, 1), []);
  const flag = useMemo(() => makeStoneMaps("flag", 1024, 2), []);
  const drum = useMemo(() => makeStoneMaps("drum", 768, 3), []);
  // one tile ≈ 2 world units, so texel density is even across surfaces
  const wallMat = useMemo(() => stoneMaterial(tiledStone(ashlar, 13, 23), STONE_DARK, { side: THREE.BackSide }), [ashlar]);
  const pillarMat = useMemo(() => stoneMaterial(tiledStone(drum, 2.5, 23), STONE_LIGHT), [drum]);
  const floorMat = useMemo(() => stoneMaterial(tiledStone(flag, 4, 4), STONE_DARK), [flag]);
  const landingMat = useMemo(() => stoneMaterial(tiledStone(flag, 0.5, 0.5), STONE), [flag]);
  const landingGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, RING_R + 0.15, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, PILLAR_R - 0.05, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(shape, { depth: STEP_THICK * 1.4, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.035, bevelSegments: 2, curveSegments: 48 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -STEP_THICK * 1.4 - 0.03, 0);
    g.computeVertexNormals();
    return g;
  }, []);
  const runeTextures = useMemo(() => RUNES.map(makeRuneTexture), []);
  const sealData = useMemo(() => makeSeal(1100), []);
  const sealShader = useMemo(() => makeSealShader(glow), [glow]);

  /* Shared geometry and materials. */
  /* A tread is a bevelled slab cut as a sector of the well — extruded
     from a 2D shape so its top has proper planar UVs (the stone grain
     runs across it instead of being smeared round a cylinder) and its
     edges are chamfered, which is where torchlight catches. */
  const stepGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const a0 = -WEDGE * 0.48, a1 = WEDGE * 0.48, ri = PILLAR_R - 0.06, ro = RING_R;
    shape.moveTo(Math.cos(a0) * ri, Math.sin(a0) * ri);
    shape.lineTo(Math.cos(a0) * ro, Math.sin(a0) * ro);
    for (let i = 1; i <= 6; i++) { const a = a0 + (a1 - a0) * (i / 6); shape.lineTo(Math.cos(a) * ro, Math.sin(a) * ro); }
    shape.lineTo(Math.cos(a1) * ri, Math.sin(a1) * ri);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: STEP_THICK - 0.05, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 2, curveSegments: 6 });
    g.rotateX(-Math.PI / 2);          // shape plane → the tread's top
    g.translate(0, -STEP_THICK / 2 + 0.025, 0);
    g.computeVertexNormals();
    // ambient occlusion, baked: darker where the tread meets the pillar and underneath
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      const toPillar = Math.min(1, Math.max(0, (r - PILLAR_R) / 0.7));
      const ao = (0.62 + 0.38 * toPillar * toPillar) * (y < -0.02 ? 0.55 : 1);
      col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = ao;
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return g;
  }, []);
  const nosingGeo = useMemo(() => new THREE.BoxGeometry(RING_R - PILLAR_R + 0.05, 0.008, 0.012), []);
  const brassGeo = useMemo(() => new THREE.BoxGeometry(RING_R - PILLAR_R + 0.02, 0.014, 0.05), []);
  const dirtGeo = useMemo(() => new THREE.PlaneGeometry(0.7, 0.45), []);
  const postGeo = useMemo(() => new THREE.CylinderGeometry(0.035, 0.045, 0.95, 6), []);
  const corbelGeo = useMemo(() => new THREE.BoxGeometry(0.34, 0.26, 0.3), []);
  const stepMat = useMemo(() => stoneMaterial(tiledStone(flag, 0.55, 0.55), STONE_LIGHT, { emissive: "#2a2012", emissiveIntensity: 0.25, vertexColors: true }), [flag]);
  const brassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#a8813f", roughness: 0.35, metalness: 0.9, envMapIntensity: 0.9 }), []);
  const dirtMat = useMemo(() => new THREE.MeshBasicMaterial({ map: blob, color: "#14110c", transparent: true, opacity: 0.55, depthWrite: false }), [blob]);
  const brassInst = useRef<THREE.InstancedMesh>(null);
  const dirtInst = useRef<THREE.InstancedMesh>(null);
  const DIRT = 160;
  const stoneMat = useMemo(() => stoneMaterial(tiledStone(ashlar, 0.6, 0.6), STONE), [ashlar]);

  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#5a4a38", roughness: 0.38, metalness: 0.85, envMapIntensity: 0.6 }), []);
  const shadowGeo = useMemo(() => new THREE.CylinderGeometry(RING_R + 0.08, RING_R + 0.08, 0.01, 6, 1, false, Math.PI / 2 - WEDGE * 0.55, WEDGE * 1.1), []);
  const shadowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42, depthWrite: false }), []);
  const shadowInst = useRef<THREE.InstancedMesh>(null);
  // dark soot: normal blending of a near-black blob reads the same as multiply, without the premultiplied-alpha requirement
  const grimeMat = useMemo(() => new THREE.SpriteMaterial({ map: blob, color: "#0b0a07", transparent: true, opacity: 0.5, depthWrite: false }), [blob]);
  const mossMat = useMemo(() => new THREE.SpriteMaterial({ map: blob, color: "#1c2a14", transparent: true, opacity: 0.55, depthWrite: false }), [blob]);
  /* Damp patches and soot on the wall, denser lower down. */
  const grime = useMemo(() => Array.from({ length: 48 }, () => {
    const u = Math.pow(Math.random(), 0.7);
    const a = Math.random() * Math.PI * 2;
    return { x: Math.cos(a) * (WALL_R - 0.06), y: treadY(u) + (Math.random() - 0.3) * 3, z: Math.sin(a) * (WALL_R - 0.06), s: 0.9 + Math.random() * 1.5 };
  }), []);

  const RAIL_FROM = 2 / STEPS;
  const railGeo = useMemo(() => new THREE.TubeGeometry(new HelixCurve(RING_R - 0.14, STEP_THICK / 2 + 0.95, RAIL_FROM), STEPS * 4, 0.035, 8, false), []); // eslint-disable-line react-hooks/exhaustive-deps
  const railGeo2 = useMemo(() => new THREE.TubeGeometry(new HelixCurve(RING_R - 0.14, STEP_THICK / 2 + 0.5, RAIL_FROM), STEPS * 4, 0.018, 6, false), []); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = useMemo(() => Array.from({ length: STEPS }, (_, k) => stepPose(k)), []);

  /* Every step's parts are instanced: one draw call per part instead of
     one per step. The nosing pulse is a per-instance colour. */
  const treadInst = useRef<THREE.InstancedMesh>(null);
  const nosingInst = useRef<THREE.InstancedMesh>(null);
  const corbelInst = useRef<THREE.InstancedMesh>(null);
  const postInst = useRef<THREE.InstancedMesh>(null);
  const nosingMat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  const nosingColor = useMemo(() => new THREE.Color(), []);
  useEffect(() => {
    const o = new THREE.Object3D();
    const place = (inst: THREE.InstancedMesh | null, lx: number, ly: number, lz: number, ry = 0) => {
      if (!inst) return;
      steps.forEach(({ angle, y }, k) => {
        // local offset inside the step frame (rotated by -angle), then lifted to y
        o.position.set(0, y, 0); o.rotation.set(0, -angle, 0); o.updateMatrix();
        const local = new THREE.Matrix4().makeRotationY(ry).setPosition(lx, ly, lz);
        o.matrix.multiply(local);
        inst.setMatrixAt(k, o.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
    };
    place(treadInst.current, 0, 0, 0);
    place(nosingInst.current, (RING_R + PILLAR_R) / 2, STEP_THICK / 2, 0, -WEDGE * 0.48);
    place(corbelInst.current, RING_R - 0.25, -STEP_THICK / 2 - 0.13, 0);
    place(postInst.current, RING_R - 0.14, STEP_THICK / 2 + 0.47, 0);
    // no posts on the first two steps: the landing keeps an open edge
    if (postInst.current) { const zero = new THREE.Matrix4().makeScale(0, 0, 0); postInst.current.setMatrixAt(0, zero); postInst.current.setMatrixAt(1, zero); postInst.current.instanceMatrix.needsUpdate = true; }
    place(shadowInst.current, 0, -STEP_THICK / 2 - 0.012, 0);
    place(brassInst.current, (RING_R + PILLAR_R) / 2, STEP_THICK / 2 - 0.004, 0.03, -WEDGE * 0.48);
    // no two treads quite the same stone
    if (treadInst.current) {
      const c = new THREE.Color();
      for (let k = 0; k < STEPS; k++) {
        const v = 0.82 + Math.random() * 0.28, warm = 0.97 + Math.random() * 0.06;
        c.setRGB(v * warm, v, v * (2 - warm));
        treadInst.current.setColorAt(k, c);
      }
      treadInst.current.instanceColor!.needsUpdate = true;
    }
    // worn, dirty patches where feet fall
    if (dirtInst.current) {
      for (let i = 0; i < DIRT; i++) {
        const k = Math.floor(Math.random() * STEPS);
        const { angle, y } = steps[k];
        const r = PILLAR_R + 0.4 + Math.random() * (RING_R - PILLAR_R - 0.7);
        const da = (Math.random() - 0.5) * WEDGE * 0.7;
        o.position.set(Math.cos(angle + da) * r, y + STEP_THICK / 2 + 0.004, Math.sin(angle + da) * r);
        o.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI);
        const sc = 0.6 + Math.random() * 0.9;
        o.scale.set(sc, sc, 1);
        o.updateMatrix();
        dirtInst.current.setMatrixAt(i, o.matrix);
      }
      dirtInst.current.instanceMatrix.needsUpdate = true;
    }
    if (nosingInst.current) { for (let k = 0; k < STEPS; k++) nosingInst.current.setColorAt(k, GOLD); nosingInst.current.instanceColor!.needsUpdate = true; }
  }, [steps]);

  const runeSlots = useMemo(() => {
    const slots: { x: number; y: number; z: number; tex: THREE.Texture; bob: number; u: number }[] = [];
    for (let k = 3; k < STEPS; k += 4) {
      const { u, angle, y } = stepPose(k);
      const r = (RING_R + PILLAR_R) / 2 + 0.15;
      slots.push({ x: Math.cos(angle) * r, y: y + STEP_THICK / 2 + 0.13, z: Math.sin(angle) * r, tex: runeTextures[(k * 7) % RUNES.length], bob: Math.random() * Math.PI * 2, u });
    }
    return slots;
  }, [runeTextures]);

  const pillarRunes = useMemo(() => {
    const list: { x: number; y: number; z: number; tex: THREE.Texture; seed: number }[] = [];
    for (let k = 1; k < STEPS; k += 6) {
      const { angle, y } = stepPose(k);
      const r = PILLAR_R + 0.03;
      list.push({ x: Math.cos(angle) * r, y: y + 1.05, z: Math.sin(angle) * r, tex: runeTextures[(k * 11) % RUNES.length], seed: Math.random() * 10 });
    }
    return list;
  }, [runeTextures]);

  /* Torches every quarter turn in arched niches, plus one either side
     of the gate. */
  const torches = useMemo(() => {
    const list: { x: number; y: number; z: number; angle: number; seed: number; niche: boolean }[] = [];
    const n = Math.round(TURNS * 4);
    for (let i = 1; i <= n; i++) {
      const u = i / n;
      const angle = angleAt(u) + WEDGE * 0.5;
      list.push({ x: Math.cos(angle) * (WALL_R - 0.25), y: treadY(u) + 1.45, z: Math.sin(angle) * (WALL_R - 0.25), angle, seed: Math.random() * 10, niche: true });
    }
    for (const da of [-0.36, 0.36]) {
      const angle = GATE_A + da;
      list.push({ x: Math.cos(angle) * (WALL_R - 0.35), y: treadY(0) + 1.9, z: Math.sin(angle) * (WALL_R - 0.35), angle, seed: Math.random() * 10, niche: false });
    }
    return list;
  }, []);

  /* Torch furniture is instanced too: brackets, light cones, niche arches and sills. */
  const bracketInst = useRef<THREE.InstancedMesh>(null);
  const archInst = useRef<THREE.InstancedMesh>(null);
  const sillInst = useRef<THREE.InstancedMesh>(null);
  const bracketGeo = useMemo(() => new THREE.CylinderGeometry(0.025, 0.035, 0.42, 6), []);
  const archGeo = useMemo(() => new THREE.TorusGeometry(0.42, 0.07, 8, 24, Math.PI), []);
  const sillGeo = useMemo(() => new THREE.BoxGeometry(0.98, 0.1, 0.14), []);
  const nicheCount = useMemo(() => torches.filter((t) => t.niche).length, [torches]);
  useEffect(() => {
    const o = new THREE.Object3D();
    const set = (inst: THREE.InstancedMesh | null, only: "all" | "niche", lx: number, ly: number, lz: number, rx: number, ry: number, rz: number) => {
      if (!inst) return;
      let i = 0;
      for (const tk of torches) {
        if (only === "niche" && !tk.niche) continue;
        o.position.set(tk.x, tk.y, tk.z); o.rotation.set(0, -tk.angle, 0); o.updateMatrix();
        const local = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)).setPosition(lx, ly, lz);
        o.matrix.multiply(local);
        inst.setMatrixAt(i++, o.matrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    };
    set(bracketInst.current, "all", 0.1, -0.24, 0, 0, 0, 0.35);
    set(archInst.current, "niche", 0.22, 0.1, 0, 0, Math.PI / 2, 0);
    set(sillInst.current, "niche", 0.22, -0.55, 0, 0, Math.PI / 2, 0);
  }, [torches]);

  /* Smoke: a few particles per torch, rising and fading, recycled. */
  const SMOKE_PER = 4;
  const smokeRef = useRef<THREE.Points>(null);
  const smoke = useMemo(() => {
    const n = torches.length * SMOKE_PER;
    const pos = new Float32Array(n * 3);
    const life = new Float32Array(n);
    for (let i = 0; i < n; i++) life[i] = Math.random();
    return { pos, life, n };
  }, [torches]);
  const smokeMat = useMemo(() => new THREE.PointsMaterial({ map: blob, color: "#3a332c", size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.35, depthWrite: false }), [blob]);

  const pilasters = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2 + Math.PI / 8), []);
  const wisps = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ off: i / 7, seed: Math.random() * 10, speed: 0.008 + Math.random() * 0.006 })), []);

  const emberData = useMemo(() => {
    const n = 1100;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = PILLAR_R + 0.2 + Math.random() * (WALL_R - PILLAR_R - 0.4);
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = 2 - Math.random() * (DEPTH + 4);
      pos[i * 3 + 2] = Math.sin(a) * r;
    }
    return pos;
  }, []);

  const { gl, size } = useThree();
  useEffect(() => { sealShader.uniforms.uPixelRatio.value = gl.getPixelRatio(); }, [gl, sealShader]);

  const smooth = useRef({ mx: 0, my: 0, u: 0, hero: 0, hold: 0 });
  const litTorch = useRef({ a: -1, b: -1, ia: 0, ib: 0 });
  const lightTarget = useMemo(() => [new THREE.Vector3(), new THREE.Vector3()], []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const eye = useMemo(() => new THREE.Vector3(), []);
  const aim = useMemo(() => new THREE.Vector3(), []);
  const anchor = useMemo(() => new THREE.Vector3(), []);
  const restEye = useMemo(() => new THREE.Vector3(), []);
  const restAim = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const d = driver.current;
    const s = smooth.current;
    const k = 1 - Math.exp(-dt * 4.5);
    const ku = 1 - Math.exp(-dt * 9);
    s.mx += (d.mouseX - s.mx) * k;
    s.my += (d.mouseY - s.my) * k;
    s.u += (d.u - s.u) * ku;
    s.hero += (d.hero - s.hero) * ku;
    s.hold += (d.hold - s.hold) * k;

    const t = state.clock.elapsedTime;
    const u = s.u;
    const look = 1 - s.hold * 0.85;

    sealShader.uniforms.uTime.value = t;
    sealShader.uniforms.uOpacity.value = 1 - Math.min(1, Math.max(0, (u - 0.02) * 30));

    // first person
    poseAt(u, s.hero, s.mx * look, s.my * look, eye, aim);
    eye.y += Math.sin(u * STEPS * Math.PI) * 0.018 * s.hero + Math.sin(t * 0.9) * 0.012;
    aim.x += Math.sin(t * 0.5) * 0.02; aim.y += Math.cos(t * 0.7) * 0.015;
    state.camera.position.copy(eye);
    state.camera.lookAt(aim);
    if (lamp.current) { lamp.current.position.copy(eye).add(tmp.set(0, 0.35, 0)); lamp.current.intensity = 8 + 18 * s.hero; }

    // the portcullis lifts as you step through
    if (portcullis.current) portcullis.current.position.y = 0.25 + s.hero * 2.2;

    // quest panels: project each anchor to the screen and move the DOM
    const cam = state.camera;
    const NAV = 84;
    for (const p of d.panels) {
      if (!p.el) continue;
      // a panel taller than the screen is read from the top: it settles
      // just under the nav and scrolls up while you stand at its landing
      const h = p.h || p.el.offsetHeight;
      const tall = h > size.height - NAV - 60;
      const topCentre = NAV + 28 + h / 2;
      if (p.screen) {
        const cy = tall ? topCentre : size.height / 2;
        p.el.style.transform = `translate(${Math.round(size.width / 2)}px, ${Math.round(cy - p.shift)}px) translate(-50%, -50%)`;
        p.el.style.opacity = String(p.fade);
        p.el.style.pointerEvents = p.fade > 0.5 ? "auto" : "none";
        continue;
      }
      anchorAt(p.u, anchor);
      const dist = anchor.distanceTo(cam.position);
      poseAt(p.u, 1, 0, 0, restEye, restAim);
      const restDist = restAim.distanceTo(restEye);
      tmp.copy(anchor).project(cam);
      const behind = tmp.z > 1 || tmp.z < -1;
      const sx = (tmp.x + 1) / 2 * size.width;
      const sy = (1 - tmp.y) / 2 * size.height;
      const scale = Math.min(1, restDist / Math.max(dist, 0.001));
      const near = 1 - Math.min(1, Math.max(0, (dist - 5) / 7));
      const op = behind ? 0 : near * p.fade;
      const w = tall ? Math.min(1, Math.max(0, (scale - 0.8) / 0.2)) : 0;
      const cy = sy * (1 - w) + topCentre * w;
      const sc = scale > 0.995 ? 1 : scale;
      p.el.style.transform = `translate(${Math.round(sx)}px, ${Math.round(cy - p.shift)}px) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
      p.el.style.opacity = String(op);
      p.el.style.pointerEvents = op > 0.6 && scale > 0.9 ? "auto" : "none";
    }

    // the two torches nearest you carry the light
    if (torchGroup.current && torchLight.current && torchLight2.current) {
      let best = 0, bestD = Infinity, second = 0, secondD = Infinity;
      torchGroup.current.children.forEach((m, i) => {
        const tk = torches[i];
        const flicker = 0.92 + 0.05 * Math.sin(t * 5 + tk.seed) + 0.03 * Math.sin(t * 11 + tk.seed * 2);
        const sp = m.children[0] as THREE.Sprite | undefined;
        if (sp) { sp.material.opacity = 0.9 * flicker; sp.scale.setScalar(0.6 + 0.06 * flicker); }
        const inner = m.children[1] as THREE.Sprite | undefined, outer = m.children[2] as THREE.Sprite | undefined;
        if (inner && outer) {
          const lick = Math.sin(t * 17 + tk.seed * 3) * 0.5 + Math.sin(t * 9.3 + tk.seed) * 0.5;
          inner.scale.set(0.2 + 0.03 * lick, 0.38 + 0.08 * lick, 1);
          inner.position.x = 0.02 * lick;
          outer.scale.set(0.32 + 0.05 * lick, 0.55 + 0.12 * Math.sin(t * 7 + tk.seed), 1);
          outer.material.opacity = 0.5 + 0.15 * lick;
        }
        m.getWorldPosition(tmp);
        const dist = tmp.distanceTo(cam.position);
        if (dist < bestD) { second = best; secondD = bestD; bestD = dist; best = i; }
        else if (dist < secondD) { secondD = dist; second = i; }
      });
      const fl = (sd: number) => 0.94 + 0.03 * Math.sin(t * 3.1 + sd) + 0.02 * Math.sin(t * 7.3 + sd * 2) + 0.01 * Math.sin(t * 13 + sd * 3);
      const calm = 0.5 + 0.5 * s.hero; // the gate is lit softly; the stair by torchlight
      // the lit pair is chosen with hysteresis, so two torches at equal
      // distance don't trade places every frame, and the lights ease over
      const lt = litTorch.current;
      const distTo = (i: number) => { torchGroup.current!.children[i].getWorldPosition(tmp); return tmp.distanceTo(cam.position); };
      if (lt.a < 0) { lt.a = best; lt.b = second; }
      else {
        const da = distTo(lt.a), db = distTo(lt.b);
        if (best !== lt.a && best !== lt.b && bestD < Math.max(da, db) - 0.6) { if (da > db) lt.a = best; else lt.b = best; }
        else if (second !== lt.a && second !== lt.b && secondD < Math.max(da, db) - 0.6) { if (da > db) lt.a = second; else lt.b = second; }
      }
      const kl = 1 - Math.exp(-dt * 6);
      torchGroup.current.children[lt.a].getWorldPosition(lightTarget[0]);
      torchGroup.current.children[lt.b].getWorldPosition(lightTarget[1]);
      torchLight.current.position.lerp(lightTarget[0], kl);
      torchLight2.current.position.lerp(lightTarget[1], kl);
      lt.ia += (70 * fl(torches[lt.a].seed) * calm - lt.ia) * kl;
      lt.ib += (45 * fl(torches[lt.b].seed) * calm - lt.ib) * kl;
      torchLight.current.intensity = lt.ia;
      torchLight2.current.intensity = lt.ib;
    }

    // light runs down the stair, step by step; the step you're on is lit
    if (nosingInst.current) {
      for (let i = 0; i < STEPS; i++) {
        const wave = Math.sin(t * 2.2 - i * 0.45);
        const b = 0.18 + 0.28 * Math.max(0, wave) + (Math.abs(u * STEPS - i) < 1.5 ? 0.25 : 0);
        nosingInst.current.setColorAt(i, nosingColor.copy(GOLD).multiplyScalar(b));
      }
      nosingInst.current.instanceColor!.needsUpdate = true;
    }

    if (wispGroup.current) {
      wispGroup.current.children.forEach((m, i) => {
        const w = wisps[i];
        const uu = (u + (w.off - 0.5) * 0.12 + Math.sin(t * w.speed * 10 + w.seed) * 0.01 + 1) % 1;
        const a = angleAt(uu);
        const r = WALK_R + Math.sin(t * 0.7 + w.seed) * 0.5;
        m.position.set(Math.cos(a) * r, treadY(uu) + 0.9 + Math.sin(t * 1.3 + w.seed) * 0.25, Math.sin(a) * r);
        const sp = m as THREE.Sprite;
        sp.material.opacity = 0.35 + 0.3 * Math.sin(t * 2 + w.seed);
        sp.scale.setScalar(0.18 + 0.06 * Math.sin(t * 3 + w.seed));
      });
    }
    if (runeGroup.current) {
      runeGroup.current.children.forEach((m, i) => {
        const slot = runeSlots[i];
        const near = 1 - Math.min(1, Math.abs(u - slot.u) * 6);
        (m as THREE.Sprite).material.opacity = 0.3 + 0.3 * Math.sin(t * 0.8 + slot.bob) + near * 0.4;
      });
    }
    if (pillarRuneGroup.current) {
      pillarRuneGroup.current.children.forEach((m, i) => {
        (m as THREE.Sprite).material.opacity = 0.55 + 0.35 * Math.sin(t * 1.3 + pillarRunes[i].seed);
      });
    }
    if (smokeRef.current) {
      const { pos, life, n } = smoke;
      for (let i = 0; i < n; i++) {
        life[i] += dt * 0.22;
        if (life[i] > 1) life[i] -= 1;
        const tk = torches[Math.floor(i / SMOKE_PER)];
        const l = life[i];
        const drift = Math.sin(t * 0.8 + i) * 0.12 * l;
        pos[i * 3] = tk.x * 0.94 + drift;
        pos[i * 3 + 1] = tk.y + 0.25 + l * 1.6;
        pos[i * 3 + 2] = tk.z * 0.94 + Math.cos(t * 0.7 + i * 1.7) * 0.12 * l;
      }
      smokeRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (embers.current) {
      embers.current.rotation.y = t * 0.02;
      embers.current.position.y = (t * 0.12) % 3;
    }
    if (floor.current) {
      const near = Math.max(0, (u - 0.7) / 0.3);
      (floor.current.material as THREE.MeshBasicMaterial).opacity = 0.05 + near * 0.22;
      floor.current.rotation.z = -t * 0.05;
    }
  });

  const gateX = Math.cos(GATE_A), gateZ = Math.sin(GATE_A);

  return (
    <>
      <ambientLight color="#7a6650" intensity={0.55} />
      <hemisphereLight args={["#2c3140", "#0a0806", 0.75]} />
      {/* physically-based lights: candela-ish, so they need to be strong */}
      <pointLight ref={lamp} color="#f0d6ac" intensity={36} distance={12} decay={2} />
      <pointLight ref={torchLight} color="#ffb068" intensity={70} distance={11} decay={2} />
      <pointLight ref={torchLight2} color="#ffb068" intensity={45} distance={10} decay={2} />

      {/* the shaft wall, seen from inside, the vault over it and a cornice */}
      <mesh position={[0, -DEPTH / 2 + 0.5, 0]} material={wallMat}>
        <cylinderGeometry args={[WALL_R, WALL_R, DEPTH + 8, 64, 1, true]} />
      </mesh>
      <mesh position={[0, 4.5, 0]} material={wallMat}>
        <sphereGeometry args={[WALL_R, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 4.4, 0]} material={stoneMat}>
        <torusGeometry args={[WALL_R - 0.05, 0.12, 8, 64]} />
      </mesh>

      {/* pilasters: stone ribs up the wall */}
      {pilasters.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * (WALL_R - 0.12), -DEPTH / 2 + 0.5, Math.sin(a) * (WALL_R - 0.12)]} rotation={[0, -a, 0]} material={stoneMat}>
          <boxGeometry args={[0.26, DEPTH + 8, 0.42]} />
        </mesh>
      ))}

      {/* THE ENTRANCE: a gated archway in the wall at the top landing */}
      <group position={[gateX * (WALL_R - 0.2), treadY(0) - STEP_THICK / 2, gateZ * (WALL_R - 0.2)]} rotation={[0, -GATE_A, 0]}>
        {/* the dark passage beyond */}
        <mesh position={[0.3, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[2.0, 3.2]} />
          <meshBasicMaterial color="#020201" />
        </mesh>
        {/* jambs */}
        <mesh position={[-0.15, 1.35, -1.05]} material={stoneMat}><boxGeometry args={[0.7, 2.7, 0.45]} /></mesh>
        <mesh position={[-0.15, 1.35, 1.05]} material={stoneMat}><boxGeometry args={[0.7, 2.7, 0.45]} /></mesh>
        {/* capitals */}
        <mesh position={[-0.15, 2.75, -1.05]} material={stoneMat}><boxGeometry args={[0.85, 0.16, 0.6]} /></mesh>
        <mesh position={[-0.15, 2.75, 1.05]} material={stoneMat}><boxGeometry args={[0.85, 0.16, 0.6]} /></mesh>
        {/* the arch and its keystone */}
        <mesh position={[-0.15, 2.8, 0]} rotation={[0, Math.PI / 2, 0]} material={stoneMat}>
          <torusGeometry args={[1.05, 0.2, 8, 24, Math.PI]} />
        </mesh>
        <mesh position={[-0.15, 3.85, 0]} material={stoneMat}><boxGeometry args={[0.6, 0.4, 0.34]} /></mesh>
        {/* the lintel with a rune band */}
        <mesh position={[-0.18, 4.1, 0]} material={stoneMat}><boxGeometry args={[0.75, 0.3, 3.2]} /></mesh>
        <mesh position={[-0.56, 4.1, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[2.9, 0.12]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0.45} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        {/* runes over the door */}
        {["ᚨ", "ᛉ", "ᚠ", "ᛟ", "ᚱ"].map((r, i) => (
          <sprite key={r} position={[-0.6, 3.35 + (i === 2 ? 0.18 : 0), (i - 2) * 0.42]} scale={[0.3, 0.3, 1]}>
            <spriteMaterial map={runeTextures[RUNES.indexOf(r)]} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
        {/* the portcullis: iron bars that lift as you go in */}
        <group ref={portcullis} position={[0, 0.25, 0]}>
          {[-0.75, -0.45, -0.15, 0.15, 0.45, 0.75].map((z) => (
            <mesh key={z} position={[-0.15, 1.4, z]} material={ironMat}><boxGeometry args={[0.06, 2.9, 0.06]} /></mesh>
          ))}
          {[0.5, 1.4, 2.3].map((y) => (
            <mesh key={y} position={[-0.15, y, 0]} material={ironMat}><boxGeometry args={[0.05, 0.06, 1.75]} /></mesh>
          ))}
        </group>
        {/* the threshold and the bridge to the landing */}
        <mesh position={[-0.35, 0.02, 0]} material={stoneMat}><boxGeometry args={[0.7, STEP_THICK * 1.5, 2.4]} /></mesh>
        <mesh position={[-0.95, 0.01, -1.1]} material={ironMat}><boxGeometry args={[1.5, 0.04, 0.04]} /></mesh>
        <mesh position={[-0.95, 0.01, 1.1]} material={ironMat}><boxGeometry args={[1.5, 0.04, 0.04]} /></mesh>
      </group>

      {/* the pillar the stair winds round, with its bands and collars */}
      <mesh position={[0, -DEPTH / 2 + 0.5, 0]} material={pillarMat}>
        <cylinderGeometry args={[PILLAR_R, PILLAR_R * 1.08, DEPTH + 8, 48]} />
      </mesh>
      {Array.from({ length: Math.floor(TURNS) + 1 }, (_, i) => (
        <group key={i} position={[0, treadY(i / TURNS) - 0.6, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[PILLAR_R + 0.03, 0.03, 8, 64]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.16, 0]}>
            <torusGeometry args={[PILLAR_R + 0.03, 0.015, 8, 64]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          <mesh position={[0, -0.32, 0]} material={stoneMat}>
            <cylinderGeometry args={[PILLAR_R + 0.09, PILLAR_R + 0.02, 0.22, 32]} />
          </mesh>
        </group>
      ))}

      {/* the top landing: a bevelled flagstone slab the seal lies on */}
      <mesh geometry={landingGeo} material={landingMat} position={[0, -0.2, 0]} />
      <points position={[0, -0.2, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sealData.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[sealData.col, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sealData.sz, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[sealData.seed, 1]} />
        </bufferGeometry>
        <shaderMaterial args={[sealShader]} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* the steps: tread, glowing nosing, corbel beneath, baluster post — instanced */}
      <instancedMesh ref={treadInst} args={[stepGeo, stepMat, STEPS]} frustumCulled={false} />
      <instancedMesh ref={nosingInst} args={[nosingGeo, nosingMat, STEPS]} frustumCulled={false} />
      <instancedMesh ref={brassInst} args={[brassGeo, brassMat, STEPS]} frustumCulled={false} />
      <instancedMesh ref={dirtInst} args={[dirtGeo, dirtMat, DIRT]} frustumCulled={false} />
      <instancedMesh ref={corbelInst} args={[corbelGeo, stoneMat, STEPS]} frustumCulled={false} />
      <instancedMesh ref={postInst} args={[postGeo, ironMat, STEPS]} frustumCulled={false} />
      {/* a dark wedge just under each tread: the shadow it throws on the step below */}
      <instancedMesh ref={shadowInst} args={[shadowGeo, shadowMat, STEPS]} frustumCulled={false} />
      <mesh geometry={railGeo} material={ironMat} />
      <mesh geometry={railGeo2} material={ironMat} />

      {/* runes carved down the pillar and into the treads */}
      <group ref={pillarRuneGroup}>
        {pillarRunes.map((pr, i) => (
          <sprite key={i} position={[pr.x, pr.y, pr.z]} scale={[0.26, 0.26, 1]}>
            <spriteMaterial map={pr.tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>
      <group ref={runeGroup}>
        {runeSlots.map((slot, i) => (
          <sprite key={i} position={[slot.x, slot.y, slot.z]} scale={[0.3, 0.3, 1]}>
            <spriteMaterial map={slot.tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>

      {/* torches: the flames are sprites (one each), the rest is instanced */}
      <group ref={torchGroup}>
        {torches.map((tk, i) => (
          <group key={i} position={[tk.x, tk.y, tk.z]} rotation={[0, -tk.angle, 0]}>
            <sprite scale={[0.6, 0.6, 1]}>
              <spriteMaterial map={glow} color={EMBER} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <sprite scale={[0.22, 0.42, 1]} position={[0, 0.08, 0]}>
              <spriteMaterial map={blob} color="#ffd27a" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <sprite scale={[0.34, 0.6, 1]} position={[0, 0.16, 0]}>
              <spriteMaterial map={blob} color="#ff7a1a" transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        ))}
      </group>
      <instancedMesh ref={bracketInst} args={[bracketGeo, ironMat, torches.length]} frustumCulled={false} />
      <instancedMesh ref={archInst} args={[archGeo, stoneMat, nicheCount]} frustumCulled={false} />
      <instancedMesh ref={sillInst} args={[sillGeo, stoneMat, nicheCount]} frustumCulled={false} />

      {/* the floor of the well */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -DEPTH - 0.55, 0]} material={floorMat}>
        <circleGeometry args={[WALL_R, 64]} />
      </mesh>
      <mesh ref={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, -DEPTH - 0.5, 0]}>
        <ringGeometry args={[PILLAR_R + 0.2, RING_R * 0.9, 96]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.05} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      <group ref={wispGroup}>
        {wisps.map((_, i) => (
          <sprite key={i} scale={[0.2, 0.2, 1]}>
            <spriteMaterial map={glow} color={SILVER} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
      </group>

      <points ref={smokeRef} material={smokeMat}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[smoke.pos, 3]} />
        </bufferGeometry>
      </points>
      {grime.map((g, i) => (
        <sprite key={i} position={[g.x, g.y, g.z]} scale={[g.s, g.s * 0.7, 1]} material={i % 3 === 0 ? mossMat : grimeMat} />
      ))}

      <points ref={embers}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[emberData, 3]} />
        </bufferGeometry>
        <pointsMaterial map={glow} color={EMBER} size={0.06} sizeAttenuation transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
    </>
  );
}

export default function RuneRing({ driver, className = "" }: { driver: React.RefObject<RingDriver>; className?: string }) {
  return (
    <div className={`absolute inset-0 ${className}`} aria-hidden>
      <Canvas
        dpr={[1, 1.25]}
        camera={{ position: [2.4, 2.9, 1.0], fov: 60, near: 0.05, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMappingExposure: 0.8 }}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={["#07080a", 3, 19]} />
        <Well driver={driver} />
      </Canvas>
    </div>
  );
}
