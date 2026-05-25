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
          src="/my_picture2.jpeg"
          alt="My Picture 2"
          className="rounded-3xl h-[280px] object-cover mb-8 border border-[#F6BC7C]/20"
        />

        <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
          SOFTWARE ENGINEERING • AI WORKFLOWS • WEB SYSTEMS
        </p>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-4">
          Adrian Zachary bin Ian
        </h1>

        <p className="text-[#D9EAFA] text-3xl md:text-4xl font-semibold mb-8">
          (or just Z)
        </p>

        <p className="text-lg md:text-xl text-[#D9EAFA]/70 max-w-3xl mx-auto leading-relaxed mb-10">
          Final-year Software Engineering student focused on building practical web systems,
          AI-assisted workflows, and modern digital solutions with real-world impact.
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

          <p className="text-[#D9EAFA]/75 leading-relaxed">
            I am a final-year Software Engineering student with hands-on experience in
            web development, AI-assisted systems, enterprise workflows, and software support
            through my internship at Sarawak Information Systems (SAINS).
          </p>

          <p className="text-[#D9EAFA]/75 leading-relaxed mt-4">
            My work focuses on building practical and meaningful systems that solve real
            workflow problems — from AI-enhanced recruitment features to environmental
            monitoring applications.
          </p>

          <p className="text-[#D9EAFA]/75 leading-relaxed mt-4">
            I focus on creating clean, user-friendly, and efficient digital solutions while
            continuously strengthening my technical, analytical, and problem-solving skills
            through real project experience.
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
          <div className="bg-[#151611] rounded-3xl p-6 md:p-10 mb-16">

            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

              <div className="max-w-2xl">

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

                <div className="space-y-10 mt-10">

                  <div className="space-y-3">
                    <h4 className="text-[#F6BC7C] font-semibold mb-2">
                      Problem
                    </h4>

                    <p className="text-[#D9EAFA]/75 leading-relaxed">
                      Users often lack simple access to real-time environmental and
                      air quality information in a clear and accessible format.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[#F6BC7C] font-semibold mb-2">
                      Solution
                    </h4>

                    <p className="text-[#D9EAFA]/75 leading-relaxed">
                      Developed a mobile-based environmental monitoring application
                      capable of displaying air quality data, weather information,
                      and location-based monitoring features.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[#F6BC7C] font-semibold mb-2">
                      My Contribution
                    </h4>

                    <p className="text-[#D9EAFA]/75 leading-relaxed">
                      Designed the application interface, structured the mobile
                      workflow, and implemented frontend integration concepts
                      using Flutter and Firebase.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[#F6BC7C] font-semibold mb-2">
                      Outcome
                    </h4>

                    <p className="text-[#D9EAFA]/75 leading-relaxed">
                      Created a cleaner and more user-friendly monitoring experience
                      for displaying environmental information through a mobile-first interface.
                    </p>
                  </div>

                </div>

                <div className="flex flex-wrap gap-3 mt-8 max-w-2xl">

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

                <div className="mt-8">

                  <button
                    onClick={() => scrollTo("case-study")}
                    className="bg-[#D9EAFA] text-[#151611] px-6 py-3 rounded-2xl font-semibold hover:scale-105 hover:opacity-90 transition-all duration-300"
                  >
                    View FYP Case Study
                  </button>

                </div>

              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:max-w-none">

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
                    className="w-full h-auto rounded-3xl object-cover border border-[#F6BC7C]/20"
                  />

                ))}

              </div>

            </div>

          </div>

          {/* SmartAirIQ Case Study */}
          <div id="case-study" className="mt-10 bg-[#1D1E19] rounded-3xl p-6 md:p-8">
            <div>
              <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
                Case Study
              </p>

              <h2 className="text-3xl md:text-5xl font-bold mb-8">
                SmartAirIQ Project Breakdown
              </h2>

              <p className="text-[#D9EAFA]/80 text-lg leading-relaxed max-w-3xl mb-12">
                SmartAirIQ was developed as an academic environmental monitoring project
                focused on making air quality information easier to access through a
                mobile-based interface.
              </p>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  [
                    "Project Goal",
                    "To provide users with a simple mobile interface for viewing air quality information, location-based monitoring, and basic precaution guidance.",
                  ],
                  [
                    "System Design",
                    "The project was structured around a mobile-first approach using Flutter for the interface, Firebase concepts for backend support, and Google Maps for location-based visualization.",
                  ],
                  [
                    "Key Challenge",
                    "One major challenge was planning how environmental data, map display, and precaution information could be presented clearly without overwhelming the user.",
                  ],
                  [
                    "What I Learned",
                    "This project strengthened my understanding of mobile UI structure, user flow planning, Firebase-based architecture, and how environmental data can be translated into useful user-facing information.",
                  ],
                ].map(([title, desc]) => (
                  <div key={title} className="bg-[#151611] p-6 rounded-2xl border border-[#D9EAFA]/10">
                    <h3 className="text-[#F6BC7C] text-xl font-semibold mb-3">
                      {title}
                    </h3>
                    <p className="text-[#D9EAFA]/75 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recruitment */}
          {/* AI Recruitment */}
          <div className="bg-[#151611] rounded-3xl p-6 md:p-10">
            <div className="grid lg:grid-cols-2 gap-12 items-start">

              {/* Left Content */}
              <div>
                <p className="text-[#F6BC7C] uppercase tracking-[0.3em] text-sm mb-4">
                  Enterprise Experience
                </p>

                <h3 className="text-4xl font-bold mb-6">
                  AI Recruitment System
                </h3>

                <p className="text-[#D9EAFA]/80 text-lg leading-relaxed mb-8">
                  AI-enhanced recruitment platform involving resume analysis,
                  interview question generation, and enterprise recruitment workflow
                  improvements.
                </p>

                <div className="grid md:grid-cols-2 gap-5 my-8">
                  {[
                    [
                      "Problem",
                      "Recruitment screening can be time-consuming when HR teams need to manually review applicant resumes and match them with job requirements.",
                    ],
                    [
                      "Solution",
                      "Improved the recruitment workflow by supporting AI-assisted resume matching and interview question generation features.",
                    ],
                    [
                      "My Contribution",
                      "Supported UAT issue fixing, investigated AI feature issues, refined system behavior, and worked on API-related improvements.",
                    ],
                    [
                      "Outcome",
                      "Helped improve the clarity and efficiency of applicant screening workflows within an enterprise recruitment system.",
                    ],
                  ].map(([title, desc]) => (
                    <div
                      key={title}
                      className="bg-[#1D1E19] p-5 rounded-2xl border border-[#D9EAFA]/10"
                    >
                      <h4 className="text-[#F6BC7C] font-semibold mb-2">
                        {title}
                      </h4>

                      <p className="text-[#D9EAFA]/75 leading-relaxed text-sm">
                        {desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 flex-wrap mb-8">
                  {["PHP", "MySQL", "AI Integration", "API"].map((tech) => (
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

              {/* Right Screenshot */}
              <div className="lg:sticky lg:top-24">
                <img
                  src="/ai-recruitment.png"
                  alt="AI Recruitment"
                  className="rounded-3xl w-full border border-[#D9EAFA]/10"
                />
              </div>

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
