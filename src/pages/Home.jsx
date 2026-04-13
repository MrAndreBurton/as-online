import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/home/HeroSection";
import FeaturedCourse from "../components/home/FeaturedCourse";
import CoursesPreview from "../components/home/CoursesPreview";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Header />

      <main>
        <HeroSection />
        <FeaturedCourse />
        <CoursesPreview />
      </main>

      <Footer />
    </div>
  );
}


