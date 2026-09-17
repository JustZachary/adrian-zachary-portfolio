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
import { TOOLS, TOPICS, GREETING, UNKNOWN } from "../../../data/facts.js";
import { buildMessages, limiter, providerFrom, tooLong, trustworthy } from "../../../lib/chatapi.js";

const DATA = { projects: PROJECTS, topics: TOPICS, tools: TOOLS, greeting: GREETING, unknown: UNKNOWN };
const allowed = limiter(12);

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
  if (!provider || found.id === "greeting" || found.id === "thanks") {
    return NextResponse.json({ ...found, phrased: false });
  }

  try {
    const reply = await fetch(provider.url, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${provider.key}` },
      body: JSON.stringify({
        model: provider.model,
        messages: buildMessages(question, found.text, body.history),
        max_tokens: 220,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!reply.ok) throw new Error(`provider said ${reply.status}`);
    const json = await reply.json();
    const said = json?.choices?.[0]?.message?.content;
    if (!trustworthy(said, found.text)) throw new Error("answer left the context");
    return NextResponse.json({ ...found, text: String(said).trim(), phrased: true });
  } catch {
    /* Down, out of credit, slow, or off-script: the retrieved answer is
       right here and is still true. */
    return NextResponse.json({ ...found, phrased: false });
  }
}
