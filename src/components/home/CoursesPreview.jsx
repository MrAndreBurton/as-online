import { Link } from "react-router-dom";

const courses = [
  {
    title: "Std 3 & 4 Mathematics",
    description:
      "Focused support for students building strong number sense, problem-solving skills, and confidence in upper primary mathematics.",
    link: "/courses",
  },
  {
    title: "SEA Mathematics",
    description:
      "Targeted preparation for SEA students with attention to strategy, speed, accuracy, and exam confidence.",
    link: "/courses",
  },
  {
    title: "Forms 1-3 Mathematics",
    description:
      "Clear, step-by-step guidance for lower secondary students developing strong foundations across key math topics.",
    link: "/courses",
  },
  {
    title: "CSEC Mathematics",
    description:
      "One-on-one lessons focused on understanding concepts, solving problems, and exam readiness.",
    link: "/courses",
  },
  {
    title: "AI & Computer Skills",
    description:
      "Practical digital skills courses designed to prepare students for a changing world.",
    link: "/courses/ai-digital-readiness",
  },
];

export default function CoursesPreview() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-lg uppercase tracking-[0.33em] text-sky-300">
            A&apos;S ONLINE TUTORING
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Core Courses on Offer
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-400">
          At A&apos;s Online Tutoring Services, we bring passion, innovation, and a
          personal touch to SEA, CSEC, and AI learning. Your success is what
          we&apos;re all about.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => (
          <div
            key={course.title}
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-xl shadow-black/10 backdrop-blur"
          >
            <div className="mb-4 h-10 w-10 rounded-2xl bg-sky-500/15" />
            <h3 className="text-xl font-semibold text-white">{course.title}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {course.description}
            </p>

            <Link
              to={course.link}
              className="mt-6 inline-flex text-sm font-medium text-sky-300 transition hover:text-sky-200"
            >
              Learn more →
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          to="/courses"
          className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Register for a Course
        </Link>
      </div>
    </section>
  );
}

