import { Link } from "react-router-dom";
import logo from "../../assets/logo/as-online-logo.svg";

const navigation = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Tutoring", path: "/tutoring" },
  { name: "Courses", path: "/courses" },
  { name: "Resources", path: "/resources" },
  { name: "Contact", path: "/contact" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
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

        <nav className="hidden gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className="text-sm text-slate-200 transition hover:text-sky-300"
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}


