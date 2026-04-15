import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/shared/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Tutoring from "./pages/Tutoring";
import Courses from "./pages/Courses";
import AIDigitalReadiness from "./pages/AIDigitalReadiness";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import CountMeInTT from "./pages/CountMeInTT";

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/tutoring" element={<Tutoring />} />
        <Route path="/courses" element={<Courses />} />
        <Route
          path="/courses/ai-digital-readiness"
          element={<AIDigitalReadiness />}
        />
        <Route path="/resources" element={<Resources />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/countmeintt" element={<CountMeInTT />} />
      </Routes>
    </>
  );
}

