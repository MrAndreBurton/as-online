import { featuredChallenge } from "../../data/countmeintt";

export default function CountMeInFeaturedChallenge() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="relative">
        <div className="absolute -inset-4 rounded-[2rem] bg-sky-500/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-sky-300">Featured Challenge</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {featuredChallenge.title}
                </h2>
              </div>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300">
                Challenge Live
              </span>
            </div>

            <p className="mb-6 max-w-3xl text-base leading-8 text-slate-300">
              {featuredChallenge.description}
            </p>

            <div className="space-y-4">
              <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                <iframe
                  className="h-full w-full"
                  src={featuredChallenge.videoEmbed}
                  title={featuredChallenge.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={featuredChallenge.playLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Play Now
                </a>
                <a
                  href={featuredChallenge.joinLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Join the Challenge
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

