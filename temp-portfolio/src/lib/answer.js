/* The chat, minus the chat.
 *
 * Given a question and the site's own data, this returns what to say.
 * No model, no API key, no network — which is the point three times
 * over: it costs nothing, it cannot be run up by whoever finds the
 * page, and it CANNOT MAKE ANYTHING UP. Every sentence it returns was
 * written by hand in src/data. Asked whether I know Kubernetes, a
 * language model would happily improvise; this says it doesn't know.
 *
 * Plain JavaScript rather than TypeScript so it can be run and tested
 * with node alone — see answer.test.js next to it. The matching is the
 * only part with any logic in it, so it is the part worth testing.
 *
 * It takes its data as an argument rather than importing it, so a test
 * can hand it three fixtures instead of the real site.
 */

const STOP = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "am",
  "do", "does", "did", "doing", "have", "has", "had", "can", "could",
  "would", "should", "will", "shall", "may", "might", "must",
  "i", "me", "my", "you", "your", "yours", "he", "his", "him", "it", "its",
  "we", "us", "our", "they", "them", "their",
  "what", "which", "who", "whom", "whose", "where", "when", "why", "how",
  "of", "in", "on", "at", "for", "with", "about", "from", "to", "by", "as",
  "and", "or", "but", "if", "then", "than", "that", "this", "these", "those",
  "any", "some", "all", "also", "just", "very", "much", "many",
  "please", "thanks", "thank", "ok", "okay", "so", "there", "here", "up",
  "tell", "know", "get", "got", "give", "show", "say", "said", "like", "want",
]);

export function normalise(text) {
  return String(text == null ? "" : text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function words(text) {
  return normalise(text).split(" ").filter((w) => w && !STOP.has(w));
}

const GREETINGS = ["hi", "hello", "hey", "yo", "helo", "hai", "morning", "afternoon", "evening", "greetings", "sup"];
const THANKS = ["thanks", "thank", "thx", "ty", "appreciate", "cheers"];
const MORE = ["more", "elaborate", "continue", "go on", "details", "detail", "expand", "further", "explain"];

const has = (list, w) => list.indexOf(w) >= 0;

const pick = (project, what) => {
  const note = (project.notes || []).find((n) => what.test(n.title));
  return note ? note.body : "";
};

/* Every project becomes something askable, without anybody writing the
   triggers out: its name, its slug, and every technology on it. */
function fromProjects(projects) {
  return (projects || []).map((p) => ({
    id: `project:${p.slug}`,
    kind: "project",
    ask: words(p.title).concat(words(p.slug), (p.tech || []).flatMap((t) => words(t))),
    say: [
      `${p.title} — ${p.blurb}`,
      (p.notes || []).filter((n) => /contribution/i.test(n.title)).map((n) => n.body)[0],
      (p.tech || []).length ? `Built with ${p.tech.join(", ")}.` : "",
    ].filter(Boolean).join(" "),
    deep: (p.notes || []).map((n) => `${n.title}: ${n.body}`).join("\n\n"),
    title: p.title,
    /* Everything known about this project, for stage three: the model
       is allowed to rephrase, and rephrasing needs more vocabulary than
       the single retrieved sentence or every answer it writes looks
       like an invention. The retrieved sentence stays the fallback. */
    context: [
      `${p.title}: ${p.blurb}`,
      (p.notes || []).map((n) => `${n.title}: ${n.body}`).join(" "),
      (p.tech || []).length ? `Built with ${p.tech.join(", ")}.` : "",
    ].filter(Boolean).join(" "),
    fields: {
      problem: pick(p, /problem/i),
      solution: pick(p, /solution/i),
      contribution: pick(p, /contribution/i),
      outcome: pick(p, /outcome/i),
      tech: (p.tech || []).length ? `${p.title} was built with ${p.tech.join(", ")}.` : "",
    },
    then: ["What else have you built?", "What do you work with?", "How do I contact you?"],
  }));
}

/* "What have you built" is its own question, and the answer is the
   list rather than whichever project happened to score highest. */
function listEntry(projects) {
  const names = (projects || []).map((p) => p.title);
  return {
    id: "projects",
    kind: "list",
    ask: ["projects", "project", "built", "build", "work", "works", "portfolio", "made", "done", "experience", "case", "study"],
    say: names.length
      ? `${names.length === 1 ? "One project" : `${names.length} projects`} on here: ${names.join(", ")}. Ask about any of them by name.`
      : "Nothing listed yet.",
    then: names.slice(0, 3).map((n) => `Tell me about ${n}`),
  };
}

function toolsEntry(tools) {
  if (!tools || !tools.length) return null;
  return {
    id: "tools-list",
    kind: "tools",
    ask: ["tools", "tool", "stack", "arsenal", "technologies", "technology", "tech"],
    say: `${tools.map((t) => t.name).join(", ")}. Ask where any of them was used.`,
    then: ["Where did you use Flutter?", "What have you built?"],
  };
}

/* One typo, forgiven. "flutterr", "recruitmnt", "smartairq" — people
   type quickly on a phone and a chat that answers "I don't know" to a
   misspelling reads as broken rather than careful. Only for words long
   enough that a near miss is unlikely to be a different word. */
function near(a, b) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length < 5) return false;
  let i = 0, j = 0, slips = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    slips += 1;
    if (slips > 1) return false;
    if (a.length > b.length) i += 1;
    else if (b.length > a.length) j += 1;
    else { i += 1; j += 1; }
  }
  return slips + (a.length - i) + (b.length - j) <= 1;
}

