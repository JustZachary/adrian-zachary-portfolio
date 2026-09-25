"use client";
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

const GOLD = new THREE.Color("#F6BC7C");
const SILVER = new THREE.Color("#D9EAFA");
const EMBER = new THREE.Color("#ff9a3c");
const STONE = "#2a261c";
const STONE_LIGHT = "#3a3324";
const STONE_DARK = "#1c1913";
const IRON = "#3b3126";
const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

/* The well's shape. */
export const RING_R = 2.7;       // outer radius of the steps
export const PILLAR_R = 0.8;     // the central pillar
export const WALL_R = 3.9;       // the shaft wall
export const TURNS = 6.5;        // how many times the stair winds
export const DEPTH = 30;         // how far down it goes
export const STEPS_PER_TURN = 16;
export const STEPS = Math.round(TURNS * STEPS_PER_TURN);
const WEDGE = (Math.PI * 2) / STEPS_PER_TURN;
const STEP_THICK = 0.16;
const WALK_R = (RING_R + PILLAR_R) / 2 + 0.15; // where you walk
const EYE = 1.4;                                // eye height above the tread
const AHEAD = 0.85;                             // radians you look ahead
const GATE_A = -WEDGE * 2.2;                    // where the entrance is, just above step 0

/* Shared driver state — written by the page every scroll, read every
   frame in here. A ref, not React state, so nothing rerenders. */
export type QuestPanel = {
  el: HTMLElement | null;
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

/* Rough masonry: noise, cracks and block courses, generated once. */
function makeStoneTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#6a6250";
  ctx.fillRect(0, 0, size, size);
  const img = ctx.getImageData(0, 0, size, size);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 70;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.9;
  }
  ctx.putImageData(img, 0, 0);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    let x = Math.random() * size, y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let j = 0; j < 6; j++) { x += (Math.random() - 0.5) * 60; y += (Math.random() - 0.5) * 60; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.lineWidth = 3;
  for (let y = 0; y < size; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    const off = (y / 64) % 2 ? 64 : 0;
    for (let x = off; x < size; x += 128) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 64); ctx.stroke(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* The handrail follows the stair: a helix. */
class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private r: number, private lift: number) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = angleAt(t);
    return target.set(Math.cos(a) * this.r, treadY(t) + this.lift, Math.sin(a) * this.r);
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
    sz[i] = 0.03 + Math.random() * 0.06;
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
  const a = angleAt(u);
  const y = treadY(u) + STEP_THICK / 2 + EYE;
  const px = Math.cos(a) * WALK_R, pz = Math.sin(a) * WALK_R;
  const ahead = a + AHEAD + mx * 0.4;
  const ax = Math.cos(ahead) * WALK_R, az = Math.sin(ahead) * WALK_R;
  const ay = treadY(u + AHEAD / (TURNS * Math.PI * 2)) + STEP_THICK / 2 + EYE - 0.35 - my * 0.5;
  // in the gate: eye at the threshold, looking at the seal and the drop beyond
  const gx = Math.cos(GATE_A) * (WALL_R - 0.55), gz = Math.sin(GATE_A) * (WALL_R - 0.55), gy = treadY(0) + STEP_THICK / 2 + EYE;
  const lx = Math.cos(GATE_A + 0.5) * 0.4 - mx * 0.6, ly = treadY(0) + 0.35 - my * 0.5, lz = Math.sin(GATE_A + 0.5) * 0.4;
  const b = 1 - hero;
  const e = b * b * (3 - 2 * b);
  eye.set(px + (gx - px) * e, y + (gy - y) * e, pz + (gz - pz) * e);
  aim.set(ax + (lx - ax) * e, ay + (ly - ay) * e, az + (lz - az) * e);
}

/* Where a quest panel hangs for a landing at u: exactly where you look
   when you stand there, so it sits centre-screen while you read. */
