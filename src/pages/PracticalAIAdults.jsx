import { Helmet } from "react-helmet-async";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const registrationLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSeebdecXR2PM-60uEIWq-xBjyQ7ENqgXLe9lC3B1M7oiDJo2Q/viewform?usp=header";

const whoItsFor = [
  "Adults who already use a computer or smartphone comfortably",
  "Persons who know a little about AI or want to understand it better",
  "Persons looking for practical guidance rather than technical jargon",
  "Adults who want to use AI for work, communication, productivity, or everyday tasks",
];

const whoItsNotFor = [
  "Complete beginners who still need basic computer training",
  "Persons looking for coding or technical AI development",
  "Persons seeking highly advanced specialist AI training",
];

const learningPoints = [
  "Understand what AI is and what it can realistically do",
  "Ask better questions to get better AI responses",
  "Use AI for writing, planning, summarising, and organisation",
  "Apply AI to practical everyday and work-related tasks",
  "Review and improve AI-generated content",
  "Build smart and responsible AI habits",
];

const courseBreakdown = [
  {
    week: "Week 1",
    title: "Understanding AI Clearly",
    description:
      "What AI is, what it is not, where it already appears, and why it matters now.",
  },
  {
    week: "Week 2",
    title: "Prompting for Better Results",
    description:
      "How to ask clearer questions, improve vague prompts, and get more useful responses from AI.",
  },
  {
    week: "Week 3",
    title: "Practical AI for Productivity and Everyday Tasks",
    description:
      "Using AI for writing, planning, summarising, brainstorming, and organising ideas.",
  },
  {
    week: "Week 4",
    title: "Checking, Editing, and Using AI Responsibly",
    description:
      "Reviewing AI responses critically, improving weak output, editing into your own voice, and building smart AI habits.",
  },
];

const useCases = [
  "Drafting and improving emails",
  "Summarising long documents",
  "Brainstorming ideas",
  "Organising information more clearly",
  "Planning tasks and projects",
  "Simplifying complex information",
  "Learning unfamiliar topics more quickly",
  "Improving clarity in writing and communication",
];

const includedItems = [
  "4 live in-person sessions",
  "Guided practical activities",
  "Course materials",
  "Certificate of completion",
];

const outcomes = [
  "understand AI more clearly and practically",
  "write better prompts for stronger results",
  "use AI for useful everyday and work-related tasks",
  "review and improve AI-generated content",
  "use AI more responsibly and confidently",
];

