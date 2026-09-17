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
    ask: ["study", "studies", "student", "degree", "university", "graduate", "education", "school", "course", "ukm", "universiti", "kebangsaan", "major", "what did you study"],
    say: "Software Engineering (Information Systems) at UKM — Universiti Kebangsaan Malaysia. Most of what's on this site came out of it: SmartAirIQ was the final-year project, and the recruitment work was the industrial internship at SAINS.",
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
    id: "where",
    ask: ["where are you", "where do you live", "based", "location", "city", "located", "kl", "selangor", "malaysia", "sarawak", "relocate", "remote", "onsite", "office"],
    say: "I'm from Sibu, Sarawak originally, and I'm in the Klang Valley now — working in Petaling Jaya and staying in Ara Damansara.",
    then: ["What have you built?", "How do I contact you?"],
  },
  {
    id: "now",
    ask: ["where do you work", "current job", "currently working", "mfinity", "who do you work for", "your company", "employer", "day job", "working now"],
    say: "I'm at Mfinity Technologies at the moment, working on internal systems and AI-assisted workflows. The projects on this page are the ones I can show publicly.",
    then: ["What have you built?", "What are you learning?"],
  },
  {
    id: "contact",
    ask: ["contact", "email", "reach", "reach out", "touch", "get in touch", "hire", "hiring",
      "linkedin", "github", "cv", "resume", "talk", "message", "available", "availability",
      "opportunity", "opportunities", "freelance", "connect",
      /* "are you looking for work" is a question about availability, not
         about the work already done — and the second reading is what it
         landed on before these were here. */
      "looking for work", "looking for a job", "open to work", "open to opportunities",
      "position", "vacancy", "employment", "recruiting", "role", "roles", "join"],
    say: `Email is best: ${FACTS.email}. I'm also on GitHub (JustZachary) and LinkedIn, and my CV is downloadable from the Summon Me section at the bottom of this page. I'm working at Mfinity Technologies at the moment, so it's worth saying what it's about.`,
    then: ["What have you built?", "Where are you based?"],
  },
  {
    id: "site",
    ask: ["this site", "website", "portfolio", "built this", "made this", "runes", "theme", "design"],
    say: "This site is Next.js and Tailwind, deployed on Vercel. The runic theme is mine — a portfolio that looks like every other portfolio is a portfolio nobody remembers. The projects on it come from a single data file, so the page and this chat always agree.",
    then: ["What have you built?", "What do you work with?"],
  },
];

/* The things people say to a chat box that are not questions about the
   work. Left out, every one of them gets "I only know what's on this
   site", which is technically true and reads like a machine. */
export const SMALL_TALK = [
  {
    id: "bot",
    ask: ["are you real", "are you a bot", "bot", "ai", "human", "really you", "chatgpt", "robot", "is this you", "automated"],
    say: "Straight answer: this is a small chat on my site, not me typing. It only knows what is written on this page — for anything else, my email is at the bottom.",
    then: ["What have you built?", "How do I contact you?"],
  },
  {
    id: "howareyou",
    ask: ["how are you", "how you doing", "how is it going", "you good", "whats up"],
    say: "Doing well — mostly deep in cloud architecture reading at the moment. What can I tell you about the work?",
    /* "tell me more" after small talk used to fall through to a
       refusal, which reads as a door closing mid-sentence. */
    deep: "It's the AWS Solutions Architect certification I'm working towards, so a lot of architecture and deployment reading around it. The projects on here are the practical side of the same thing.",
    then: ["What have you built?", "What are you learning?"],
  },
  {
    id: "compliment",
    ask: ["nice site", "cool site", "love the design", "great portfolio", "nice work", "impressive", "awesome", "beautiful"],
    say: "Thank you — the runes were the fun part. Have a look at the projects while you're here.",
    then: ["What have you built?", "How do I contact you?"],
  },
  {
    id: "why",
    ask: ["why software", "why engineering", "what do you enjoy", "what drives you", "passion", "motivation", "enjoy most"],
    say: "The part I like is when a system takes a real workflow problem off somebody's desk — that's why the projects here are monitoring and recruitment rather than demos.",
    deep: "SmartAirIQ came out of people not being able to see air quality information simply, and the recruitment work was HR teams reading resumes by hand. Both are the same shape of problem: something tedious that a system should be carrying.",
    then: ["What have you built?", "What are you learning?"],
  },
  {
    id: "bye",
    ask: ["bye", "goodbye", "see you", "later", "cheers", "thats all", "that is all", "nothing else"],
    say: "Good talking to you. The email and CV are at the bottom of the page if anything comes up.",
    then: ["How do I contact you?"],
  },
];

/* Said when somebody only says hello. */
export const GREETING = {
  say: "Hello — ask me about my projects, the tools I work with, or how to get in touch.",
  then: ["What have you built?", "What do you work with?", "How do I contact you?"],
};

/* Said when nothing matches. Never a guess: it says what it does know. */
export const UNKNOWN = {
  say: "I don't have that on here. I can tell you about my projects, the tools behind them, the SAINS internship, or how to reach me.",
  then: ["What have you built?", "What do you work with?", "How do I contact you?"],
};
