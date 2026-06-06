import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo/as-online-logo.svg";

const navigation = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Tutoring", path: "/tutoring" },
  {
    name: "Courses",
    path: "/courses",
    children: [
      { name: "All Courses", path: "/courses" },
      {
        name: "AI & Digital Readiness",
        path: "/courses/ai-digital-readiness",
      },
      {
        name: "Practical AI for Adults",
        path: "/courses/practical-ai-for-adults",
      },
    ],
  },
  { name: "Resources", path: "/resources" },
  { name: "Contact", path: "/contact" },
  { name: "CountMeInTT", path: "/countmeintt", featured: true },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt="A's Online logo"
              className="h-12 w-12 object-contain"
            />

            <div>
              <p className="text-lg font-semibold tracking-wide text-white">
                A&apos;s Online
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300/80">
                Modern Learning Support
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-3 text-white transition hover:bg-white/10 md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            <span className="text-lg leading-none">{menuOpen ? "✕" : "☰"}</span>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <div key={item.name} className="group relative">
                    <Link
                      to={item.path}
                      className="text-sm text-slate-200 transition hover:text-sky-300"
                    >
                      {item.name}
                    </Link>

                    <div className="invisible absolute left-0 top-full z-50 mt-3 w-72 translate-y-2 rounded-2xl border border-white/10 bg-slate-900/95 p-3 opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.path}
                          className="block rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5 hover:text-sky-300"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={
                    item.featured
                      ? "text-sm font-semibold text-yellow-300 transition hover:text-yellow-200"
                      : "text-sm text-slate-200 transition hover:text-sky-300"
                  }
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {menuOpen && (
          <nav className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl md:hidden">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <div key={item.name} className="rounded-xl border border-white/10 bg-white/5">
                    <button
                      type="button"
                      onClick={() => setCoursesOpen(!coursesOpen)}
                      className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/5 hover:text-sky-300"
                    >
                      <span>{item.name}</span>
                      <span>{coursesOpen ? "−" : "+"}</span>
                    </button>

                    {coursesOpen && (
                      <div className="grid gap-1 px-2 pb-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.path}
                            onClick={() => {
                              setMenuOpen(false);
                              setCoursesOpen(false);
                            }}
                            className="rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-sky-300"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={
                    item.featured
                      ? "rounded-xl px-4 py-3 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-400/10 hover:text-yellow-200"
                      : "rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5 hover:text-sky-300"
                  }
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
}