export default function PracticalAIAdults() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>Practical AI for Adults | A&apos;s Online Tutoring Services</title>
        <meta
          name="description"
          content="Join our 4-week in-person Practical AI for Adults course and learn how to use AI for writing, productivity, planning, and everyday tasks."
        />
        <meta
          property="og:title"
          content="Practical AI for Adults | A's Online Tutoring Services"
        />
        <meta
          property="og:description"
          content="Join our 4-week in-person Practical AI for Adults course and learn how to use AI for writing, productivity, planning, and everyday tasks."
        />
      </Helmet>

      <Header />

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
                Practical AI for Adults
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Practical AI for Adults
              </h1>

              <h2 className="mt-4 text-2xl font-medium text-slate-200 lg:text-3xl">
                Work, Productivity and Everyday Use
              </h2>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
                A practical 4-week in-person course designed for adults who want
                to understand and use AI more effectively for writing, planning,
                productivity, and everyday tasks.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href={registrationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                >
                  Register Now
                </a>

                <a
                  href="#course-overview"
                  className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  View Course Details
                </a>
              </div>
            </div>
          </div>
        </section>

        <section
          id="course-overview"
          className="mx-auto max-w-7xl px-6 pb-20 lg:px-8"
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Duration
              </p>
              <p className="mt-3 text-lg font-semibold text-white">4 weeks</p>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Schedule
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                1 session per week
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Session Length
              </p>
              <p className="mt-3 text-lg font-semibold text-white">2 hours</p>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Format
              </p>
              <p className="mt-3 text-lg font-semibold text-white">In person</p>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Level
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                Introductory to Intermediate
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Materials
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                Soft copy or hard copy
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-sky-400/20 bg-sky-500/10 p-6 shadow-xl shadow-black/10 backdrop-blur md:col-span-2 xl:col-span-2">
              <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
                Pilot Community Rate
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                TT$750 soft copy / TT$850 hard copy
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              About This Course
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Practical guidance for adults who want to use AI well.
            </h2>
            <div className="mt-8 space-y-6 text-base leading-8 text-slate-300">
              <p>
                Practical AI for Adults: Work, Productivity and Everyday Use is
                a 4-week in-person course designed for adults who are already
                comfortable using a computer or smartphone and want practical
                guidance on how to use AI more effectively.
              </p>
              <p>
                Participants will learn what AI is, how to ask better
                questions, how to use AI for writing, planning, summarising, and
                productivity, and how to check and use AI responsibly. The
                course is practical, interactive, and focused on real-life use
                rather than technical jargon.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-sky-400/20 bg-sky-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Ideal Participant
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              A practical introduction without needing a technical background.
            </h2>
            <p className="mt-6 text-base leading-8 text-slate-200">
              This course is ideal for adults who want a practical introduction
              to AI without needing a technical background.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Who This Course Is For
            </p>
            <div className="mt-8 grid gap-4">
              {whoItsFor.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Who This Course Is Not For
            </p>
            <div className="mt-8 grid gap-4">
              {whoItsNotFor.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              What You Will Learn
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {learningPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Course Breakdown
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              A practical 4-week learning journey.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {courseBreakdown.map((item) => (
              <div
                key={item.week}
                className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur"
              >
                <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
                  {item.week}
                </p>
                <h3 className="mt-3 text-xl font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              How This Course Can Help in Real Life
            </p>
            <p className="mt-6 text-base leading-8 text-slate-300">
              This course focuses on practical uses of AI that can support
              everyday life and work.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {useCases.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              What&apos;s Included
            </p>

            <div className="mt-8 grid gap-4">
              {includedItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-2xl border border-white/10 bg-sky-500/10 p-4 text-sm leading-7 text-slate-200">
                <span className="font-semibold text-white">Soft Copy Option:</span>{" "}
                digital course materials
              </div>
              <div className="rounded-2xl border border-white/10 bg-sky-500/10 p-4 text-sm leading-7 text-slate-200">
                <span className="font-semibold text-white">Hard Copy Option:</span>{" "}
                printed course materials/workbook
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] border border-emerald-400/20 bg-emerald-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
              Pilot Community Rate
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              TT$750 — Soft copy
            </h2>
            <p className="mt-3 text-lg text-slate-200">
              TT$850 — Hard copy
            </p>
            <p className="mt-6 text-base leading-8 text-slate-200">
              Spaces are limited. Early registration is encouraged.
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-100">
              Registration is confirmed after payment.
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

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              How the Course Is Taught
            </p>
            <p className="mt-6 text-base leading-8 text-slate-300">
              This course is delivered in a practical, hands-on format.
              Sessions include explanation, live demonstration, guided
              examples, participant practice, and discussion. The focus is on
              helping adults use AI confidently in real-life situations, not on
              technical theory.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
  <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
    <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
      About the Facilitator
    </p>

    <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
      Practical experience, clear teaching, and real-world AI use.
    </h2>

    <div className="mt-8 space-y-6 text-base leading-8 text-slate-300">
      <p>
        Andre Burton is an experienced educator and digital practitioner who has
        spent years helping learners understand difficult concepts clearly and
        practically. Through A&apos;s Online Tutoring Services, he has delivered
        thousands of hours of personalised teaching and built a strong
        reputation for breaking down complex ideas into simple, usable steps.
      </p>

      <p>
        In his own work, Andre already uses AI in practical ways to support
        writing, planning, idea development, learning tools, website building,
        and digital workflows. That means this course is not being taught from
        theory alone, but from real experience using AI to create, organise,
        communicate, and solve everyday problems more effectively.
      </p>

      <p>
        His approach focuses on helping adults understand what AI can
        realistically do, how to use it well, and how to apply it with
        confidence in work and everyday life.
      </p>
    </div>
  </div>

  <div className="rounded-[2rem] border border-sky-400/20 bg-sky-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
    <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
      Why Learn From Andre?
    </p>

    <div className="mt-8 grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
        Thousands of hours of teaching experience
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
        Practical experience using AI in real projects and workflows
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
        Experience building learning tools and websites with AI support
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200">
        Strong focus on clear explanation and real-life application
      </div>
    </div>
  </div>
</section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1fr_0.95fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              By the End of the Course
            </p>
            <p className="mt-6 text-base leading-8 text-slate-300">
              Participants should be able to:
            </p>

            <div className="mt-8 grid gap-4">
              {outcomes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Certificate of Completion
            </p>
            <p className="mt-6 text-base leading-8 text-slate-300">
              Participants who complete the course will receive a Certificate of
              Completion from A&apos;s Online Tutoring Services.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-sky-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Register for the Course
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              Complete the registration form to reserve your space.
            </h2>

            <div className="mt-6 space-y-2 text-base text-slate-200">
              <p>Soft copy option — TT$750</p>
              <p>Hard copy option — TT$850</p>
              <p>Registration confirmed after payment</p>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={registrationLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Register Now
              </a>

              <a
                href="/contact"
                className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Contact for More Information
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

