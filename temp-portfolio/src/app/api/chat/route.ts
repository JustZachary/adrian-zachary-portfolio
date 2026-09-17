/* The chat's optional brain.
 *
 * WITHOUT an API key this route still works: it returns the retrieved
 * answer, word for word, exactly as stages one and two did. The site
 * never depends on a provider being up, in credit, or configured at
 * all — a portfolio that breaks because a free tier ran out is worse
 * than one that never had a model.
 *
 * WITH a key, the same retrieved text goes to the model as CONTEXT and
 * the model only rephrases it. Retrieval decides what is true; the
 * model chooses the words. If the answer strays outside the context it
 * is thrown away and the retrieved one is sent instead.
 *
 * Set these in Vercel's environment (and set a spend cap with the
 * provider — a public chat box is a public invoice):
 *
 *   CHAT_API_KEY   the provider key
 *   CHAT_API_URL   optional, any OpenAI-shaped endpoint
 *   CHAT_MODEL     optional
 */
import { NextResponse } from "next/server";
import { answer } from "../../../lib/answer.js";
import { PROJECTS } from "../../../data/projects";
import { TOOLS, TOPICS, SMALL_TALK, GREETING, UNKNOWN } from "../../../data/facts.js";
import { buildMessages, buildOpenMessages, limiter, looksLikeRefusal, providerFrom, saysNothingAboutHim, tooLong, trustworthy } from "../../../lib/chatapi.js";

const DATA = { projects: PROJECTS, topics: TOPICS.concat(SMALL_TALK), tools: TOOLS, greeting: GREETING, unknown: UNKNOWN };
const allowed = limiter(12);
/* Tighter, because this is the lane a stranger can spend his money in:
   every question that is not about him is a model call with nothing
   retrieved to keep it short. */
const allowedOpen = limiter(5);

type Body = {
  question?: string;
  lastId?: string;
  seen?: string[];
  history?: { role: string; content: string }[];
};

export async function POST(request: Request) {
  let body: Body = {};
  try { body = await request.json(); } catch { body = {}; }

  const question = String(body.question || "").trim();
  if (!question) return NextResponse.json({ error: "no question" }, { status: 400 });
  if (tooLong(question)) {
    return NextResponse.json({ text: "That is longer than I can read. Ask me something shorter.", chips: [], id: "unknown" });
  }

  const who = request.headers.get("x-forwarded-for") || "anon";
  if (!allowed(who)) {
    return NextResponse.json({ text: "One at a time — give me a moment.", chips: [], id: "unknown" }, { status: 429 });
  }

  /* Retrieval first, always. This is the answer; everything after it is
     presentation. */
  const found = answer(question, DATA, { lastId: body.lastId, seen: body.seen || [] });
  const provider = providerFrom(process.env);
  /* Greetings, thanks and refusals are already written, already in the
     right voice, and there is nothing for a model to add to them —
     only something to get wrong. They also happen to be the answers a
     bored visitor can generate endlessly, so not spending a call on
     them is the cheap thing as well as the safe one. */
  const NOT_WORTH_A_MODEL = ["greeting", "thanks"];
  const NOTHING_RETRIEVED = ["unknown", "unsure"];

  if (!provider || NOT_WORTH_A_MODEL.indexOf(found.id) >= 0) {
    return NextResponse.json({ ...found, phrased: false });
  }

  /* Nothing on the page matched, so the question is probably not about
     him — "what is Flutter?", "what does a solutions architect do?".
     The second lane answers those from the model's own knowledge and is
     forbidden from saying anything about him. If it slips, or the
     allowance is spent, the honest refusal is still there. */
  if (NOTHING_RETRIEVED.indexOf(found.id) >= 0) {
    if (!allowedOpen(who)) return NextResponse.json({ ...found, phrased: false, why: "open lane rate limited" });
    try {
      const reply = await fetch(provider.url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
        body: JSON.stringify({
          model: provider.model,
          messages: buildOpenMessages(question, body.history),
          max_tokens: 200,
          temperature: 0.5,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!reply.ok) throw new Error(`provider said ${reply.status}`);
      const json = await reply.json();
      const said = json?.choices?.[0]?.message?.content;
      if (!saysNothingAboutHim(said)) throw new Error("open answer spoke for him");
      return NextResponse.json({ ...found, text: String(said).trim(), id: "open", phrased: true, lane: "open" });
    } catch (err) {
      return NextResponse.json({
        ...found,
        phrased: false,
        why: err instanceof Error ? err.message : "provider unavailable",
      });
    }
  }

  try {
    const reply = await fetch(provider.url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
      body: JSON.stringify({
        model: provider.model,
        messages: buildMessages(question, found.context || found.text, body.history),
        max_tokens: 220,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!reply.ok) throw new Error(`provider said ${reply.status}`);
    const json = await reply.json();
    const said = json?.choices?.[0]?.message?.content;
    if (!trustworthy(said, found.context || found.text)) throw new Error("answer left the context");
    /* Retrieval found something; if the model apologises anyway it has
       failed to use what it was handed, and the retrieved sentence is
       the better answer. Only retrieval gets to say "I don't know". */
    if (looksLikeRefusal(said)) throw new Error("model refused an answer retrieval had");
    return NextResponse.json({ ...found, text: String(said).trim(), phrased: true });
  } catch (err) {
    /* Down, out of credit, slow, or off-script: the retrieved answer is
       right here and is still true.
     *
     * `why` is returned so the fallback is visible while setting this
     * up — "provider said 404" is a wrong model id, "answer left the
     * context" is the model ignoring its brief, and a timeout is a
     * timeout. It carries no key and no visitor data. */
    return NextResponse.json({
      ...found,
      phrased: false,
      why: err instanceof Error ? err.message : "provider unavailable",
    });
  }
}
