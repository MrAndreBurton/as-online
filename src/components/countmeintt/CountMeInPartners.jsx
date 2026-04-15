import { countMeInPartners } from "../../data/countmeintt";

export default function CountMeInPartners() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          Official Partners
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          Organisations and donors that have supported CountMeInTT to date.
        </h2>
        <p className="mt-6 text-base leading-8 text-slate-300">
          These partnerships reflect growing confidence in the platform and its
          potential to support mathematics engagement across Trinidad and
          Tobago.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {countMeInPartners.map((partner) => (
          <div
            key={partner.name}
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur"
          >
            <div className="mb-4 h-10 w-10 rounded-2xl bg-sky-500/15" />
            <h3 className="text-xl font-semibold text-white">{partner.name}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {partner.note}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}


