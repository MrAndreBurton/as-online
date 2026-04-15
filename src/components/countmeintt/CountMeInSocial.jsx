import {
  countMeInSocialLinks,
  countMeInSocialFeature,
} from "../../data/countmeintt";

export default function CountMeInSocial() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            Follow the Movement
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
            See challenges, results, and student highlights across our platforms.
          </h2>

          <p className="mt-6 text-base leading-8 text-slate-300">
            Follow CountMeInTT for challenge updates, gameplay moments, student
            reactions, and multiplication practice in action.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {countMeInSocialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:bg-slate-900/80"
              >
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                  {item.label}
                </p>
                <p className="mt-3 text-sm font-medium leading-7 text-white">
                  {item.handle}
                </p>
              </a>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl shadow-black/20 lg:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
            Featured Social Content
          </p>

          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {countMeInSocialFeature.title}
          </h3>

          <p className="mt-6 text-base leading-8 text-slate-300">
            {countMeInSocialFeature.description}
          </p>

          <div className="mt-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950/60">
            {countMeInSocialFeature.previewImage ? (
              <img
                src={countMeInSocialFeature.previewImage}
                alt={`${countMeInSocialFeature.title} preview`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center px-6 text-center text-sm leading-7 text-slate-400">
                Add featured social preview image here.
              </div>
            )}
          </div>

          <div className="mt-6">
            <a
              href={countMeInSocialFeature.embedLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              View Featured Post
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

