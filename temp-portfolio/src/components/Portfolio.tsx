"use client";
/* The portfolio page: one scroll, readable in thirty seconds, with a few toys.
 *
 * Order is what a recruiter looks for first: who, the quick facts and the CV
 * button, then work, experience, skills, the games, contact. The fun parts
 * (the portrait that un-pixelates, the facts typing in, the "explored" coins,
 * games playable in a window) never hide content and switch off for people
 * who ask for reduced motion.
 *
 * Words live in src/data/profile.ts and src/data/projects.ts, not here.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Lenis from "lenis";
import { PROFILE, QUICK_FACTS, EXPERIENCE, EDUCATION, AWARDS, SKILLS, STATS, ABOUT } from "../data/profile";
import LogoToy from "./LogoToy";
import { PROJECTS, GAMES, ZLAB_URL } from "../data/projects";
import type { Project, Game } from "../data/projects";
import { PixelIcon } from "./icons";

const SECTIONS = [
  ["top", "Hi"],
  ["work", "Work"],
  ["experience", "Experience"],
  ["skills", "Skills"],
  ["play", "Play"],
  ["contact", "Contact"],
] as const;

/* The colour theme. A visitor's own pick is remembered; without one, people whose
   computer is in dark mode get Night and everyone else gets PROFILE.theme. The theme
   sits on <html data-pf-theme> (set before the first paint by layout.tsx), so the
   right colours show straight away. */
type Theme = "sunset" | "holo" | "night";
const THEMES: Theme[] = ["sunset", "holo", "night"];
const THEME_NAME: Record<Theme, string> = { sunset: "Sunset", holo: "Holo pastel", night: "Night" };
const THEME_BG: Record<Theme, string> = { sunset: "#FFF4EA", holo: "#FBF9FF", night: "#12142B" };
const nextTheme = (t: Theme) => THEMES[(THEMES.indexOf(t) + 1) % THEMES.length];
const themeListeners = new Set<() => void>();
const themeStore = {
  get(): Theme {
    try { const t = localStorage.getItem("pf-theme") as Theme; if (THEMES.includes(t)) return t; } catch {}
    try { if (matchMedia("(prefers-color-scheme: dark)").matches) return "night"; } catch {}
    return PROFILE.theme;
  },
  set(t: Theme) {
    try { localStorage.setItem("pf-theme", t); } catch {}
    document.documentElement.dataset.pfTheme = t;
    themeListeners.forEach((l) => l());
  },
  sub(l: () => void) {
    themeListeners.add(l);
    const mq = matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener("change", l);
    return () => { themeListeners.delete(l); mq.removeEventListener("change", l); };
  },
};
/* the logo and splash art: Night uses the Sunset renders, which read well on dark */
const art = (t: Theme) => (t === "holo" ? "holo" : "sunset");
function useTheme() {
  return useSyncExternalStore(themeStore.sub, themeStore.get, () => PROFILE.theme);
}

function useReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

/* Which sections have been on screen, for the coins in the top bar. */
function useVisited(onAll: () => void) {
  const [seen, setSeen] = useState<Set<string>>(new Set(["top"]));
  const done = useRef(new Set<string>(["top"])), fired = useRef(false), cb = useRef(onAll);
  useEffect(() => { cb.current = onAll; });
  const [current, setCurrent] = useState<string>("top");
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = e.target.id;
          setCurrent(id);
          setSeen((s) => (s.has(id) ? s : new Set(s).add(id)));
          done.current.add(id);
          if (!fired.current && done.current.size === SECTIONS.length) { fired.current = true; cb.current(); }
        }
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const [id] of SECTIONS) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);
  return { seen, current };
}

/* Smooth scrolling for the whole page (Lenis): the wheel glides instead of stepping,
   and every #section link scrolls there instead of jumping, stopping just under the
   top bar. Off for reduced motion, where links jump as normal. */
let lenis: Lenis | null = null;
const BAR = 70;
function useSmoothScroll(reduce: boolean) {
  useEffect(() => {
    if (reduce) return;
    const l = new Lenis({ autoRaf: true, lerp: 0.1, allowNestedScroll: true });
    lenis = l;
    // any in-page link (#work, #contact...) glides instead of jumping
    const click = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const id = a?.getAttribute("href")?.slice(1);
      if (!id || !document.getElementById(id)) return;
      e.preventDefault();
      scrollToId(id);
      history.replaceState(null, "", "#" + id);
    };
    document.addEventListener("click", click, true);
    return () => { document.removeEventListener("click", click, true); l.destroy(); lenis = null; };
  }, [reduce]);
}
function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = id === "top" ? 0 : el.getBoundingClientRect().top + scrollY - BAR;
  if (lenis) lenis.scrollTo(y, { duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else scrollTo(0, y);
}

/* Things fade and rise into place as they scroll into view. Anything marked
   data-reveal takes part; --i on it staggers a group. The page shows everything
   if this never runs (see the failsafe in portfolio.css). */
function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("pf-js");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    const watch = () => document.querySelectorAll("[data-reveal]:not(.in)").forEach((el) => io.observe(el));
    watch();
    const mo = new MutationObserver(watch);   // cards added later (filters) join in too
    mo.observe(document.querySelector(".pf") ?? document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);
}

/* A thin bar under the header that fills as you read, and the back-to-top button. */
function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - innerHeight;
        setP(max > 0 ? Math.min(1, scrollY / max) : 0);
      });
    };
    on();
    addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => { removeEventListener("scroll", on); removeEventListener("resize", on); cancelAnimationFrame(raf); };
  }, []);
  return p;
}

