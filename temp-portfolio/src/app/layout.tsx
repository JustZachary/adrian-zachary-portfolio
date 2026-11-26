import type { Metadata, Viewport } from "next";
import "lenis/dist/lenis.css";
import { PROFILE } from "../data/profile";
import "./globals.css";
import "./portfolio.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://adrian-zachary-portfolio.vercel.app"),
  title: "Adrian Zachary · Software Engineer",
  description:
    "Software engineer in Petaling Jaya. Automation and AI tools at work, browser games after hours. Projects, experience, skills, CV and contact on one page.",
  openGraph: {
    type: "website",
    url: "/",
    title: "Adrian Zachary · Software Engineer",
    description: "Automation and AI tools at work, browser games after hours. Projects, experience, CV and contact.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Adrian Zachary, software engineer in Petaling Jaya" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export const viewport: Viewport = { themeColor: "#FFF4EA" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Before the first paint: skip the splash for repeat views this visit and for reduced motion,
            switch on the scroll-in animations (pf-anim) unless motion is reduced, and set the colour theme. */}
        <script dangerouslySetInnerHTML={{ __html: "try{var d=document.documentElement,r=matchMedia('(prefers-reduced-motion: reduce)').matches,t=null;try{t=localStorage.getItem('pf-theme')}catch(e){}if(['sunset','holo','night'].indexOf(t)<0)t=matchMedia('(prefers-color-scheme: dark)').matches?'night':'" + PROFILE.theme + "';d.setAttribute('data-pf-theme',t);d.style.background={sunset:'#FFF4EA',holo:'#FBF9FF',night:'#12142B'}[t];if(!r)d.classList.add('pf-anim');if(r||sessionStorage.getItem('pf-splash'))d.setAttribute('data-splash','skip')}catch(e){}" }} />
        <link rel="preload" as="image" href="/splash-sunset.webp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
