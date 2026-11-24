"use client";
/* The portfolio as a little retro computer.
 *
 * On a laptop it is a desktop: icons down the left, windows you can drag,
 * focus, minimise and close, a taskbar with a start menu. On a phone the same
 * windows stack into one scrolling column, and a project opens full screen.
 * Everything shown comes from src/data/projects.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PROJECTS, GAMES, ZLAB_URL } from "../data/projects";
import type { Project, Game, IconName } from "../data/projects";
import { PixelIcon } from "./icons";

const EMAIL = "adrianzachary825@gmail.com";
const GITHUB = "https://github.com/JustZachary";
const LINKEDIN = "https://www.linkedin.com/in/adrian-zachary-ian-2a4748181/";
const RESUME = "/adrian_zachary_resume.pdf";

type WinId = string;
type Win = { x: number; y: number; w: number; h: number; z: number; open: boolean; min: boolean };
type Kind = { title: string; bar: string; barText?: string };

/* Where each window starts, as fractions of the desktop, so the opening
   arrangement holds its shape on any laptop screen. */
const START: Record<string, { fx: number; fy: number; w: number; h: number }> = {
  about: { fx: 0.1, fy: 0.03, w: 560, h: 340 },
  projects: { fx: 0.52, fy: 0.05, w: 560, h: 440 },
  play: { fx: 0.25, fy: 0.45, w: 480, h: 340 },
  mail: { fx: 0.63, fy: 0.58, w: 340, h: 236 },
};

function useClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString([], { weekday: "short", hour: "numeric", minute: "2-digit" }));
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function useNarrow() {
  const [narrow, setNarrow] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return narrow;
}