export default function Portfolio() {
  const reduce = useReducedMotion();
  const [party, setParty] = useState(false);
  const { seen, current } = useVisited(() => {
    if (reduce) return;
    setParty(true);
    setTimeout(() => setParty(false), 2600);
  });
  const theme = useTheme();
  // the page behind the page (overscroll, the strip under the phone toolbar) follows the theme
  useEffect(() => {   // the page behind the page and the phone's browser bar follow the theme
    const d = document.documentElement; d.dataset.pfTheme = theme; d.style.background = THEME_BG[theme];
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_BG[theme]);
  }, [theme]);
  const [project, setProject] = useState<Project | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [live, setLive] = useState(false);   // the splash has gone: start the hero's entrance
  useSmoothScroll(reduce);
  useReveal();
  const progress = useScrollProgress();
  const [palette, setPalette] = useState(false);
  useEffect(() => {   // Ctrl/Cmd+K, or "/" when not typing, opens the quick search
    const key = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest?.("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey)) {
        if (document.querySelector("dialog[open]:not(.pf-pal-dlg)")) return;
        e.preventDefault(); setPalette((o) => !o);
      }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);
  const later = (f: () => void) => () => { setPalette(false); setTimeout(f, 60); };
  const commands: Cmd[] = [
    ...SECTIONS.map(([id, label]) => ({ group: "Go to", label: id === "top" ? "Top of the page" : label, hint: "section", run: later(() => scrollToId(id)) })),
    ...PROJECTS.map((p) => ({ group: "Projects", label: p.title, hint: p.kind + " · " + p.tech.join(" "), run: later(() => setProject(p)) })),
    ...GAMES.map((g) => ({ group: "Play", label: g.title, hint: g.tech + " · game", run: later(() => setGame(g)) })),
    { group: "Do", label: "Download my CV", hint: "resume pdf", run: later(() => { const a = document.createElement("a"); a.href = PROFILE.resume; a.download = ""; a.click(); }) },
    { group: "Do", label: "Copy my email", hint: PROFILE.email, run: later(() => { navigator.clipboard?.writeText(PROFILE.email).catch(() => { location.href = "mailto:" + PROFILE.email; }); }) },
    { group: "Do", label: "Open LinkedIn", hint: "profile", run: later(() => window.open(PROFILE.linkedin, "_blank", "noopener")) },
    { group: "Do", label: "Open GitHub", hint: "code", run: later(() => window.open(PROFILE.github, "_blank", "noopener")) },
    ...THEMES.filter((t) => t !== theme).map((t) => ({ group: "Do", label: `Switch to ${THEME_NAME[t]} colours`, hint: "theme dark light mode", run: later(() => themeStore.set(t)) })),
    { group: "Do", label: "Open the retro desktop", hint: "az-os easter egg", run: later(() => window.location.assign("/desktop")) },
  ];

  return (
    <div className={`pf theme-${theme}`}>
      <TopBar seen={seen} current={current} theme={theme} progress={progress} onSearch={() => setPalette(true)} />
      <Hero reduce={reduce} live={live} />
      <Stats />
      <Work onOpen={setProject} />
      <Experience />
      <Skills onProject={setProject} onGame={setGame} />
      <About theme={theme} />
      <Play onPlay={setGame} />
      <Contact />
      <footer className="pf-foot">
        <div className="pf-wrap pf-foot-in">
          <span>© {new Date().getFullYear()} {PROFILE.name} · Built with Next.js, deployed on Vercel</span>
          <a href="/desktop" className="pf-secret">Psst: there is a retro desktop version of this site →</a>
        </div>
      </footer>
      <CaseFile project={project} onClose={() => setProject(null)}
        onNav={(d) => setProject((cur) => cur && PROJECTS[(PROJECTS.indexOf(cur) + d + PROJECTS.length) % PROJECTS.length])} />
      <GameWindow game={game} onClose={() => setGame(null)} />
      <Palette open={palette} onClose={() => setPalette(false)} commands={commands} />
      {party && <Confetti />}
      <button type="button" className={"pf-top" + (progress > 0.12 ? " show" : "")} onClick={() => scrollToId("top")} aria-label="Back to top">
        <span aria-hidden="true">▲</span>
      </button>
      <Splash theme={theme} onDone={() => setLive(true)} />
    </div>
  );
}

/* --------------------------------------------------------------- the splash
   The 3D logo builds itself (a Blender render, played as an animated WebP), the
   name types in, then the screen breaks into pixels and the page shows. About two
   seconds; any click, key, scroll or tap skips it. It plays once per visit: a tiny
   script in layout.tsx hides it before the first paint for repeat views and for
   people who ask for reduced motion. Without JavaScript, CSS still removes it. */
