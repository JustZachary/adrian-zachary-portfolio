import Desktop from "../components/Desktop";

export default function Home() {
  return (
    <main>
      <Desktop />
      {/* For search engines and screen readers that skip the desktop. */}
      <noscript>
        <p>Adrian Zachary, software engineer in Petaling Jaya. Automation and AI tools by day, browser games by night. Email adrianzachary825@gmail.com.</p>
      </noscript>
    </main>
  );
}
