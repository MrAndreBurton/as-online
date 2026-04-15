import { Link } from "react-router-dom";
import { countMeInSchools } from "../../data/countmeintt";

export default function CountMeInSchools() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
        <div className="max-w-4xl">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            For Schools
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
            {countMeInSchools.title}
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-300">
            {countMeInSchools.description}
          </p>

          <div className="mt-8">
            <Link
              to={countMeInSchools.contactLink}
              className="inline-flex rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              Contact for School Integration
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

