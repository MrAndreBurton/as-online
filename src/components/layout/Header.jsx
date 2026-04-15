import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo/as-online-logo.svg";

const navigation = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Tutoring", path: "/tutoring" },
  { name: "Courses", path: "/courses" },
  { name: "Resources", path: "/resources" },
  { name: "Contact", path: "/contact" },
  { name: "CountMeInTT", path: "/countmeintt", featured: true },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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

          <nav className="hidden gap-8 md:flex">
            {navigation.map((item) => (
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
            ))}
          </nav>
        </div>

        {menuOpen && (
          <nav className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl md:hidden">
            {navigation.map((item) => (
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
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}

