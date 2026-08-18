import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentDashboard } from "../../../lib/studentDashboard";

export default function StudentDashboard() {
  const { user, studentProfile } = useAuth();
  const [data,setData]=useState(null);
  const [error,setError]=useState("");

  useEffect(() => {
    if (!user?.id) return;
    fetchStudentDashboard(user.id).then(setData).catch(e=>setError(e.message));
  }, [user?.id]);

  if (error) return <div className="portal-alert">{error}</div>;
  if (!data) return <div className="portal-loading">Loading your dashboard…</div>;

  const name=studentProfile?.first_name || studentProfile?.display_name || "there";

  return <>
    <section className="portal-welcome">
      <p className="portal-eyebrow">Pen-E & Me starts here</p>
      <h2>Welcome back, {name}.</h2>
      <p>Your sessions, current learning, homework and recommendations will build your personal AEOS learning record.</p>
    </section>

    <div className="portal-grid portal-grid-3">
      <article className="portal-card"><span className="metric-value">{data.enrolments.length}</span><span className="metric-label">Active subjects</span></article>
      <article className="portal-card"><span className="metric-value">{data.homework.length}</span><span className="metric-label">Homework items</span></article>
      <article className="portal-card"><span className="metric-value">{data.recommendations.length}</span><span className="metric-label">Recommended next steps</span></article>
    </div>

    <div className="portal-grid portal-grid-2">
      <section className="portal-card"><h3>My subjects</h3>{data.enrolments.length ? data.enrolments.map(x =>
        <div className="portal-list-row" key={x.enrolment_id}><strong>{x.offering?.offering_name}</strong><span>{x.offering?.subject?.subject_name}</span></div>
      ) : <p>No active offerings yet.</p>}</section>

      <section className="portal-card"><h3>Upcoming sessions</h3>{data.upcomingSessions.length ? data.upcomingSessions.map(x =>
        <div className="portal-list-row" key={x.session_id}><strong>{x.session_title || x.offering_name}</strong><span>{x.scheduled_start_at ? new Date(x.scheduled_start_at).toLocaleString() : "Not scheduled"}</span></div>
      ) : <p>No upcoming sessions currently scheduled.</p>}</section>

      <section className="portal-card"><h3>What should I practise?</h3>{data.recommendations.length ? data.recommendations.map(x =>
        <div className="portal-list-row" key={x.recommendation_id}><strong>{x.title}</strong><span>{x.recommendation_text}</span></div>
      ) : <p>Pen-E recommendations will appear here as AEOS gathers evidence.</p>}</section>

      <section className="portal-card"><h3>Recent learning</h3>{data.mastery.length ? data.mastery.map(x =>
        <div className="portal-list-row" key={x.mastery_id}><strong>{x.learning_node_name}</strong><span className="status-pill">{x.mastery_status}</span></div>
      ) : <p>Your learning evidence and progress will appear here.</p>}</section>
    </div>
  </>;
}
