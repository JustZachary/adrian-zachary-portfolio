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
import { PROFILE, QUICK_FACTS, EXPERIENCE, EDUCATION, AWARDS, SKILLS } from "../data/profile";
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

/* The colour theme, remembered per visitor. A tiny store so the server render and the
   first client render agree, and every reader updates together when it changes. */
type Theme = "sunset" | "holo";
const themeListeners = new Set<() => void>();
const themeStore = {
  get(): Theme {
    try { const t = localStorage.getItem("pf-theme"); if (t === "sunset" || t === "holo") return t; } catch {}
    return PROFILE.theme;
  },
  set(t: Theme) { try { localStorage.setItem("pf-theme", t); } catch {} themeListeners.forEach((l) => l()); },
  sub(l: () => void) { themeListeners.add(l); return () => { themeListeners.delete(l); }; },
};
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
  useEffect(() => { document.documentElement.style.background = theme === "holo" ? "#FBF9FF" : "#FFF4EA"; }, [theme]);
  const [project, setProject] = useState<Project | null>(null);
  const [game, setGame] = useState<Game | null>(null);

  return (
    <div className={`pf theme-${theme}`}>
      <TopBar seen={seen} current={current} theme={theme} />
      <Hero reduce={reduce} />
      <Work onOpen={setProject} />
      <Experience />
      <Skills />
      <Play onPlay={setGame} />
      <Contact />
      <footer className="pf-foot">
        <div className="pf-wrap pf-foot-in">
          <span>© {new Date().getFullYear()} {PROFILE.name} · Built with Next.js, deployed on Vercel</span>
          <a href="/desktop" className="pf-secret">Psst: there is a retro desktop version of this site →</a>
        </div>
      </footer>
      <CaseFile project={project} onClose={() => setProject(null)} />
      <GameWindow game={game} onClose={() => setGame(null)} />
      {party && <Confetti />}
      <Splash theme={theme} />
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
function Splash({ theme }: { theme: Theme }) {
  const [gone, setGone] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try { sessionStorage.setItem("pf-splash", "1"); } catch {}
    const root = el.current;
    if (!root) return;
    if (getComputedStyle(root).display === "none") { const t = setTimeout(() => setGone(true), 0); return () => clearTimeout(t); }
    const skip = () => root.classList.add("out");
    const end = (e: AnimationEvent) => { if (e.target === root) setGone(true); };
    root.addEventListener("animationend", end);
    root.addEventListener("click", skip);
    addEventListener("keydown", skip);
    addEventListener("wheel", skip, { passive: true });
    addEventListener("touchstart", skip, { passive: true });
    return () => {
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
        <img src={`/splash-${theme}.webp`} width={260} height={260} alt="" />
        <p className="pf-splash-name">{PROFILE.name}</p>
        <p className="pf-splash-sub">{PROFILE.role}</p>
      </div>
      <p className="pf-splash-skip">click or press any key to skip</p>
    </div>
  );
}

/* ------------------------------------------------------------------ top bar */
function TopBar({ seen, current, theme }: { seen: Set<string>; current: string; theme: Theme }) {
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
          <img className="pf-mark" src={`/logo-${theme}.png`} alt="" width={40} height={40} />
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
        <button type="button" className="pf-theme" onClick={() => themeStore.set(theme === "sunset" ? "holo" : "sunset")}
          title={theme === "sunset" ? "Switch to the holo pastel colours" : "Switch to the sunset colours"}
          aria-label={`Colour theme: ${theme}. Switch theme`}><i /></button>
        <a className="pf-btn pf-btn-ink small" href={PROFILE.resume} download>CV ↓</a>
        <button type="button" className="pf-menu-btn" aria-expanded={menu} aria-controls="pf-menu" onClick={() => setMenu((m) => !m)}>
          <span aria-hidden="true" className={menu ? "x" : ""}><i /><i /><i /></span><span className="pf-sr">Sections menu</span>
        </button>
      </div>
      <nav id="pf-menu" className={"pf-menu" + (menu ? " open" : "")} aria-label="Sections" hidden={!menu}>
        {SECTIONS.slice(1).map(([id, label], i) => (
          <a key={id} href={`#${id}`} onClick={() => setMenu(false)} aria-current={current === id ? "true" : undefined}>
            <span className="pf-num">{String(i + 1).padStart(2, "0")}</span>{label}{seen.has(id) && <em aria-label="seen">✓</em>}
          </a>
        ))}
      </nav>
    </header>
  );
}

