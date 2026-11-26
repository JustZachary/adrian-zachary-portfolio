import type { Metadata } from "next";
import Desktop from "../../components/Desktop";

/* The retro desktop version of the portfolio, kept as an easter egg. */
export const metadata: Metadata = { title: "AZ-OS · Adrian Zachary" };

export default function DesktopPage() {
  return (
    <main>
      <Desktop />
    </main>
  );
}
