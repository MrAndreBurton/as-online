import { Link } from "react-router-dom";

const LEVELS = [
  {
    id: "level-1",
    label: "Level 1",
    shortLabel: "Foundation",
    audience: "SEA / Primary",
    path: "/math-language/level-1",
  },
  {
    id: "level-2",
    label: "Level 2",
    shortLabel: "Secondary",
    audience: "Forms 1–3",
    path: "/math-language/level-2",
  },
  {
    id: "level-3",
    label: "Level 3",
    shortLabel: "CSEC",
    audience: "CSEC Mathematics",
    path: "/math-language/level-3",
  },
];

export default function MathLanguageLevelNav({
  currentLevel = null,
}) {
  return (
    <nav className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            to="/math-language"
            className="text-sm font-black text-gray-600 transition hover:text-blue-700"
          >
            ← Math Language
          </Link>

          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-gray-400">
            Choose or change level
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {LEVELS.map((level) => {
            const isCurrent =
              currentLevel === level.id;

            return (
              <Link
                key={level.id}
                to={level.path}
                aria-current={
                  isCurrent
                    ? "page"
                    : undefined
                }
                className={[
                  "rounded-xl border px-4 py-3 transition",
                  isCurrent
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-gray-200 bg-white text-gray-900 hover:border-yellow-300 hover:bg-yellow-50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black">
                    {level.label}
                  </span>

                  {isCurrent && (
                    <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-black uppercase tracking-wide">
                      Current
                    </span>
                  )}
                </div>

                <p
                  className={[
                    "mt-1 text-sm font-bold",
                    isCurrent
                      ? "text-white"
                      : "text-gray-700",
                  ].join(" ")}
                >
                  {level.shortLabel}
                </p>

                <p
                  className={[
                    "mt-1 text-xs",
                    isCurrent
                      ? "text-gray-300"
                      : "text-gray-500",
                  ].join(" ")}
                >
                  {level.audience}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}


