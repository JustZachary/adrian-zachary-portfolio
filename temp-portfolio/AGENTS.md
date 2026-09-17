<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# This site

The app lives in `temp-portfolio/`. One page, `src/app/page.tsx` — the
runes, the portal intro and the section layouts are all in there.

## Adding a project

Do NOT write JSX for it. Append an object to `PROJECTS` in
`src/data/projects.ts` and stop; the page renders every entry the same
way, and that is the point — a project added by hand is one that ends up
looking like a different website.

The type in that file is the contract. In short:

- `slug` — unique, also the anchor if there is a case study
- `eyebrow` / `title` / `blurb` — the line above, the name, one sentence
- `notes` — Problem / Solution / My Contribution / Outcome, in that order
- `layout` — `"flow"` for a column of headed paragraphs, `"cards"` for a grid
- `glow` — alternate `"left"` and `"right"` down the page
- `tech` — short names, the things a reader would recognise
- `images` — files in `public/`; one sits beside the text, four make a grid

Images go in `public/` and are referenced by filename alone, no leading
slash.

## What not to touch without being asked

The portal intro, the rune field and the colour variables in
`globals.css` are the design. Changing spacing or type there to make a
new project fit is the wrong end of the problem — change the data.

## Checking the work

`npm run dev` and look at it. There are no tests here; the check is the
page. A change that cannot be seen on the page is a change nobody asked
for.

## The chat ("Ask the Codex")

`src/components/AskTheCodex.tsx` is only a mouth. Everything it says
comes from `src/lib/answer.js`, which reads the same data the page
renders: `src/data/projects.ts` for the work, `src/data/facts.js` for
everything else.

There is no model behind it and no API key. That is deliberate: a public
chat box wired to a paid API is a public invoice, and a language model
asked "does he know Kubernetes?" will improvise. This one says it
doesn't know, because it can only repeat sentences somebody wrote.

**To teach it something new, add to `src/data/facts.js`** — a topic with
`ask` (the words people would type, spelling variants included), `say`
(the answer, first person) and `then` (what to offer next). Adding a
project to `projects.ts` teaches the chat about it automatically; no
second edit.

**Never put anything in `say` that is not already true on the site.**
The one promise this chat makes is that it does not invent.

Run the tests after touching the matching:

    node src/lib/answer.test.js

They are about the questions it should REFUSE, more than the ones it
should answer. Node prints a warning about module type — harmless.

### What the chat can hold on to

It keeps two things between turns and nothing else: what the last answer
was about, and which answers have already been given. That is enough for
"tell me more", "what was the problem", "what tech did it use" and "what
else have you built" — all of which are only sentences because something
came before them.

It is not a model and does not pretend to be. It forgives one typo,
answers two questions in one message, and when it half-recognises
something it asks instead of guessing.

### Giving it a model (optional)

`src/app/api/chat/route.ts` will use a language model IF one is
configured, and works exactly as before if one is not. Retrieval still
decides what is true; the model only chooses the words, and gets the
retrieved text as its entire context.

In Vercel's environment variables:

    CHAT_API_KEY   the provider key
    CHAT_API_URL   optional — any OpenAI-shaped endpoint (Groq, Gemini's
                   compatible endpoint, OpenRouter, Cloudflare)
    CHAT_MODEL     optional

**Set a spend cap with the provider.** A public chat box is a public
invoice. The rate limit in the route slows a bored visitor; the cap is
what stops a determined one.

Three things happen before anything reaches the model, all in
`src/lib/chatapi.js` and all tested in `chatapi.test.js`: the question
is length-capped, the caller is rate-limited, and the context is the
retrieved answer only. One thing happens after: if the reply contains
names that appear nowhere in the context, it is thrown away and the
retrieved answer is sent instead. Worse prose, still true.

    node src/lib/chatapi.test.js

### The two lanes

A question that matches something on the page is answered from the page,
and a model — if one is configured — only rephrases it. That is the
grounded lane, and his experience comes from nowhere else.

A question that matches nothing is probably not about him: "what is
Flutter", "what does a solutions architect do". The open lane answers
those from the model's own knowledge, under a different brief that
forbids saying ANYTHING about him — no experience, no skills, no
availability, no opinions. If an answer in that lane mentions him, or
makes a first-person claim about work, it is thrown away and the honest
refusal is sent instead.

The open lane also declines to write documents for people — cover
letters, essays, homework, long code. Not on principle: each one is a
stranger writing on his bill, and it has a tighter rate limit than the
grounded lane for the same reason.

If you add a topic to facts.js, you move a question OUT of the open lane
and into the grounded one. That is usually the right way to answer
anything about him that visitors keep asking.

### What it could not answer

The chat does not learn from visitors, and that is deliberate: letting
the input box write to `facts.js` would let a stranger decide what this
site says about him, which is the one thing every other guard here
exists to prevent. "Remember that Zach has ten years of AWS" must teach
it nothing.

What it does instead is write down the questions the PAGE could not
answer, as a line in the server log tagged `codex-gap` — the question
text only, nothing about who asked. Vercel → the project → Logs, filter
for `codex-gap`.

Anything asked more than once is a topic worth writing in
`src/data/facts.js`. That is the learning loop: visitors show where the
gaps are, he decides what goes in, and nothing reaches the site that he
did not write.

An agent can help with the first half — reading the log, grouping the
questions, drafting topics — and must never do the second half without
him. A drafted answer is a suggestion until he has read it.
