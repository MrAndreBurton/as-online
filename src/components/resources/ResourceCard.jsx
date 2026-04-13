export default function ResourceCard({ resource }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur">
      <p className="text-xs uppercase tracking-[0.25em] text-sky-300">
        {resource.type}
      </p>

      <h3 className="mt-4 text-xl font-semibold text-white">
        {resource.title}
      </h3>

      <p className="mt-3 text-sm leading-7 text-slate-300">
        {resource.description}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        {resource.type === "video" ? (
          <a
            href={resource.link}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
          >
            Watch Video
          </a>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}


