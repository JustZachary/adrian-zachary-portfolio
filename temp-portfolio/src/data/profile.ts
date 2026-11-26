/* Everything about me that the page shows, as data.
 *
 * The page reads this file and src/data/projects.ts. To change what a
 * recruiter sees, change the words here; there is no layout code to touch.
 * Lines marked CHECK are guesses from the CV that need confirming.
 */

export const PROFILE = {
  name: "Adrian Zachary",
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
  photo: "/my_picture.jpg",
};

/* The 30-second version, top of the page. One line each. */
export const QUICK_FACTS: { label: string; value: string }[] = [
  { label: "Now", value: "Automation & AI tools for the mlabs group of companies" },
  { label: "Degree", value: "B.SE (Information Systems), UKM 2026 · CGPA 3.31 · Dean's List ×2" },
  { label: "Internship", value: "Junior PHP Developer, SAINS · 5 months" },
  { label: "Stack", value: "TypeScript, React / Next.js, Node.js, PHP, SQL, Flutter" },
  { label: "Studying", value: "AWS Solutions Architect – Associate" },
];

export type Job = { role: string; org: string; place: string; when: string; points: string[]; tech?: string[] };

export const EXPERIENCE: Job[] = [
  {
    role: "Software engineer, automation & AI", // CHECK: exact title
    org: "mlabs group (mfinity · ikhlas · mlabs · Swapp Asia)",
    place: "Petaling Jaya",
    when: "2026 – now", // CHECK: start month
    points: [
      "Built a crawler that checks government tender listings every weekday and posts new matches to the team.",
      "Built a WhatsApp AI assistant that answers customers from the company's own pages, in Malay or English.",
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
  { group: "Languages", items: ["TypeScript", "JavaScript", "PHP", "SQL", "Java", "Dart", "C++"] },
  { group: "Web", items: ["React", "Next.js", "Tailwind CSS", "HTML & CSS", "three.js"] },
  { group: "Backend & data", items: ["Node.js", "REST APIs", "MySQL", "SQLite", "Firebase"] },
  { group: "Mobile", items: ["Flutter", "Android Studio"] },
  { group: "Ops & cloud", items: ["Linux", "Nginx", "Git & GitHub", "Vercel", "AWS (studying SAA)"] },
  { group: "Design & 3D", items: ["Figma", "Blender", "Canva", "DaVinci Resolve"] },
];
