import { Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";
import PortalEntry from "./components/auth/PortalEntry";
import StudentPortalLayout from "./layouts/StudentPortalLayout";
import AdminPortalLayout from "./layouts/AdminPortalLayout";
import StudentDashboard from "./pages/portal/student/StudentDashboard";
import AdminDashboard from "./pages/portal/admin/AdminDashboard";
import StudentPlaceholder from "./pages/portal/student/StudentPlaceholder";
import AdminPlaceholder from "./pages/portal/admin/AdminPlaceholder";

import StudentsPage from "./pages/portal/admin/StudentsPage";
import StudentProfilePage from "./pages/portal/admin/StudentProfilePage";

import SessionsPage from "./pages/portal/admin/SessionsPage";
import SessionWorkspacePage from "./pages/portal/admin/SessionWorkspacePage";

import TranscriptAutomationPage from "./pages/portal/admin/TranscriptAutomationPage";

export function PortalRoutes() {
  return <>
    <Route path="/portal" element={<ProtectedRoute><PortalEntry /></ProtectedRoute>} />

    <Route path="/portal/student" element={<ProtectedRoute><RoleRoute role="student"><StudentPortalLayout /></RoleRoute></ProtectedRoute>}>
      <Route index element={<StudentDashboard />} />
      <Route path="sessions" element={<StudentPlaceholder title="My Sessions" copy="Your completed and upcoming tutoring sessions will live here." />} />
      <Route path="learning" element={<StudentPlaceholder title="My Learning" copy="AEOS mastery, Learning Nodes and subject progress will appear here." />} />
      <Route path="homework" element={<StudentPlaceholder title="Homework" copy="Assigned practice and due dates will appear here." />} />
      <Route path="pen-e" element={<StudentPlaceholder title="Pen-E & Me" copy="This becomes the student's personal AI learning space." />} />
    </Route>

    <Route path="/portal/admin" element={<ProtectedRoute><RoleRoute role="admin_tutor"><AdminPortalLayout /></RoleRoute></ProtectedRoute>}>
      <Route index element={<AdminDashboard />} />
      <Route path="students" element={<StudentsPage />} />
<Route
  path="students/:studentUserId"
  element={<StudentProfilePage />}
/>
      <Route path="sessions" element={<SessionsPage />} />
<Route
  path="sessions/:sessionId"
  element={<SessionWorkspacePage />}
/>

<Route
  path="transcripts"
  element={<TranscriptAutomationPage />}
/>

      <Route path="evidence" element={<AdminPlaceholder title="Evidence Review" copy="Suggested learning evidence will be approved here." />} />
      <Route path="curriculum" element={<AdminPlaceholder title="Curriculum" copy="AEOS Subjects, Offerings, Learning Nodes and Profiles will be managed here." />} />
      <Route path="pen-e" element={<AdminPlaceholder title="Pen-E Tutor Tools" copy="Session summaries, lesson suggestions and practice generation will live here." />} />
    </Route>
  </>;
}
