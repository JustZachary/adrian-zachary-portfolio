import Portfolio from "../components/Portfolio";
import { PROFILE } from "../data/profile";

/* Who this page is about, for search engines (schema.org Person). */
const PERSON = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: PROFILE.name,
  jobTitle: PROFILE.role,
  url: "https://adrian-zachary-portfolio.vercel.app",
  image: "https://adrian-zachary-portfolio.vercel.app/og.png",
  email: "mailto:" + PROFILE.email,
  sameAs: [PROFILE.github, PROFILE.linkedin],
  address: { "@type": "PostalAddress", addressLocality: "Petaling Jaya", addressCountry: "MY" },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Universiti Kebangsaan Malaysia" },
};

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PERSON) }} />
      <Portfolio />
    </main>
  );
}