/* --------------------------------------------------------------------- hero */
function Hero({ reduce }: { reduce: boolean }) {
  return (
    <section id="top" className="pf-hero">
      <div className="pf-wrap pf-hero-in">
        <div className="pf-hero-copy">
          <p className="pf-kicker">{PROFILE.role} · {PROFILE.location}</p>
          <h1>Hi, I&rsquo;m {PROFILE.name.split(" ")[0]}.<span className="pf-cursor" aria-hidden="true" /></h1>
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
        <div className="pf-hero-side">
          <PixelPortrait reduce={reduce} />
          <div className="pf-win pf-facts">
            <div className="pf-win-bar"><i /><i /><i /><span>quick-facts.txt</span></div>
            <dl className="pf-facts-list">
              {QUICK_FACTS.map((f, i) => (
                <div key={f.label}>
                  <dt>{f.label}</dt>
                  <dd><TypeIn text={f.value} delay={reduce ? 0 : 500 + i * 380} reduce={reduce} /></dd>
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
function TypeIn({ text, delay, reduce }: { text: string; delay: number; reduce: boolean }) {
  const [typed, setN] = useState(0);
  const n = reduce ? text.length : typed;
  useEffect(() => {
    if (reduce) return;
    let i = 0, t: ReturnType<typeof setTimeout>;
    const step = () => { i += 2; setN(Math.min(i, text.length)); if (i < text.length) t = setTimeout(step, 14); };
    t = setTimeout(step, delay);
    return () => clearTimeout(t);
  }, [text, delay, reduce]);
  return (
    <>
      <span className="pf-sr">{text}</span>
      <span aria-hidden="true">{text.slice(0, n)}{n < text.length && <b className="pf-caret" />}</span>
    </>
  );
}

/* The photo starts as chunky pixels and sharpens; hovering it pixelates it again. */
function PixelPortrait({ reduce }: { reduce: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement | null>(null);
  const block = useRef(28), target = useRef(1), raf = useRef(0);

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
      if (reduce) { block.current = 1; paint(); return; }
      paint();
      setTimeout(() => { target.current = 1; animate(); }, 650);
    };
    return () => cancelAnimationFrame(raf.current);
  }, [reduce, paint, animate]);

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

/* --------------------------------------------------------------------- work */
const FILTERS = [["all", "All"], ["work", "Built at work"], ["study", "Study & internship"]] as const;

function Work({ onOpen }: { onOpen: (p: Project) => void }) {
  const [f, setF] = useState<(typeof FILTERS)[number][0]>("all");
  const list = PROJECTS.filter((p) => f === "all" || p.area === f);
  return (
    <section id="work" className="pf-sec">
      <div className="pf-wrap">
        <SecHead n="01" title="Things I've built" sub="Click a card for the problem, what I did and how it turned out." />
        <div className="pf-filters" role="group" aria-label="Filter projects">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={f === id} onClick={() => setF(id)}>
              {label} <small>{id === "all" ? PROJECTS.length : PROJECTS.filter((p) => p.area === id).length}</small>
            </button>
          ))}
        </div>
        <div className="pf-cards">
          {list.map((p) => <Card key={p.slug} p={p} onOpen={() => onOpen(p)} />)}
        </div>
      </div>
    </section>
  );
}

function Card({ p, onOpen }: { p: Project; onOpen: () => void }) {
  const el = useRef<HTMLButtonElement>(null);
  const tilt = (e: React.PointerEvent) => {
    const r = el.current!.getBoundingClientRect();
    el.current!.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -5}deg`);
    el.current!.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 6}deg`);
  };
  const flat = () => { el.current!.style.setProperty("--rx", "0deg"); el.current!.style.setProperty("--ry", "0deg"); };
  return (
    <button ref={el} type="button" className="pf-card" onClick={onOpen} onPointerMove={tilt} onPointerLeave={flat}>
      <span className="pf-card-top" style={{ background: `var(--t${PROJECTS.indexOf(p) % 4})` }}>
        {p.images?.length ? <img src={"/" + p.images[0]} alt="" className={p.imageShape === "phone" ? "pf-phone" : ""} /> : <PixelIcon name={p.icon} size={64} />}
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

/* A native <dialog>: Esc closes it, focus stays inside, the page behind is inert. */
function Modal({ open, onClose, label, wide, children }: { open: boolean; onClose: () => void; label: string; wide?: boolean; children: React.ReactNode }) {
  const d = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = d.current!;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog ref={d} className={"pf-modal" + (wide ? " wide" : "")} aria-label={label} onClose={onClose}
      onClick={(e) => { if (e.target === d.current) onClose(); }}>
      {open && children}
    </dialog>
  );
}

