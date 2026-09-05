import { Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/shared/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Tutoring from "./pages/Tutoring";
import Courses from "./pages/Courses";
import AIDigitalReadiness from "./pages/AIDigitalReadiness";
import PracticalAIAdults from "./pages/PracticalAIAdults";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import CountMeInTT from "./pages/CountMeInTT";

import Login from "./pages/Login";
import SetPassword from "./pages/SetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import { PortalRoutes } from "./PortalRoutes";

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

        <Route
          path="/courses/practical-ai-for-adults"
          element={<PracticalAIAdults />}
        />

        <Route path="/resources" element={<Resources />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/countmeintt" element={<CountMeInTT />} />

        {/* Public authentication routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected portal routes */}
        {PortalRoutes()}
      </Routes>
    </>
  );
}


