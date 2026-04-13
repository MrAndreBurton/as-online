import { Link } from "react-router-dom";

export default function HeroSection() {
  const highlights = [
    "One-on-one tutoring tailored to each student",
    "Clear explanations that build confidence",
    "Online and flexible learning support",
    "Strong focus on foundations and understanding",
  ];

  return (
    <section className="relative mx-auto grid max-w-7xl items-center gap-12 overflow-hidden px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-8%] top-8 h-40 w-40 rounded-full border border-sky-300/10 bg-sky-300/5 blur-2xl" />
        <div className="absolute right-[8%] top-10 h-48 w-48 rounded-full border border-cyan-300/10 bg-cyan-300/5 blur-3xl" />
        <svg
          viewBox="0 0 800 500"
          className="absolute right-[-80px] top-0 h-full w-[520px] opacity-[0.12]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M146 108C201 71 281 63 346 96C386 116 414 148 453 170C519 208 610 205 665 256C705 294 721 354 698 402" stroke="url(#paint0)" strokeWidth="2" strokeLinecap="round" />
          <path d="M98 194C152 172 211 178 259 211C298 239 325 277 366 303C435 347 531 339 603 378" stroke="url(#paint1)" strokeWidth="2" strokeLinecap="round" />
          <path d="M220 82L246 58L272 82" stroke="url(#paint2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M206 96H287" stroke="url(#paint3)" strokeWidth="2" strokeLinecap="round" />
          <rect x="470" y="86" width="120" height="88" rx="18" stroke="url(#paint4)" strokeWidth="2" />
          <path d="M500 118H561" stroke="url(#paint5)" strokeWidth="2" strokeLinecap="round" />
          <path d="M500 142H548" stroke="url(#paint6)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="570" cy="328" r="44" stroke="url(#paint7)" strokeWidth="2" />
          <path d="M548 328H592" stroke="url(#paint8)" strokeWidth="2" strokeLinecap="round" />
          <path d="M570 306V350" stroke="url(#paint9)" strokeWidth="2" strokeLinecap="round" />
          <defs>
            <linearGradient id="paint0" x1="146" y1="108" x2="698" y2="402" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7DD3FC" />
              <stop offset="1" stopColor="#38BDF8" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="paint1" x1="98" y1="194" x2="603" y2="378" gradientUnits="userSpaceOnUse">
              <stop stopColor="#93C5FD" />
              <stop offset="1" stopColor="#22D3EE" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="paint2" x1="220" y1="58" x2="272" y2="82" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="paint3" x1="206" y1="96" x2="287" y2="96" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="paint4" x1="470" y1="86" x2="590" y2="174" gradientUnits="userSpaceOnUse">
              <stop stopColor="#BAE6FD" />
              <stop offset="1" stopColor="#0EA5E9" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="paint5" x1="500" y1="118" x2="561" y2="118" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="paint6" x1="500" y1="142" x2="548" y2="142" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="paint7" x1="526" y1="284" x2="614" y2="372" gradientUnits="userSpaceOnUse">
              <stop stopColor="#BAE6FD" />
              <stop offset="1" stopColor="#22D3EE" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="paint8" x1="548" y1="328" x2="592" y2="328" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="paint9" x1="570" y1="306" x2="570" y2="350" gradientUnits="userSpaceOnUse">
              <stop stopColor="#E0F2FE" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div>
        <div className="mb-6 inline-flex items-center rounded-full border border-sky-400/20 bg-white/5 px-4 py-1 text-sm text-sky-200">
          Personalised Tutoring • Courses • Digital Skills
        </div>

        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Empowering Minds, One Student at a Time.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          From personalised one-on-one tutoring to innovative AI-powered learning tools, A&apos;s Online blends modern technology, gamification, and traditional learning principles, to help every student succeed. Whether it&apos;s mastering math or unlocking potential through engaging challenges, we&apos;re here to guide students on their journey of learning.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/courses"
            className="rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
          >
            View Courses
          </Link>

          <Link
            to="/resources"
            className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Free Resources
          </Link>
        </div>

        <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 shadow-xl shadow-black/10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
            <span className="text-lg font-semibold">90</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
              Students Tutored
            </p>
            <p className="text-sm text-slate-200">and counting</p>
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {highlights.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 shadow-xl shadow-black/10"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


