import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./portfolio.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://adrian-zachary-portfolio.vercel.app"),
  title: "Adrian Zachary · Software Engineer",
  description:
    "Software engineer in Petaling Jaya. Automation and AI tools at work, browser games after hours. Projects, experience, skills, CV and contact on one page.",
  openGraph: {
    title: "Adrian Zachary · Software Engineer",
    description: "Automation and AI tools by day, playable browser games by night.",
    images: ["/wick.webp"],
  },
};

export const viewport: Viewport = { themeColor: "#FFF8EC" };

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
