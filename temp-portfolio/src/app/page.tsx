"use client";
import { motion } from "framer-motion";

export default function Home() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#151611] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-[#151611]/90 backdrop-blur-md z-50 border-b border-[#D9EAFA]/10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          <h1 className="text-xl font-bold text-[#F6BC7C]">
            AZ
          </h1>

          <div className="flex gap-6 text-sm text-[#D9EAFA]">

            <a
              onClick={() => scrollTo("home")}
              className="hover:text-[#F6BC7C] transition cursor-pointer"
            >
              Home
            </a>

            <a
              onClick={() => scrollTo("about")}
              className="hover:text-[#F6BC7C] transition cursor-pointer"
            >
              About
            </a>

            <a
              onClick={() => scrollTo("skills")}
              className="hover:text-[#F6BC7C] transition cursor-pointer"
            >
              Skills
            </a>

            <a
              onClick={() => scrollTo("projects")}
              className="hover:text-[#F6BC7C] transition cursor-pointer"
            >
              Projects
            </a>

            <a
              onClick={() => scrollTo("contact")}
              className="hover:text-[#F6BC7C] transition cursor-pointer"
            >
              Contact
            </a>

          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        id="home"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center justify-center text-center min-h-screen px-6 pt-28"
      >

        <img
          src="/my_picture.jpg"
          alt="My Picture"
          className="rounded-3xl h-[280px] object-cover mb-8 border border-[#F6BC7C]/20"
        />

        <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
          Welcome To My Portfolio
        </p>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-4">
          Adrian Zachary
          <br />
          bin Ian
        </h1>

        <p className="text-[#D9EAFA] text-3xl md:text-4xl font-semibold mb-8">
          (or just Z)
        </p>

        <p className="text-[#D9EAFA]/80 max-w-2xl text-lg leading-relaxed mb-10">
          Final-year Software Engineering student passionate about
          web development, AI-enhanced systems, and building
          modern digital solutions.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">

          <button
            onClick={() => scrollTo("projects")}
            className="bg-[#F6BC7C] text-[#151611] hover:opacity-90 transition px-6 py-3 rounded-full font-semibold"
          >
            View Projects
          </button>

          <button
            onClick={() => scrollTo("contact")}
            className="border border-[#D9EAFA]/30 text-[#D9EAFA] px-6 py-3 rounded-full hover:bg-[#D9EAFA] hover:text-[#151611] transition"
          >
            Contact Me
          </button>

          <a
            href="/adrian_zachary_resume.pdf"
            download
            className="border border-[#F6BC7C]/30 text-[#F6BC7C] px-6 py-3 rounded-full hover:bg-[#F6BC7C] hover:text-[#151611] transition"
          >
            Download Resume
          </a>

        </div>

      </motion.section>

      {/* About */}
      <section
        id="about"
        className="px-6 py-24 bg-[#1D1E19]"
      >

        <div className="max-w-4xl mx-auto">

          <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
            About Me
          </p>

          <h2 className="text-3xl md:text-5xl font-bold mb-8">
            I build practical and modern digital systems.
          </h2>

          <p className="text-[#D9EAFA]/80 text-lg leading-relaxed mb-6">
            I am a final-year Software Engineering student with
            experience in web development, API integration,
            AI-enhanced systems, and enterprise software workflows
            through my internship at Sarawak Information Systems.
          </p>

          <p className="text-[#D9EAFA]/80 text-lg leading-relaxed">
            I enjoy designing clean interfaces and creating
            meaningful systems that improve real-world workflows
            and user experiences.
          </p>

        </div>

      </section>

      {/* Skills */}
      <section
        id="skills"
        className="px-6 py-24 bg-[#151611]"
      >

        <div className="max-w-6xl mx-auto">

          <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
            Skills
          </p>

          <h2 className="text-3xl md:text-5xl font-bold mb-12">
            Technologies I Work With
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

            {[
              ["PHP", "Backend Development"],
              ["Laravel", "Web Framework"],
              ["MySQL", "Database Management"],
              ["Flutter", "Mobile App Development"],
              ["Firebase", "Backend Services"],
              ["GitHub", "Version Control"],
              ["API", "API Integration"],
              ["Next.js", "Frontend Framework"],
            ].map(([title, desc]) => (

              <div
                key={title}
                className="bg-[#1D1E19] p-6 rounded-2xl hover:bg-[#252620] transition"
              >

                <h3 className="text-xl font-semibold mb-2">
                  {title}
                </h3>

                <p className="text-[#D9EAFA]/70 text-sm">
                  {desc}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* Projects */}
      <section
        id="projects"
        className="px-6 py-24 bg-[#1D1E19]"
      >

        <div className="max-w-6xl mx-auto">

          <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
            Projects
          </p>

          <h2 className="text-3xl md:text-5xl font-bold mb-12">
            Featured Work
          </h2>

          {/* SmartAirIQ */}
          <div className="bg-[#151611] rounded-3xl p-10 mb-16">

            <div className="grid md:grid-cols-2 gap-12 items-center">

              <div>

                <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
                  Featured Project
                </p>

                <h3 className="text-4xl font-bold mb-6">
                  SmartAirIQ
                </h3>

                <p className="text-[#D9EAFA]/80 text-lg leading-relaxed mb-6">
                  Smart environmental monitoring system designed
                  for real-time air quality tracking and
                  visualization using mobile technologies.
                </p>

                <div className="flex gap-3 flex-wrap mb-8">

                  {[
                    "Flutter",
                    "Firebase",
                    "Google Maps",
                    "Air Quality API",
                  ].map((tech) => (

                    <span
                      key={tech}
                      className="bg-[#F6BC7C] text-[#151611] px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      {tech}
                    </span>

                  ))}

                </div>

                <button className="bg-[#D9EAFA] text-[#151611] px-5 py-3 rounded-xl font-semibold hover:opacity-90 transition">
                  FYP Project
                </button>

              </div>

              <div className="grid grid-cols-2 gap-4">

                {[
                  "smartairiq-1.jpeg",
                  "smartairiq-2.jpeg",
                  "smartairiq-3.jpeg",
                  "smartairiq-4.jpeg",
                ].map((img, index) => (

                  <img
                    key={index}
                    src={`/${img}`}
                    alt={`SmartAirIQ ${index + 1}`}
                    className="rounded-3xl h-[350px] object-cover border border-[#F6BC7C]/20"
                  />

                ))}

              </div>

            </div>

          </div>

          {/* AI Recruitment */}
          <div className="bg-[#151611] rounded-3xl p-10">

            <img
              src="/ai-recruitment.png"
              alt="AI Recruitment"
              className="rounded-3xl w-full mb-10 border border-[#D9EAFA]/10"
            />

            <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
              Enterprise Experience
            </p>

            <h3 className="text-4xl font-bold mb-6">
              AI Recruitment System
            </h3>

            <p className="text-[#D9EAFA]/80 text-lg leading-relaxed mb-6 max-w-3xl">
              AI-enhanced recruitment platform involving
              resume analysis, interview question generation,
              and enterprise recruitment workflow improvements.
            </p>

            <div className="flex gap-3 flex-wrap mb-8">

              {[
                "PHP",
                "MySQL",
                "AI Integration",
                "API",
              ].map((tech) => (

                <span
                  key={tech}
                  className="bg-[#F6BC7C] text-[#151611] px-4 py-2 rounded-full text-sm font-semibold"
                >
                  {tech}
                </span>

              ))}

            </div>

            <div className="flex gap-4 flex-wrap">

              <button className="bg-[#F6BC7C] text-[#151611] px-5 py-3 rounded-xl font-semibold">
                Enterprise Project
              </button>

              <button className="border border-[#D9EAFA]/30 text-[#D9EAFA] px-5 py-3 rounded-xl hover:bg-[#D9EAFA] hover:text-[#151611] transition">
                Internship Project
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* Contact */}
      <section
        id="contact"
        className="px-6 py-24 bg-[#151611]"
      >

        <div className="max-w-4xl mx-auto text-center">

          <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
            Contact
          </p>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Let&apos;s Work Together
          </h2>

          <p className="text-[#D9EAFA]/80 text-lg mb-10">
            Open to software engineering opportunities,
            internships, and collaborative projects.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">

            <a
              href="mailto:adrianzachary825@gmail.com"
              className="bg-[#F6BC7C] text-[#151611] hover:opacity-90 transition px-6 py-3 rounded-full font-semibold"
            >
              Email Me
            </a>

            <a
              href="https://github.com/JustZachary"
              target="_blank"
              className="border border-[#D9EAFA]/30 text-[#D9EAFA] px-6 py-3 rounded-full hover:bg-[#D9EAFA] hover:text-[#151611] transition"
            >
              GitHub
            </a>

            <a
              href="https://www.linkedin.com/in/adrian-zachary-ian-2a4748181/"
              target="_blank"
              className="border border-[#F6BC7C]/30 text-[#F6BC7C] px-6 py-3 rounded-full hover:bg-[#F6BC7C] hover:text-[#151611] transition"
            >
              LinkedIn
            </a>

          </div>

        </div>

      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[#D9EAFA]/10 bg-[#151611] text-center">

        <p className="text-[#D9EAFA]/60 text-sm">
          © 2026 Adrian Zachary. Built with Next.js & Tailwind CSS.
        </p>

      </footer>

    </main>
  );
}
