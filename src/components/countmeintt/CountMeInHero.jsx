import { countMeInStats } from "../../data/countmeintt";
import countMeInLogo from "../../assets/logo/countmeintt-logo.svg";

export default function CountMeInHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-[-6%] top-8 h-40 w-40 rounded-full border border-sky-300/10 bg-sky-300/5 blur-2xl" />
          <div className="absolute right-[6%] top-10 h-48 w-48 rounded-full border border-cyan-300/10 bg-cyan-300/5 blur-3xl" />
        </div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:items-start">
          <div className="flex justify-center lg:justify-start">
            <img
              src={countMeInLogo}
              alt="Count Me In TT logo"
              className="h-60 w-auto object-contain sm:h-68 lg:h-72"
            />
          </div>

          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Powered by A's Online - Turning Math Practice Into a Game Students Enjoy
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Count Me In TT - Math Fluency
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
              A simple but powerful way to build speed, accuracy, and confidence
              in multiplication through challenge, repetition, and competition.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="https://www.countmeintt.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                Play Now
              </a>

              <a
                href="#countmeintt-resources"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Explore Resources
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <p className="text-3xl font-semibold text-white">
              {countMeInStats.schools}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Used by students across schools in Trinidad and Tobago
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <p className="text-3xl font-semibold text-white">
              {countMeInStats.visits}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Site visits recorded through growing public interest and school
              engagement
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <p className="text-3xl font-semibold text-white">
              {countMeInStats.submissions}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Game submissions completed by students building speed and
              confidence
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


