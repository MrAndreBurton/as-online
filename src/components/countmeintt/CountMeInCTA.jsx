import { Link } from "react-router-dom";
import { countMeInCTA } from "../../data/countmeintt";

export default function CountMeInCTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
      <div className="rounded-[2rem] border border-white/10 bg-sky-500/10 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          Final Call to Action
        </p>

        <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          {countMeInCTA.title}
        </h2>

        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-200">
          Start practicing, explore the support materials, or get in touch to
          bring CountMeInTT into your classroom, school, or learning environment.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={countMeInCTA.playLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
          >
            Play Now
          </a>

          <a
            href={countMeInCTA.resourcesAnchor}
            className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Explore Resources
          </a>

          <Link
            to={countMeInCTA.contactLink}
            className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Contact for More Info
          </Link>
        </div>
      </div>
    </section>
  );
}

