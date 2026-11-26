"use client";
/* The AZ logo in live 3D (three.js): the same blocks as the Blender logo. Drag to spin
   it; click (or the Smash button) and the blocks fly apart, bounce, and snap back.
   three.js only loads when the section is close to the screen, rendering pauses while
   it is off screen, and without WebGL the rendered logo picture shows instead. */
import { useEffect, useRef, useState } from "react";
import { unlock } from "./Achievements";

type Palette = { tile: string[]; a: string; z: string; shadow: string };
const PALETTES: Record<string, Palette> = {
  sunset: { tile: ["#FF6B6B", "#FF9E6B", "#FFC46B"], a: "#1B1F4B", z: "#FFFFFF", shadow: "#1B1F4B" },
  holo: { tile: ["#FFC6E8", "#D9C6FF", "#B8F0FF"], a: "#1B1F4B", z: "#7B3FE4", shadow: "#FF4FA3" },
  night: { tile: ["#FF6B6B", "#FF9E6B", "#FFC46B"], a: "#1B1F4B", z: "#FFFFFF", shadow: "#06071A" },
};
const A = [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"];
const Z = ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"];
const CELLS: [number, number, boolean][] = [
  ...A.flatMap((r, y) => [...r].flatMap((c, x) => (c === "#" ? [[2 + x, 4 + y, true] as [number, number, boolean]] : []))),
  ...Z.flatMap((r, y) => [...r].flatMap((c, x) => (c === "#" ? [[8 + x, 4 + y, false] as [number, number, boolean]] : []))),
];

export default function LogoToy({ theme }: { theme: string }) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{ smash: () => void; recolour: (t: string) => void } | null>(null);
  const [state, setState] = useState<"idle" | "ready" | "fallback">("idle");
  const [smashes, setSmashes] = useState(0);
  const themeRef = useRef(theme);

  useEffect(() => { themeRef.current = theme; api.current?.recolour(theme); }, [theme]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let stop = () => {};
    let started = false;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return;
      started = true; io.disconnect();
      start(el).then((s) => { stop = s; }).catch(() => setState("fallback"));
    }, { rootMargin: "300px 0px" });
    io.observe(el);
    return () => { io.disconnect(); stop(); };

    async function start(root: HTMLDivElement) {
      const test = document.createElement("canvas");
      if (!(test.getContext("webgl2") || test.getContext("webgl"))) { setState("fallback"); return () => {}; }
      const THREE = await import("three");
      const { RoundedBoxGeometry } = await import("three/examples/jsm/geometries/RoundedBoxGeometry.js");
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      root.appendChild(renderer.domElement);
      renderer.domElement.setAttribute("aria-hidden", "true");

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(28, 1, 1, 400);
      camera.position.set(0, 0, 54);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x8890b0, 1.9));
      const key = new THREE.DirectionalLight(0xfff4e6, 2.4); key.position.set(-18, 26, 30); scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 0.9); rim.position.set(20, -10, -20); scene.add(rim);

      const logo = new THREE.Group(); scene.add(logo);
      // the tile, coloured bottom to top like the render
      const tileGeo = new RoundedBoxGeometry(15, 15, 3, 5, 1.3);
      const tileMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .38, metalness: 0 });
      const tile = new THREE.Mesh(tileGeo, tileMat); tile.position.z = -1.5; logo.add(tile);
      const shadowMat = new THREE.MeshStandardMaterial({ roughness: .6 });
      const slab = new THREE.Mesh(new RoundedBoxGeometry(15, 15, 3, 5, 1.3), shadowMat); slab.position.set(1.3, -1.3, -3.4); logo.add(slab);
      // the blocks: one instanced mesh, each block moved by its own matrix
      const blockGeo = new RoundedBoxGeometry(.96, .96, 1.7, 2, .14);
      const blockMat = new THREE.MeshStandardMaterial({ roughness: .4 });
      const blocks = new THREE.InstancedMesh(blockGeo, blockMat, CELLS.length); logo.add(blocks);
      const home = CELLS.map(([gx, gy]) => new THREE.Vector3(gx - 7, -(gy - 7), .85));
      const pos = home.map((h) => h.clone()), vel = home.map(() => new THREE.Vector3());
      const rot = home.map(() => new THREE.Quaternion()), spin = home.map(() => new THREE.Vector3());
      const m4 = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1), qd = new THREE.Quaternion(), eul = new THREE.Euler();

      const recolour = (t: string) => {
        const p = PALETTES[t] ?? PALETTES.sunset;
        const cols = p.tile.map((c) => new THREE.Color(c));
        const pa = tileGeo.getAttribute("position"), n = pa.count, arr = new Float32Array(n * 3), c = new THREE.Color();
        for (let i = 0; i < n; i++) {
          const k = Math.min(1, Math.max(0, (pa.getY(i) + 7.5) / 15)) * 2, j = Math.min(1, Math.floor(k));
          c.copy(cols[j]).lerp(cols[j + 1], k - j); arr.set([c.r, c.g, c.b], i * 3);
        }
        tileGeo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
        shadowMat.color.set(p.shadow);
        CELLS.forEach(([, , isA], i) => blocks.setColorAt(i, new THREE.Color(isA ? p.a : p.z)));
        if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;
      };
      recolour(themeRef.current);

      // smash: blocks fly toward the viewer and outwards, fall, bounce, then spring home
      let mode: "home" | "fly" | "back" = "home", modeT = 0;
      const smash = () => {
        mode = "fly"; modeT = 0;
        home.forEach((h, i) => {
          vel[i].set(h.x * .9 + (Math.random() - .5) * 10, h.y * .5 + 6 + Math.random() * 10, 14 + Math.random() * 16);
          spin[i].set((Math.random() - .5) * 14, (Math.random() - .5) * 14, (Math.random() - .5) * 14);
        });
        setSmashes((s) => { if (s + 1 >= 3) unlock("smasher"); return s + 1; });
      };

      // drag to spin; a click without a drag smashes
      let yaw = -.38, pitch = .12, tyaw = yaw, tpitch = pitch, drag = false, moved = 0, lx = 0, ly = 0;
      const cv = renderer.domElement;
      cv.style.touchAction = "pan-y";
      const down = (e: PointerEvent) => { drag = true; moved = 0; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); };
      const move = (e: PointerEvent) => {
        if (!drag) return;
        const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
        tyaw += dx * .01; tpitch = Math.max(-.7, Math.min(.7, tpitch + dy * .006));
      };
      const up = () => { if (drag && moved < 6) smash(); drag = false; };
      cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move); cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);

      const size = () => { const w = root.clientWidth, h = root.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
      const ro = new ResizeObserver(size); ro.observe(root); size();

      let raf = 0, last = performance.now(), visible = true, t = 0;
      const vis = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
      vis.observe(root);
      function frame(now: number) {
        raf = 0;
        const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt; modeT += dt;
        const sway = still || drag ? 0 : Math.sin(t * .55) * .42;    // an idle sway, so it never sits edge-on for long
        yaw += (tyaw + sway - yaw) * .08; pitch += (tpitch - pitch) * .12;
        logo.rotation.set(pitch + (still ? 0 : Math.sin(t * .8) * .04), yaw, 0);
        logo.position.y = still ? 0 : Math.sin(t * 1.1) * .35;
        if (mode === "fly") {
          home.forEach((_, i) => {
            vel[i].y -= 38 * dt; pos[i].addScaledVector(vel[i], dt);
            if (pos[i].y < -11) { pos[i].y = -11; vel[i].y *= -.45; vel[i].x *= .8; vel[i].z *= .8; }
            eul.set(spin[i].x * dt, spin[i].y * dt, spin[i].z * dt); rot[i].multiply(qd.setFromEuler(eul));
          });
          if (modeT > 1.5) { mode = "back"; modeT = 0; }
        } else if (mode === "back") {
          let done = true;
          home.forEach((h, i) => {
            const k = 1 - Math.pow(.0009, dt);                        // the same pull at any frame rate
            pos[i].lerp(h, Math.min(1, k * (1 + i * .02))); rot[i].slerp(qd.identity(), k);
            if (pos[i].distanceToSquared(h) > .0004) done = false;
          });
          if (done) { home.forEach((h, i) => { pos[i].copy(h); rot[i].identity(); }); mode = "home"; }
        }
        home.forEach((_, i) => blocks.setMatrixAt(i, m4.compose(pos[i], rot[i], one)));
        blocks.instanceMatrix.needsUpdate = true;
        renderer.render(scene, camera);
        if (visible && !document.hidden) raf = requestAnimationFrame(frame);
      }
      const wake = () => { if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
      document.addEventListener("visibilitychange", wake);
      raf = requestAnimationFrame(frame);

      api.current = { smash, recolour };
      setState("ready");
      return () => {
        cancelAnimationFrame(raf); ro.disconnect(); vis.disconnect(); document.removeEventListener("visibilitychange", wake);
        cv.removeEventListener("pointerdown", down); cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerup", up); cv.removeEventListener("pointercancel", up);
        [tileGeo, blockGeo, slab.geometry].forEach((g) => g.dispose()); [tileMat, blockMat, shadowMat].forEach((m) => m.dispose());
        renderer.dispose(); cv.remove(); api.current = null;
      };
    }
  }, []);

  return (
    <div className="pf-toy">
      <div ref={host} className={"pf-toy-stage " + state}>
        {state !== "ready" && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme === "holo" ? "/logo-holo-full.png" : "/logo.png"} alt="" className="pf-toy-still" loading="lazy" />
        )}
      </div>
      <div className="pf-toy-bar">
        <span>{state === "fallback" ? "The AZ logo, made in Blender" : smashes ? `Smashed ${smashes}× · it always comes back` : "Drag to spin · click to smash"}</span>
        {state === "ready" && <button type="button" className="pf-btn small" onClick={() => api.current?.smash()}>Smash it 💥</button>}
      </div>
    </div>
  );
}
