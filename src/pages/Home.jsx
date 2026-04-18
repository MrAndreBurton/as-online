import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/home/HeroSection";
import FeaturedCourse from "../components/home/FeaturedCourse";
import CoursesPreview from "../components/home/CoursesPreview";
import { Helmet } from "react-helmet-async";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Helmet>
        <title>A&apos;s Online Tutoring Services | Mathematics, Courses & Digital Skills</title>
        <meta
          name="description"
          content="One-on-one mathematics tutoring, courses, and digital skills support for students of Standard 3, Standard 4, Standard 5, Form 1, Form 2, Form 3, Form 4 and Form 5. Students preparing for the End of Term Exam, Secondary Entrance Assessment (SEA) and CSEC in Trinidad and Tobago."
        />
        <meta
          property="og:title"
          content="A's Online Tutoring Services | Mathematics, Courses & Digital Skills"
        />
        <meta
          property="og:description"
          content="One-on-one mathematics tutoring, courses, and digital skills support for students of Standard 3, Standard 4, Standard 5, Form 1, Form 2, Form 3, Form 4 and Form 5. Students preparing for the End of Term Exam, Secondary Entrance Assessment (SEA) and CSEC in Trinidad and Tobago."
        />
      </Helmet>

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


