import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Helmet } from "react-helmet-async";

const registrationLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSduZj2qI01suyHDZN7TixWnPE83NMuFB4SkpgRmedWNKCWYJw/viewform?usp=header";

const moduleList = [
  {
    title: "Module 1: Digital Foundations",
    weeks: "Weeks 1–4",
    color: "text-yellow-300",
    objective: "Students become independent computer users.",
    content: [
      "Keyboard and typing basics",
      "Files, folders, and saving work",
      "Using a browser properly",
      "Internet safety",
      "Email basics",
    ],
    outcome: "Student can use a computer without help.",
  },
  {
    title: "Module 2: School Productivity Skills",
    weeks: "Weeks 5–8",
    color: "text-sky-300",
    objective: "Students learn to use technology for school work.",
    content: [
      "Google Docs for typing and formatting",
      "Google Slides for presentations",
      "Research skills",
      "Organising school work digitally",
    ],
    outcome: "Student can complete assignments digitally.",
  },
  {
    title: "Module 3: AI for Learning",
    weeks: "Weeks 9–12",
    color: "text-emerald-300",
    objective: "Students learn to use AI correctly and safely.",
    content: [
      "What AI is in simple terms",
      "Asking good questions",
      "Using AI for explanations",
      "Using AI for studying",
      "Checking AI answers",
      "Responsible use",
    ],
    outcome: "Student uses AI as a learning tool, not a shortcut.",
  },
];

const outcomes = [
  "Use a computer confidently",
  "Type and organise school work digitally",
  "Create documents and presentations",
  "Research information online effectively",
  "Use AI tools responsibly for learning",
  "Be better prepared for Form 1",
];

const strengths = [
  "Post-SEA timing gives parents structure at the right moment",
  "Schools are not teaching AI properly yet",
  "Built by a teacher, content creator, and digital practitioner",
  "Small group format feels premium and focused",
];

export default function AIDigitalReadiness() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
  <title>Future Skills: AI & Digital Readiness for Form 1 Students | A's Online</title>
  <meta
    name="description"
    content="A 3-month small-group programme helping students enter Form 1 confident, organised, and ready to use technology and AI for school."
  />
  <meta
    property="og:title"
    content="Future Skills: AI & Digital Readiness for Form 1 Students | A's Online"
  />
  <meta
    property="og:description"
    content="A 3-month small-group programme helping students enter Form 1 confident, organised, and ready to use technology and AI for school."
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
                <p className="mt-3 text-lg font-semibold text-white">3 Months</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  Schedule
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  2 Hours per Week
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
              Module Breakdown
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              A clear 3-month path into Form 1 readiness.
            </h2>
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
                  {module.weeks}
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
              Students will type a document in Google Docs, create a short
              presentation in Google Slides, and use AI to assist with ideas,
              explanations, and planning.
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
              This certifies that <span className="text-white">[Student Name]</span>{" "}
              has successfully completed the{" "}
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
              $400 / month
            </h2>
            <p className="mt-3 text-lg text-slate-200">3 months = $1200</p>
            <p className="mt-6 text-base leading-8 text-slate-200">
              Full payment discount available:{" "}
              <span className="font-semibold text-white">$1100</span>
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
              digital and AI skills they will actually use.
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

