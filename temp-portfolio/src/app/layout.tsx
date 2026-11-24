import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://adrian-zachary-portfolio.vercel.app"),
  title: "Adrian Zachary · Software Engineer",
  description:
    "Software engineer in Petaling Jaya. Automation and AI tools by day, playable browser games by night. Projects, Z Lab games and contact, on a little retro desktop.",
  openGraph: {
    title: "Adrian Zachary · Software Engineer",
    description: "Automation and AI tools by day, playable browser games by night.",
    images: ["/wick.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#2C2F6B" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
