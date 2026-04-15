import { Link } from "react-router-dom";

const featuredVideo = "https://www.youtube.com/embed/st-unhiZF34";
const registrationLink =
  "https://docs.google.com/forms/d/e/1FAIpQLSduZj2qI01suyHDZN7TixWnPE83NMuFB4SkpgRmedWNKCWYJw/viewform?usp=header";

export default function FeaturedCourse() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="relative">
        <div className="absolute -inset-4 rounded-[2rem] bg-sky-500/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/80 p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-sky-300">Featured Course</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  AI &amp; Digital Readiness
                </h2>
              </div>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Registration Open
              </span>
            </div>

            <div className="space-y-4">
              <div className="aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
                <iframe
                  className="h-full w-full"
                  src={featuredVideo}
                  title="AI and Digital Readiness Course"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to="/courses/ai-digital-readiness"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:opacity-90"
                >
                  Learn More
                </Link>

                <a
                  href={registrationLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Register Now
                </a>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Mode
                </p>
                <p className="mt-2 text-sm text-white">Online / Hybrid</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Audience
                </p>
                <p className="mt-2 text-sm text-white">
                  Beginners &amp; Students
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Action
                </p>
                <p className="mt-2 text-sm text-white">Google Form Signup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

