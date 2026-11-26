<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# This site

The app lives in `temp-portfolio/`. The home page is one scroll, written so a
recruiter gets the picture in thirty seconds: name, quick facts and the CV
button, then Work, Experience & education, Skills, Play (the Z Lab games,
playable in a window), Contact. `src/components/Portfolio.tsx` draws it and
`src/app/portfolio.css` styles it (every class starts with `pf-`).

The fun parts never hide content: the photo un-pixelates, the quick facts
type in, the top bar fills a coin per section seen (confetti at 100%), cards
tilt, games open in a window. They all switch off for reduced motion.

The old retro desktop, "AZ-OS", lives on at `/desktop` as an easter egg
(`src/components/Desktop.tsx`, styles in `globals.css`), linked from the
footer.

## Changing the words

Do NOT write JSX for content. Everything shown comes from two files:

- `src/data/profile.ts` — name, intro line, availability badge, links, quick
  facts, experience, education, awards, skills. Lines marked CHECK need confirming.
- `src/data/projects.ts` — projects and Z Lab games (below).

## The CV

`/cv` (`src/app/cv/`) is the CV as a web page, built from the same data files, so it
is never out of date. The downloadable PDF, `public/adrian_zachary_resume.pdf`, is printed
from it: open `/cv` in Chrome, Print, Save as PDF (A4, no headers and footers), and
replace that file. `CV` in `src/data/profile.ts` holds the summary and the phone
number, which only the CV shows.

## Achievements

`src/components/Achievements.tsx` holds the trophy list. Anything can call
`unlock("id")`; the toast, the footer shelf and the visitor's saved progress
(their own browser only) follow from that.

## Adding a project

Append an object to `PROJECTS` in `src/data/projects.ts` and stop; it
appears as a card that opens into a case file, and as an icon on `/desktop`.

The type in that file is the contract. In short:

- `slug` — unique
- `title` / `kind` / `blurb` — the name, a short label, one sentence
- `area` — `"work"` or `"study"`, which filter it sits under
- `icon` / `tile` — a pixel icon from `src/components/icons.tsx` and the colour behind it
- `notes` — Problem / Solution / My Contribution / Outcome, in that order
- `tech` — short names, the things a reader would recognise
- `images` — files in `public/`; `imageShape` "phone" for tall screenshots, "wide" otherwise
- `caseStudy` — optional extra headed notes

A Z Lab game is an entry in `GAMES` in the same file (its thumbnail in
`public/`); it plays in a window in an iframe from the Z Lab site.

Images go in `public/` and are referenced by filename alone, no leading
slash.

## What not to touch without being asked

The colour variables in `globals.css` are the design, shared by both pages.
Changing spacing or type to make a new project fit is the wrong end of the
problem — change the data.

## Checking the work

`npm run dev` and look at it, on a laptop width and a phone width, at `/`
and `/desktop`. There are no tests here; the check is the page.
