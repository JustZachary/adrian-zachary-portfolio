"use client";
/* Little pixel trophies for exploring the page. Anything can call unlock("id"); a toast
   pops up bottom left the first time, the footer shows the shelf, and the visitor's
   trophies are remembered in their own browser. Nothing is sent anywhere. */
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export const ACHIEVEMENTS = [
  { id: "curious", icon: "📂", title: "Curious", desc: "Opened a project's case file" },
  { id: "explorer", icon: "🗺️", title: "Explorer", desc: "Scrolled through every section" },
  { id: "gamer", icon: "🕹️", title: "Player one", desc: "Started one of the games" },
  { id: "smasher", icon: "💥", title: "Smasher", desc: "Smashed the 3D logo three times" },
  { id: "searcher", icon: "⌕", title: "Shortcut", desc: "Used quick search" },
  { id: "decorator", icon: "🎨", title: "Decorator", desc: "Changed the colour theme" },
  { id: "paper", icon: "📄", title: "Paper trail", desc: "Opened the CV" },
  { id: "konami", icon: "🎮", title: "Old school", desc: "Entered the Konami code" },
] as const;
export type AchId = (typeof ACHIEVEMENTS)[number]["id"];

const KEY = "pf-ach";
const listeners = new Set<() => void>();
let cache: string | null = null;
const read = (): string => { if (cache !== null) return cache; try { cache = localStorage.getItem(KEY) ?? ""; } catch { cache = ""; } return cache; };
const store = {
  get: read,
  sub(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

export function unlock(id: AchId) {
  if (typeof window === "undefined") return;
  const have = read().split(",").filter(Boolean);
  if (have.includes(id)) return;
  cache = [...have, id].join(",");
  try { localStorage.setItem(KEY, cache); } catch {}
  listeners.forEach((l) => l());
  window.dispatchEvent(new CustomEvent("pf-ach", { detail: id }));
}

function useUnlocked() {
  const raw = useSyncExternalStore(store.sub, store.get, () => "");
  return raw.split(",").filter(Boolean);
}

/* The toasts, bottom left. */
export function AchToasts() {
  const [shown, setShown] = useState<{ id: AchId; key: number }[]>([]);
  const n = useRef(0);
  useEffect(() => {
    const on = (e: Event) => {
      const id = (e as CustomEvent).detail as AchId, key = ++n.current;
      setShown((s) => [...s, { id, key }]);
      setTimeout(() => setShown((s) => s.filter((t) => t.key !== key)), 3800);
    };
    addEventListener("pf-ach", on);
    return () => removeEventListener("pf-ach", on);
  }, []);
  return (
    <div className="pf-toasts" role="status" aria-live="polite">
      {shown.map(({ id, key }) => {
        const a = ACHIEVEMENTS.find((x) => x.id === id)!;
        return (
          <div key={key} className="pf-toast">
            <span className="pf-toast-ico" aria-hidden="true">{a.icon}</span>
            <span><small>Achievement unlocked</small><b>{a.title}</b><em>{a.desc}</em></span>
          </div>
        );
      })}
    </div>
  );
}

/* The trophy shelf in the footer: earned ones show, the rest are ???. */
export function AchShelf() {
  const got = useUnlocked();
  const [open, setOpen] = useState(false);
  return (
    <div className="pf-shelf">
      <button type="button" className="pf-shelf-btn" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        🏆 {got.length} of {ACHIEVEMENTS.length} achievements
      </button>
      {open && (
        <ul className="pf-shelf-list">
          {ACHIEVEMENTS.map((a) => {
            const on = got.includes(a.id);
            return (
              <li key={a.id} className={on ? "on" : ""}>
                <span aria-hidden="true">{on ? a.icon : "?"}</span>
                <b>{on ? a.title : "???"}</b>
                <em>{on ? a.desc : a.id === "konami" ? "A secret. ↑↑↓↓…" : "Keep exploring"}</em>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ↑ ↑ ↓ ↓ ← → ← → B A */
export function useKonami(onDone: () => void) {
  const done = useRef(onDone);
  useEffect(() => { done.current = onDone; });
  useEffect(() => {
    const seq = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let i = 0;
    const key = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === seq[i] ? i + 1 : k === seq[0] ? 1 : 0;
      if (i === seq.length) { i = 0; done.current(); }
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);
}