const SPLASH_COLS = 12, SPLASH_ROWS = 8;
function Splash({ theme, onDone }: { theme: Theme; onDone: () => void }) {
  const [gone, setGone] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    try { sessionStorage.setItem("pf-splash", "1"); } catch {}
    const root = el.current;
    if (!root) return;
    if (getComputedStyle(root).display === "none") { const t = setTimeout(() => { setGone(true); done.current(); }, 0); return () => clearTimeout(t); }
    const leaving = setTimeout(() => done.current(), 1900);   // the hero comes in as the pixels go
    const skip = () => { root.classList.add("out"); clearTimeout(leaving); done.current(); };
    const end = (e: AnimationEvent) => { if (e.target === root) setGone(true); };
    root.addEventListener("animationend", end);
    root.addEventListener("click", skip);
    addEventListener("keydown", skip);
    addEventListener("wheel", skip, { passive: true });
    addEventListener("touchstart", skip, { passive: true });
    return () => {
      clearTimeout(leaving);
      root.removeEventListener("animationend", end);
      root.removeEventListener("click", skip);
      removeEventListener("keydown", skip);
      removeEventListener("wheel", skip);
      removeEventListener("touchstart", skip);
    };
  }, []);
  if (gone) return null;
  return (
    <div ref={el} className="pf-splash" aria-hidden="true">
      <div className="pf-splash-px">
        {Array.from({ length: SPLASH_COLS * SPLASH_ROWS }, (_, i) => (
          <i key={i} style={{ ["--d" as string]: `${((i * 53) % 97) / 97}` }} />
        ))}
      </div>
      <div className="pf-splash-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/splash-${art(theme)}.webp`} width={260} height={260} alt="" />
        <p className="pf-splash-name">{PROFILE.name}</p>
        <p className="pf-splash-sub">{PROFILE.role}</p>
      </div>
      <p className="pf-splash-skip">click or press any key to skip</p>
    </div>
  );
}

/* ------------------------------------------------------------------ top bar */
function TopBar({ seen, current, theme, progress, onSearch }: { seen: Set<string>; current: string; theme: Theme; progress: number; onSearch: () => void }) {
  const n = seen.size, all = n === SECTIONS.length;
  const [menu, setMenu] = useState(false);
  const bar = useRef<HTMLElement>(null);
  useEffect(() => {   // the phone menu closes on Esc or a tap outside it
    if (!menu) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(false); };
    const tap = (e: PointerEvent) => { if (!bar.current?.contains(e.target as Node)) setMenu(false); };
    addEventListener("keydown", key); addEventListener("pointerdown", tap);
    return () => { removeEventListener("keydown", key); removeEventListener("pointerdown", tap); };
  }, [menu]);
  return (
    <header className="pf-bar" ref={bar}>
      <div className="pf-wrap pf-bar-in">
        <a className="pf-brand" href="#top" aria-label={`${PROFILE.name}, back to top`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="pf-mark" src={`/logo-${art(theme)}.png`} alt="" width={40} height={40} />
          <span className="pf-brand-name">{PROFILE.name}</span>
        </a>
        <nav className="pf-nav" aria-label="Sections">
          {SECTIONS.slice(1).map(([id, label]) => (
            <a key={id} href={`#${id}`} aria-current={current === id ? "true" : undefined}>{label}</a>
          ))}
        </nav>
        <div className="pf-xp" title={all ? "You've seen everything. Thanks for reading!" : `Explored ${n} of ${SECTIONS.length} sections`}>
          <span className="pf-coins" aria-hidden="true">
            {SECTIONS.map(([id]) => <i key={id} className={seen.has(id) ? "on" : ""} />)}
          </span>
          <span className="pf-xp-label">{all ? "100%!" : `${Math.round((n / SECTIONS.length) * 100)}%`}</span>
        </div>
        <button type="button" className="pf-search" onClick={onSearch} title="Quick search (Ctrl/⌘ K or /)">
          <span aria-hidden="true">⌕</span><span className="pf-search-l">Search</span><kbd>/</kbd>
        </button>
        <button type="button" className="pf-theme" onClick={() => themeStore.set(nextTheme(theme))}
          title={`Colours: ${THEME_NAME[theme]}. Switch to ${THEME_NAME[nextTheme(theme)]}`}
          aria-label={`Colour theme: ${THEME_NAME[theme]}. Switch to ${THEME_NAME[nextTheme(theme)]}`}><i /></button>
        <a className="pf-btn pf-btn-ink small" href={PROFILE.resume} download>CV ↓</a>
        <button type="button" className="pf-menu-btn" aria-expanded={menu} aria-controls="pf-menu" onClick={() => setMenu((m) => !m)}>
          <span aria-hidden="true" className={menu ? "x" : ""}><i /><i /><i /></span><span className="pf-sr">Sections menu</span>
        </button>
      </div>
      <i className="pf-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <nav id="pf-menu" className={"pf-menu" + (menu ? " open" : "")} aria-label="Sections" hidden={!menu}>
        {SECTIONS.slice(1).map(([id, label], i) => (
          <a key={id} href={`#${id}`} onClick={() => setMenu(false)} aria-current={current === id ? "true" : undefined}>
            <span className="pf-num">{String(i + 1).padStart(2, "0")}</span>{label}{seen.has(id) && <em aria-label="seen">✓</em>}
          </a>
        ))}
        <button type="button" className="pf-menu-search" onClick={() => { setMenu(false); onSearch(); }}><span className="pf-num">⌕</span>Search everything</button>
      </nav>
    </header>
  );
}

