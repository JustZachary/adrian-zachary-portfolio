"use client";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import AskTheCodex from "../components/AskTheCodex";
import { PROJECTS } from "../data/projects";
import type { Project } from "../data/projects";
import { SmoothScroll, SplitReveal, Magnetic, scrollToY } from "../components/motion";
import { STEPS } from "../components/RuneRing";
import type { RingDriver } from "../components/RuneRing";

/* Where each section hangs on the stair (0 = the gate, 1 = the floor),
   and how much stair you walk between them. */
const LANDINGS: { id: string; u: number; screen?: boolean }[] = [
  { id: "home", u: 0, screen: true },
  { id: "about", u: 0.17 },
  { id: "skills", u: 0.4 },
  { id: "projects", u: 0.63 },
  { id: "contact", u: 0.97 },
];
const WALK_VH = 1.7; // viewport-heights of scroll per walk between landings

/* WebGL only exists in the browser; keep it out of the server render. */
const RuneRing = dynamic(() => import("../components/RuneRing"), { ssr: false });

const RUNES = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

function FloatingRune({ rune, x, y, delay, fontSize }: { rune: string; x: number; y: number; delay: number; fontSize: number }) {
  return (
    <motion.span
      className="absolute text-[#F6BC7C] font-cinzel select-none pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, fontSize: `${fontSize}px`, opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0], y: [0, -30, -60] }}
      transition={{ duration: 4, delay, repeat: Infinity, ease: "easeOut" }}
    >
      {rune}
    </motion.span>
  );
}

