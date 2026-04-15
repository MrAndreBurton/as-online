import { countMeInWhyItWorks } from "../../data/countmeintt";

export default function CountMeInWhyItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          Why It Works
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          A system built on repetition, speed, and competition.
        </h2>
        <p className="mt-6 text-base leading-8 text-slate-300">
          Students do not just practice—they push themselves to improve every
          time they play. Many users keep returning to the platform over months,
          to beat their times and possibly make it on the Leaderboards.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {countMeInWhyItWorks.map((item) => (
          <div
            key={item.title}
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur"
          >
            <div className="mb-4 h-10 w-10 rounded-2xl bg-sky-500/15" />
            <h3 className="text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}