export default function Desktop() {
  const narrow = useNarrow();
  const clock = useClock();
  const area = useRef<HTMLDivElement>(null);
  const [wins, setWins] = useState<Record<WinId, Win>>({});
  const zTop = useRef(10);   // the highest window so far
  const [selected, setSelected] = useState<string>(PROJECTS[0].slug);
  const [game, setGame] = useState<Game>(GAMES[0]);
  const [playing, setPlaying] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [sheet, setSheet] = useState<WinId | null>(null);   // phones: the window open full screen

  // lay out the opening windows once the desktop has a size
  useEffect(() => {
    if (narrow !== false || !area.current) return;
    const r = area.current.getBoundingClientRect();
    setWins((cur) => {
      if (Object.keys(cur).length) return cur;
      const next: Record<WinId, Win> = {};
      let z = 1;
      for (const [id, s] of Object.entries(START)) {
        const w = Math.min(s.w, r.width - 140), h = Math.min(s.h, r.height - 40);
        next[id] = { x: Math.round(Math.min(r.width - w - 20, 130 + s.fx * (r.width - 130))), y: Math.round(Math.min(r.height - h - 16, s.fy * r.height + 12)), w, h, z: z++, open: true, min: false };
      }
      return next;
    });
  }, [narrow]);

  const focus = useCallback((id: WinId) => {
    const nz = ++zTop.current;
    setWins((cur) => (cur[id] ? { ...cur, [id]: { ...cur[id], z: nz, min: false } } : cur));
  }, []);

  const open = useCallback((id: WinId, size?: { w: number; h: number }) => {
    setStartOpen(false);
    if (narrow) { setSheet(id); return; }
    const r = area.current?.getBoundingClientRect();
    const nz = ++zTop.current;
    setWins((cur) => {
      if (cur[id]) return { ...cur, [id]: { ...cur[id], open: true, min: false, z: nz } };
      const w = Math.min(size?.w ?? 520, (r?.width ?? 1200) - 140), h = Math.min(size?.h ?? 420, (r?.height ?? 800) - 40);
      const n = Object.values(cur).filter((v) => v.open).length;
      const x = Math.round(Math.max(120, Math.min((r?.width ?? 1200) - w - 20, 180 + n * 34)));
      const y = Math.round(Math.max(10, Math.min((r?.height ?? 800) - h - 16, 30 + n * 28)));
      return { ...cur, [id]: { x, y, w, h, z: nz, open: true, min: false } };
    });
  }, [narrow]);

  const close = useCallback((id: WinId) => {
    if (narrow) { setSheet(null); return; }
    setWins((cur) => (cur[id] ? { ...cur, [id]: { ...cur[id], open: false } } : cur));
    if (id === "play") setPlaying(false);
  }, [narrow]);
  const minimise = (id: WinId) => setWins((cur) => ({ ...cur, [id]: { ...cur[id], min: true } }));

  // Escape closes the window on top
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (startOpen) { setStartOpen(false); return; }
      if (sheet) { setSheet(null); return; }
      const live = Object.entries(wins).filter(([, w]) => w.open && !w.min).sort((a, b) => b[1].z - a[1].z);
      if (live[0]) close(live[0][0]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wins, sheet, startOpen, close]);

  // dragging a window by its title bar
  const drag = useRef<{ id: WinId; dx: number; dy: number } | null>(null);
  const onBarDown = (id: WinId) => (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const w = wins[id]; if (!w) return;
    focus(id);
    drag.current = { id, dx: e.clientX - w.x, dy: e.clientY - w.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onBarMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || !area.current) return;
    const r = area.current.getBoundingClientRect();
    setWins((cur) => {
      const w = cur[d.id];
      const x = Math.max(-w.w + 120, Math.min(r.width - 80, e.clientX - d.dx));
      const y = Math.max(0, Math.min(r.height - 40, e.clientY - d.dy));
      return { ...cur, [d.id]: { ...w, x, y } };
    });
  };
  const onBarUp = () => { drag.current = null; };

  const playGame = (g: Game) => { setGame(g); setPlaying(narrow ? false : true); if (narrow) window.open(ZLAB_URL + g.slug + "/", "_blank", "noopener"); else open("play"); };

  // ------------------------------------------------------------------ window contents
  const project = (slug: string) => PROJECTS.find((p) => p.slug === slug);
  const kinds: Record<string, Kind> = useMemo(() => {
    const k: Record<string, Kind> = {
      about: { title: "about.txt", bar: "var(--tomato)" },
      projects: { title: "C:\\projects", bar: "var(--leaf)" },
      zlab: { title: "z-lab · 30+ games and 3D worlds", bar: "var(--cobalt)" },
      play: { title: `${game.slug}.exe`, bar: "var(--cobalt)" },
      mail: { title: "new message", bar: "var(--plum)" },
      trash: { title: "trash", bar: "#6F7680" },
    };
    for (const p of PROJECTS) k["p:" + p.slug] = { title: `${p.slug}.txt`, bar: p.tile === "#FBF1DA" || p.tile === "#E9E3FF" || p.tile === "#BFEFFF" ? "var(--ink)" : p.tile, barText: p.tile === "#FFC93C" || p.tile === "#3DD6A3" ? "var(--ink)" : undefined };
    return k;
  }, [game]);

  function content(id: WinId, phone = false) {
    if (id === "about") return <About />;
    if (id === "projects") return <Projects selected={selected} onSelect={setSelected} onOpen={(slug) => open("p:" + slug, { w: 620, h: 520 })} onZlab={() => open("zlab", { w: 640, h: 470 })} onTrash={() => open("trash", { w: 300, h: 170 })} phone={phone} />;
    if (id === "zlab") return <ZLab onPlay={playGame} phone={phone} />;
    if (id === "play") return <Play game={game} playing={playing} onStart={() => setPlaying(true)} onOther={() => open("zlab", { w: 640, h: 470 })} />;
    if (id === "mail") return <Mail />;
    if (id === "trash") return <div className="pad">The trash is empty. Nothing that shipped ended up in here.</div>;
    if (id.startsWith("p:")) { const p = project(id.slice(2)); return p ? <ProjectWindow p={p} /> : null; }
    return null;
  }

  // ------------------------------------------------------------------ phones: one column
  if (narrow) {
    const stack: WinId[] = ["about", "projects", "zlab", "mail"];
    return (
      <div className="phone">
        <MenuBar clock={clock} onOpen={open} />
        <div className="phone-stack">
          <span className="sticker" style={{ background: "var(--sun)", transform: "rotate(-3deg)", alignSelf: "flex-start" }}>pursuing AWS SA</span>
          {stack.map((id) => (
            <section key={id} className="win flat" aria-label={kinds[id].title}>
              <TitleBar title={kinds[id].title} bar={kinds[id].bar} />
              <div className="win-body">{content(id, true)}</div>
            </section>
          ))}
          <footer className="phone-foot">© {new Date().getFullYear()} Adrian Zachary · made by hand with Next.js</footer>
        </div>
        {sheet && (
          <div className="sheet" role="dialog" aria-modal="true" aria-label={kinds[sheet]?.title}>
            <section className="win flat sheet-win">
              <TitleBar title={kinds[sheet]?.title ?? ""} bar={kinds[sheet]?.bar ?? "var(--ink)"} barText={kinds[sheet]?.barText} onClose={() => setSheet(null)} />
              <div className="win-body scroll">{content(sheet, true)}</div>
            </section>
          </div>
        )}
      </div>
    );
  }

  // ------------------------------------------------------------------ laptops: the desktop
  const openWins = Object.entries(wins).filter(([, w]) => w.open).sort((a, b) => a[0].localeCompare(b[0]));
  const focused = Object.entries(wins).filter(([, w]) => w.open && !w.min).sort((a, b) => b[1].z - a[1].z)[0]?.[0];
  const ICONS: { id: WinId; label: string; icon: IconName; href?: string; size?: { w: number; h: number } }[] = [
    { id: "about", label: "about.txt", icon: "text" },
    { id: "projects", label: "projects", icon: "folder" },
    { id: "zlab", label: "z-lab.exe", icon: "game", size: { w: 640, h: 470 } },
    { id: "resume", label: "resume.pdf", icon: "pdf", href: RESUME },
    { id: "mail", label: "mail", icon: "mail" },
  ];
  return (
    <div className="screen">
      <Wallpaper />
      <MenuBar clock={clock} onOpen={open} />
      <div className="desk" ref={area}>
        <nav className="icons" aria-label="Desktop">
          {ICONS.map((ic) => ic.href
            ? <a key={ic.id} className="ico" href={ic.href} target="_blank" rel="noopener"><PixelIcon name={ic.icon} />{ic.label}</a>
            : <button key={ic.id} type="button" className="ico" onClick={() => open(ic.id, ic.size)}><PixelIcon name={ic.icon} />{ic.label}</button>)}
        </nav>
        <span className="sticker" style={{ left: "44%", top: 6, background: "var(--sun)", transform: "rotate(5deg)" }}>pursuing AWS SA</span>
        <span className="sticker" style={{ left: "60%", top: "48%", background: "var(--tomato)", color: "#FFF8EC", transform: "rotate(-6deg)" }}>30+ things shipped</span>
        {openWins.map(([id, w]) => (
          <section key={id} className={"win" + (w.min ? " min" : "") + (focused === id ? " focused" : "")} style={{ left: w.x, top: w.y, width: w.w, height: w.h, zIndex: w.z }} aria-label={kinds[id]?.title} onPointerDown={() => focus(id)}>
            <TitleBar title={kinds[id]?.title ?? id} bar={kinds[id]?.bar ?? "var(--ink)"} barText={kinds[id]?.barText} onClose={() => close(id)} onMin={() => minimise(id)} onDown={onBarDown(id)} onMove={onBarMove} onUp={onBarUp} />
            <div className="win-body scroll">{content(id)}</div>
          </section>
        ))}
      </div>
      <footer className="taskbar">
        <button type="button" className="start" aria-expanded={startOpen} onClick={() => setStartOpen((s) => !s)}>◆ start</button>
        {openWins.map(([id, w]) => (
          <button key={id} type="button" className={"task" + (focused === id && !w.min ? " on" : "")} onClick={() => (focused === id && !w.min ? minimise(id) : focus(id))}>{kinds[id]?.title ?? id}</button>
        ))}
        <span className="tray">{clock}</span>
        {startOpen && (
          <div className="start-menu" role="menu">
            <b>Adrian Zachary</b>
            {[["about", "About me"], ["projects", "Projects"], ["zlab", "Z Lab games"], ["mail", "Say hi"]].map(([id, label]) => <button key={id} type="button" role="menuitem" onClick={() => open(id, id === "zlab" ? { w: 640, h: 470 } : undefined)}>{label}</button>)}
            <a role="menuitem" href={RESUME} target="_blank" rel="noopener">Résumé (PDF)</a>
            <a role="menuitem" href={GITHUB} target="_blank" rel="noopener">GitHub</a>
            <a role="menuitem" href={LINKEDIN} target="_blank" rel="noopener">LinkedIn</a>
          </div>
        )}
      </footer>
    </div>
  );
}

