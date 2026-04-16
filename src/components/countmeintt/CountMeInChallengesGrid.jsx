import { currentChallenges, pastChallenges } from "../../data/countmeintt";

export default function CountMeInChallengesGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="mb-12 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          Challenges
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          Real challenges that turn practice into participation.
        </h2>
      </div>

      <div className="mb-16">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Current Challenges
          </p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Active opportunities for students to join and compete.
          </h3>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {currentChallenges.map((challenge) => (
            <div
              key={challenge.title}
              className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-xl shadow-black/10 backdrop-blur"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-900/60">
                <img
                  src={challenge.flyer}
                  alt={challenge.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="p-6">
                <h4 className="text-xl font-semibold text-white">
                  {challenge.title}
                </h4>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {challenge.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
  href={challenge.flyer}
  target="_blank"
  rel="noreferrer"
  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
>
  View Flyer
</a>
                  <a
                    href={challenge.joinLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Join Challenge
                  </a>
                </div>

                {challenge.videoLink ? (
                  <a
                    href={challenge.videoLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-medium text-sky-300 transition hover:text-sky-200"
                  >
                    Watch Video →
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-8 max-w-3xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
            Past Challenges
          </p>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white lg:text-3xl">
            Completed challenges that showcase real participation and results.
          </h3>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {pastChallenges.map((challenge) => (
            <div
              key={challenge.title}
              className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur"
            >
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="aspect-[4/3] overflow-hidden bg-slate-900/60">
                  <img
                    src={challenge.flyer}
                    alt={challenge.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-6">
                  <h4 className="text-2xl font-semibold text-white">
                    {challenge.title}
                  </h4>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {challenge.description}
                  </p>

                  {challenge.winnersImage ? (
                    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                      <img
                        src={challenge.winnersImage}
                        alt={`${challenge.title} winners`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}

                  {challenge.winners?.length ? (
                    <div className="mt-6">
                      <p className="text-sm uppercase tracking-[0.25em] text-sky-300">
                        Winners
                      </p>
                      <div className="mt-3 grid gap-3">
                        {challenge.winners.map((winner) => (
                          <div
                            key={winner}
                            className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200"
                          >
                            {winner}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