function Spark({ x, y, delay, size, hue }: { x: number; y: number; delay: number; size: number; hue: number }) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{ left: `${x}%`, top: `${y}%`, width: `${size}px`, height: `${size}px`, background: `hsl(${hue}, 100%, 70%)` }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [0, -20] }}
      transition={{ duration: 1.5, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

function Door({ side, isOpen }: { side: "left" | "right"; isOpen: boolean }) {
  const isLeft = side === "left";
  return (
    <motion.div
      className="absolute top-0 w-1/2 h-full overflow-hidden"
      style={{ [isLeft ? "left" : "right"]: 0, transformOrigin: isLeft ? "left center" : "right center" }}
      animate={{ rotateY: isOpen ? (isLeft ? -110 : 110) : 0, opacity: isOpen ? 0 : 1 }}
      transition={{ duration: 1.6, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="absolute inset-0" style={{ background: isLeft ? "linear-gradient(to right, #0a0a08 0%, #111210 60%, #1a1b14 100%)" : "linear-gradient(to left, #0a0a08 0%, #111210 60%, #1a1b14 100%)" }} />
      {[10, 25, 40, 55, 70, 85].map((x) => (
        <div key={x} className="absolute top-0 bottom-0 opacity-10" style={{ left: `${x}%`, width: "1px", background: "linear-gradient(to bottom, transparent, #F6BC7C 20%, #F6BC7C 80%, transparent)" }} />
      ))}
      <div className="absolute inset-0 pointer-events-none" style={{ border: "1px solid rgba(246,188,124,0.25)", boxShadow: isLeft ? "inset -4px 0 20px rgba(246,188,124,0.15)" : "inset 4px 0 20px rgba(246,188,124,0.15)" }} />
      <div className="absolute" style={{ top: "20%", bottom: "20%", left: isLeft ? "15%" : "10%", right: isLeft ? "10%" : "15%", border: "1px solid rgba(246,188,124,0.3)", borderRadius: "4px", background: "rgba(246,188,124,0.03)" }} />
      <div className="absolute" style={{ top: "25%", bottom: "25%", left: isLeft ? "20%" : "15%", right: isLeft ? "15%" : "20%", border: "1px solid rgba(246,188,124,0.15)", borderRadius: "2px" }} />
      <div className="absolute text-4xl select-none" style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "rgba(246,188,124,0.35)", textShadow: "0 0 20px rgba(246,188,124,0.5)", fontSize: "60px" }}>⚜</div>
      {["ᚠ", "ᚱ", "ᛏ", "ᛟ"].map((r, i) => (
        <span key={i} className="absolute text-sm select-none" style={{ color: "rgba(246,188,124,0.4)", top: i < 2 ? "5%" : "90%", left: (i === 0 || i === 2) ? "10%" : "80%", fontFamily: "serif" }}>{r}</span>
      ))}
      <div className="absolute top-0 bottom-0 w-6 pointer-events-none" style={{ [isLeft ? "right" : "left"]: 0, background: isLeft ? "linear-gradient(to right, transparent, rgba(246,188,124,0.08))" : "linear-gradient(to left, transparent, rgba(246,188,124,0.08))" }} />
    </motion.div>
  );
}

function PortalIntro({ onEnter }: { onEnter: () => void }) {
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [showEnter, setShowEnter] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [runeData, setRuneData] = useState<{ rune: string; x: number; y: number; delay: number; fontSize: number }[]>([]);
  const [sparkData, setSparkData] = useState<{ x: number; y: number; delay: number; size: number; hue: number }[]>([]);

  useEffect(() => {
    setRuneData(Array.from({ length: 20 }, (_, i) => ({
      rune: RUNES[i % RUNES.length],
      x: Math.random() * 90 + 5,
      y: Math.random() * 80 + 5,
      delay: Math.random() * 3,
      fontSize: Math.random() * 14 + 10,
    })));
    setSparkData(Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      size: Math.random() * 3 + 1,
      hue: Math.random() * 40 + 30,
    })));
  }, []);

  const handleEnter = () => {
    setDoorsOpen(true);
    setTimeout(() => setLeaving(true), 800);
    setTimeout(() => onEnter(), 2000);
  };

  useEffect(() => {
    const t = setTimeout(() => setShowEnter(true), 800);
    return () => clearTimeout(t);
  }, []);

  // THE FIX:
  // We use a plain <div> as the root (not motion.div) so it never creates a
  // GPU compositing layer. All stacking is pure DOM paint order:
  // - doors div comes first in DOM  → paints first (behind)
  // - content div comes second      → paints second (in front)
  // No z-index needed at all. Works on mobile Safari, Chrome, Android.
  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        background: "#07080a",
        opacity: leaving ? 0 : 1,
        transition: leaving ? "opacity 0.6s ease 0.8s" : "none",
        // Prevent Next.js body flex from affecting this
        contain: "strict",
      }}
    >
      {/* === DOORS LAYER (paints first = behind) === */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* Atmosphere */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(246,188,124,0.06) 0%, rgba(30,20,10,0.4) 50%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "33%", background: "linear-gradient(to bottom, rgba(15,12,5,0.9), transparent)" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "33%", background: "linear-gradient(to top, rgba(15,12,5,0.9), transparent)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 120% 120% at 50% 50%, transparent 40%, rgba(0,0,0,0.8) 100%)" }} />

        {/* Floating runes */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {runeData.map((r, i) => <FloatingRune key={i} {...r} />)}
          {sparkData.map((s, i) => <Spark key={i} {...s} />)}
        </div>

        {/* The doors */}
        <Door side="left" isOpen={doorsOpen} />
        <Door side="right" isOpen={doorsOpen} />

        {/* Vignette */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 80px rgba(0,0,0,0.9)" }} />

        {/* Center seam */}
        <motion.div
          style={{
            position: "absolute", top: 0, bottom: 0,
            left: "calc(50% - 1px)", width: "2px",
            pointerEvents: "none",
            background: "linear-gradient(to bottom, transparent 0%, rgba(246,188,124,0.6) 20%, rgba(246,188,124,0.8) 50%, rgba(246,188,124,0.6) 80%, transparent 100%)",
          }}
          animate={{ opacity: doorsOpen ? 0 : [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: doorsOpen ? 0 : Infinity }}
        />
      </div>

      {/* === CONTENT LAYER (paints second = in front, no z-index needed) === */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // NO transform, NO filter, NO will-change — keeps this out of any compositing layer
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "0 24px",
            width: "100%",
            maxWidth: "min(500px, 90vw)",
          }}
        >
          <motion.p
            style={{ fontFamily: "'Cinzel', serif", color: "rgba(246,188,124,0.5)", fontSize: "clamp(0.5rem, 1.8vw, 0.7rem)", letterSpacing: "0.5em", textTransform: "uppercase", marginBottom: "16px" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          >
            ᚠ &nbsp; Codex Arcanum &nbsp; ᚠ
          </motion.p>

          <motion.div
            style={{ fontSize: "2.2rem", marginBottom: "12px", color: "rgba(246,188,124,0.8)", textShadow: "0 0 30px rgba(246,188,124,0.6)" }}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 10 }}
          >🐉</motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h1 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "clamp(1rem, 5vw, 3.5rem)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              color: "#ffffff",
              marginBottom: "8px",
              lineHeight: 1.2,
              textShadow: "0 0 40px rgba(246,188,124,0.5)",
            }}>
              Adrian Zachary bin Ian
            </h1>
            <p style={{ fontFamily: "'Cinzel', serif", color: "#F6BC7C", fontSize: "clamp(0.55rem, 2vw, 0.9rem)", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              ⚔ &nbsp; Software Engineer &nbsp; ⚔
            </p>
          </motion.div>

          <motion.div
            style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}
            initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.5, duration: 0.6 }}
          >
            <div style={{ height: "1px", width: "60px", background: "linear-gradient(to right, transparent, rgba(246,188,124,0.6))" }} />
            <span style={{ color: "rgba(246,188,124,0.6)", fontSize: "0.75rem", fontFamily: "serif" }}>ᛟ ᚱ ᚹ ᛖ ᛚ</span>
            <div style={{ height: "1px", width: "60px", background: "linear-gradient(to left, transparent, rgba(246,188,124,0.6))" }} />
          </motion.div>

          <AnimatePresence>
            {showEnter && !doorsOpen && (
              <motion.button
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: "#F6BC7C",
                  border: "1px solid rgba(246,188,124,0.5)",
                  borderRadius: "2px",
                  background: "rgba(246,188,124,0.08)",
                  cursor: "pointer",
                  padding: "14px 36px",
                  fontSize: "clamp(0.65rem, 2.8vw, 0.875rem)",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  position: "relative",
                  minWidth: "180px",
                  minHeight: "52px",
                  touchAction: "manipulation",
                  WebkitTapHighlightColor: "transparent",
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                whileHover={{ scale: 1.04, background: "rgba(246,188,124,0.15)" }}
                whileTap={{ scale: 0.96 }}
                onClick={handleEnter}
              >
                <span style={{ position: "absolute", top: 0, left: 0, width: 8, height: 8, borderTop: "1px solid rgba(246,188,124,0.7)", borderLeft: "1px solid rgba(246,188,124,0.7)" }} />
                <span style={{ position: "absolute", top: 0, right: 0, width: 8, height: 8, borderTop: "1px solid rgba(246,188,124,0.7)", borderRight: "1px solid rgba(246,188,124,0.7)" }} />
                <span style={{ position: "absolute", bottom: 0, left: 0, width: 8, height: 8, borderBottom: "1px solid rgba(246,188,124,0.7)", borderLeft: "1px solid rgba(246,188,124,0.7)" }} />
                <span style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderBottom: "1px solid rgba(246,188,124,0.7)", borderRight: "1px solid rgba(246,188,124,0.7)" }} />
                Enter the Realm
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* Between sections: a rune line, and below it how far down the stair
   this landing is. */