/* What somebody is asking ABOUT a thing, once the thing is established:
   "what was the problem", "what did you actually do", "what's it built
   with". Asked on their own these are meaningless — they only mean
   something attached to the last project talked about. */
const FIELDS = [
  { key: "problem", ask: ["problem", "issue", "pain", "need", "gap"] },
  { key: "solution", ask: ["solution", "solve", "solved", "approach", "fix", "built"] },
  { key: "contribution", ask: ["contribution", "contribute", "role", "part", "responsible", "did", "doing", "job", "yours"] },
  { key: "outcome", ask: ["outcome", "result", "results", "impact", "achieved", "difference"] },
  { key: "tech", ask: ["tech", "stack", "technology", "technologies", "framework", "language", "languages", "written", "made"] },
];

function fieldAsked(asked) {
  for (const f of FIELDS) {
    for (const w of asked) if (f.ask.indexOf(w) >= 0) return f.key;
  }
  return null;
}

/* "it", "that one", "this" — a question with no subject of its own is a
   question about whatever was last said. */
const POINTERS = ["it", "that", "this", "they", "them", "one", "there", "its", "theirs"];
const pointsBack = (raw) => raw.split(" ").some((w) => POINTERS.indexOf(w) >= 0);

/* `asked` is the question with the small words stripped out; `raw` is
   all of it. Phrases need the raw form — "how are you" is nothing but
   small words, so against the stripped version it matches nothing at
   all, which is exactly how a chat ends up answering "how are you?"
   with "I only know what's on this site". */
function score(asked, entry, raw = "") {
  const triggers = new Set((entry.ask || []).flatMap((a) => words(a)));
  const phrases = (entry.ask || []).filter((a) => a.indexOf(" ") > 0);
  let points = 0;
  for (const w of asked) {
    if (triggers.has(w)) { points += 2; continue; }
    for (const t of triggers) if (near(w, t)) { points += 1; break; }
  }
  /* A whole phrase matching is worth more than its words: "work
     experience" should reach the internship, not every project. */
  const whole = normalise(raw) || asked.join(" ");
  for (const p of phrases) if (whole.indexOf(normalise(p)) >= 0) points += 3;
  const flat = asked.join(" ");

  /* People put spaces where a product name has none — "smart air iq",
     "next js", "fire base". Comparing with the spaces taken out costs
     one line and catches all of them. */
  const squashed = flat.replace(/ /g, "");
  if (squashed.length >= 5) {
    for (const t of triggers) {
      if (t.length >= 5 && (squashed.indexOf(t) >= 0 || t.indexOf(squashed) >= 0)) { points += 3; break; }
    }
  }
  return points;
}

/* question: what they typed.
 * data: { projects, topics, tools, greeting, unknown }
 * context: { lastId } — what the previous answer was about, so "tell me
 *   more" has something to be more about. That is the whole of the
 *   conversation it can hold today, and it is deliberately small.
 *
 * Returns { text, chips, id } — chips being what to offer next, because
 * a chat that says "ask me anything" gets asked nothing. */