// ------------------------------------------------------------------ pieces
function Wallpaper() {
  return (
    <div className="wallpaper" aria-hidden="true">
      <div className="sun" />
      <div className="hills" />
      <div className="field" />
    </div>
  );
}

function MenuBar({ clock, onOpen }: { clock: string; onOpen: (id: WinId) => void }) {
  return (
    <header className="menubar">
      <div className="menu-left">
        <b>◆ AZ-OS</b>
        <button type="button" onClick={() => onOpen("about")}>About</button>
        <button type="button" onClick={() => onOpen("projects")}>Projects</button>
        <button type="button" onClick={() => onOpen("zlab")}>Z Lab</button>
        <button type="button" onClick={() => onOpen("mail")}>Contact</button>
      </div>
      <div className="menu-right"><span className="badge">● open for freelance</span><span className="clock">{clock}</span></div>
    </header>
  );
}

function TitleBar({ title, bar, barText, onClose, onMin, onDown, onMove, onUp }: { title: string; bar: string; barText?: string; onClose?: () => void; onMin?: () => void; onDown?: (e: React.PointerEvent) => void; onMove?: (e: React.PointerEvent) => void; onUp?: () => void }) {
  return (
    <div className="bar" style={{ background: bar, color: barText ?? "#FFF8EC" }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      {onMin ? <button type="button" className="dot" aria-label={"Minimise " + title} onClick={onMin} /> : <span className="dot" aria-hidden="true" />}
      <span className="dot" aria-hidden="true" />
      <h2 className="bar-title">{title}</h2>
      {onClose && <button type="button" className="x" aria-label={"Close " + title} onClick={onClose}>✕</button>}
    </div>
  );
}

function About() {
  return (
    <div className="about">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/my_picture.jpg" alt="Adrian Zachary in a dark blazer under neon light" className="portrait" />
      <div className="about-text">
        <h1 className="hello">hi, i&apos;m adrian.</h1>
        <p className="tagline">i build <span className="hl">useful</span> software and <span className="blue">playable</span> worlds.</p>
        <p>Software engineer from UKM, based in Petaling Jaya. By day I build automation and AI tools for the mlabs group of companies: crawlers, AI assistants, staff portals. In the evenings I make little games you can play in a browser tab. Pursuing AWS Solutions Architect Associate.</p>
        <div className="row">
          <a className="pbtn sun" href={RESUME} target="_blank" rel="noopener">resume.pdf</a>
          <a className="pbtn" href={GITHUB} target="_blank" rel="noopener">github</a>
          <a className="pbtn" href={LINKEDIN} target="_blank" rel="noopener">linkedin</a>
        </div>
      </div>
    </div>
  );
}

function Projects({ selected, onSelect, onOpen, onZlab, onTrash, phone }: { selected: string; onSelect: (s: string) => void; onOpen: (s: string) => void; onZlab: () => void; onTrash: () => void; phone: boolean }) {
  const sel = PROJECTS.find((p) => p.slug === selected);
  return (
    <div className="folder">
      <div className="grid">
        {PROJECTS.map((p) => (
          <button key={p.slug} type="button" className={"fi" + (selected === p.slug ? " sel" : "")} onClick={() => (phone || selected === p.slug ? onOpen(p.slug) : onSelect(p.slug))} onDoubleClick={() => onOpen(p.slug)}>
            <span className="tile" style={{ background: p.tile }}><PixelIcon name={p.icon} size={34} /></span>
            <span>{p.title.toLowerCase()}</span>
          </button>
        ))}
        <button type="button" className="fi" onClick={onZlab}><span className="tile" style={{ background: "var(--cobalt)" }}><PixelIcon name="folder" size={34} /></span><span>z lab (30+)</span></button>
        {!phone && <button type="button" className="fi" onClick={onTrash}><span className="tile" style={{ background: "#D3D7DC" }}><PixelIcon name="trash" size={34} /></span><span>trash</span></button>}
      </div>
      {!phone && sel && (
        <div className="preview">
          <b>{sel.title.toLowerCase()}</b>: {sel.blurb} <button type="button" className="linkish" onClick={() => onOpen(sel.slug)}>open →</button>
        </div>
      )}
      <div className="status">{PROJECTS.length + 1} items{phone ? " · tap to open" : " · click twice to open"}</div>
    </div>
  );
}

function ProjectWindow({ p }: { p: Project }) {
  return (
    <article className="project">
      <div className="row wrap">
        <span className="chip" style={{ background: p.tile }}>{p.kind}</span>
        {p.badges?.map((b) => <span key={b} className="chip">{b}</span>)}
      </div>
      <h3 className="p-title">{p.title}</h3>
      <p className="p-blurb">{p.blurb}</p>
      {p.images && (
        <div className={"shots " + (p.imageShape ?? "wide")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.images.map((src) => <img key={src} src={"/" + src} alt={p.title + " screenshot"} loading="lazy" />)}
        </div>
      )}
      <div className="notes">
        {p.notes.map((n) => <div key={n.title} className="note"><b>{n.title}</b><p>{n.body}</p></div>)}
      </div>
      {p.caseStudy && (
        <>
          <h4 className="sub">case study</h4>
          <div className="notes">{p.caseStudy.map((n) => <div key={n.title} className="note dashed"><b>{n.title}</b><p>{n.body}</p></div>)}</div>
        </>
      )}
      <div className="row wrap">{p.tech.map((t) => <span key={t} className="chip small">{t}</span>)}</div>
      {p.links && <div className="row wrap">{p.links.map((l) => <a key={l.href} className="pbtn" href={l.href} target="_blank" rel="noopener">{l.label}</a>)}</div>}
    </article>
  );
}

function ZLab({ onPlay, phone }: { onPlay: (g: Game) => void; phone: boolean }) {
  return (
    <div className="zlab">
      <p className="z-intro">Z Lab is where I try things: games, 3D worlds and concept sites, all running in the browser. {phone ? "Tap one to play." : "Pick one and it opens right here."}</p>
      <div className="games">
        {GAMES.map((g) => (
          <button key={g.slug} type="button" className="game" onClick={() => onPlay(g)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={"/" + g.thumb} alt="" loading="lazy" />
            <b>{g.title}</b>
            <span>{g.line}</span>
            <em>{g.tech}</em>
          </button>
        ))}
      </div>
      <a className="pbtn sun" href={ZLAB_URL} target="_blank" rel="noopener">see all 30+ experiments ↗</a>
    </div>
  );
}

function Play({ game, playing, onStart, onOther }: { game: Game; playing: boolean; onStart: () => void; onOther: () => void }) {
  return (
    <div className="play">
      <div className="screen-box">
        {playing
          ? <iframe src={ZLAB_URL + game.slug + "/"} title={game.title} allow="autoplay; fullscreen; gamepad" />
          : <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={"/" + game.thumb} alt={game.title} />
            <button type="button" className="playbtn" onClick={onStart}>▶ PLAY</button>
          </>}
      </div>
      <div className="status row between">
        <span>{game.line}</span>
        <span className="row"><button type="button" className="linkish" onClick={onOther}>other games</button><a href={ZLAB_URL + game.slug + "/"} target="_blank" rel="noopener">full screen ↗</a></span>
      </div>
    </div>
  );
}

function Mail() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="pad mail">
      <b className="say">say hi :)</b>
      <span>Taking on freelance builds: websites, automation, AI tools and small games.</span>
      <a href={"mailto:" + EMAIL}>{EMAIL}</a>
      <button type="button" className="pbtn sun small" onClick={() => { navigator.clipboard?.writeText(EMAIL).then(() => setCopied(true)).catch(() => setCopied(false)); }}>{copied ? "copied!" : "copy address"}</button>
    </div>
  );
}