export function anchorAt(u: number, out: THREE.Vector3) {
  const a = angleAt(u) + AHEAD;
  out.set(Math.cos(a) * WALK_R, treadY(u + AHEAD / (TURNS * Math.PI * 2)) + STEP_THICK / 2 + EYE - 0.35, Math.sin(a) * WALK_R);
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
  const stone = useMemo(() => makeStoneTexture(), []);
  const tiled = (rx: number, ry: number) => { const t = stone.clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; };
  const stoneWall = useMemo(() => tiled(10, 14), [stone]); // eslint-disable-line react-hooks/exhaustive-deps
  const stonePillar = useMemo(() => tiled(2, 14), [stone]); // eslint-disable-line react-hooks/exhaustive-deps
  const stoneLanding = useMemo(() => tiled(4, 1), [stone]); // eslint-disable-line react-hooks/exhaustive-deps
  const stoneFloor = useMemo(() => tiled(6, 6), [stone]); // eslint-disable-line react-hooks/exhaustive-deps
  const runeTextures = useMemo(() => RUNES.map(makeRuneTexture), []);
  const sealData = useMemo(() => makeSeal(2400), []);
  const sealShader = useMemo(() => makeSealShader(glow), [glow]);

  /* Shared geometry and materials. */
  const stepGeo = useMemo(() => new THREE.CylinderGeometry(RING_R, RING_R, STEP_THICK, 6, 1, false, Math.PI / 2 - WEDGE * 0.48, WEDGE * 0.96), []);
  const nosingGeo = useMemo(() => new THREE.BoxGeometry(RING_R - PILLAR_R + 0.05, 0.012, 0.02), []);
  const postGeo = useMemo(() => new THREE.CylinderGeometry(0.035, 0.045, 0.95, 6), []);
  const corbelGeo = useMemo(() => new THREE.BoxGeometry(0.34, 0.26, 0.3), []);
  const stepMat = useMemo(() => new THREE.MeshStandardMaterial({ color: STONE_LIGHT, map: stone, roughness: 0.9, metalness: 0.05, emissive: "#1a1408", emissiveIntensity: 0.35 }), [stone]);
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({ color: STONE, map: stone, roughness: 0.95 }), [stone]);
  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({ color: IRON, roughness: 0.45, metalness: 0.7, emissive: "#2a1c0a", emissiveIntensity: 0.25 }), []);
  const nosingMats = useMemo(() => Array.from({ length: STEPS }, () => new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })), []);
  const railGeo = useMemo(() => new THREE.TubeGeometry(new HelixCurve(RING_R - 0.14, STEP_THICK / 2 + 0.95), STEPS * 4, 0.035, 8, false), []);
  const railGeo2 = useMemo(() => new THREE.TubeGeometry(new HelixCurve(RING_R - 0.14, STEP_THICK / 2 + 0.5), STEPS * 4, 0.018, 6, false), []);

  const steps = useMemo(() => Array.from({ length: STEPS }, (_, k) => stepPose(k)), []);

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
    s.mx += (d.mouseX - s.mx) * k;
    s.my += (d.mouseY - s.my) * k;
    s.u += (d.u - s.u) * k;
    s.hero += (d.hero - s.hero) * k;
    s.hold += (d.hold - s.hold) * k;

    const t = state.clock.elapsedTime;
    const u = s.u;
    const look = 1 - s.hold * 0.85;

    sealShader.uniforms.uTime.value = t;
    sealShader.uniforms.uOpacity.value = 1 - Math.min(1, Math.max(0, (u - 0.02) * 30));

    // first person
    poseAt(u, s.hero, s.mx * look, s.my * look, eye, aim);
    eye.y += Math.sin(u * STEPS * Math.PI) * 0.018 * s.hero;
    state.camera.position.copy(eye);
    state.camera.lookAt(aim);
    if (lamp.current) lamp.current.position.copy(eye).add(tmp.set(0, 0.2, 0));

    // the portcullis lifts as you step through
    if (portcullis.current) portcullis.current.position.y = 0.25 + s.hero * 2.2;

    // quest panels: project each anchor to the screen and move the DOM
    const cam = state.camera;
    for (const p of d.panels) {
      if (!p.el) continue;
      if (p.screen) {
        p.el.style.transform = `translate(${size.width / 2}px, ${size.height / 2 - p.shift}px) translate(-50%, -50%)`;
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
      p.el.style.transform = `translate(${sx}px, ${sy - p.shift}px) translate(-50%, -50%) scale(${scale})`;
      p.el.style.opacity = String(op);
      p.el.style.pointerEvents = op > 0.6 && scale > 0.9 ? "auto" : "none";
    }

    // the two torches nearest you carry the light
    if (torchGroup.current && torchLight.current && torchLight2.current) {
      let best = 0, bestD = Infinity, second = 0, secondD = Infinity;
      torchGroup.current.children.forEach((m, i) => {
        const tk = torches[i];
        const flicker = 0.75 + 0.25 * Math.sin(t * 9 + tk.seed) * Math.sin(t * 13.7 + tk.seed * 2);
        const sp = m.children[0] as THREE.Sprite | undefined;
        if (sp) { sp.material.opacity = 0.9 * flicker; sp.scale.setScalar(0.6 + 0.1 * flicker); }
        m.getWorldPosition(tmp);
        const dist = tmp.distanceTo(cam.position);
        if (dist < bestD) { second = best; secondD = bestD; bestD = dist; best = i; }
        else if (dist < secondD) { secondD = dist; second = i; }
      });
      torchGroup.current.children[best].getWorldPosition(tmp);
      torchLight.current.position.copy(tmp);
      torchLight.current.intensity = 12 + 3 * Math.sin(t * 11 + torches[best].seed);
      torchGroup.current.children[second].getWorldPosition(tmp);
      torchLight2.current.position.copy(tmp);
      torchLight2.current.intensity = 9 + 3 * Math.sin(t * 10 + torches[second].seed);
    }

    // light runs down the stair, step by step; the step you're on is lit
    for (let i = 0; i < STEPS; i++) {
      const wave = Math.sin(t * 2.2 - i * 0.45);
      nosingMats[i].opacity = 0.45 + 0.4 * Math.max(0, wave) + (Math.abs(u * STEPS - i) < 1.5 ? 0.3 : 0);
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
      <ambientLight color="#6b5a45" intensity={1.15} />
      <hemisphereLight args={["#3a2e20", "#050403", 0.6]} />
      <pointLight ref={lamp} color="#F6BC7C" intensity={10} distance={9} decay={2} />
      <pointLight ref={torchLight} color="#ff9a3c" intensity={14} distance={8} decay={2} />
      <pointLight ref={torchLight2} color="#ff9a3c" intensity={9} distance={7} decay={2} />

      {/* the shaft wall, seen from inside, the vault over it and a cornice */}
      <mesh position={[0, -DEPTH / 2 + 0.5, 0]}>
        <cylinderGeometry args={[WALL_R, WALL_R, DEPTH + 8, 64, 1, true]} />
        <meshStandardMaterial color={STONE_DARK} map={stoneWall} roughness={1} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, 4.5, 0]}>
        <sphereGeometry args={[WALL_R, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={STONE_DARK} map={stoneWall} roughness={1} side={THREE.BackSide} />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <torusGeometry args={[WALL_R - 0.05, 0.12, 8, 64]} />
        <meshStandardMaterial color={STONE} map={stoneLanding} roughness={0.9} />
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
        <mesh position={[-0.75, 0, 0]} material={stoneMat}><boxGeometry args={[1.5, STEP_THICK * 1.5, 2.4]} /></mesh>
        <mesh position={[-0.95, 0.01, -1.1]} material={ironMat}><boxGeometry args={[1.5, 0.04, 0.04]} /></mesh>
        <mesh position={[-0.95, 0.01, 1.1]} material={ironMat}><boxGeometry args={[1.5, 0.04, 0.04]} /></mesh>
      </group>

      {/* the pillar the stair winds round, with its bands and collars */}
      <mesh position={[0, -DEPTH / 2 + 0.5, 0]}>
        <cylinderGeometry args={[PILLAR_R, PILLAR_R * 1.08, DEPTH + 8, 32]} />
        <meshStandardMaterial color={STONE_LIGHT} map={stonePillar} roughness={0.9} />
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
          <mesh position={[0, -0.32, 0]}>
            <cylinderGeometry args={[PILLAR_R + 0.09, PILLAR_R + 0.02, 0.22, 32]} />
            <meshStandardMaterial color={STONE} map={stoneLanding} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* the top landing: a stone ring the seal lies on */}
      <mesh position={[0, -0.2 - STEP_THICK / 2, 0]}>
        <cylinderGeometry args={[RING_R + 0.15, RING_R + 0.15, STEP_THICK * 1.5, 64]} />
        <meshStandardMaterial color={STONE} map={stoneLanding} roughness={0.95} />
      </mesh>
      <points position={[0, -0.2, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sealData.pos, 3]} />
          <bufferAttribute attach="attributes-color" args={[sealData.col, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sealData.sz, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[sealData.seed, 1]} />
        </bufferGeometry>
        <shaderMaterial args={[sealShader]} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* the steps: tread, glowing nosing, corbel beneath, baluster post */}
      {steps.map(({ angle, y }, k) => (
        <group key={k} rotation={[0, -angle, 0]} position={[0, y, 0]}>
          <mesh geometry={stepGeo} material={stepMat} />
          <mesh geometry={nosingGeo} material={nosingMats[k]} position={[(RING_R + PILLAR_R) / 2, STEP_THICK / 2, 0]} rotation={[0, -WEDGE * 0.48, 0]} />
          <mesh geometry={corbelGeo} material={stoneMat} position={[RING_R - 0.25, -STEP_THICK / 2 - 0.13, 0]} />
          <mesh geometry={postGeo} material={ironMat} position={[RING_R - 0.14, STEP_THICK / 2 + 0.47, 0]} />
        </group>
      ))}
      <mesh geometry={railGeo} material={ironMat} />
      <mesh geometry={railGeo2} material={ironMat} />

      {/* runes carved down the pillar and into the treads */}
      <group ref={pillarRuneGroup}>
        {pillarRunes.map((pr, i) => (
          <sprite key={i} position={[pr.x, pr.y, pr.z]} scale={[0.42, 0.42, 1]}>
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

      {/* torches */}
      <group ref={torchGroup}>
        {torches.map((tk, i) => (
          <group key={i} position={[tk.x, tk.y, tk.z]} rotation={[0, -tk.angle, 0]}>
            <sprite scale={[0.6, 0.6, 1]}>
              <spriteMaterial map={glow} color={EMBER} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
            <mesh position={[0.1, -0.24, 0]} rotation={[0, 0, 0.35]} material={ironMat}>
              <cylinderGeometry args={[0.025, 0.035, 0.42, 6]} />
            </mesh>
            {tk.niche && (
              <>
                <mesh position={[0.22, 0.1, 0]} rotation={[0, Math.PI / 2, 0]} material={stoneMat}>
                  <torusGeometry args={[0.42, 0.07, 8, 24, Math.PI]} />
                </mesh>
                <mesh position={[0.22, -0.55, 0]} rotation={[0, Math.PI / 2, 0]} material={stoneMat}>
                  <boxGeometry args={[0.98, 0.1, 0.14]} />
                </mesh>
              </>
            )}
          </group>
        ))}
      </group>

      {/* the floor of the well */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -DEPTH - 0.55, 0]}>
        <circleGeometry args={[WALL_R, 64]} />
        <meshStandardMaterial color={STONE_DARK} map={stoneFloor} roughness={1} />
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
        dpr={[1, 1.75]}
        camera={{ position: [2.4, 2.9, 1.0], fov: 60, near: 0.05, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={["#07080a", 2.5, 14]} />
        <Well driver={driver} />
      </Canvas>
    </div>
  );
}
