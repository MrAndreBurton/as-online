import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Helmet } from "react-helmet-async";

const impactStats = [
  { value: "90+", label: "Students taught one-on-one" },
  { value: "9,000+", label: "Hours of tutoring delivered" },
  { value: "Std 3 – CSEC", label: "Focused support range" },
];

const philosophyPoints = [
  "Strong foundations, especially times tables and number sense",
  "Breaking down problems step-by-step",
  "Building speed without losing accuracy",
  "Making students think, not just memorize",
];

const approachPoints = [
  "Students get individual attention",
  "Mistakes are corrected immediately",
  "Lessons are adapted to the student—not the other way around",
  "Traditional teaching is combined with modern tools and techniques",
];

const differentiators = [
  "One-on-one sessions",
  "Online learning tools",
  "Interactive math games like CountMeInTT",
  "AI and digital skill development",
  "Competitions and challenges that build confidence",
];

const trustPoints = [
  "Proven track record with SEA and CSEC students",
  "Personalized one-on-one attention",
  "Structured progress and consistent feedback",
  "Trusted by parents across Trinidad and Tobago",
];

export default function About() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
  <title>About | A's Online Tutoring Services</title>
  <meta
    name="description"
    content="Learn more about Andre Burton, A's Online Tutoring Services, and the teaching approach helping students build confidence and results in Mathematics at the SEA and CSEC levels (primary and secondary schools)."
  />
  <meta property="og:title" content="About | A's Online Tutoring Services" />
  <meta
    property="og:description"
    content="Learn more about Andre Burton, A's Online Tutoring Services, and the teaching approach helping students build confidence and results in Mathematics at the SEA and CSEC levels (primary and secondary schools)."
  />
</Helmet>

      <Header />

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
                About A&apos;s Online
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Built to help more students understand Mathematics and succeed.
              </h1>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
                For more than 20 years, over 50% of students have struggled to
                pass Mathematics at both SEA and CSEC levels in Trinidad and
                Tobago.
              </p>

              <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                That&apos;s not just a statistic—it represents thousands of
                students being left behind every year. A&apos;s Online was built
                to change that by giving students the tools, understanding, and
                confidence they need to move forward.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 lg:grid-cols-3 lg:px-8">
          {impactStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur"
            >
              <p className="text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {stat.label}
              </p>
            </div>
          ))}
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              My Story
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              From helping classmates to building a tutoring system.
            </h2>

            <div className="mt-8 space-y-6 text-base leading-8 text-slate-300">
              <p>
                My name is Andre Burton. I&apos;ve been teaching Mathematics
                since I was a student myself—helping classmates understand
                concepts that never quite clicked in the classroom.
              </p>
              <p>
                What started as helping a few friends grew into something much
                bigger. Over the years, I&apos;ve worked with students across
                primary, secondary, and even adult learners preparing for exams.
              </p>
              <p>
                In 2019, I officially launched A&apos;s Online Tutoring
                Services. When the world shifted online, I was already ready—and
                that made it possible to reach and help even more students
                across Trinidad and Tobago.
              </p>
              <p>
                Students move from “I don&apos;t like Maths” to “I actually love
                Maths.” That shift in confidence is where real success begins.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Teaching Philosophy
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Understanding first. Confidence next. Results after that.
            </h2>

            <div className="mt-8 space-y-6 text-base leading-8 text-slate-300">
              <p>
                Mathematics is a language that uses numbers and symbols to
                communicate.
              </p>
              <p>
                Too often, students are taught to memorize instead of
                understand—and that is where the problem starts.
              </p>
              <p>
                I tell my students all the time: do not say “I can&apos;t” or “I
                don&apos;t know.” That is self-defeating.
              </p>
              <p>
                You cannot teach someone anything—you can only help them find it
                within themselves.
              </p>
              <p>
                Every student learns differently. That is why my sessions are
                one-on-one, interactive, and tailored in real time.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              How I Teach
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Sessions designed around the student.
            </h2>

            <div className="mt-8 grid gap-4">
              {philosophyPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Why It Works
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              A better process leads to better outcomes.
            </h2>

            <div className="mt-8 grid gap-4">
              {approachPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[1fr_0.9fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              What Makes A&apos;s Online Different
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              More than tutoring.
            </h2>

            <div className="mt-6 max-w-2xl space-y-6 text-base leading-8 text-slate-300">
              <p>
                A’s Online is not just tutoring. It is not only about passing
                exams. It is a system built around structure, creativity, and
                modern tools that keep students engaged while building real
                skill.
              </p>

              <p>
                My approach focuses on building confidence in what students
                already know and helping them realise they are capable of more.
              </p>

              <p>
                I take time to connect with each student—understanding how they
                think, what they struggle with, and what matters to them—so I
                can teach in a way that actually makes sense to them. Every
                session is tailored to the individual, not just to cover
                content, but to build confidence and curiosity.
              </p>

              <p>
                With tools like CountMeInTT and other interactive resources,
                learning becomes engaging, structured, and modern. The goal is
                to move students from “I don’t like Maths” to “I actually enjoy
                learning.”
              </p>

              <p>
                I always remind my students that Mathematics is not just about
                numbers—it is about training your mind to think through problems
                and find solutions. That is a skill they will use for the rest
                of their lives.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {differentiators.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Trust & Credibility
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Results that parents can feel confident about.
            </h2>

            <div className="mt-8 grid gap-4">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200"
                >
                  {point}
                </div>
              ))}
            </div>

            <p className="mt-8 text-base leading-8 text-slate-300">
              Many students come through referrals—which speaks to the trust,
              consistency, and results behind the work.
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-sky-400/20 bg-sky-500/10">
              <div className="aspect-[16/9] overflow-hidden bg-slate-900/60">
                <img
                  src="/images/about/guardian-andre-burton-feature.jpg"
                  alt="Trinidad Guardian feature on Andre Burton"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
                  Featured Article
                </p>

                <h3 className="mt-3 text-xl font-semibold text-white">
                  Featured in the Trinidad Guardian
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Read the Guardian feature on Andre Burton, A&apos;s Online
                  Tutoring Services, and Count Me In TT.
                </p>

                <a
                  href="https://www.guardian.co.tt/article/andre-burton-6.2.2449695.ed1a3e0e8b"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                >
                  Read Article
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-sky-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              note from andre
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              If your child is struggling with Mathematics—or can benefit from
              the right guidance to improve—you&apos;re in the right place.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-200">
              Let&apos;s get to work.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


