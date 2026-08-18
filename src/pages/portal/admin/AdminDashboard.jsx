import { useEffect, useState } from "react";
import { fetchAdminDashboard } from "../../../lib/adminDashboard";

const studentName = s => s?.display_name || [s?.first_name,s?.last_name].filter(Boolean).join(" ") || "Student";

export default function AdminDashboard() {
  const [data,setData]=useState(null);
  const [error,setError]=useState("");

  useEffect(() => { fetchAdminDashboard().then(setData).catch(e=>setError(e.message)); }, []);

  if (error) return <div className="portal-alert">{error}</div>;
  if (!data) return <div className="portal-loading">Loading AEOS…</div>;

  return <>
    <section className="portal-welcome">
      <p className="portal-eyebrow">AEOS Tutor Workspace</p>
      <h2>Today at A's Online</h2>
      <p>This dashboard is querying the actual AEOS foundation.</p>
    </section>

    <div className="portal-grid portal-grid-4">
      <article className="portal-card"><span className="metric-value">{data.studentCount}</span><span className="metric-label">Students</span></article>
      <article className="portal-card"><span className="metric-value">{data.activeEnrolmentCount}</span><span className="metric-label">Active enrolments</span></article>
      <article className="portal-card"><span className="metric-value">{data.sessionsToday.length}</span><span className="metric-label">Sessions today</span></article>
      <article className="portal-card"><span className="metric-value">{data.evidenceQueueCount}</span><span className="metric-label">Evidence to review</span></article>
    </div>

    <div className="portal-grid portal-grid-2">
      <section className="portal-card"><h3>Today's sessions</h3>{data.sessionsToday.length ? data.sessionsToday.map(s =>
        <div className="portal-list-row" key={s.session_id}><strong>{studentName(s.student)}</strong><span>{s.scheduled_start_at ? new Date(s.scheduled_start_at).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}) : "Unscheduled"} · {s.offering?.offering_name}</span></div>
      ) : <p>No sessions scheduled today.</p>}</section>

      <section className="portal-card"><h3>Recently added students</h3>{data.recentStudents.length ? data.recentStudents.map(s =>
        <div className="portal-list-row" key={s.user_id}><strong>{studentName(s)}</strong><span>{s.school || "School not recorded"}</span></div>
      ) : <p>No students yet.</p>}</section>
    </div>
  </>;
}
