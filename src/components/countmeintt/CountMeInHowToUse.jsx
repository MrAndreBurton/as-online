import { countMeInHowToUse } from "../../data/countmeintt";

export default function CountMeInHowToUse() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          How To Use
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          Built for students, teachers, and parents.
        </h2>
        <p className="mt-6 text-base leading-8 text-slate-300">
          CountMeInTT can be used in different ways depending on who is
          supporting the child’s learning journey. Consistent, monthly practice has
          already shown to have a positive impact on A's Online students over the past
          five years. With 10 minutes of practice, students are able to improve over time.  
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {countMeInHowToUse.map((item) => (
          <div
            key={item.audience}
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur"
          >
            <div className="mb-4 h-10 w-10 rounded-2xl bg-sky-500/15" />
            <h3 className="text-xl font-semibold text-white">
              {item.audience}
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

