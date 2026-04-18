import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ResourceCategorySection from "../components/resources/ResourceCategorySection";
import { resources } from "../data/resources";
import { Helmet } from "react-helmet-async";

export default function Resources() {
  const seaResources = resources.filter((item) => item.category === "SEA");
  const csecResources = resources.filter((item) => item.category === "CSEC");
  const aiResources = resources.filter(
    (item) => item.category === "AI & Computer Skills"
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
  <title>Free Resources | A's Online Tutoring Services</title>
  <meta
    name="description"
    content="Explore free notes, videos, worksheets, and learning tools to help students improve in Mathematics and build stronger learning habits."
  />
  <meta property="og:title" content="Free Resources | A's Online Tutoring Services" />
  <meta
    property="og:description"
    content="Explore free notes, videos, worksheets, and learning tools to help students improve in Mathematics and build stronger learning habits."
  />
</Helmet>

      <Header />

      <main className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20 backdrop-blur lg:p-12">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
              Free Resources
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Free Resources to Help Students Improve in Mathematics
            </h1>

            <p className="mt-8 max-w-3xl text-lg leading-8 text-slate-300">
              Explore free videos, worksheets, and learning tools designed to
              help students build understanding, confidence, and stronger
              results.
            </p>
          </div>
        </section>

        <ResourceCategorySection title="SEA Resources" resources={seaResources} />
        <ResourceCategorySection title="CSEC Resources" resources={csecResources} />
        <ResourceCategorySection
          title="AI & Computer Skills"
          resources={aiResources}
        />
      </main>

      <Footer />
    </div>
  );
}


