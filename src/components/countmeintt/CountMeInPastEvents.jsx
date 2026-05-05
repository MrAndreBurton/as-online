import { countMeInPastEvents } from "../../data/countmeintt";

export default function CountMeInPastEvents() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          Past Events
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          CountMeInTT in the community.
        </h2>
        <p className="mt-6 text-base leading-8 text-slate-300">
          A look back at events where students engaged with CountMeInTT through
          live challenges, practice sessions, and public activations.
        </p>
      </div>

      <div className="grid gap-6">
        {countMeInPastEvents.map((event) => (
          <div
            key={event.title}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
              Past Event
            </p>

            <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">
              {event.title}
            </h3>

            <p className="mt-3 text-base text-slate-300">
              {event.organisation}
            </p>

            <p className="mt-2 text-base font-medium text-white">
              {event.date}
            </p>

            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300">
              {event.description}
            </p>

            <div className="mt-8">
              <a
                href={event.link}
                target={event.link.startsWith("http") ? "_blank" : "_self"}
                rel={event.link.startsWith("http") ? "noreferrer" : undefined}
                className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
              >
                {event.buttonText || "View Event Details"}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

