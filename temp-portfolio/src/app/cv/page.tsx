import type { Metadata } from "next";
import { PROFILE, CV, EXPERIENCE, EDUCATION, AWARDS, SKILLS } from "../../data/profile";
import { PROJECTS, ZLAB_URL } from "../../data/projects";
import CvActions from "./CvActions";
import "./cv.css";

/* The CV as a web page: plain, real text (so applicant-tracking systems read it),
   one A4 column that prints cleanly. Built from the same data as the portfolio, so
   it is never out of date. The PDF in public/ is printed from this page. */
export const metadata: Metadata = {
  title: "CV · Adrian Zachary",
  description: "Adrian Zachary, software engineer in Petaling Jaya: experience, projects, skills and education.",
};

const host = (u: string) => u.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

export default function CvPage() {
  return (
    <div className="cv-page">
      <CvActions pdf={PROFILE.resume} />
      <article className="cv">
        <header className="cv-head">
          <div>
            <h1>{PROFILE.name}</h1>
            <p className="cv-role">{PROFILE.role} · {PROFILE.location}</p>
          </div>
          <ul className="cv-contact">
            <li><a href={"mailto:" + PROFILE.email}>{PROFILE.email}</a></li>
            {CV.phone && <li>{CV.phone}</li>}
            <li><a href={"https://" + CV.website}>{CV.website}</a></li>
            <li><a href={PROFILE.linkedin}>{host(PROFILE.linkedin)}</a></li>
            <li><a href={PROFILE.github}>{host(PROFILE.github)}</a></li>
          </ul>
        </header>

        <section><h2>Summary</h2><p>{CV.summary}</p></section>

        <section>
          <h2>Experience</h2>
          {EXPERIENCE.map((j) => (
            <div key={j.org + j.role} className="cv-item">
              <div className="cv-line"><h3>{j.role}</h3><span>{j.when}</span></div>
              <p className="cv-sub">{j.org} · {j.place}</p>
              <ul>{j.points.map((p) => <li key={p}>{p}</li>)}</ul>
              {j.tech && <p className="cv-tech">{j.tech.join(" · ")}</p>}
            </div>
          ))}
        </section>

        <section>
          <h2>Projects</h2>
          {PROJECTS.map((p) => (
            <div key={p.slug} className="cv-item cv-proj">
              <div className="cv-line"><h3>{p.title}</h3><span>{p.kind}</span></div>
              <p>{p.blurb} {p.notes.find((n) => n.title === "Outcome")?.body}</p>
              <p className="cv-tech">{p.tech.join(" · ")}</p>
            </div>
          ))}
          <div className="cv-item cv-proj">
            <div className="cv-line"><h3>Z Lab</h3><span>Personal</span></div>
            <p>Browser games and interactive 3D sites built in my own time: Blender models, three.js, Canvas and Web Audio. Playable at <a href={ZLAB_URL}>{host(ZLAB_URL)}</a>.</p>
          </div>
        </section>

        <section>
          <h2>Skills</h2>
          <dl className="cv-skills">
            {SKILLS.map((g) => <div key={g.group}><dt>{g.group}</dt><dd>{g.items.join(", ")}</dd></div>)}
          </dl>
        </section>

        <section>
          <h2>Education</h2>
          {EDUCATION.map((e) => (
            <div key={e.school} className="cv-item">
              <div className="cv-line"><h3>{e.what}</h3><span>{e.when}</span></div>
              <p className="cv-sub">{e.school}</p>
              <p>{e.detail}</p>
            </div>
          ))}
        </section>

        <section>
          <h2>Achievements & activities</h2>
          <ul>{AWARDS.map((a) => <li key={a}>{a}</li>)}</ul>
        </section>

        <p className="cv-foot">References available on request.</p>
      </article>
    </div>
  );
}
