import { Link } from "react-router-dom";

const navigation = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Tutoring", path: "/tutoring" },
  { name: "Courses", path: "/courses" },
  { name: "Resources", path: "/resources" },
  { name: "Contact", path: "/contact" },
  { name: "CountMeInTT", path: "/countmeintt", featured: true },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-2 lg:px-8">
        <div>
          <h3 className="text-lg font-semibold text-white">A&apos;s Online</h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">
            Personalised learning support in mathematics and digital skills with
            a modern, student-focused approach.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-400">
            Quick Links
          </h4>
          <div className="mt-4 flex flex-col gap-3 text-sm text-slate-300">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={
                  item.featured
                    ? "font-semibold text-yellow-300 transition hover:text-yellow-200"
                    : "transition hover:text-sky-300"
                }
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-sm text-slate-500 lg:px-8">
        © {new Date().getFullYear()} A&apos;s Online Tutoring Services. All
        rights reserved.
        This website was designed and created by A's Online.
      </div>
    </footer>
  );
}