/* --------------------------------------------------------------------- hero */
function Hero({ reduce, live }: { reduce: boolean; live: boolean }) {
  const floaters = useRef<HTMLDivElement>(null);
  useEffect(() => {   // a few pixel shapes drift with the mouse and the scroll
    if (reduce) return;
    const el = floaters.current;
    if (!el) return;
    let mx = 0, my = 0, raf = 0;
    const set = () => { raf = 0; el.style.setProperty("--mx", mx.toFixed(3)); el.style.setProperty("--my", my.toFixed(3)); el.style.setProperty("--sy", String(Math.min(scrollY, 900))); };
    const move = (e: PointerEvent) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; if (!raf) raf = requestAnimationFrame(set); };
    const scroll = () => { if (!raf) raf = requestAnimationFrame(set); };
    addEventListener("pointermove", move, { passive: true });
    addEventListener("scroll", scroll, { passive: true });
    return () => { removeEventListener("pointermove", move); removeEventListener("scroll", scroll); cancelAnimationFrame(raf); };
  }, [reduce]);
  return (
    <section id="top" className={"pf-hero" + (live ? " live" : "")}>
      <div className="pf-floaters" ref={floaters} aria-hidden="true">
        {[["sq", 8, 18, .9], ["plus", 46, 10, .5], ["sq", 90, 26, 1.3], ["dot", 70, 78, .7], ["plus", 14, 82, 1.1], ["sq", 56, 64, .4], ["dot", 34, 40, 1.6]].map(([k, x, y, d], i) => (
          <i key={i} className={"f-" + k} style={{ left: x + "%", top: y + "%", ["--d" as string]: d }} />
        ))}
      </div>
      <div className="pf-wrap pf-hero-in">
        <div className="pf-hero-copy" data-hero>
          <p className="pf-kicker">{PROFILE.name} · {PROFILE.role} · {PROFILE.location.split(",")[0]}</p>
          <h1>Hi, I&rsquo;m {PROFILE.nickname}.<span className="pf-cursor" aria-hidden="true" /></h1>
          <p className="pf-lede">{PROFILE.intro}</p>
          {PROFILE.availability && <p className="pf-avail"><i aria-hidden="true" />{PROFILE.availability}</p>}
          <div className="pf-ctas">
            <a className="pf-btn pf-btn-tomato" href={PROFILE.resume} download>Download CV</a>
            <a className="pf-btn" href="#work">See my work</a>
            <CopyEmail className="pf-btn" />
          </div>
          <p className="pf-links">
            <a href={PROFILE.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
            <a href={PROFILE.github} target="_blank" rel="noopener">GitHub ↗</a>
          </p>
        </div>
        <div className="pf-hero-side" data-hero>
          <PixelPortrait reduce={reduce} live={live} />
          <div className="pf-win pf-facts">
            <div className="pf-win-bar"><i /><i /><i /><span>quick-facts.txt</span></div>
            <dl className="pf-facts-list">
              {QUICK_FACTS.map((f, i) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd><TypeIn text={f.value} delay={500 + i * 380} reduce={reduce} live={live} /></dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

/* A line that types itself in. The whole text is always there for screen readers. */
function TypeIn({ text, delay, reduce, live }: { text: string; delay: number; reduce: boolean; live: boolean }) {
  const [typed, setN] = useState(0);
  const n = reduce ? text.length : typed;
  useEffect(() => {
    if (reduce || !live) return;
    let i = 0, t: ReturnType<typeof setTimeout>;
    const step = () => { i += 2; setN(Math.min(i, text.length)); if (i < text.length) t = setTimeout(step, 14); };
    t = setTimeout(step, delay);
    return () => clearTimeout(t);
  }, [text, delay, reduce, live]);
  return (
    <>
      <span className="pf-sr">{text}</span>
      <span aria-hidden="true">{text.slice(0, n)}{n < text.length && <b className="pf-caret" />}</span>
    </>
  );
}

/* The photo starts as chunky pixels and sharpens; hovering it pixelates it again. */
function PixelPortrait({ reduce, live }: { reduce: boolean; live: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const block = useRef(28), target = useRef(28), raf = useRef(0);

  const paint = useCallback(() => {
    const c = cv.current, im = img.current;
    if (!c || !im) return;
    const ctx = c.getContext("2d")!;
    const W = c.width, H = c.height, b = Math.max(1, Math.round(block.current));
    // cover-crop the photo into the square
    const s = Math.max(W / im.naturalWidth, H / im.naturalHeight), sw = W / s, sh = H / s;
    const sx = (im.naturalWidth - sw) / 2, sy = (im.naturalHeight - sh) * 0.2;
    if (b <= 1) { ctx.imageSmoothingEnabled = true; ctx.drawImage(im, sx, sy, sw, sh, 0, 0, W, H); return; }
    const w = Math.ceil(W / b), h = Math.ceil(H / b);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(c, 0, 0, w, h, 0, 0, W, H);
  }, []);

  const animate = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const tick = () => {
      const d = target.current - block.current;
      block.current += d * 0.14;
      if (Math.abs(d) < 0.3) block.current = target.current;
      paint();
      if (block.current !== target.current) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  }, [paint]);

  useEffect(() => {
    const im = new Image();
    im.src = PROFILE.photo;
    im.onload = () => {
      img.current = im;
      if (reduce) block.current = 1;
      paint();
    };
    return () => cancelAnimationFrame(raf.current);
  }, [reduce, paint]);
  useEffect(() => {   // sharpen once the splash has gone
    if (reduce || !live) return;
    const t = setTimeout(() => { target.current = 1; animate(); }, 450);
    return () => clearTimeout(t);
  }, [live, reduce, animate]);

  const to = (b: number) => { if (reduce) return; target.current = b; animate(); };
  return (
    <div className="pf-portrait" onPointerEnter={() => to(12)} onPointerLeave={() => to(1)}>
      <canvas ref={cv} width={560} height={560} role="img" aria-label={`Photo of ${PROFILE.name}`} />
      <span className="pf-sticker">hover me</span>
    </div>
  );
}

function CopyEmail({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className={className}
      onClick={() => {
        navigator.clipboard?.writeText(PROFILE.email).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); }).catch(() => { location.href = "mailto:" + PROFILE.email; });
      }}>
      {copied ? "Email copied ✓" : "Copy my email"}
    </button>
  );
}

/* -------------------------------------------------------------------- stats
   Four numbers that count up the first time they come into view. */
function Stats() {
  return (
    <section className="pf-stats" aria-label="At a glance">
      <div className="pf-wrap pf-stats-in">
        {STATS.map((st, i) => (
          <div key={st.label} className="pf-stat" data-reveal style={{ ["--i" as string]: i }}>
            <b><CountUp to={st.value} />{st.suffix}</b>
            <span className="pf-stat-label">{st.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
function CountUp({ to }: { to: number }) {
  const el = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now(), dur = 1100;
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 3);
        node.textContent = String(Math.round(to * ease));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      node.textContent = "0";
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    io.observe(node);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to]);
  return <span ref={el}>{to}</span>;
}

/* --------------------------------------------------------------------- work */
const FILTERS = [["all", "All"], ["work", "Built at work"], ["study", "Study & internship"]] as const;

function Work({ onOpen }: { onOpen: (p: Project) => void }) {
  const [f, setF] = useState<(typeof FILTERS)[number][0]>("all");
  const list = PROJECTS.filter((p) => f === "all" || p.area === f);
  return (
    <section id="work" className="pf-sec">
      <div className="pf-wrap">
        <SecHead n="01" title="Things I've built" sub="Click a card for the problem, what I did and how it turned out." />
        <div className="pf-filters" role="group" aria-label="Filter projects" data-reveal>
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={f === id} onClick={() => setF(id)}>
              {label} <small>{id === "all" ? PROJECTS.length : PROJECTS.filter((p) => p.area === id).length}</small>
            </button>
          ))}
        </div>
        <div className="pf-cards">
          {list.map((p, i) => <Card key={p.slug} p={p} i={i} onOpen={() => onOpen(p)} />)}
        </div>
      </div>
    </section>
  );
}

function Card({ p, i, onOpen }: { p: Project; i: number; onOpen: () => void }) {
  const el = useRef<HTMLButtonElement>(null);
  const tilt = (e: React.PointerEvent) => {
    const r = el.current!.getBoundingClientRect();
    el.current!.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -5}deg`);
    el.current!.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
  };
  const flat = () => { el.current!.style.setProperty("--rx", "0deg"); el.current!.style.setProperty("--ry", "0deg"); };
  return (
    <button ref={el} type="button" className="pf-card" data-reveal style={{ ["--i" as string]: i % 3 }} onClick={onOpen} onPointerMove={tilt} onPointerLeave={flat}>
      <span className="pf-card-top" style={{ background: `var(--t${PROJECTS.indexOf(p) % 4})` }}>
        {p.images?.length ? <img src={"/" + p.images[0]} alt="" loading="lazy" decoding="async" className={p.imageShape === "phone" ? "pf-phone" : ""} /> : <Scene icon={p.icon} />}
        <span className="pf-kind">{p.kind}</span>
      </span>
      <span className="pf-card-body">
        <b>{p.title}</b>
        <span>{p.blurb}</span>
        <span className="pf-tags">{p.tech.slice(0, 4).map((t) => <i key={t}>{t}</i>)}</span>
        <span className="pf-open">Open case file →</span>
      </span>
    </button>
  );
}

/* Little animated scenes of what each internal tool does, for the projects that have
   no screenshots. Drawn, not captured: nothing here is real data. Any other icon
   falls back to the pixel icon. */
function Scene({ icon }: { icon: Project["icon"] }) {
  if (icon === "tower") {
    const rows = [["68%", "Supply of laptops"], ["52%", "Network upgrade"], ["74%", "Cloud backup"], ["46%", "CCTV system"], ["60%", "Software licences"], ["40%", "Data centre"]];
    return (
      <span className="sc sc-tender" aria-hidden="true">
        <span className="sc-win"><b>tenders · today<em>NEW 3</em></b>
          <span className="sc-rows"><span className="sc-roll">
            {[...rows, ...rows].map(([w, t], i) => <span key={i} className="sc-row"><i />{t}<s style={{ width: w }} /></span>)}
          </span></span>
        </span>
      </span>
    );
  }
  if (icon === "chat") {
    return (
      <span className="sc sc-chat" aria-hidden="true">
        <span className="sc-phone">
          <span className="sc-b in" style={{ ["--k" as string]: 0 }}>Ada pakej untuk syarikat kecil?</span>
          <span className="sc-b out" style={{ ["--k" as string]: 1 }}>Ada! Team kami akan follow up dengan butiran 👋</span>
          <span className="sc-b in" style={{ ["--k" as string]: 2 }}>Ok terima kasih</span>
          <span className="sc-typing" style={{ ["--k" as string]: 3 }}><i /><i /><i /></span>
        </span>
      </span>
    );
  }
  if (icon === "door") {
    return (
      <span className="sc sc-portal" aria-hidden="true">
        <span className="sc-card"><b>Sign in · workspaces</b>
          <span className="sc-grid">{["Mfinity", "Ikhlas", "Mlabs", "Swapp"].map((n, i) => <span key={n} style={{ ["--k" as string]: i }}>{n}</span>)}</span>
        </span>
        <span className="sc-cursor" />
      </span>
    );
  }
  if (icon === "post") {
    return (
      <span className="sc sc-post" aria-hidden="true">
        {["IG", "FB", "TT", "TH"].map((n, i) => <span key={n} className="sc-p" style={{ ["--k" as string]: i }}>{n}<i /><i /></span>)}
        <span className="sc-idea">💡 one idea</span>
      </span>
    );
  }
  return <PixelIcon name={icon} size={64} />;
}

/* A native <dialog>: Esc closes it, focus stays inside, the page behind is inert. */
function Modal({ open, onClose, label, wide, cls, children }: { open: boolean; onClose: () => void; label: string; wide?: boolean; cls?: string; children: React.ReactNode }) {
  const d = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = d.current!;
    if (open && !el.open) { el.showModal(); lenis?.stop(); }
    if (!open && el.open) el.close();
    if (!open) lenis?.start();
  }, [open]);
  return (
    <dialog ref={d} data-lenis-prevent className={"pf-modal" + (wide ? " wide" : "") + (cls ? " " + cls : "")} aria-label={label} onClose={onClose}
      onClick={(e) => { if (e.target === d.current) onClose(); }}>
      {open && children}
    </dialog>
  );
}

function CaseFile({ project: p, onClose, onNav }: { project: Project | null; onClose: () => void; onNav: (d: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const nav = useRef(onNav);
  useEffect(() => { nav.current = onNav; });
  useEffect(() => { box.current?.scrollTo(0, 0); }, [p]);   // each project opens at its top
  const open = !!p;
  useEffect(() => {   // ← and → step through the projects
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "ArrowRight") nav.current(1); if (e.key === "ArrowLeft") nav.current(-1); };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, [open]);
  const n = p ? PROJECTS.indexOf(p) : 0;
  return (
    <Modal open={!!p} onClose={onClose} label={p ? p.title : "Project"}>
      {p && (
        <div className="pf-win">
          <div className="pf-win-bar"><i /><i /><i /><span>{p.slug}.txt</span>
            <button type="button" className="pf-x" onClick={onClose} aria-label="Close">✕</button></div>
          <div className="pf-case" ref={box}>
            <p className="pf-kicker">{p.kind} · {n + 1} of {PROJECTS.length}</p>
            <h3>{p.title}</h3>
            <p className="pf-case-blurb">{p.blurb}</p>
            {p.badges && <p className="pf-tags">{p.badges.map((b) => <i key={b} className="hl">{b}</i>)}</p>}
            {p.images && (
              <div className={"pf-shots " + (p.imageShape === "phone" ? "pf-phone" : "pf-wide")}>
                {p.images.map((src) => <img key={src} src={"/" + src} alt={`${p.title} screenshot`} loading="lazy" />)}
              </div>
            )}
            <div className="pf-notes">
              {p.notes.map((n) => <div key={n.title}><b>{n.title}</b><p>{n.body}</p></div>)}
            </div>
            {p.caseStudy && (
              <details className="pf-more">
                <summary>More detail</summary>
                <div className="pf-notes">{p.caseStudy.map((n) => <div key={n.title}><b>{n.title}</b><p>{n.body}</p></div>)}</div>
              </details>
            )}
            <p className="pf-tags">{p.tech.map((t) => <i key={t}>{t}</i>)}</p>
            {p.links && <p className="pf-links">{p.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noopener">{l.label} ↗</a>)}</p>}
            <div className="pf-case-nav">
              <button type="button" className="pf-btn small" onClick={() => onNav(-1)}>← {PROJECTS[(n - 1 + PROJECTS.length) % PROJECTS.length].title}</button>
              <span className="pf-case-hint">← → keys work too</span>
              <button type="button" className="pf-btn small" onClick={() => onNav(1)}>{PROJECTS[(n + 1) % PROJECTS.length].title} →</button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* --------------------------------------------------------------- experience */
/* The timeline: a dashed track through the centre of every marker, a solid line that
   fills down it as you scroll (to the middle of the screen), and each marker lights up
   as the line reaches it. The first entry, the current job, pulses. */
function useTimeline() {
  const ol = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = ol.current;
    if (!list) return;
    const items = [...list.querySelectorAll<HTMLElement>(":scope > li")];
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let top = 0, len = 0, raf = 0;
    const measure = () => {   // from the first marker's centre to the last one's
      const r = list.getBoundingClientRect();
      const c = items.map((li) => li.getBoundingClientRect().top - r.top + 13);
      top = c[0]; len = c[c.length - 1] - c[0];
      list.style.setProperty("--t0", top + "px");
      list.style.setProperty("--len", len + "px");
      update();
    };
    const update = () => {
      raf = 0;
      const r = list.getBoundingClientRect(), at = innerHeight * 0.55 - r.top - top;
      const p = still ? 1 : Math.min(1, Math.max(0, at / Math.max(1, len)));
      list.style.setProperty("--p", p.toFixed(4));
      items.forEach((li, i) => li.classList.toggle("lit", still || at >= (i === 0 ? 0 : li.offsetTop + 13 - top) - 1));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(list);
    addEventListener("scroll", on, { passive: true });
    return () => { ro.disconnect(); removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);
  return ol;
}

function Experience() {
  const tl = useTimeline();
  return (
    <section id="experience" className="pf-sec pf-alt">
      <div className="pf-wrap">
        <SecHead n="02" title="Experience & education" />
        <div className="pf-two">
          <ol className="pf-timeline" ref={tl}>
            {EXPERIENCE.map((j, i) => (
              <li key={j.org + j.role} data-reveal className={i === 0 ? "now" : undefined}>
                <p className="pf-when">{j.when} · {j.place}</p>
                <h3>{j.role}</h3>
                <p className="pf-org">{j.org}</p>
                <ul>{j.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                {j.tech && <p className="pf-tags">{j.tech.map((t) => <i key={t}>{t}</i>)}</p>}
              </li>
            ))}
          </ol>
          <div className="pf-edu">
            {EDUCATION.map((e) => (
              <div key={e.school} className="pf-win pf-edu-card" data-reveal>
                <div className="pf-win-bar"><i /><i /><i /><span>{e.when}</span></div>
                <div className="pf-edu-body"><b>{e.school}</b><span>{e.what}</span><small>{e.detail}</small></div>
              </div>
            ))}
            <div className="pf-win pf-edu-card" data-reveal>
              <div className="pf-win-bar sun"><i /><i /><i /><span>achievements.txt</span></div>
              <ul className="pf-awards">{AWARDS.map((a) => <li key={a}>{a}</li>)}</ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- skills */
/* Where each skill was used: a skill matches a project, job or game when their tech
   lists name it ("LLM APIs" matches "LLM API", "Cron jobs" matches "Cron"). */
type Use = { label: string; run: () => void };
const norm = (t: string) => t.toLowerCase().replace(/[^a-z0-9+#]/g, "");
const matches = (skill: string, tech: string) => { const a = norm(skill), b = norm(tech); return !!b && (a === b || (b.length >= 4 && a.startsWith(b))); };
function Skills({ onProject, onGame }: { onProject: (p: Project) => void; onGame: (g: Game) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!(e.target as Element).closest?.(".pf-slot-wrap")) setOpen(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    addEventListener("pointerdown", away); addEventListener("keydown", esc);
    return () => { removeEventListener("pointerdown", away); removeEventListener("keydown", esc); };
  }, [open]);
  const usesOf = (skill: string): Use[] => [
    ...PROJECTS.filter((p) => p.tech.some((t) => matches(skill, t))).map((p) => ({ label: p.title, run: () => { setOpen(null); onProject(p); } })),
    ...EXPERIENCE.filter((j) => j.tech?.some((t) => matches(skill, t))).map((j) => ({ label: j.org.split(" (")[0], run: () => { setOpen(null); scrollToId("experience"); } })),
    ...GAMES.filter((g) => g.tech.split("·").some((t) => matches(skill, t))).map((g) => ({ label: g.title, run: () => { setOpen(null); onGame(g); } })),
  ];
  return (
    <section id="skills" className="pf-sec">
      <div className="pf-wrap">
        <SecHead n="03" title="Skills" sub="What I use, grouped the way a job ad lists them. Tap a skill with a dot to see where I used it." />
        <div className="pf-skills" ref={box}>
          {SKILLS.map((g, i) => (
            <div key={g.group} className="pf-skill" data-reveal style={{ ["--i" as string]: i % 3 }}>
              <b>{g.group}</b>
              <div className="pf-slots">{g.items.map((sk) => {
                const uses = usesOf(sk);
                if (!uses.length) return <span key={sk}>{sk}</span>;
                const on = open === sk;
                return (
                  <span key={sk} className={"pf-slot-wrap" + (on ? " on" : "")}>
                    <button type="button" className="pf-slot" aria-expanded={on} onClick={() => setOpen(on ? null : sk)}>{sk}<i aria-hidden="true" /></button>
                    {on && (
                      <span className="pf-uses" role="group" aria-label={`Where I used ${sk}`}>
                        <small>Used in</small>
                        {uses.map((u) => <button key={u.label} type="button" onClick={u.run}>{u.label} →</button>)}
                      </span>
                    )}
                  </span>
                );
              })}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- how I work */
function About({ theme }: { theme: Theme }) {
  return (
    <section id="about" className="pf-sec pf-alt pf-about">
      <div className="pf-wrap pf-about-in">
        <div className="pf-about-copy">
          <SecHead n="04" title="How I work" />
          {ABOUT.paragraphs.map((t, i) => <p key={i} className="pf-about-p" data-reveal style={{ ["--i" as string]: i }}>{t}</p>)}
          <ul className="pf-principles" data-reveal style={{ ["--i" as string]: 2 }}>
            {ABOUT.principles.map((t, i) => <li key={t}><span className="pf-num">{String(i + 1).padStart(2, "0")}</span>{t}</li>)}
          </ul>
        </div>
        <div data-reveal style={{ ["--i" as string]: 1 }}><LogoToy theme={theme} /></div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- play */
function Play({ onPlay }: { onPlay: (g: Game) => void }) {
  return (
    <section id="play" className="pf-sec pf-play">
      <div className="pf-wrap">
        <SecHead n="05" title="After hours: games and 3D sites" sub="I make browser games and 3D sites in my own time, as Z Lab. Pick one; it opens right here." light />
        <div className="pf-games">
          {GAMES.map((g, i) => (
            <button key={g.slug} type="button" className={"pf-game" + (i === 0 ? " feat" : "")} data-reveal style={{ ["--i" as string]: i % 4 }} onClick={() => onPlay(g)}>
              <img src={"/" + g.thumb} alt="" loading="lazy" />
              <span><b>{g.title}</b><small>{g.line}</small><em>{g.tech}</em></span>
              <span className="pf-play-btn" aria-hidden="true">▶ Play</span>
              {i === 0 && <span className="pf-new" aria-hidden="true">New</span>}
            </button>
          ))}
        </div>
        <p className="pf-links light"><a href={ZLAB_URL} target="_blank" rel="noopener">Every Z Lab experiment ↗</a></p>
      </div>
    </section>
  );
}

function GameWindow({ game, onClose }: { game: Game | null; onClose: () => void }) {
  const url = game ? `${ZLAB_URL}${game.slug}/` : "";
  return (
    <Modal open={!!game} onClose={onClose} label={game ? `Play ${game.title}` : "Game"} wide>
      {game && (
        <div className="pf-win pf-gamewin">
          <div className="pf-win-bar cobalt"><i /><i /><i /><span>{game.title} · Z Lab</span>
            <a href={url} target="_blank" rel="noopener" className="pf-full">Full screen ↗</a>
            <button type="button" className="pf-x" onClick={onClose} aria-label="Close">✕</button></div>
          <iframe src={url} title={game.title} allow="autoplay; fullscreen; gamepad" />
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------ quick search
   Ctrl/Cmd+K or "/": type to jump to a section, open a project or game, or grab the CV. */
type Cmd = { group: string; label: string; hint: string; run: () => void };
function Palette({ open, onClose, commands }: { open: boolean; onClose: () => void; commands: Cmd[] }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = commands.filter((c) => { const h = (c.label + " " + c.hint + " " + c.group).toLowerCase(); return words.every((w) => h.includes(w)); });
  useEffect(() => { if (open) setTimeout(() => input.current?.focus(), 30); }, [open]);
  useEffect(() => { list.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" }); }, [sel]);
  const close = () => { setQ(""); setSel(0); onClose(); };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(shown.length - 1, s + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    if (e.key === "Enter" && shown[sel]) { e.preventDefault(); const c = shown[sel]; setQ(""); setSel(0); c.run(); }
  };
  return (
    <Modal open={open} onClose={close} label="Quick search" cls="pf-pal-dlg">
      <div className="pf-win pf-pal">
        <div className="pf-win-bar"><i /><i /><i /><span>search.exe</span><button type="button" className="pf-x" onClick={close} aria-label="Close">✕</button></div>
        <label className="pf-pal-in"><span aria-hidden="true">⌕</span>
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={key} placeholder="Type a section, project, game or 'cv'…"
            aria-label="Search" role="combobox" aria-expanded="true" aria-controls="pf-pal-list" aria-activedescendant={shown[sel] ? `pal-${sel}` : undefined} />
        </label>
        <ul className="pf-pal-list" id="pf-pal-list" role="listbox" ref={list}>
          {shown.map((c, i) => (
            <li key={c.group + c.label} id={`pal-${i}`} role="option" aria-selected={i === sel} onMouseMove={() => setSel(i)} onClick={() => { setQ(""); setSel(0); c.run(); }}>
              {(i === 0 || shown[i - 1].group !== c.group) && <small className="pf-pal-g">{c.group}</small>}
              <span className="pf-pal-row"><b>{c.label}</b><em>{c.group === "Projects" || c.group === "Play" ? c.hint.split(" · ")[0] : c.group === "Go to" ? "section" : ""}</em><kbd>↵</kbd></span>
            </li>
          ))}
          {!shown.length && <li className="pf-pal-none">Nothing matches &ldquo;{q}&rdquo;. Try &ldquo;cv&rdquo;, &ldquo;email&rdquo; or a project name.</li>}
        </ul>
        <p className="pf-pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></p>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ contact */
function Contact() {
  return (
    <section id="contact" className="pf-sec">
      <div className="pf-wrap">
        <div className="pf-win pf-contact" data-reveal>
          <div className="pf-win-bar tomato"><i /><i /><i /><span>say-hi.txt</span></div>
          <div className="pf-contact-in">
            <div>
              <h2>Let&rsquo;s talk.</h2>
              <p>The quickest way to reach me is email. I usually reply within a day.</p>
              <LocalTime />
              <p className="pf-email">{PROFILE.email}</p>
            </div>
            <div className="pf-contact-btns">
              <CopyEmail className="pf-btn pf-btn-tomato" />
              <a className="pf-btn" href={PROFILE.resume} download>Download CV</a>
              <a className="pf-btn" href={PROFILE.linkedin} target="_blank" rel="noopener">LinkedIn ↗</a>
              <a className="pf-btn" href={PROFILE.github} target="_blank" rel="noopener">GitHub ↗</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* "It's 4:32 pm in Petaling Jaya", ticking, for people writing from another time zone. */
function LocalTime() {
  const [now, setNow] = useState("");
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-MY", { timeZone: "Asia/Kuala_Lumpur", hour: "numeric", minute: "2-digit", weekday: "short" });
    const tick = () => setNow(fmt.format(new Date()));
    const first = setTimeout(tick, 0), t = setInterval(tick, 20000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, []);
  return <p className="pf-clock" aria-live="off"><i aria-hidden="true" />{now ? `It's ${now} in Petaling Jaya (GMT+8)` : "Petaling Jaya, GMT+8"}</p>;
}

function SecHead({ n, title, sub, light }: { n: string; title: string; sub?: string; light?: boolean }) {
  return (
    <div className={"pf-head" + (light ? " light" : "")} data-reveal>
      <span className="pf-num">{n}</span>
      <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
    </div>
  );
}

/* Pixel confetti, once, when every section has been seen. */
function Confetti() {
  const colors = ["var(--tomato)", "var(--sun)", "var(--pop)", "var(--t1)", "var(--t2)"];
  return (
    <div className="pf-confetti" aria-hidden="true">
      {Array.from({ length: 48 }, (_, i) => (
        <i key={i} style={{
          left: `${(i * 37) % 100}%`, background: colors[i % colors.length],
          animationDelay: `${(i % 12) * 60}ms`, animationDuration: `${1600 + ((i * 53) % 900)}ms`,
          ["--dx" as string]: `${((i * 29) % 80) - 40}px`,
        }} />
      ))}
      <p>You read the whole thing. Thank you! ★</p>
    </div>
  );
}
