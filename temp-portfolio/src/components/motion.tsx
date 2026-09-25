"use client";
/* Small motion primitives used across the page.
 *
 *   SmoothScroll  — Lenis, so the wheel feels weighted and scroll-driven
 *                   animation reads as one continuous motion
 *   SplitReveal   — a headline that arrives word by word
 *   Magnetic      — a button that leans toward the cursor
 *   Parallax      — a wrapper that drifts slower or faster than the page
 *
 * None of them know anything about the arcane theme; they only move.
 */
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import Lenis from "lenis";
import { useEffect, useRef } from "react";

let lenisInstance: Lenis | null = null;

/* Scroll to an element by id, through Lenis when it is running so the
   easing matches the wheel, and natively otherwise. */
export function scrollToId(id: string, offset = -64) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenisInstance) lenisInstance.scrollTo(el, { offset, duration: 1.4 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/* Scroll to an absolute page offset, eased through Lenis when running. */
export function scrollToY(y: number) {
  if (lenisInstance) lenisInstance.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;
    const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.85, smoothWheel: true });
    lenisInstance = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
  return <>{children}</>;
}

export function SplitReveal({
  text,
  as: Tag = "h1",
  className = "",
  style,
  delay = 0,
  stagger = 0.06,
}: {
  text: string;
  as?: "h1" | "h2" | "p";
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  stagger?: number;
}) {
  const words = text.split(" ");
  return (
    <Tag className={className} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" style={{ paddingBottom: "0.08em", marginBottom: "-0.08em" }}>
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.9, delay: delay + i * stagger, ease: [0.22, 1, 0.36, 1] }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

export function Magnetic({ children, strength = 0.35, className = "" }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 200, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 200, damping: 18, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div ref={ref} className={`inline-block ${className}`} style={{ x: sx, y: sy }} onMouseMove={onMove} onMouseLeave={onLeave}>
      {children}
    </motion.div>
  );
}

export function Parallax({ children, speed = 0.2, className = "" }: { children: React.ReactNode; speed?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [speed * 120, -speed * 120]);
  return (
    <motion.div ref={ref} className={className} style={{ y }}>
      {children}
    </motion.div>
  );
}

/* A landing on the stair, floating like a quest scroll. As you come
   down toward it the panel rises out of the dark ahead — small and far,
   then close and flat — and once it's with you it hovers gently. */
export function Landing({ children, side = "left", className = "" }: { children: React.ReactNode; side?: "left" | "right"; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 40%"] });
  const dir = side === "left" ? -1 : 1;
  const z = useTransform(scrollYProgress, [0, 1], [-900, 0]);
  const x = useTransform(scrollYProgress, [0, 1], [dir * 120, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [-140, 0]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [dir * 14, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  return (
    <div style={{ perspective: "1200px" }} className={className}>
      <motion.div ref={ref} style={{ z, x, y, rotateY, opacity, transformStyle: "preserve-3d" }}>
        <motion.div animate={{ y: [0, -9, 0] }} transition={{ duration: 6 + (side === "left" ? 0 : 1.3), repeat: Infinity, ease: "easeInOut" }}>
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
