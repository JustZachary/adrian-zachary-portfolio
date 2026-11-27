/* Everything about me that the page shows, as data.
 *
 * The page reads this file and src/data/projects.ts. To change what a
 * recruiter sees, change the words here; there is no layout code to touch.
 * Lines marked CHECK are guesses from the CV that need confirming.
 */

export const PROFILE = {
  name: "Adrian Zachary",
  /* What the big hello calls you: "Hi, I'm Zach." Use "Zachary" for the longer one. */
  nickname: "Zach",
  role: "Software engineer",
  location: "Petaling Jaya, Malaysia",
  /* One sentence under the name. Keep it about what you do, not adjectives. */
  intro:
    "I build automation and AI tools that save teams hours of manual work. After hours I make browser games, and you can play them on this page.",
  /* Shown as a small badge in the hero. Leave empty to hide it. */
  availability: "",
  email: "adrianzachary825@gmail.com",
  github: "https://github.com/JustZachary",
  linkedin: "https://www.linkedin.com/in/adrian-zachary-ian-2a4748181/",
  resume: "/adrian_zachary_resume.pdf",
  photo: "/my_picture.webp",
  /* The colour theme visitors see first: "sunset" or "holo" (people in dark mode get
     "night"). They can cycle themes with the round button in the top bar. The favicon
     files in src/app/ are drawn for Sunset. */
  theme: "sunset" as "sunset" | "holo" | "night",
};

/* The CV page (/cv) and the PDF made from it. The rest of the CV comes from the lists
   below (experience, education, skills, awards) and from the projects file. */
export const CV = {
  summary:
    "Software engineer and UKM Software Engineering (Information Systems) graduate, class of 2026. I build automation and AI tools for the Mlabs Group of companies: a government-tender crawler, a WhatsApp AI assistant, a single sign-in portal for four companies' internal apps and a social content engine. Before that, five months on enterprise PHP systems for the Sarawak state government at SAINS. Studying for AWS Solutions Architect – Associate.",
  /* Shown on the CV page and PDF only, never on the portfolio page. Leave "" to hide. */
  phone: "+60 13-286 0843",
  website: "adrian-zachary-portfolio.vercel.app",
  /* The three projects the CV tells as problem → solution → impact (slugs from projects.ts, plus Z Lab). */
  projects: ["tender-watch", "sales-desk"] as string[],
  zlab: {
    problem: "Clients find it hard to picture what an interactive website could do for them before they commit.",
    solution: "Built Z Lab in my own time: browser games and interactive 3D sites using Blender models, three.js, Canvas and Web Audio.",
    impact: "38 games and sites live and playable, used as a showcase for client work.",
    tech: ["Blender", "three.js", "Canvas", "Web Audio", "Vercel"],
  },
  /* Spoken languages, CV only. */
  languages: [
    { name: "Bahasa Malaysia", level: "Fluent" },
    { name: "English", level: "Fluent" },
    { name: "Chinese", level: "Beginner" },
  ],
};

/* The 30-second version, top of the page. One line each. */
export const QUICK_FACTS: { label: string; value: string }[] = [
  { label: "Now", value: "Automation & AI tools for the Mlabs Group of companies" },
  { label: "Degree", value: "B.SE (Information Systems), UKM 2026 · CGPA 3.31 · Dean's List ×2" },
  { label: "Internship", value: "Junior PHP Developer, SAINS · 5 months" },
  { label: "Stack", value: "TypeScript, React / Next.js, Node.js, PHP, SQL, Flutter" },
  { label: "Studying", value: "AWS Solutions Architect – Associate" },
];

/* "How I work": a few lines in your own words, beside the 3D logo. Rewrite freely. */
export const ABOUT = {
  paragraphs: [
    "I like the problems a team runs into every day: checking a portal by hand, answering the same question for the tenth time, logging in to five different places. I build the small tool that makes that go away, then watch how people actually use it and fix what gets in their way.",
    "After hours I make games and 3D sites, mostly to learn: Blender for the models, three.js and Web Audio in the browser. The logo here is one of them. Drag it, or smash it.",
  ],
  principles: ["Automate the boring part", "Ship small, then improve", "Make it fun to use", "Read the logs, not the guesses"],
};