function RuneDivider({ landing, steps }: { landing?: string; steps?: number }) {
  return (
    <div className="relative z-10 flex flex-col items-center justify-center gap-2 py-6">
      <div className="flex items-center justify-center gap-4 opacity-30">
        <div className="h-px flex-1 w-[100px]" style={{ background: "linear-gradient(to right, transparent, #F6BC7C)" }} />
        <span className="text-[#F6BC7C] text-xs tracking-widest" style={{ fontFamily: "serif" }}>ᚠ ᚱ ᚹ ᛖ ᛚ ᛟ</span>
        <div className="h-px flex-1 w-[100px]" style={{ background: "linear-gradient(to left, transparent, #F6BC7C)" }} />
      </div>
      {landing && (
        <motion.p
          className="font-cinzel text-[10px] uppercase tracking-[0.45em]"
          style={{ color: "rgba(246,188,124,0.45)" }}
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Landing {landing}{steps ? ` · ${steps} steps down` : ""}
        </motion.p>
      )}
    </div>
  );
}

function ArcaneCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-[#0e0f0a] rounded-lg p-6 border border-[#F6BC7C]/20 overflow-hidden group hover:border-[#F6BC7C]/40 transition-all duration-500 ${className}`}>
      <span className="absolute top-2 left-2 text-[#F6BC7C]/20 text-xs select-none" style={{ fontFamily: "serif" }}>ᚠ</span>
      <span className="absolute bottom-2 right-2 text-[#F6BC7C]/20 text-xs select-none" style={{ fontFamily: "serif" }}>ᛟ</span>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(246,188,124,0.05) 0%, transparent 70%)" }} />
      {children}
    </div>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* One project, however many there are.
 *
 * Both projects were written out by hand and were already drifting
 * apart — different heading sizes, different spacing under the tags.
 * They render from the same code now, so a new entry cannot arrive
 * looking like a different website. What differs between them is
 * declared in src/data/projects.ts and nowhere else. */
