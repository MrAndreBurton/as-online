import { countMeInResources } from "../../data/countmeintt";

const resourceCategories = [
  "Implementation Guides",
  "User Guides",
  "Proof of Concept Materials",
  "Research & Development",
];

export default function CountMeInResources() {
  return (
    <section
      id="countmeintt-resources"
      className="mx-auto max-w-7xl px-6 pb-20 lg:px-8"
    >
      <div className="mb-8 max-w-4xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          Resources
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          Guides, worksheets, and supporting material for using CountMeInTT well.
        </h2>
        <p className="mt-6 text-base leading-8 text-slate-300">
          Explore implementation guides, user support material, printable
          resources, and development notes that help schools, teachers, parents,
          and students get the most out of CountMeInTT.
        </p>
      </div>

      <div className="space-y-16">
        {resourceCategories.map((category) => {
          const categoryResources = countMeInResources.filter(
            (item) => item.category === category
          );

          if (!categoryResources.length) return null;

          return (
            <div key={category}>
              <div className="mb-8">
                <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                  Resource Category
                </p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white lg:text-3xl">
                  {category}
                </h3>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {categoryResources.map((resource) => (
                  <div
                    key={resource.title}
                    className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur"
                  >
                    {resource.previewImage ? (
                      <div className="mb-4 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
                        <img
                          src={resource.previewImage}
                          alt={`${resource.title} preview`}
                          className="h-56 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null}

                    <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
                      {resource.type}
                    </p>

                    <h4 className="mt-4 text-xl font-semibold text-white">
                      {resource.title}
                    </h4>

                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {resource.description}
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                      <a
                        href={resource.viewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                      >
                        View
                      </a>

                      <a
                        href={resource.downloadLink}
                        download
                        className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

