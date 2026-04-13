import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Tutoring from "./pages/Tutoring";
import Courses from "./pages/Courses";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import AIDigitalReadiness from "./pages/AIDigitalReadiness";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/tutoring" element={<Tutoring />} />
      <Route path="/courses" element={<Courses />} />
      <Route path="/resources" element={<Resources />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/courses/ai-digital-readiness" element={<AIDigitalReadiness />} />
    </Routes>
  );
}