function ProjectBlock({ project, onJump, last = false }: { project: Project; onJump: (id: string) => void; last?: boolean }) {
  const left = project.glow === "left";
  const cta = project.cta;
  return (
    <>
      <Reveal>
        <div className={`rounded-2xl p-6 md:p-10 ${last ? "" : "mb-12 "}border border-[#F6BC7C]/15 relative overflow-hidden`} style={{ background: "var(--bg-deep)" }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 60% 40% at ${left ? "0%" : "100%"} 50%, rgba(246,188,124,0.04) 0%, transparent 70%)` }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to ${left ? "right" : "left"}, rgba(246,188,124,0.3), transparent)` }} />
          <div className="grid lg:grid-cols-2 gap-12 items-start relative z-10">
            <div>
              <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.4em] text-xs mb-4 opacity-70">{project.eyebrow}</p>
              <h3 className="font-cinzel text-3xl font-bold mb-5 text-white" style={project.titleGlow ? { textShadow: "0 0 20px rgba(246,188,124,0.2)" } : undefined}>{project.title}</h3>
              <p className="font-crimson text-lg leading-relaxed mb-8" style={{ color: "var(--text-dim)" }}>{project.blurb}</p>

              {project.layout === "flow" ? (
                <div className="space-y-6">
                  {project.notes.map((note) => (
                    <div key={note.title}>
                      <h4 className="font-cinzel text-sm font-semibold mb-1 text-[#F6BC7C] tracking-wider opacity-80">{note.title}</h4>
                      <p className="font-crimson text-base leading-relaxed" style={{ color: "var(--text-dim)" }}>{note.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4 mb-8">
                  {project.notes.map((note) => (
                    <ArcaneCard key={note.title}>
                      <h4 className="font-cinzel text-xs font-semibold mb-1 text-[#F6BC7C] tracking-wider">{note.title}</h4>
                      <p className="font-crimson text-sm leading-relaxed" style={{ color: "var(--text-dim)" }}>{note.body}</p>
                    </ArcaneCard>
                  ))}
                </div>
              )}

              <div className={`flex flex-wrap gap-2 ${project.layout === "flow" ? "mt-8" : "mb-6"}`}>
                {project.tech.map((tech) => (
                  <span key={tech} className="font-cinzel text-xs px-3 py-1 tracking-wider" style={{ background: "rgba(246,188,124,0.12)", border: "1px solid rgba(246,188,124,0.3)", color: "#F6BC7C", borderRadius: "2px" }}>{tech}</span>
                ))}
              </div>

              {cta && (
                <div className="mt-8">
                  <button onClick={() => onJump(cta.target)} className="font-cinzel text-sm tracking-widest px-6 py-3 transition-all duration-300 hover:bg-[#D9EAFA]/10" style={{ border: "1px solid rgba(217,234,250,0.3)", color: "rgba(217,234,250,0.8)", borderRadius: "2px" }}>{cta.label}</button>
                </div>
              )}

              {project.badges && project.badges.length > 0 && (
                <div className="flex gap-3 flex-wrap">
                  {project.badges.map((badge, i) => (
                    <span key={badge} className="font-cinzel text-xs px-5 py-2 tracking-wider" style={i === 0
                      ? { background: "rgba(246,188,124,0.15)", border: "1px solid rgba(246,188,124,0.4)", color: "#F6BC7C", borderRadius: "2px" }
                      : { border: "1px solid rgba(217,234,250,0.2)", color: "rgba(217,234,250,0.6)", borderRadius: "2px" }}>{badge}</span>
                  ))}
                </div>
              )}
            </div>

            {project.images.length > 1 ? (
              <div className="grid grid-cols-2 gap-2 md:gap-3">
                {project.images.map((img, i) => (
                  <div key={img} className="relative overflow-hidden rounded-xl border border-[#F6BC7C]/10 group">
                    <img src={`/${img}`} alt={`${project.title} ${i + 1}`} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-[#F6BC7C]/0 group-hover:bg-[#F6BC7C]/5 transition-colors duration-500" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${project.mediaAfterText ? "order-first lg:order-last " : ""}overflow-hidden rounded-xl border border-[#D9EAFA]/10 group`}>
                <img src={`/${project.images[0]}`} alt={project.title} className="w-full group-hover:scale-105 transition-transform duration-500" />
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {project.caseStudy && (
        <Reveal>
          <div id="case-study" className="rounded-2xl p-6 md:p-8 mb-12 border border-[#D9EAFA]/10 relative overflow-hidden" style={{ background: "rgba(217,234,250,0.02)" }}>
            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(217,234,250,0.2), transparent)" }} />
            <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.4em] text-xs mb-4 opacity-70">{project.caseStudy.eyebrow}</p>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold mb-6 text-white">{project.caseStudy.title}</h2>
            <p className="font-crimson text-lg leading-relaxed max-w-3xl mb-8" style={{ color: "var(--text-dim)" }}>{project.caseStudy.intro}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {project.caseStudy.cards.map((card) => (
                <ArcaneCard key={card.title}>
                  <h3 className="font-cinzel text-sm font-semibold mb-2 text-[#F6BC7C] tracking-wider">{card.title}</h3>
                  <p className="font-crimson text-base leading-relaxed" style={{ color: "var(--text-dim)" }}>{card.body}</p>
                </ArcaneCard>
              ))}
            </div>
          </div>
        </Reveal>
      )}
    </>
  );
}

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* THE DESCENT.
     The stair is one long walk from the gate to the floor; the sections
     hang at landings along it. Scroll is turned into a timeline of holds
     (standing at a landing, reading — long enough to scroll through a
     tall panel) and walks (the stretch of stair to the next one). The
     canvas gets `u` (where you are) and moves the panels itself; see
     RuneRing. */
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringDriver = useRef<RingDriver>({
    u: 0, hero: 0, hold: 1, mouseX: 0, mouseY: 0,
    panels: LANDINGS.map((l) => ({ el: null, h: 0, u: l.u, screen: l.screen, shift: 0, fade: l.screen ? 1 : 0 })),
  });
  const timeline = useRef<{ start: number; end: number; hold: boolean; i: number; from: number; to: number; travel: number }[]>([]);
  const [totalVh, setTotalVh] = useState(900);
  const depthEl = useRef<HTMLSpanElement>(null);
  const lastDepth = useRef(-1);

  const buildTimeline = () => {
    const vh = window.innerHeight;
    const segs: typeof timeline.current = [];
    let pos = 0;
    LANDINGS.forEach((l, i) => {
      const h = panelRefs.current[i]?.offsetHeight ?? vh;
      ringDriver.current.panels[i].h = h;
      const travel = Math.max(0, h - vh * 0.78); // px the panel must scroll while you read
      const hold = 0.9 + travel / vh;              // in viewport heights
      segs.push({ start: pos, end: pos + hold, hold: true, i, from: l.u, to: l.u, travel });
      pos += hold;
      if (i < LANDINGS.length - 1) {
        segs.push({ start: pos, end: pos + WALK_VH, hold: false, i, from: l.u, to: LANDINGS[i + 1].u, travel });
        pos += WALK_VH;
      }
    });
    timeline.current = segs;
    setTotalVh(Math.round(pos * 100) + 100);
  };
  useEffect(() => {
    buildTimeline();
    const t = setTimeout(buildTimeline, 800); // fonts and images settle
    window.addEventListener("resize", buildTimeline);
    return () => { clearTimeout(t); window.removeEventListener("resize", buildTimeline); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => {
    const vh = window.innerHeight;
    const pos = v / vh;
    const d = ringDriver.current;
    const segs = timeline.current;
    if (!segs.length) return;
    let seg = segs[segs.length - 1];
    for (const sg of segs) if (pos < sg.end) { seg = sg; break; }
    const frac = Math.min(1, Math.max(0, (pos - seg.start) / (seg.end - seg.start)));
    for (const p of d.panels) { p.fade = 0; }
    if (seg.hold) {
      d.u = seg.from;
      d.hold = 1;
      d.hero = seg.i === 0 ? 0 : 1;
      const p = d.panels[seg.i];
      p.fade = 1;
      p.shift = frac * seg.travel;
      if (d.panels[seg.i + 1]) d.panels[seg.i + 1].fade = 0.55;
    } else {
      const e = frac * frac * (3 - 2 * frac);
      d.u = seg.from + (seg.to - seg.from) * e;
      d.hold = 0;
      d.hero = seg.i === 0 ? e : 1;
      const leaving = d.panels[seg.i];
      leaving.fade = seg.i === 0 ? 1 - Math.min(1, frac * 2.2) : 1;
      leaving.shift = seg.travel;
      const arriving = d.panels[seg.i + 1];
      arriving.fade = 1;
      arriving.shift = 0;
    }
    const dep = Math.round(d.u * STEPS);
    if (dep !== lastDepth.current && depthEl.current) { lastDepth.current = dep; depthEl.current.textContent = String(dep); }
  });

  /* Nav: a landing's id scrolls to where you stand at it; an anchor
     inside a panel scrolls to where that part of the panel is in view. */
  const scrollTo = (id: string) => {
    const vh = window.innerHeight;
    const segs = timeline.current;
    let li = LANDINGS.findIndex((l) => l.id === id);
    let within = 0;
    if (li < 0) {
      const el = document.getElementById(id);
      const panel = el?.closest(".quest") as HTMLElement | null;
      if (!el || !panel) return;
      li = panelRefs.current.indexOf(panel as HTMLDivElement);
      within = el.getBoundingClientRect().top - panel.getBoundingClientRect().top - vh * 0.15;
    }
    const seg = segs.find((sg) => sg.hold && sg.i === li);
    if (!seg) return;
    const f = seg.travel > 0 ? Math.min(1, Math.max(0, within / seg.travel)) : 0;
    scrollToY((seg.start + f * (seg.end - seg.start)) * vh + 2);
  };

  const onPageMouse = (e: React.MouseEvent) => {
    ringDriver.current.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    ringDriver.current.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Text:ital,wght@0,400;0,600;1,400&display=swap');
        :root {
          --gold: #F6BC7C; --silver: #D9EAFA;
          --bg-deep: #07080a; --bg-dark: #0c0d09;
          --bg-mid: #111210; --bg-light: #181a14;
          --text-dim: rgba(217,234,250,0.65);
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: var(--bg-deep);
          color: #fff;
          font-family: 'Crimson Text', Georgia, serif;
          overflow-x: hidden;
        }
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-crimson { font-family: 'Crimson Text', serif; }
        .quest {
          position: fixed; left: 0; top: 0; opacity: 0; pointer-events: none;
          transform-origin: 50% 50%; backface-visibility: hidden;
        }
        .quest-hero { width: min(96vw, 1100px); }
        .quest-panel {
          width: min(92vw, 1120px);
          background: rgba(10,10,8,0.8);
          border: 1px solid rgba(246,188,124,0.18);
          border-radius: 22px;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 40px 120px rgba(0,0,0,0.65), 0 0 90px rgba(246,188,124,0.05), inset 0 0 60px rgba(0,0,0,0.35);
        }
        .quest-panel::before, .quest-panel::after {
          content: 'ᚦ'; position: absolute; top: 14px; font-family: serif; font-size: 14px;
          color: rgba(246,188,124,0.4); text-shadow: 0 0 10px rgba(246,188,124,0.5);
        }
        .quest-panel::before { left: 18px; }
        .quest-panel::after { right: 18px; content: 'ᛟ'; }
        .torchlight {
          position: fixed; inset: 0; pointer-events: none; z-index: 30;
          background: radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.72) 100%);
        }
        @keyframes emberglow { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.85; } }
        .torchlight::after {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(ellipse 30% 40% at 0% 60%, rgba(255,140,60,0.09), transparent 70%),
            radial-gradient(ellipse 30% 40% at 100% 35%, rgba(255,140,60,0.07), transparent 70%);
          animation: emberglow 7s ease-in-out infinite;
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: var(--bg-deep); }
        ::-webkit-scrollbar-thumb { background: rgba(246,188,124,0.3); border-radius: 2px; }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9999;
          opacity: 0.4;
        }
      `}</style>

      {/* Portal — rendered directly, NOT inside AnimatePresence */}
      {!entered && <PortalIntro onEnter={() => setEntered(true)} />}

      <SmoothScroll>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: entered ? 1 : 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="min-h-screen relative"
        style={{ background: "var(--bg-deep)" }}
        onMouseMove={onPageMouse}
      >
        {/* The stair runs behind the whole page; scrolling is the descent */}
        <motion.div className="fixed inset-0 z-0 pointer-events-none" initial={{ opacity: 0, scale: 1.15 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}>
          <RuneRing driver={ringDriver} />
        </motion.div>
        <div className="torchlight" />
        {/* depth meter */}
        <motion.div className="fixed bottom-5 left-5 z-40 font-cinzel text-[10px] tracking-[0.35em] uppercase select-none" style={{ color: "rgba(246,188,124,0.6)", textShadow: "0 0 12px rgba(246,188,124,0.4)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>
          <span className="opacity-60" style={{ fontFamily: "serif" }}>ᛞ </span>Depth · <span ref={depthEl}>0</span> steps
        </motion.div>

        {/* NAVBAR */}
        <nav
          className="fixed top-0 w-full z-50 border-b border-[#F6BC7C]/10"
          style={{ background: "rgba(7,8,10,0.92)", backdropFilter: "blur(12px)" }}
        >
          <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
            <h1
              className="text-lg font-bold text-[#F6BC7C] font-cinzel tracking-widest"
              style={{ textShadow: "0 0 20px rgba(246,188,124,0.4)" }}
            >
              ⚬ AZ ⚬
            </h1>

            {/* Desktop nav */}
            <div className="hidden md:flex gap-6 text-sm font-cinzel tracking-wider" style={{ color: "rgba(217,234,250,0.7)" }}>
              {[["Home", "home"], ["The Engineer", "about"], ["The Arsenal", "skills"], ["Chronicles", "projects"], ["Summon Me", "contact"]].map(([label, id]) => (
                <a key={id} onClick={() => scrollTo(id)} className="hover:text-[#F6BC7C] transition-colors duration-300 cursor-pointer relative group">
                  {label}
                  <span className="absolute -bottom-1 left-0 right-0 h-px bg-[#F6BC7C] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </a>
              ))}
            </div>

            {/* Mobile hamburger button */}
            <button
              className="md:hidden flex flex-col justify-center items-center gap-[5px] w-8 h-8"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <motion.span
                animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 7 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "block", width: "22px", height: "1px", background: "#F6BC7C" }}
              />
              <motion.span
                animate={{ opacity: menuOpen ? 0 : 1 }}
                transition={{ duration: 0.2 }}
                style={{ display: "block", width: "22px", height: "1px", background: "#F6BC7C" }}
              />
              <motion.span
                animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -7 : 0 }}
                transition={{ duration: 0.2 }}
                style={{ display: "block", width: "22px", height: "1px", background: "#F6BC7C" }}
              />
            </button>
          </div>

          {/* Mobile dropdown menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden", borderTop: "1px solid rgba(246,188,124,0.1)" }}
              >
                <div
                  className="flex flex-col px-6 py-4 gap-4"
                  style={{ background: "rgba(7,8,10,0.98)" }}
                >
                  {[["Home", "home"], ["The Engineer", "about"], ["The Arsenal", "skills"], ["Chronicles", "projects"], ["Summon Me", "contact"]].map(([label, id]) => (
                    <a
                      key={id}
                      onClick={() => { scrollTo(id); setMenuOpen(false); }}
                      className="font-cinzel text-sm tracking-widest cursor-pointer"
                      style={{ color: "rgba(217,234,250,0.8)" }}
                    >
                      <span className="text-[#F6BC7C]/40 mr-3" style={{ fontFamily: "serif" }}>ᚠ</span>
                      {label}
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-px w-full" style={{ background: "linear-gradient(to right, transparent, rgba(246,188,124,0.2), transparent)" }} />
        </nav>

        {/* HERO */}
        {/* THE QUESTS — fixed panels the stair positions every frame (see RuneRing).
            Nothing here is in the document flow; the spacer below gives the
            page its scroll length and useDescent turns scroll into the walk. */}
        <div className="fixed inset-0 z-10 pointer-events-none">
          <div ref={(el) => { panelRefs.current[0] = el; ringDriver.current.panels[0].el = el; }} className="quest quest-hero">
            <div className="absolute -inset-10 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 58% at 50% 50%, rgba(7,8,10,0.78) 0%, rgba(7,8,10,0.45) 55%, transparent 100%)" }} />
            <div className="relative flex flex-col items-center text-center">


          <motion.div className="relative mb-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <div className="absolute -inset-4 rounded-3xl blur-2xl" style={{ background: "radial-gradient(ellipse, rgba(246,188,124,0.2), transparent 70%)" }} />
            <div className="absolute -inset-1 rounded-3xl border border-[#F6BC7C]/30" />
            <div className="absolute -inset-3 rounded-3xl border border-[#F6BC7C]/10" />
            <img src="/my_picture2.jpeg" alt="Adrian Zachary" className="relative rounded-3xl h-[260px] object-cover" style={{ filter: "contrast(1.05) saturate(0.9)" }} />
            {["ᚠ", "ᚱ", "ᛏ", "ᛟ"].map((r, i) => (
              <span key={i} className="absolute text-[#F6BC7C]/60 text-base select-none" style={{ top: i < 2 ? "-8px" : "auto", bottom: i >= 2 ? "-8px" : "auto", left: (i === 0 || i === 2) ? "-8px" : "auto", right: (i === 1 || i === 3) ? "-8px" : "auto", fontFamily: "serif", textShadow: "0 0 10px rgba(246,188,124,0.5)" }}>{r}</span>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.5em] text-xs mb-4 opacity-80">⚜ Code ⚜ Cloud ⚜ AI ⚜ Systems ⚜</p>
            <p className="font-cinzel text-[var(--silver)] text-xs uppercase tracking-[0.4em] mb-3 opacity-50">Software Engineer · Cloud Architect Apprentice</p>
            <SplitReveal text="Adrian Zachary bin Ian" className="font-cinzel text-3xl md:text-7xl font-bold leading-tight mb-3 text-white" style={{ textShadow: "0 0 40px rgba(246,188,124,0.35), 0 0 80px rgba(246,188,124,0.1)", perspective: "600px" }} delay={0.5} stagger={0.12} />
            <p className="font-cinzel text-[#F6BC7C] text-2xl md:text-3xl font-semibold mb-6 tracking-widest opacity-70">· &quot;Z&quot; ·</p>
          </motion.div>

          <motion.p className="font-crimson text-xl md:text-2xl text-[var(--text-dim)] max-w-2xl mx-auto leading-relaxed mb-10 italic" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            Software Engineering graduate forging practical web systems, AI-assisted workflows, and modern digital solutions with real-world impact.
          </motion.p>

          <motion.div className="flex gap-4 flex-wrap justify-center mb-14" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Magnetic><button onClick={() => scrollTo("projects")} className="font-cinzel text-sm tracking-widest px-7 py-3 relative group" style={{ background: "rgba(246,188,124,0.12)", border: "1px solid rgba(246,188,124,0.5)", color: "#F6BC7C", borderRadius: "2px" }}>
              <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#F6BC7C]/60" /><span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F6BC7C]/60" /><span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F6BC7C]/60" /><span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#F6BC7C]/60" />
              View Projects
            </button></Magnetic>
            <Magnetic><button onClick={() => scrollTo("contact")} className="font-cinzel text-sm tracking-widest px-7 py-3 transition-all duration-300 hover:bg-[#D9EAFA]/10" style={{ border: "1px solid rgba(217,234,250,0.25)", color: "rgba(217,234,250,0.8)", borderRadius: "2px" }}>Contact Me</button></Magnetic>
            <Magnetic><a href="/adrian_zachary_resume.pdf" download className="font-cinzel text-sm tracking-widest px-7 py-3 transition-all duration-300 hover:bg-[#F6BC7C]/10" style={{ border: "1px solid rgba(246,188,124,0.25)", color: "rgba(246,188,124,0.7)", borderRadius: "2px" }}>Download Resume</a></Magnetic>
          </motion.div>

          <motion.div className="flex gap-6 md:gap-10 text-center flex-wrap justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            {[["2+", "Major Projects"], ["1", "Enterprise Internship"], ["AWS", "Certification In Progress"]].map(([val, label]) => (
              <div key={label}>
                <h3 className="font-cinzel text-3xl font-bold text-[#F6BC7C]" style={{ textShadow: "0 0 20px rgba(246,188,124,0.4)" }}>{val}</h3>
                <p className="font-crimson text-sm" style={{ color: "var(--text-dim)" }}>{label}</p>
              </div>
            ))}
          </motion.div>
          
            </div>
            <div className="relative flex justify-center mt-2">
<motion.div className="relative flex flex-col items-center gap-2 font-cinzel text-[10px] tracking-[0.4em] uppercase" style={{ color: "rgba(246,188,124,0.45)" }}>
            Scroll
            <motion.span className="block w-px h-8" style={{ background: "linear-gradient(to bottom, #F6BC7C, transparent)" }} animate={{ scaleY: [0, 1, 0], originY: 0 }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
          </motion.div>
            </div>
          </div>
          <div ref={(el) => { panelRefs.current[1] = el; ringDriver.current.panels[1].el = el; }} className="quest quest-panel">
            <p className="font-cinzel text-[10px] uppercase tracking-[0.45em] text-center mb-2 -mt-6" style={{ color: "rgba(246,188,124,0.5)" }}>Landing II · The Engineer · {Math.round(LANDINGS[1].u * STEPS)} steps down</p>
            <section id="about" className="px-6 md:px-12 py-16 md:py-20 relative overflow-hidden">
              <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[200px] select-none pointer-events-none opacity-[0.03] font-cinzel" style={{ color: "#F6BC7C" }}>⚜</div>
              <div className="max-w-4xl mx-auto relative z-10">
                <Reveal>
                  <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.4em] text-xs mb-4 opacity-80">ᚦ The Engineer ᚦ</p>
                  <h2 className="font-cinzel text-3xl md:text-5xl font-bold mb-8 text-white leading-tight" style={{ textShadow: "0 0 30px rgba(246,188,124,0.15)" }}>
                    I build practical and modern<br /><span className="text-[#F6BC7C]">digital systems.</span>
                  </h2>
                </Reveal>
                <Reveal delay={0.1}>
                  <div className="space-y-4">
                    {[
                      "I am a final-year Software Engineering student with hands-on experience in web development, AI-assisted systems, enterprise workflows, and software support through my internship at Sarawak Information Systems (SAINS).",
                      "My work focuses on building practical and meaningful systems that solve real workflow problems — from AI-enhanced recruitment features to environmental monitoring applications.",
                      "I focus on creating clean, user-friendly, and efficient digital solutions while continuously strengthening my technical, analytical, and problem-solving skills through real project experience.",
                    ].map((text, i) => (
                      <p key={i} className="font-crimson text-lg leading-relaxed" style={{ color: "var(--text-dim)" }}>{text}</p>
                    ))}
                  </div>
                </Reveal>
                <Reveal delay={0.2}>
                  <div className="mt-10 rounded-lg p-6 border border-[#F6BC7C]/20 relative overflow-hidden" style={{ background: "rgba(246,188,124,0.04)" }}>
                    <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(246,188,124,0.4), transparent)" }} />
                    <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.4em] text-xs mb-3 opacity-70">⚔ Current Quest ⚔</p>
                    <h3 className="font-cinzel text-lg font-semibold mb-2 text-white">AWS Certified Solutions Architect — Associate</h3>
                    <p className="font-crimson text-base" style={{ color: "var(--text-dim)" }}>Currently preparing for certification while expanding cloud architecture and deployment knowledge.</p>
                  </div>
                </Reveal>
              </div>
            </section>
          </div>
          <div ref={(el) => { panelRefs.current[2] = el; ringDriver.current.panels[2].el = el; }} className="quest quest-panel">
            <p className="font-cinzel text-[10px] uppercase tracking-[0.45em] text-center mb-2 -mt-6" style={{ color: "rgba(246,188,124,0.5)" }}>Landing III · The Arsenal · {Math.round(LANDINGS[2].u * STEPS)} steps down</p>
            <section id="skills" className="px-6 md:px-12 py-16 md:py-20 relative">
              <div className="max-w-6xl mx-auto">
                <Reveal>
                  <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.4em] text-xs mb-4 opacity-80">ᛞ The Arsenal ᛞ</p>
                  <h2 className="font-cinzel text-3xl md:text-5xl font-bold mb-12 text-white">Tools &amp; Technologies</h2>
                </Reveal>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[["PHP", "Backend Development", "🔩"], ["Laravel", "Web Framework", "🌐"], ["MySQL", "Database Management", "🗄️"], ["Flutter", "Mobile App Development", "📱"], ["Firebase", "Backend Services", "🔥"], ["GitHub", "Version Control", "📜"], ["API", "API Integration", "⚡"], ["Next.js", "Frontend Framework", "✦"]].map(([title, desc, icon], i) => (
                    <Reveal key={title} delay={i * 0.05}>
                      <ArcaneCard>
                        <div className="text-2xl mb-3 opacity-70">{icon}</div>
                        <h3 className="font-cinzel text-base font-semibold mb-1 text-white">{title}</h3>
                        <p className="font-crimson text-sm" style={{ color: "var(--text-dim)" }}>{desc}</p>
                      </ArcaneCard>
                    </Reveal>
                  ))}
                </div>
              </div>
            </section>
          </div>
          <div ref={(el) => { panelRefs.current[3] = el; ringDriver.current.panels[3].el = el; }} className="quest quest-panel">
            <p className="font-cinzel text-[10px] uppercase tracking-[0.45em] text-center mb-2 -mt-6" style={{ color: "rgba(246,188,124,0.5)" }}>Landing IV · The Chronicles · {Math.round(LANDINGS[3].u * STEPS)} steps down</p>
            <section id="projects" className="px-6 md:px-12 py-16 md:py-20 relative">
              <div className="max-w-6xl mx-auto">
                <Reveal>
                  <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.4em] text-xs mb-4 opacity-80">📜 The Chronicles 📜</p>
                  <h2 className="font-cinzel text-3xl md:text-5xl font-bold mb-12 text-white">Featured Work</h2>
                </Reveal>
    
                {PROJECTS.map((project, i) => (
                  <ProjectBlock
                    key={project.slug}
                    project={project}
                    onJump={scrollTo}
                    last={i === PROJECTS.length - 1}
                  />
                ))}
              </div>
            </section>
          </div>
          <div ref={(el) => { panelRefs.current[4] = el; ringDriver.current.panels[4].el = el; }} className="quest quest-panel">
            <p className="font-cinzel text-[10px] uppercase tracking-[0.45em] text-center mb-2 -mt-6" style={{ color: "rgba(246,188,124,0.5)" }}>Landing V · The Floor · {Math.round(LANDINGS[4].u * STEPS)} steps down</p>
            <section id="contact" className="px-6 md:px-12 py-16 md:py-20 relative overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(246,188,124,0.04) 0%, transparent 70%)" }} />
              <Reveal>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                  <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.5em] text-xs mb-4 opacity-70">🔮 Summon Me 🔮</p>
                  <h2 className="font-cinzel text-3xl md:text-5xl font-bold mb-5 text-white" style={{ textShadow: "0 0 30px rgba(246,188,124,0.15)" }}>Let&apos;s Work Together</h2>
                  <p className="font-crimson text-lg mb-10 italic" style={{ color: "var(--text-dim)" }}>Open to software engineering opportunities, internships, and collaborative projects.</p>
                  <div className="flex justify-center gap-3 flex-wrap px-4">
                    <a href="mailto:adrianzachary825@gmail.com" className="font-cinzel text-sm tracking-widest px-7 py-3 transition-all duration-300 relative group" style={{ background: "rgba(246,188,124,0.12)", border: "1px solid rgba(246,188,124,0.4)", color: "#F6BC7C", borderRadius: "2px" }}>
                      <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#F6BC7C]" /><span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#F6BC7C]" /><span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#F6BC7C]" /><span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#F6BC7C]" />
                      Email Me
                    </a>
                    <a href="https://github.com/JustZachary" target="_blank" className="font-cinzel text-sm tracking-widest px-7 py-3 transition-all duration-300 hover:bg-[#D9EAFA]/10" style={{ border: "1px solid rgba(217,234,250,0.25)", color: "rgba(217,234,250,0.8)", borderRadius: "2px" }}>GitHub</a>
                    <a href="https://www.linkedin.com/in/adrian-zachary-ian-2a4748181/" target="_blank" className="font-cinzel text-sm tracking-widest px-7 py-3 transition-all duration-300 hover:bg-[#F6BC7C]/10" style={{ border: "1px solid rgba(246,188,124,0.25)", color: "rgba(246,188,124,0.7)", borderRadius: "2px" }}>LinkedIn</a>
                  </div>
                </div>
              </Reveal>
            </section>
            <footer className="px-6 pt-10 pb-2 text-center border-t border-[#F6BC7C]/10 mt-10">
              <div className="flex items-center justify-center gap-4 mb-3">
                <div className="h-px w-16" style={{ background: "linear-gradient(to right, transparent, rgba(246,188,124,0.3))" }} />
                <span className="text-[#F6BC7C]/30 text-xs font-cinzel">ᚠ ᛟ</span>
                <div className="h-px w-16" style={{ background: "linear-gradient(to left, transparent, rgba(246,188,124,0.3))" }} />
              </div>
              <p className="font-cinzel text-xs tracking-widest" style={{ color: "rgba(217,234,250,0.35)" }}>© 2026 Adrian Zachary — Forged with Next.js &amp; Tailwind CSS</p>
            </footer>
          </div>
        </div>

        {/* the scroll length of the descent */}
        <div style={{ height: `${totalVh}vh` }} aria-hidden />
        <AskTheCodex />
      </motion.main>
      </SmoothScroll>
    </>
  );
}