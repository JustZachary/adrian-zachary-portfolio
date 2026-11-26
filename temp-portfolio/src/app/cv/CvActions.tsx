"use client";
/* The bar above the CV on screen: back to the portfolio, download the PDF, or print.
   It is hidden when printing. */
import Link from "next/link";

export default function CvActions({ pdf }: { pdf: string }) {
  return (
    <nav className="cv-actions" aria-label="CV actions">
      <Link href="/">← Portfolio</Link>
      <span>
        <a className="cv-btn" href={pdf} download>Download PDF</a>
        <button type="button" className="cv-btn" onClick={() => window.print()}>Print</button>
      </span>
    </nav>
  );
}
