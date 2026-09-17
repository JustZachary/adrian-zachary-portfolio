/* Everything the site knows that is not a project.
 *
 * Written as data for the same reason the projects are: the page and
 * the chat both read it, so they cannot end up saying different things
 * about the same person.
 *
 * Every line here is something true that is already on the site. If it
 * is not on the site, it does not go here — the whole promise of this
 * chat is that it never invents anything about me.
 */

export const FACTS = {
  name: "Adrian Zachary bin Ian",
  short: "Zach",
  role: "Software Engineer",
  email: "adrianzachary825@gmail.com",
  github: "https://github.com/JustZachary",
  linkedin: "https://www.linkedin.com/in/adrian-zachary-ian-2a4748181/",
  resume: "/adrian_zachary_resume.pdf",
};

/* The tools, as the Arsenal section lists them. */
export const TOOLS = [
  { name: "PHP", what: "Backend development" },
  { name: "Laravel", what: "Web framework" },
  { name: "MySQL", what: "Database management" },
  { name: "Flutter", what: "Mobile app development" },
  { name: "Firebase", what: "Backend services" },
  { name: "GitHub", what: "Version control" },
  { name: "API", what: "API integration" },
  { name: "Next.js", what: "Frontend framework" },
];

/* Answers to the things people actually ask a portfolio, in the order
   they tend to ask them. `ask` is what a visitor might type — spelling
   variants included on purpose, because that is how people type. */
export const TOPICS = [
  {
    id: "who",
    ask: ["who are you", "about", "introduce", "yourself", "bio", "background", "adrian", "zachary", "zach"],
    say: "I'm Adrian Zachary bin Ian — Zach. Software Engineering, with hands-on work in web development, AI-assisted systems and enterprise workflows, including an internship at Sarawak Information Systems (SAINS). I like building systems that solve a real workflow problem rather than demos.",
    then: ["What have you built?", "What do you work with?", "How do I contact you?"],
  },
  {
    id: "studies",
    ask: ["study", "studies", "student", "degree", "university", "graduate", "education", "school", "course"],
    say: "Software Engineering. Most of what's on this site came out of it — SmartAirIQ was the final-year project, and the recruitment work was the industrial internship at SAINS.",
    then: ["Tell me about SmartAirIQ", "What did you do at SAINS?"],
  },
  {
    id: "tools",
    ask: ["tools", "tech", "stack", "skills", "technologies", "languages", "know", "use", "familiar", "experience with"],
    say: "PHP and Laravel with MySQL on the backend; Flutter and Firebase for mobile; Next.js on the frontend; API integration throughout; Git for version control.",
    then: ["Where did you use Flutter?", "Where did you use PHP?", "What are you learning now?"],
  },
  {
    id: "aws",
    ask: ["aws", "cloud", "certification", "certificate", "certified", "learning", "studying now", "current"],
    say: "I'm preparing for the AWS Certified Solutions Architect — Associate, and building out cloud architecture and deployment knowledge alongside it.",
    then: ["What have you built?", "Are you looking for work?"],
  },
  {
    id: "internship",
    ask: ["sains", "internship", "intern", "work experience", "job", "employed", "company", "enterprise"],
    say: "I interned at Sarawak Information Systems (SAINS), working on an AI-enhanced recruitment platform — UAT fixes, investigating AI feature issues, and API-related improvements on a system real HR teams use.",
    then: ["Tell me about the recruitment system", "What tech was that in?"],
  },
  {
    id: "contact",
    ask: ["contact", "email", "reach", "reach out", "touch", "get in touch", "hire", "hiring", "linkedin", "github", "cv", "resume", "talk", "message", "available", "availability", "opportunity", "opportunities", "freelance", "connect"],
    say: `Email is best: ${FACTS.email}. I'm also on GitHub (JustZachary) and LinkedIn, and my CV is downloadable from the Summon Me section at the bottom of this page. Open to software engineering roles, internships and collaborative projects.`,
    then: ["What have you built?", "Where are you based?"],
  },
  {
    id: "site",
    ask: ["this site", "website", "portfolio", "built this", "made this", "runes", "theme", "design"],
    say: "This site is Next.js and Tailwind, deployed on Vercel. The runic theme is mine — a portfolio that looks like every other portfolio is a portfolio nobody remembers. The projects on it come from a single data file, so the page and this chat always agree.",
    then: ["What have you built?", "What do you work with?"],
  },
];

/* Said when somebody only says hello. */
export const GREETING = {
  say: "Hello — ask me about Zach's projects, the tools he works with, or how to get in touch.",
  then: ["What have you built?", "What do you work with?", "How do I contact you?"],
};

/* Said when nothing matches. Never a guess: it says what it does know. */
export const UNKNOWN = {
  say: "I only know what's on this site, and that one isn't on it. I can tell you about the projects, the tools behind them, the SAINS internship, or how to get in touch.",
  then: ["What have you built?", "What do you work with?", "How do I contact you?"],
};
