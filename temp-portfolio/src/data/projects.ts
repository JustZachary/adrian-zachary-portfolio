/* The work, as data.
 *
 * The page draws every project from this list as a card that opens into a
 * case file (and the /desktop easter egg draws the same list as icons). Adding a
 * project is appending an object here; there is no layout code to touch.
 *
 *   icon   one of the pixel icons in src/components/icons.tsx
 *   tile   the colour of the square behind the icon
 *   notes  Problem / Solution / My Contribution / Outcome, in that order
 *   images files in public/, referenced by filename alone
 */

export type Note = { title: string; body: string };

export type Project = {
  slug: string;
  title: string;
  /* A short label shown on the window and in the folder status line. */
  kind: string;
  /* Which filter it sits under on the page: built at work, or study and internship. */
  area: "work" | "study";
  icon: IconName;
  tile: string;
  blurb: string;
  notes: Note[];
  tech: string[];
  badges?: string[];
  images?: string[];
  /* Tall phone screenshots sit in a row; wide ones fill the window. */
  imageShape?: "phone" | "wide";
  links?: { label: string; href: string }[];
  caseStudy?: Note[];
};

export type IconName = "tower" | "chat" | "door" | "post" | "phone" | "resume" | "folder" | "trash" | "text" | "mail" | "game" | "pdf";

export const PROJECTS: Project[] = [
  {
    slug: "tender-watch",
    title: "Tender Watch",
    kind: "Automation",
    area: "work",
    icon: "tower",
    tile: "#FFC93C",
    blurb: "A crawler that reads government tender listings every weekday and posts new matches to a shared team board.",
    notes: [
      { title: "Problem", body: "New tenders appear on a government portal every day, and checking it by hand meant good opportunities slipped past." },
      { title: "Solution", body: "A headless-browser crawler runs on a schedule on the company server, collects new listings and recently awarded contracts, and posts them to an internal board." },
      { title: "My Contribution", body: "Built the crawler, its schedule and the board feed. It only ever reads: it never presses anything that would write to the portal." },
      { title: "Outcome", body: "The team starts each morning with a fresh list of matching tenders instead of searching for them." },
    ],
    tech: ["Node.js", "Playwright", "Cron", "Nginx"],
    badges: ["Internal tool", "Not public"],
  },
  {
    slug: "sales-desk",
    title: "WhatsApp AI sales desk",
    kind: "AI",
    area: "work",
    icon: "chat",
    tile: "#3DD6A3",
    blurb: "An assistant that answers customers on WhatsApp from the company's own pages, short and polite, in Malay or English.",
    notes: [
      { title: "Problem", body: "Customers ask the same questions on WhatsApp all day, and every answer waited for someone to be free." },
      { title: "Solution", body: "An assistant grounded in the company's own website and documents, so it answers from real information rather than guessing." },
      { title: "My Contribution", body: "Designed the retrieval, the message bridge and the rules it follows: never quote a price, hand money and renewals to a person, keep replies short." },
      { title: "Outcome", body: "Routine questions get an answer straight away, and the ones that need a person reach a person." },
    ],
    tech: ["Node.js", "Retrieval", "LLM API", "Webhooks"],
    badges: ["Internal tool"],
  },
  {
    slug: "worker-portal",
    title: "Worker portal",
    kind: "Internal tool",
    area: "work",
    icon: "door",
    tile: "#E9E3FF",
    blurb: "One sign-in in front of four companies' internal apps, with roles that decide which workspaces each person sees.",
    notes: [
      { title: "Problem", body: "Staff across four related companies each had their own tools, links and logins." },
      { title: "Solution", body: "A single hub with sign-in, roles and a workspace switcher. People can request an account for their company, and an admin approves it." },
      { title: "My Contribution", body: "Designed and built it end to end as a small, dependency-free Node app with SQLite, then deployed it on the company's Linux server behind Nginx." },
      { title: "Outcome", body: "One place to start the work day, and a live demo of what the group can automate for its own clients." },
    ],
    tech: ["Node.js", "SQLite", "Nginx", "Linux"],
    badges: ["Internal tool"],
  },
  {
    slug: "post-engine",
    title: "Post Engine",
    kind: "Content",
    area: "work",
    icon: "post",
    tile: "#FF5A36",
    blurb: "One idea in, ready posts out for Instagram, Facebook, TikTok and Threads, with written captions, pictures and short video.",
    notes: [
      { title: "Problem", body: "Posting to every platform meant rewriting each idea several times and making the pictures by hand." },
      { title: "Solution", body: "A web app where one idea becomes captions shaped for each platform, generated images and short videos, with a calendar and an engagement dashboard." },
      { title: "My Contribution", body: "Built the app and its AI pipeline, with a free starter setup for demos and a full version on paid models." },
      { title: "Outcome", body: "A working tool with scheduling and auto-posting built in, ready to switch on when the team decides to go live." },
    ],
    tech: ["Node.js", "AI text", "Image & video APIs"],
  },
  {
    slug: "smartairiq",
    title: "SmartAirIQ",
    kind: "Final year project",
    area: "study",
    icon: "phone",
    tile: "#BFEFFF",
    blurb: "A mobile app for real-time air quality, weather and simple precautions, shown on a map.",
    notes: [
      { title: "Problem", body: "People often lack simple access to real-time air quality information in a clear, readable format." },
      { title: "Solution", body: "A mobile app that shows air quality, weather and location-based monitoring on a map." },
      { title: "My Contribution", body: "Designed the interface, structured the mobile workflow and worked on the frontend integration with Flutter and Firebase." },
      { title: "Outcome", body: "A cleaner, more user-friendly way to read environmental information on a phone." },
    ],
    tech: ["Flutter", "Firebase", "Google Maps", "Air Quality API"],
    images: ["smartairiq-1.jpeg", "smartairiq-2.jpeg", "smartairiq-3.jpeg", "smartairiq-4.jpeg"],
    imageShape: "phone",
    caseStudy: [
      { title: "Project goal", body: "Give people a simple mobile interface for air quality, location-based monitoring and basic precaution guidance." },
      { title: "System design", body: "Mobile first: Flutter for the interface, Firebase for backend support and Google Maps for location-based views." },
      { title: "Key challenge", body: "Showing environmental data, a map and precautions together without overwhelming the user." },
      { title: "What I learned", body: "Mobile UI structure, user flow planning, Firebase-based architecture, and turning raw environmental data into something useful." },
    ],
  },
  {
    slug: "ai-recruitment",
    title: "AI recruitment system",
    kind: "Internship · SAINS",
    area: "study",
    icon: "resume",
    tile: "#FBF1DA",
    blurb: "An enterprise recruitment platform with AI resume analysis and interview question generation.",
    notes: [
      { title: "Problem", body: "Screening is slow when HR teams review every resume by hand against the job requirements." },
      { title: "Solution", body: "AI-assisted resume matching and interview question generation inside the recruitment workflow." },
      { title: "My Contribution", body: "Fixed UAT issues, investigated AI feature problems, refined system behaviour and worked on API improvements." },
      { title: "Outcome", body: "Clearer and faster applicant screening in an enterprise recruitment system." },
    ],
    tech: ["PHP", "MySQL", "AI integration", "API"],
    badges: ["Enterprise project", "Internship"],
    images: ["ai-recruitment.png"],
    imageShape: "wide",
  },
];

