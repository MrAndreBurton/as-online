import ResourceCard from "./ResourceCard";

export default function ResourceCategorySection({ title, resources }) {
  if (!resources.length) return null;

  return (
    <section className="mt-16">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
          Resource Category
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          {title}
        </h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.title} resource={resource} />
        ))}
      </div>
    </section>
  );
}