export function answer(question, data = {}, context = {}) {
  const projects = data.projects || [];
  const topics = data.topics || [];
  const asked = words(question);
  const raw = normalise(question);

  const unknown = data.unknown || { say: "I don't know that one.", then: [] };
  const greeting = data.greeting || { say: "Hello.", then: [] };

  if (!raw) return { text: greeting.say, chips: greeting.then || [], id: "greeting" };

  /* Manners first, and only when that is all they said — "hi, what did
     you build" is a question, not a greeting. */
  const bareWords = raw.split(" ");
  if (bareWords.every((w) => has(GREETINGS, w))) {
    return { text: greeting.say, chips: greeting.then || [], id: "greeting" };
  }
  if (bareWords.every((w) => has(THANKS, w) || has(GREETINGS, w))) {
    return { text: "Any time. Anything else you want to know?", chips: greeting.then || [], id: "thanks" };
  }

  const entries = topics
    .concat(fromProjects(projects))
    .concat([listEntry(projects), toolsEntry(data.tools)].filter(Boolean));

  /* "Tell me more" is not a question on its own — it is a question
     about whatever was just said. */
  if (asked.length <= 2 && asked.some((w) => has(MORE, w)) && context.lastId) {
    const last = entries.find((e) => e.id === context.lastId);
    if (last) {
      return {
        text: last.deep || last.say,
        chips: last.then || [],
        id: last.id,
      };
    }
  }

  let best = null, bestPoints = 0;
  for (const entry of entries) {
    const points = score(asked, entry, raw);
    if (points > bestPoints) { best = entry; bestPoints = points; }
  }

  const last = context.lastId ? entries.find((e) => e.id === context.lastId) : null;
  const seen = context.seen || [];
  const field = fieldAsked(asked);

  /* "what else have you built" — the answer is a project they have not
     been told about yet, not the same one again. */
  if (/\b(else|other|another|next)\b/.test(raw)) {
    const rest = entries.filter((e) => e.kind === "project" && seen.indexOf(e.id) < 0 && e.id !== context.lastId);
    if (rest.length) {
      return { text: rest[0].say, chips: onward(rest[0].then, data), id: rest[0].id, context: rest[0].context || rest[0].say };
    }
    if (projects.length) {
      return {
        text: `That is everything on here — ${projects.map((p) => p.title).join(" and ")}. There is more in the CV, and the rest is best over a call.`,
        chips: ["How do I contact you?"], id: "projects",
      };
    }
  }

  /* A question about PART of a project: the problem, what he actually
     did, what it was built with. Either the project is named in the
     question, or it is the one already being talked about — which is
     what makes "and what tech did it use?" a sentence at all. */
  const subject = best && best.kind === "project" && bestPoints >= 2
    ? best
    : (last && last.kind === "project" ? last : null);
  if (field && subject && subject.fields && subject.fields[field]) {
    const others = FIELDS.map((f) => f.key).filter((k) => k !== field && subject.fields[k]);
    return {
      text: subject.fields[field],
      chips: others.slice(0, 2).map((k) => `${k === "tech" ? "What was it built with" : `What was the ${k}`}?`).concat("What else have you built?"),
      id: subject.id,
      context: subject.context || subject.say,
    };
  }

  /* "what about it", "who was that for" — a question with no subject of
     its own belongs to whatever was last said. */
  if (bestPoints < 2 && pointsBack(raw) && last) {
    return { text: last.deep || last.say, chips: onward(last.then, data), id: last.id, context: last.context || last.say };
  }

  /* Two questions in one message. People do this constantly and a chat
     that answers only the first half feels like it is not listening. */
  if (!context.nosplit) {
    const halves = String(question).split(/\?|\band\b|,/).map((h) => h.trim()).filter((h) => words(h).length >= 1);
    if (halves.length > 1) {
      const replies = halves.map((h) => answer(h, data, Object.assign({}, context, { nosplit: true })));
      const useful = replies.filter((r) => r.id !== "unknown" && r.id !== "greeting" && r.id !== "thanks");
      const distinct = useful.filter((r, i) => useful.findIndex((o) => o.id === r.id) === i);
      if (distinct.length > 1) {
        return {
          text: distinct.map((r) => r.text).join("\n\n"),
          chips: distinct[distinct.length - 1].chips || [],
          id: distinct[distinct.length - 1].id,
        };
      }
    }
  }

  /* Two points is one trigger word. Below that it is a coincidence, and
     a confident wrong answer is worse than an honest miss — but one
     point is close enough to be worth asking about rather than
     stonewalling. */
  if (!best || bestPoints < 2) {
    if (best && bestPoints >= 1) {
      const name = best.title || (best.ask && best.ask[0]) || "that";
      return {
        text: `I am not sure I follow. Did you mean ${name}?`,
        chips: [`Tell me about ${name}`].concat((unknown.then || []).slice(0, 2)),
        id: "unsure",
      };
    }
    return { text: unknown.say, chips: unknown.then || [], id: "unknown" };
  }
  return { text: best.say, chips: onward(best.then, data), id: best.id, context: best.context || best.say };
}

/* A chat that ends a turn with nothing to press is a chat that ends.
   Where an entry names no follow-ups, fall back to the three the
   greeting offers. */
function onward(then, data) {
  if (then && then.length) return then;
  const greeting = data.greeting || {};
  return (greeting.then || []).slice(0, 3);
}
