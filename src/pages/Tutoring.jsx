import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const registrationLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSduZj2qI01suyHDZN7TixWnPE83NMuFB4SkpgRmedWNKCWYJw/viewform?usp=header";

const audienceList = [
  "Students from Standard 3 to Standard 5 (SEA preparation)",
  "Students preparing for CSEC Mathematics",
  "Adult repeaters who struggle with concepts and understanding",
  "Students who are weak in fundamentals",
  "Students who understand but need speed and confidence",
  "Students aiming to improve performance and results",
];

const sessionList = [
  "One-on-one (full attention, no distractions)",
  "Online (accessible from anywhere)",
  "Interactive (students are actively solving, not just watching)",
  "Tailored in real time based on the student’s level",
];

const focusList = [
  "Strong foundations (times tables, number sense)",
  "Breaking down word problems step-by-step",
  "Understanding before memorizing",
  "Building speed and accuracy for exams",
  "Confidence under pressure",
];

const resultsList = [
  "Improve understanding of key topics",
  "Get faster and more accurate in solving problems",
  "Gain confidence in tests and exams",
  "Move from “I don’t like Maths” to “I can do this”",
];

const toolsList = [
  "Interactive grids and drills (CountMeInTT-style training)",
  "Digital whiteboards for step-by-step explanations",
  "Interactive learning tools for practice exercises",
  "Gamified activities to improve speed and engagement",
  "Past paper strategies and exam techniques",
  "AI-supported learning tools where needed",
];

const trustList = [
  "Individual attention, not classroom-style teaching",
  "Proven results with SEA and CSEC students",
  "Clear improvement in confidence and performance",
  "Modern approach that keeps students engaged",
];

const pricingPlans = [
  {
    name: "Starter",
    price: "$350 / month",
    frequency: "1 Hour Per Week",
    description: "Ideal for steady support and reinforcement",
    features: [
      "4 sessions monthly",
      "Focus on understanding core concepts",
    ],
    accent: "border-sky-400/20 bg-sky-500/10",
    buttonStyle: "bg-sky-500 text-slate-950 hover:scale-[1.02]",
    badge: null,
  },
  {
    name: "Most Popular",
    price: "$600 / month",
    frequency: "2 Hours Per Week",
    description: "Best for faster improvement and consistent progress",
    features: [
      "8 sessions monthly",
      "More practice and correction",
      "Stronger performance gains",
    ],
    accent: "border-amber-400/30 bg-amber-400/10",
    buttonStyle: "bg-amber-300 text-slate-950 hover:scale-[1.02]",
    badge: "Most Popular",
  },
  {
    name: "Intensive",
    price: "$800 / month",
    frequency: "3 Hours Per Week",
    description: "For exam prep and major improvement",
    features: [
      "12 sessions monthly",
      "Maximum support and repetition",
      "Focus on speed, accuracy, and exam readiness",
    ],
    accent: "border-rose-400/20 bg-rose-500/10",
    buttonStyle: "bg-rose-400 text-slate-950 hover:scale-[1.02]",
    badge: null,
  },
];

export default function Tutoring() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
            <div className="max-w-4xl">
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
                One-on-One Mathematics Tutoring
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                One-on-One Mathematics Tutoring Where Students Can Learn More in
                One Hour Than in a Year of School
              </h1>

              <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
                Focused, personalized sessions designed to build understanding,
                confidence, and exam performance—from Standard 3 to CSEC.
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
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Who This Is For
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Support for students who need clarity, practice, and momentum.
            </h2>

            <div className="mt-8 grid gap-4">
              {audienceList.map((item) => (
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
              How the Sessions Work
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Personalized in real time for each student.
            </h2>

            <div className="mt-8 grid gap-4">
              {sessionList.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-8 text-base leading-8 text-slate-300">
              No two sessions are the same—because no two students are the same.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-2 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              What We Focus On
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Understanding first, then speed, confidence, and results.
            </h2>

            <div className="mt-8 grid gap-4">
              {focusList.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-7 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Results You Can Expect
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Consistency leads to noticeable improvement.
            </h2>

            <div className="mt-8 grid gap-4">
              {resultsList.map((item) => (
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
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Tools & Methods Used
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Modern tools that keep learning active and engaging.
            </h2>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {toolsList.map((item) => (
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

        <section className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-sky-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Structured Support
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Most students see noticeable improvement within the first few
              weeks of consistent sessions.
            </h2>
            <p className="mt-6 max-w-4xl text-base leading-8 text-slate-200">
              With up to 100 hours of structured one-on-one tutoring, students
              build the foundation needed for real, lasting results.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="mb-8 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Pricing
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              Choose the level of support that fits your child’s needs.
            </h2>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-[2rem] border p-8 shadow-2xl shadow-black/20 backdrop-blur ${plan.accent}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-slate-300">
                      {plan.name}
                    </p>
                    <h3 className="mt-4 text-3xl font-semibold text-white">
                      {plan.price}
                    </h3>
                    <p className="mt-2 text-base text-slate-200">
                      {plan.frequency}
                    </p>
                  </div>
                  {plan.badge ? (
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                <p className="mt-6 text-sm leading-7 text-slate-200">
                  {plan.description}
                </p>

                <div className="mt-8 grid gap-3">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm leading-7 text-slate-100"
                    >
                      {feature}
                    </div>
                  ))}
                </div>

                <a
                  href={registrationLink}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-8 inline-flex rounded-full px-5 py-3 text-sm font-semibold transition ${plan.buttonStyle}`}
                >
                  Register Now
                </a>
              </div>
            ))}
          </div>

          <p className="mt-8 text-sm leading-7 text-slate-400">
            Individual sessions are available at $80 per hour, but monthly
            packages are recommended for the best results.
          </p>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Why Parents Choose A&apos;s Online
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              Support that stays personal, focused, and effective.
            </h2>

            <div className="mt-8 grid gap-4">
              {trustList.map((item) => (
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
              Final Call to Action
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
              Give your child the support they need to succeed in Mathematics.
            </h2>

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
                href="https://wa.me/18687543315"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                WhatsApp / Call for More Information
              </a>
            </div>

            <p className="mt-8 text-base leading-8 text-slate-300">
              Ready to take the next step? Start with the package that fits your
              needs and let&apos;s build strong mathematical foundations with
              consistency, clarity, and confidence.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


