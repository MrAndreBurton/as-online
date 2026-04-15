import { countMeInGallery } from "../../data/countmeintt";

export default function CountMeInGallery() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          CountMeInTT in Action
        </p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          Students engaging, competing, and improving through the game.
        </h2>
        <p className="mt-6 text-base leading-8 text-slate-300">
          CountMeInTT has entered classrooms across Trinidad, challenging students to learn
          and improve their mulitplication times tables. They are building multiplication speed,
          confidence, and focus.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {countMeInGallery.map((item, index) => (
          <div
            key={`${item.alt}-${index}`}
            className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-xl shadow-black/10 backdrop-blur"
          >
            <div className="aspect-[4/5] overflow-hidden bg-slate-900/60">
              <img
                src={item.image}
                alt={item.alt}
                className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                loading="lazy"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


