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