/* The four numbers under the hero; they count up when they scroll into view. */
export const STATS: { value: number; suffix?: string; label: string }[] = [
  { value: 4, label: "internal tools built at work" },
  { value: 34, label: "browser games and 3D sites on Z Lab" },
  { value: 2, suffix: "×", label: "Dean's List at UKM" },
  { value: 5, label: "months on government systems at SAINS" },
];

export type Job = { role: string; org: string; place: string; when: string; points: string[]; cvPoints?: string[]; tech?: string[]; cv?: false };

export const EXPERIENCE: Job[] = [
  {
    role: "Software engineer, automation & AI", // CHECK: exact title
    org: "Mlabs Group (Mfinity · Ikhlas · Mlabs · Swapp Asia)",
    place: "Petaling Jaya",
    when: "2026 – now", // CHECK: start month
    points: [
      "Built a crawler that checks government tender listings every weekday and posts new matches to the team.",
      "Built a WhatsApp AI assistant that answers customers from the company's own pages, in Malay or English.",
      "Built and deployed one sign-in portal in front of four companies' internal apps, with roles per workspace.",
      "Built Post Engine: one idea in, ready posts out for four social platforms, with images and short video.",
    ],
    cvPoints: [ // the CV's shorter version: Tender Watch and the WhatsApp desk get their own Projects entries
      "Build and run the group's automation and AI tools, including a daily government-tender crawler and a WhatsApp AI assistant for customers (see Projects).",
      "Built and deployed one sign-in portal in front of four companies' internal apps, with roles per workspace.",
      "Built Post Engine: one idea in, ready posts out for four social platforms, with images and short video.",
    ],
    tech: ["Node.js", "Playwright", "SQLite", "Nginx", "Linux", "LLM APIs"],
  },
  {
    role: "Junior PHP Developer (Intern)",
    org: "Sarawak Information Systems (SAINS)",
    place: "Kuching",
    when: "Sep 2025 – Jan 2026",
    points: [
      "Worked on two enterprise PHP systems for Sarawak state government: a citizen services portal and an HR/admin system.",
      "Supported an AI recruitment platform: fixed UAT issues, investigated AI feature behaviour and improved its APIs.",
      "Built new UI pages and form components, integrated third-party APIs, and maintained SQL schemas and data.",
    ],
    tech: ["PHP", "MySQL", "JavaScript", "REST APIs"],
  },
  {
    role: "Cashier / Event Operations Assistant (part-time)",
    org: "UKM Esport Arena",
    place: "Bangi",
    when: "Mar 2024 – Apr 2025",
    points: ["Ran POS and tournament logistics alongside full-time study."],
    cv: false, // shown on the website, left off the CV
  },
];

export const EDUCATION = [
  {
    school: "Universiti Kebangsaan Malaysia (UKM)",
    what: "Bachelor of Software Engineering (Information Systems) with Honours",
    when: "2022 – 2026",
    detail: "Graduated 25 November 2026 · CGPA 3.31 · Dean's List Sem 2 2024/25 (GPA 3.89) and Sem 1 2025/26 (GPA 3.84)",
  },
  {
    school: "Kolej Matrikulasi Selangor",
    what: "Matriculation, Computer Science",
    when: "2021 – 2022",
    detail: "CGPA 3.75",
  },
];

export const AWARDS = [
  "Gold Medal, Training of Trainers Programme (2024)",
  "Cabaran DJI Robomaster, robotics competition (2023)",
  "Facilitator, Minggu Apresiasi Watan, Kolej Pendeta Za'ba (2024)",
  "Community service: Smart Study Kits, Mobiliti Orang Asli, Misi Bantuan (2023–2024)",
];

export const SKILLS: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "PHP", "SQL", "Java", "Dart", "C++", "Bash"] },
  { group: "Web & mobile", items: ["React", "Next.js", "Tailwind CSS", "HTML & CSS", "three.js", "Canvas & Web Audio", "Flutter", "Android Studio"] },
  { group: "Backend & data", items: ["Node.js", "Laravel", "REST APIs", "Webhooks", "MySQL", "SQLite", "Firebase"] },
  { group: "AI & automation", items: ["LLM APIs", "Retrieval (RAG)", "Playwright", "Cron jobs", "Telegram bots"] },
  { group: "Ops & cloud", items: ["Linux", "Nginx", "Git & GitHub", "Vercel", "AWS (studying SAA)"] },
  { group: "Design & 3D", items: ["Figma", "Blender", "Canva", "DaVinci Resolve"] },
];
