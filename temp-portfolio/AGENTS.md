<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# This site

The app lives in `temp-portfolio/`. The page is a little retro computer,
"AZ-OS": `src/components/Desktop.tsx` draws the desktop, its icons, the
windows (drag, focus, minimise, close), the taskbar and start menu, and on
phones the same windows stacked in one column. `src/app/page.tsx` only
mounts it.

## Adding a project

Do NOT write JSX for it. Append an object to `PROJECTS` in
`src/data/projects.ts` and stop; it appears as an icon in the projects
folder and opens in its own window, drawn the same way as the others.

The type in that file is the contract. In short:

- `slug` — unique; the window is titled `<slug>.txt`
- `title` / `kind` / `blurb` — the name, a short label, one sentence
- `icon` / `tile` — a pixel icon from `src/components/icons.tsx` and the colour behind it
- `notes` — Problem / Solution / My Contribution / Outcome, in that order
- `tech` — short names, the things a reader would recognise
- `images` — files in `public/`; `imageShape` "phone" for tall screenshots, "wide" otherwise
- `caseStudy` — optional extra headed notes

A Z Lab game is an entry in `GAMES` in the same file (its thumbnail in
`public/`); it plays inside the desktop in an iframe from the Z Lab site.

Images go in `public/` and are referenced by filename alone, no leading
slash.

## What not to touch without being asked

The colour variables and the pixel look in `globals.css` are the design.
Changing spacing or type there to make a new project fit is the wrong end
of the problem — change the data.

## Checking the work

`npm run dev` and look at it, on a laptop width and a phone width. There
are no tests here; the check is the page.
