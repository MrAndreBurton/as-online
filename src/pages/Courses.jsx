import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Helmet } from "react-helmet-async";

const registrationLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSduZj2qI01suyHDZN7TixWnPE83NMuFB4SkpgRmedWNKCWYJw/viewform?usp=header";

const courses = [
  {
    title: "Std 3 & 4 Mathematics",
    description:
      "Focused support for students building strong number sense, problem-solving skills, and confidence in upper primary mathematics.",
    buttonLabel: "Register Now",
    buttonHref: registrationLink,
    buttonTarget: "_blank",
    accent: "border-sky-400/20 bg-sky-500/10",
  },
  {
    title: "SEA Mathematics",
    description:
      "Targeted preparation for SEA students with attention to strategy, speed, accuracy, and exam confidence.",
    buttonLabel: "Register Now",
    buttonHref: registrationLink,
    buttonTarget: "_blank",
    accent: "border-cyan-400/20 bg-cyan-500/10",
  },
  {
    title: "Forms 1-3 Mathematics",
    description:
      "Clear, step-by-step guidance for lower secondary students developing strong foundations across key math topics.",
    buttonLabel: "Register Now",
    buttonHref: registrationLink,
    buttonTarget: "_blank",
    accent: "border-indigo-400/20 bg-indigo-500/10",
  },
  {
    title: "CSEC Mathematics",
    description:
      "One-on-one lessons focused on understanding concepts, solving problems, and exam readiness.",
    buttonLabel: "Register Now",
    buttonHref: registrationLink,
    buttonTarget: "_blank",
    accent: "border-rose-400/20 bg-rose-500/10",
  },
  {
    title: "Future Skills: AI & Digital Readiness for Form 1 Students",
    description:
      "A 3-month small-group programme designed to help students enter Form 1 confident, organised, and ready to use technology and AI for school.",
    buttonLabel: "Learn More",
    buttonHref: "/courses/ai-digital-readiness",
    buttonTarget: "_self",
    accent: "border-amber-400/30 bg-amber-400/10",
    featured: true,
  },
];

const aiHighlights = [
  "3-month programme designed for students entering Form 1",
  "Small group format with 6–8 students",
  "Combines digital readiness, school productivity, and AI for learning",
  "Helps students enter secondary school more confident and organised",
];

export default function Courses() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
  <title>Courses | A's Online Tutoring Services</title>
  <meta
    name="description"
    content="Explore mathematics, AI, and digital skills courses designed to help students grow in confidence, skill, and future readiness."
  />
  <meta property="og:title" content="Courses | A's Online Tutoring Services" />
  <meta
    property="og:description"
    content="Explore mathematics, AI, and digital skills courses designed to help students grow in confidence, skill, and future readiness."
  />
</Helmet>

      <Header />

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
                Courses
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Courses designed to build confidence, skill, and future readiness.
              </h1>
              <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
                From upper primary and exam-focused Mathematics to digital and AI
                readiness, A&apos;s Online offers practical, guided learning
                designed to help students grow with clarity and confidence.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              All Courses
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              Find the right fit for your child.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.title}
                className={`rounded-[1.75rem] border p-6 shadow-xl shadow-black/10 backdrop-blur ${course.accent}`}
              >
                {course.featured ? (
                  <span className="mb-4 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Featured
                  </span>
                ) : null}

                <h3 className="text-xl font-semibold text-white">
                  {course.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {course.description}
                </p>

                <a
                  href={course.buttonHref}
                  target={course.buttonTarget}
                  rel={course.buttonTarget === "_blank" ? "noreferrer" : undefined}
                  className="mt-6 inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {course.buttonLabel}
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="rounded-[2rem] border border-amber-400/20 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
                Featured Programme
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-5xl">
                Future Skills: AI &amp; Digital Readiness for Form 1 Students
              </h2>
              <p className="mt-8 text-lg leading-8 text-slate-300">
                Helping your child enter Form 1 confident, organised, and ready
                to use technology and AI for school.
              </p>
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

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {aiHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
  <a
    href="/courses/ai-digital-readiness"
    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
  >
    Learn More
  </a>

  <a
    href={registrationLink}
    target="_blank"
    rel="noreferrer"
    className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
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