/* Z Lab: the games and experiments, each playable at its own URL. */
export const ZLAB_URL = "https://z-lab-kappa.vercel.app/";
export type Game = { slug: string; title: string; line: string; thumb: string; tech: string };
export const GAMES: Game[] = [
  { slug: "wick", title: "Wick", line: "A tiny candle crosses a long night. Bridges only exist where its light reaches.", thumb: "wick.webp", tech: "Canvas · pixel art" },
  { slug: "mossbrook", title: "Mossbrook", line: "A cozy pixel village: farm, fish, sell at the stall, pet the dog.", thumb: "mossbrook.webp", tech: "Canvas · pixel art" },
  { slug: "laju", title: "Laju", line: "Crash racing through a city at golden hour. Takedowns, boost, aftertouch.", thumb: "laju.webp", tech: "three.js · Blender" },
  { slug: "harrowsend", title: "Harrow's End", line: "A small open-world horror town at night, with a flashlight and a car to fix.", thumb: "harrowsend.webp", tech: "three.js · Blender" },
  { slug: "beatgarden", title: "Beat Garden", line: "Tap in time and every hit plants a glowing seed.", thumb: "beatgarden.webp", tech: "Canvas · WebAudio" },
  { slug: "dreamjar", title: "Dreamjar", line: "A cozy idle game with sleepy sheep and a friends board.", thumb: "dreamjar.webp", tech: "Canvas · serverless" },
];
