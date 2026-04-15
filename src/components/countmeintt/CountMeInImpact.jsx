import { countMeInImpact, countMeInStats } from "../../data/countmeintt";

export default function CountMeInImpact() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          Impact
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          CountMeInTT is already making an impact across Trinidad and Tobago.
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
            <p className="text-3xl font-semibold text-white">
              {countMeInStats.schools}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Schools represented by students who have engaged with the platform.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
            <p className="text-3xl font-semibold text-white">
              {countMeInStats.visits}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Visits recorded as awareness and usage continue to grow.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
            <p className="text-3xl font-semibold text-white">
              {countMeInStats.submissions}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Game submissions completed through practice, challenges, and repeated play.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            What This Means
          </p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            Real usage. Real repetition. Real confidence building.
          </h3>

          <div className="mt-8 grid gap-4">
            {countMeInImpact.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

