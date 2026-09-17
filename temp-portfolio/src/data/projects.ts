/* The work, as data.
 *
 * Every project used to be hand-written JSX inside a 662-line page
 * component, which meant adding one was an edit to layout code — and an
 * edit to layout code is how a portfolio ends up broken at the exact
 * moment somebody is looking at it.
 *
 * Adding a project is now appending an object to the list below. The
 * page maps over it and renders every entry the same way, so a new
 * project cannot land looking different from the others by accident.
 *
 * The fields that are not text are deliberately few:
 *   glow    which side the light comes from — alternate them down the page
 *   layout  "flow" reads as a column of headed paragraphs, "cards" as a grid
 *   images  one image sits beside the text; four make the grid
 */

export type Note = { title: string; body: string };

export type Project = {
  /* Used as the React key and, for a case study, as the anchor. */
  slug: string;
  eyebrow: string;
  title: string;
  blurb: string;
  notes: Note[];
  layout: "flow" | "cards";
  glow: "left" | "right";
  tech: string[];
  /* Small standing labels — "Enterprise Project", "Internship Project". */
  badges?: string[];
  images: string[];
  /* A single image reads better after the text on a phone and beside it
     on a laptop; a grid of four reads fine either way. */
  mediaAfterText?: boolean;
  titleGlow?: boolean;
  cta?: { label: string; target: string };
  caseStudy?: {
    eyebrow: string;
    title: string;
    intro: string;
    cards: Note[];
  };
};

export const PROJECTS: Project[] = [
  {
    slug: "smartairiq",
    eyebrow: "✦ Featured Project ✦",
    title: "SmartAirIQ",
    blurb:
      "Smart environmental monitoring system for real-time air quality tracking and visualization using mobile technologies.",
    layout: "flow",
    glow: "left",
    titleGlow: true,
    notes: [
      {
        title: "Problem",
        body: "Users often lack simple access to real-time environmental and air quality information in a clear and accessible format.",
      },
      {
        title: "Solution",
        body: "Developed a mobile-based environmental monitoring application capable of displaying air quality data, weather information, and location-based monitoring features.",
      },
      {
        title: "My Contribution",
        body: "Designed the application interface, structured the mobile workflow, and implemented frontend integration concepts using Flutter and Firebase.",
      },
      {
        title: "Outcome",
        body: "Created a cleaner and more user-friendly monitoring experience for displaying environmental information through a mobile-first interface.",
      },
    ],
    tech: ["Flutter", "Firebase", "Google Maps", "Air Quality API"],
    images: ["smartairiq-1.jpeg", "smartairiq-2.jpeg", "smartairiq-3.jpeg", "smartairiq-4.jpeg"],
    cta: { label: "View FYP Case Study", target: "case-study" },
    caseStudy: {
      eyebrow: "📖 Case Study 📖",
      title: "SmartAirIQ Project Breakdown",
      intro:
        "SmartAirIQ was developed as an academic environmental monitoring project focused on making air quality information easier to access through a mobile-based interface.",
      cards: [
        {
          title: "Project Goal",
          body: "To provide users with a simple mobile interface for viewing air quality information, location-based monitoring, and basic precaution guidance.",
        },
        {
          title: "System Design",
          body: "The project was structured around a mobile-first approach using Flutter for the interface, Firebase concepts for backend support, and Google Maps for location-based visualization.",
        },
        {
          title: "Key Challenge",
          body: "One major challenge was planning how environmental data, map display, and precaution information could be presented clearly without overwhelming the user.",
        },
        {
          title: "What I Learned",
          body: "This project strengthened my understanding of mobile UI structure, user flow planning, Firebase-based architecture, and how environmental data can be translated into useful user-facing information.",
        },
      ],
    },
  },
  {
    slug: "ai-recruitment",
    eyebrow: "⚔ Enterprise Experience ⚔",
    title: "AI Recruitment System",
    blurb:
      "AI-enhanced recruitment platform involving resume analysis, interview question generation, and enterprise recruitment workflow improvements.",
    layout: "cards",
    glow: "right",
    notes: [
      {
        title: "Problem",
        body: "Recruitment screening can be time-consuming when HR teams need to manually review applicant resumes and match them with job requirements.",
      },
      {
        title: "Solution",
        body: "Improved the recruitment workflow by supporting AI-assisted resume matching and interview question generation features.",
      },
      {
        title: "My Contribution",
        body: "Supported UAT issue fixing, investigated AI feature issues, refined system behavior, and worked on API-related improvements.",
      },
      {
        title: "Outcome",
        body: "Helped improve the clarity and efficiency of applicant screening workflows within an enterprise recruitment system.",
      },
    ],
    tech: ["PHP", "MySQL", "AI Integration", "API"],
    badges: ["Enterprise Project", "Internship Project"],
    images: ["ai-recruitment.png"],
    mediaAfterText: true,
  },
];
