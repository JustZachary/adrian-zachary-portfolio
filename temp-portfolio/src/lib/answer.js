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

function score(asked, entry) {
  const triggers = new Set((entry.ask || []).flatMap((a) => words(a)));
  const phrases = (entry.ask || []).filter((a) => a.indexOf(" ") > 0);
  let points = 0;
  for (const w of asked) if (triggers.has(w)) points += 2;
  /* A whole phrase matching is worth more than its words: "work
     experience" should reach the internship, not every project. */
  const flat = asked.join(" ");
  for (const p of phrases) if (flat.indexOf(normalise(p)) >= 0) points += 3;

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
    const points = score(asked, entry);
    if (points > bestPoints) { best = entry; bestPoints = points; }
  }

  /* Two points is one trigger word. Below that it is a coincidence, and
     a confident wrong answer is worse than an honest miss. */
  if (!best || bestPoints < 2) {
    return { text: unknown.say, chips: unknown.then || [], id: "unknown" };
  }
  return { text: best.say, chips: best.then || [], id: best.id };
}
