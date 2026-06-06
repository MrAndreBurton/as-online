import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Helmet } from "react-helmet-async";

const registrationLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSduZj2qI01suyHDZN7TixWnPE83NMuFB4SkpgRmedWNKCWYJw/viewform?usp=header";

const moduleList = [
  {
    title: "Digital Foundations",
    color: "text-yellow-300",
    objective:
      "Students build confidence moving around a computer and handling basic digital school tasks.",
    content: [
      "Getting started with computers",
      "Typing, editing, and building confidence with documents",
      "Files, folders, and staying organised",
      "Using a browser and finding information online",
      "Internet safety and smart online habits",
    ],
    outcome:
      "Students become more confident navigating a computer, saving work, and managing digital tasks.",
  },
  {
    title: "School Productivity Skills",
    color: "text-sky-300",
    objective:
      "Students learn to use technology for practical schoolwork and communication.",
    content: [
      "Getting started with Google Docs",
      "Formatting and organising work in Google Docs",
      "Getting started with Google Slides",
      "Designing clear and neat presentations in Google Slides",
    ],
    outcome:
      "Students can create and improve basic school documents and presentations.",
  },
  {
    title: "AI for Learning",
    color: "text-emerald-300",
    objective:
      "Students are introduced to AI in a simple, practical, and responsible way.",
    content: [
      "What AI is and how it can help with learning",
      "Asking better questions",
      "Using AI for explanations and study support",
      "Checking AI answers",
      "Using AI responsibly",
    ],
    outcome:
      "Students use AI as a learning support tool, not a shortcut.",
  },
];

const outcomes = [
  "Use a computer more confidently",
  "Save, organise, and find schoolwork properly",
  "Type, edit, and organise schoolwork digitally",
  "Create basic documents and presentations",
  "Research information online more effectively",
  "Use AI as a learning support tool responsibly",
  "Feel better prepared for Form 1",
];

const strengths = [
  "Post-SEA timing gives parents structure at the right moment",
  "Students need stronger digital confidence for modern school life",
  "Built by an experienced educator and digital practitioner",
  "Small group format allows for focused support",
];

export default function AIDigitalReadiness() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>
          Future Skills: AI & Digital Readiness for Form 1 Students | A&apos;s
          Online
        </title>
        <meta
          name="description"
          content="A 6-week small-group programme helping students enter Form 1 confident, organised, and ready to use technology and AI for school."
        />
        <meta
          property="og:title"
          content="Future Skills: AI & Digital Readiness for Form 1 Students | A's Online"
        />
        <meta
          property="og:description"
          content="A 6-week small-group programme helping students enter Form 1 confident, organised, and ready to use technology and AI for school."
        />
      </Helmet>

      <Header />

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
                Future Skills Programme
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Future Skills: AI &amp; Digital Readiness for Form 1 Students
              </h1>

              <p className="mt-8 text-lg leading-8 text-slate-300">
                Helping your child enter Form 1 confident, organised, and ready
                to use technology and AI for school.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={registrationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                >
                  Register Now
                </a>
              </div>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Duration
                </p>
                <p className="mt-3 text-lg font-semibold text-white">6 Weeks</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Schedule
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  2 sessions per week
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Format
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  Small Group (6–8 students)
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Programme Breakdown
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              A clear 6-week path into Form 1 readiness.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Students build digital confidence step by step through computer
              navigation, school productivity tools, and a practical
              introduction to responsible AI use.
            </p>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {moduleList.map((module) => (
              <div
                key={module.title}
                className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur"
              >
                <p
                  className={`text-sm font-semibold uppercase tracking-[0.2em] ${module.color}`}
                >
                  Programme Module
                </p>

                <h3 className="mt-3 text-2xl font-semibold text-white">
                  {module.title}
                </h3>

                <p className="mt-5 text-sm leading-7 text-slate-300">
                  <span className="font-semibold text-white">Objective:</span>{" "}
                  {module.objective}
                </p>

                <div className="mt-6 grid gap-3">
                  {module.content.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-sm leading-7 text-slate-300">
                  <span className="font-semibold text-white">Outcome:</span>{" "}
                  {module.outcome}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Final Project
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              My Form 1 Digital Success Plan
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-300">
              Students will complete a short Google Doc, create a simple Google
              Slides presentation, and use AI in a guided, responsible way to
              support ideas, explanations, and planning.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Certificate
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Certificate of Completion
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-300">
              This certifies that{" "}
              <span className="text-white">[Student Name]</span> has successfully
              completed the{" "}
              <span className="text-white">
                Future Skills: AI &amp; Digital Readiness Programme
              </span>{" "}
              offered by A&apos;s Online Tutoring Services.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Course Outcomes
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              What students will be able to do by the end.
            </h2>

            <div className="mt-8 grid gap-4">
              {outcomes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  ✅ {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Pricing
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              TT$600 total
            </h2>
            <p className="mt-3 text-lg text-slate-200">
              6 weeks · 12 sessions · Small group
            </p>
            <p className="mt-6 text-base leading-8 text-slate-200">
              Includes guided practical sessions, final project, and certificate
              of completion.
            </p>

            <a
              href={registrationLink}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              Register Now
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Why This Programme Works
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              A timely, practical programme for a real need.
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {strengths.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-6">
              <p className="text-base leading-8 text-slate-200">
                “This programme is designed and delivered by an experienced
                educator who has worked one-on-one with students for over 9,000
                hours.”
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-amber-400/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
              Final Call to Action
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              Give your child a stronger start to secondary school with the
              digital skills and responsible AI awareness they will actually use.
            </h2>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={registrationLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Register Now
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


