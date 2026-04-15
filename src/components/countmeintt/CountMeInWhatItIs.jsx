import { countMeInWhatItIs } from "../../data/countmeintt";

export default function CountMeInWhatItIs() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            {countMeInWhatItIs.title}
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
            An interactive multiplication game built for speed, accuracy, and
            confidence.
          </h2>

          <div className="mt-8 space-y-6 text-base leading-8 text-slate-300">
            {countMeInWhatItIs.description.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-sky-400/20 bg-sky-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            Core Idea
          </p>

          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Repetition becomes competition.
          </h3>

          <p className="mt-6 text-base leading-8 text-slate-200">
            CountMeInTT gives students a reason to practice multiplication with
            purpose. Instead of seeing repetition as boring, they experience it
            as a challenge—something measurable, repeatable, and worth improving
            every time.
            
          </p>
        </div>
      </div>
    </section>
  );
}


