import Link from "next/link";

/* The 404 page, in the portfolio's own colours (the theme comes from <html>). */
export default function NotFound() {
  return (
    <main className="pf pf-404">
      <div className="pf-win pf-404-win">
        <div className="pf-win-bar"><i /><i /><i /><span>error-404.txt</span></div>
        <div className="pf-404-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sunset.png" alt="" width={72} height={72} />
          <p className="pf-404-code">404</p>
          <h1>This page got smashed.</h1>
          <p>The link may be old, or there may be a typo in it. Everything I&rsquo;ve built is on the home page.</p>
          <div className="pf-404-go">
            <Link className="pf-btn pf-btn-tomato" href="/">Back to the portfolio</Link>
            <Link className="pf-btn" href="/cv">Read my CV</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
