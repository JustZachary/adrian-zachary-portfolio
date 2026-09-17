"use client";
/* The chat box, which is only a mouth.
 *
 * Everything it says comes from src/lib/answer.js, which reads the same
 * data the page renders. There is no request, no key and no model here
 * — open the network tab while you use it and nothing happens, which is
 * the honest version of "AI-powered" for a page that has to be free to
 * run and cannot afford to invent things about somebody's career.
 */
import { useEffect, useRef, useState } from "react";
import { answer } from "../lib/answer.js";
import { PROJECTS } from "../data/projects";
import { TOOLS, TOPICS, GREETING, UNKNOWN } from "../data/facts.js";

type Said = { from: "them" | "me"; text: string };

const DATA = { projects: PROJECTS, topics: TOPICS, tools: TOOLS, greeting: GREETING, unknown: UNKNOWN };

export default function AskTheCodex() {
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState<Said[]>([{ from: "me", text: GREETING.say }]);
  const [chips, setChips] = useState<string[]>(GREETING.then || []);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const lastId = useRef<string>("greeting");
  /* What has already been answered, so "what else have you built" can
     move on instead of repeating itself. */
  const seen = useRef<string[]>([]);
  const foot = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (foot.current) foot.current.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [said, open]);

  useEffect(() => {
    if (open && field.current) field.current.focus();
  }, [open]);

  /* Escape closes it, because a panel that traps you is a panel people
     resent. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Ask the server first — it has the same retrieval PLUS, if a key is
     configured, a model to phrase the answer. If it is slow, down, or
     was never configured, the identical retrieval runs here in the
     browser and the visitor sees an answer either way. A portfolio that
     shows an error because a free tier ran out is worse than one that
     never had a model. */
  async function send(question: string) {
    const asked = question.trim();
    if (!asked || busy) return;
    const local = answer(asked, DATA, { lastId: lastId.current, seen: seen.current });

    setSaid((before) => [...before, { from: "them", text: asked }]);
    setTyped("");
    setChips([]);
    setBusy(true);

    let reply = local;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: asked,
          lastId: lastId.current,
          seen: seen.current,
          history: said.slice(-4).map((s) => ({ role: s.from === "them" ? "user" : "assistant", content: s.text })),
        }),
      });
      if (response.ok) {
        const json = await response.json();
        if (json && typeof json.text === "string" && json.text.trim()) reply = json;
      }
    } catch {
      /* Offline, blocked, or the route is not deployed — `local` stands. */
    }

    lastId.current = reply.id || local.id;
    if (reply.id && seen.current.indexOf(reply.id) < 0) seen.current.push(reply.id);
    setSaid((before) => [...before, { from: "me", text: reply.text }]);
    setChips(reply.chips || local.chips || []);
    setBusy(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close the codex" : "Ask the codex"}
        className="fixed bottom-5 right-5 z-50 font-cinzel text-xs tracking-widest px-5 py-3 transition-colors duration-300"
        style={{
          background: "rgba(10,10,8,0.92)",
          border: "1px solid rgba(246,188,124,0.45)",
          color: "#F6BC7C",
          borderRadius: "2px",
          boxShadow: "0 0 24px rgba(246,188,124,0.12)",
        }}
      >
        {open ? "✕ CLOSE" : "⚜ ASK THE CODEX"}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Ask the codex"
          className="fixed z-50 flex flex-col overflow-hidden bottom-20 right-5 left-5 sm:left-auto sm:w-[26rem]"
          style={{
            maxHeight: "min(32rem, 70vh)",
            background: "rgba(10,10,8,0.97)",
            border: "1px solid rgba(246,188,124,0.3)",
            borderRadius: "4px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(246,188,124,0.18)" }}>
            <p className="font-cinzel text-[#F6BC7C] uppercase tracking-[0.35em] text-[10px] opacity-80">⚜ The Codex ⚜</p>
            <p className="font-crimson text-xs mt-1" style={{ color: "rgba(217,234,250,0.45)" }}>
              Answers only from what is on this page.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {said.map((s, i) => (
              <div key={i} className={s.from === "them" ? "text-right" : ""}>
                <span
                  className="inline-block font-crimson text-sm leading-relaxed whitespace-pre-line px-3 py-2"
                  style={
                    s.from === "them"
                      ? { background: "rgba(217,234,250,0.08)", color: "rgba(217,234,250,0.85)", borderRadius: "2px", maxWidth: "85%" }
                      : { background: "rgba(246,188,124,0.07)", border: "1px solid rgba(246,188,124,0.18)", color: "var(--text-dim, rgba(217,234,250,0.75))", borderRadius: "2px", maxWidth: "92%" }
                  }
                >
                  {s.text}
                </span>
              </div>
            ))}
            {busy && (
              <p className="font-crimson text-xs italic" style={{ color: "rgba(246,188,124,0.5)" }}>
                consulting the codex…
              </p>
            )}
            <div ref={foot} />
          </div>

          {chips.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {chips.map((c) => (
                <button
                  key={c}
                  onClick={() => send(c)}
                  className="font-cinzel text-[10px] tracking-wider px-3 py-1 transition-colors duration-200"
                  style={{ border: "1px solid rgba(246,188,124,0.28)", color: "rgba(246,188,124,0.75)", borderRadius: "999px" }}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(typed); }}
            className="flex items-center gap-2 px-3 py-3"
            style={{ borderTop: "1px solid rgba(246,188,124,0.18)" }}
          >
            <input
              ref={field}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={busy ? "…" : "Ask about the work…"}
              disabled={busy}
              aria-label="Your question"
              className="flex-1 bg-transparent font-crimson text-sm px-2 py-2 outline-none"
              style={{ color: "rgba(217,234,250,0.9)", border: "1px solid rgba(246,188,124,0.2)", borderRadius: "2px" }}
            />
            <button
              type="submit"
              disabled={busy}
              className="font-cinzel text-[10px] tracking-widest px-4 py-2"
              style={{ background: "rgba(246,188,124,0.14)", border: "1px solid rgba(246,188,124,0.4)", color: "#F6BC7C", borderRadius: "2px" }}
            >
              ASK
            </button>
          </form>
        </div>
      )}
    </>
  );
}
