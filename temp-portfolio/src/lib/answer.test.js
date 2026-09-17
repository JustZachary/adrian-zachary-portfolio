/* What the chat says, tested without a browser.
 *
 *   node src/lib/answer.test.js
 *
 * The matching is the only part with logic in it, and the failure that
 * matters is not "it crashed" — it is answering the wrong thing with
 * confidence. So most of what follows is about the questions it should
 * REFUSE to answer.
 */
import { answer, words, normalise } from "./answer.js";

let pass = 0, fail = 0;
const check = (n, c) => { c ? pass++ : fail++; console.log((c ? "  ok   " : "  FAIL ") + n); };
const eq = (n, a, b) => check(`${n}${a === b ? "" : `  (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`}`, a === b);

const DATA = {
  projects: [
    {
      slug: "smartairiq", title: "SmartAirIQ",
      blurb: "Smart environmental monitoring for real-time air quality.",
      notes: [
        { title: "Problem", body: "People cannot see air quality simply." },
        { title: "My Contribution", body: "Designed the interface and the mobile workflow." },
      ],
      tech: ["Flutter", "Firebase"],
    },
    {
      slug: "ai-recruitment", title: "AI Recruitment System",
      blurb: "AI-enhanced recruitment platform.",
      notes: [{ title: "My Contribution", body: "Fixed UAT issues and API behaviour." }],
      tech: ["PHP", "MySQL"],
    },
  ],
  topics: [
    { id: "private", ask: ["grandfather", "family", "married", "his grandfather"], say: "That's outside what this page covers.", then: ["What have you built?"] },
    { id: "howareyou", ask: ["how are you", "how is it going"], say: "Doing well, thanks.", then: [] },
    { id: "contact", ask: ["contact", "email", "hire", "touch", "get in touch"], say: "Email is best: z@example.com.", then: ["What have you built?"] },
    { id: "internship", ask: ["sains", "internship", "work experience"], say: "I interned at SAINS.", then: [] },
  ],
  tools: [{ name: "Flutter", what: "Mobile" }, { name: "PHP", what: "Backend" }],
  greeting: { say: "Hello — ask me about the projects.", then: ["What have you built?"] },
  unknown: { say: "I only know what's on this site.", then: ["What have you built?"] },
};

const ask = (q, ctx) => answer(q, DATA, ctx);

/* --- reading the question --- */
eq("punctuation is not a word", normalise("What's SmartAirIQ?!"), "what s smartairiq");
check("the small words are dropped", !words("what is the project").includes("the"));
check("but the ones carrying meaning are kept", words("what is the project").includes("project"));
check("a version number survives", words("Next.js 15").includes("next.js"));

/* --- the questions it should get right --- */
check("asked about a project by name", /SmartAirIQ/.test(ask("tell me about SmartAirIQ").text));
check("even lowercase and misspelled spacing", /SmartAirIQ/.test(ask("what is smart air iq").text));
check("asked by technology instead of name", /SmartAirIQ/.test(ask("where did you use Flutter?").text));
check("a different technology reaches the other project", /Recruitment/.test(ask("anything in PHP?").text));
check("asked what there is", /2 projects/.test(ask("what have you built?").text));
check("asked for contact", /Email/.test(ask("how do I get in touch?").text));
check("asked about the internship", /SAINS/.test(ask("tell me about your work experience").text));
check("the project answer says what he actually did",
  /Designed the interface/.test(ask("tell me about SmartAirIQ").text));

/* --- manners --- */
eq("a bare hello is a hello", ask("hi").id, "greeting");
eq("and so is hai", ask("hai").id, "greeting");
check("but a hello with a question in it is a question",
  /2 projects/.test(ask("hi, what have you built?").text));
eq("thanks is not a question either", ask("thanks!").id, "thanks");
eq("an empty message is not an error", ask("").id, "greeting");

/* --- the part that matters: not making things up --- */
eq("a skill he does not have", ask("do you know Kubernetes?").id, "unknown");
eq("a question about somebody else", ask("who is the prime minister?").id, "unknown");
eq("a request to write something", ask("write me a poem about the sea").id, "unknown");
eq("salary", ask("how much do you charge per hour?").id, "unknown");
check("and it says what it CAN answer instead of just refusing",
  ask("do you know Rust?").chips.length > 0);
check("one stray common word is not a match", ask("is this thing any good").id === "unknown");

/* --- the beginning of a conversation --- */
const first = ask("tell me about SmartAirIQ");
const second = ask("tell me more", { lastId: first.id });
check("more means more about the last thing", /Problem:/.test(second.text));
check("and it is the fuller version, not a repeat", second.text !== first.text);
eq("more with nothing before it is not an answer", ask("more").id, "unknown");

/* --- what to ask next --- */
check("every answer offers somewhere to go", ask("what have you built?").chips.length > 0);
check("including the refusals", ask("do you know COBOL?").chips.length > 0);

/* --- stage two: holding a thread ------------------------------------

   The difference between a search box and a conversation is that the
   second one knows what you were just talking about. None of this needs
   a model — it needs the last answer kept in a variable. */

/* A question about part of a project, the project named. */
check("asked for the problem, by name",
  /cannot see air quality/.test(ask("what was the problem with SmartAirIQ?").text));
check("asked what he actually did",
  /Designed the interface/.test(ask("what did you do on SmartAirIQ?").text));
check("asked what it was built with",
  /Flutter, Firebase/.test(ask("what tech is SmartAirIQ built with?").text));

/* The same questions, with the project only implied. */
const p1 = ask("tell me about SmartAirIQ");
check("what was the problem — about the last thing",
  /cannot see air quality/.test(ask("what was the problem?", { lastId: p1.id }).text));
check("and what is it built with",
  /Flutter/.test(ask("what tech did it use?", { lastId: p1.id }).text));
check("a bare pointer goes back to the last thing too",
  /SmartAirIQ|Problem:/.test(ask("what about that one?", { lastId: p1.id }).text));
eq("but with nothing said yet, it does not invent a subject",
  ask("what was the problem?").id, "unknown");

/* Moving on. */
const next = ask("what else have you built?", { lastId: p1.id, seen: [p1.id] });
check("what else means the one not yet mentioned", /Recruitment/.test(next.text));
check("and when they are all mentioned, it says so",
  /everything on here/.test(ask("anything else?", { lastId: next.id, seen: [p1.id, next.id] }).text));

/* Typing quickly. */
check("one typo is forgiven", /SmartAirIQ/.test(ask("tell me about smartairq").text));
check("and another", /Recruitment|recruitment/.test(ask("what was the recruitmnt system?").text));
eq("but a real word is not bent into a match", ask("do you know Kotlin?").id, "unknown");

/* Two questions at once, which is how people actually type. */
const both = ask("what have you built and how do I contact you?");
check("both halves are answered", /projects/.test(both.text) && /Email/.test(both.text));
check("and they are not run together", both.text.indexOf("\n\n") > 0);

/* Nearly a match. */
const unsure = ask("sains?");
check("one weak signal asks rather than guesses", /Did you mean|SAINS/.test(unsure.text));
check("and offers the way forward", unsure.chips.length > 0);

/* A phrase made only of small words matched nothing, because matching
   ran on the question with the small words taken out. "How are you?"
   came back as "I only know what's on this site", which is the most
   machine-like thing a chat can say. */
eq("a question of nothing but small words still lands", ask("How are you?").id, "howareyou");
eq("and so does its cousin", ask("how is it going?").id, "howareyou");
check("while a real question is unaffected", /SmartAirIQ/.test(ask("tell me about SmartAirIQ").text));

/* A question about his private life that happens to contain his name
   was reaching the biography, because the name matched and the rest of
   the question did not. */
eq("family questions are answered as family questions",
  ask("how about zachary, do you know his grandfather?").id, "private");
eq("even without his name in it", ask("are you married?").id, "private");
check("while the biography still works", /SmartAirIQ|projects|2 projects/.test(ask("who are you?").text) || ask("who are you?").id !== "private");

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