function CaseFile({ project: p, onClose }: { project: Project | null; onClose: () => void }) {
  return (
    <Modal open={!!p} onClose={onClose} label={p ? p.title : "Project"}>
      {p && (
        <div className="pf-win">
          <div className="pf-win-bar"><i /><i /><i /><span>{p.slug}.txt</span>
            <button type="button" className="pf-x" onClick={onClose} aria-label="Close">✕</button></div>
          <div className="pf-case">
            <p className="pf-kicker">{p.kind}</p>
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
          </div>
        </div>
      )}
    </Modal>
  );
}

/* --------------------------------------------------------------- experience */
function Experience() {
  return (
    <section id="experience" className="pf-sec pf-alt">
      <div className="pf-wrap">
        <SecHead n="02" title="Experience & education" />
        <div className="pf-two">
          <ol className="pf-timeline">
            {EXPERIENCE.map((j) => (
              <li key={j.org + j.role}>
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
              <div key={e.school} className="pf-win pf-edu-card">
                <div className="pf-win-bar"><i /><i /><i /><span>{e.when}</span></div>
                <div className="pf-edu-body"><b>{e.school}</b><span>{e.what}</span><small>{e.detail}</small></div>
              </div>
            ))}
            <div className="pf-win pf-edu-card">
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
function Skills() {
  return (
    <section id="skills" className="pf-sec">
      <div className="pf-wrap">
        <SecHead n="03" title="Skills" sub="What I use, grouped the way a job ad lists them." />
        <div className="pf-skills">
          {SKILLS.map((g) => (
            <div key={g.group} className="pf-skill">
              <b>{g.group}</b>
              <div className="pf-slots">{g.items.map((s) => <span key={s}>{s}</span>)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- play */
function Play({ onPlay }: { onPlay: (g: Game) => void }) {
  return (
    <section id="play" className="pf-sec pf-play">
      <div className="pf-wrap">
        <SecHead n="04" title="After hours: games and 3D sites" sub="I make browser games and 3D sites in my own time, as Z Lab. Pick one; it opens right here." light />
        <div className="pf-games">
          {GAMES.map((g, i) => (
            <button key={g.slug} type="button" className={"pf-game" + (i === 0 ? " feat" : "")} onClick={() => onPlay(g)}>
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

/* ------------------------------------------------------------------ contact */
function Contact() {
  return (
    <section id="contact" className="pf-sec">
      <div className="pf-wrap">
        <div className="pf-win pf-contact">
          <div className="pf-win-bar tomato"><i /><i /><i /><span>say-hi.txt</span></div>
          <div className="pf-contact-in">
            <div>
              <h2>Let&rsquo;s talk.</h2>
              <p>The quickest way to reach me is email. I usually reply within a day.</p>
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

function SecHead({ n, title, sub, light }: { n: string; title: string; sub?: string; light?: boolean }) {
  return (
    <div className={"pf-head" + (light ? " light" : "")}>
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
