import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentSessions } from "../../../lib/studentSessions";

function formatDate(value, options = {}) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-TT", {
    month: "short", day: "numeric", year: "numeric", ...options,
  }).format(new Date(value));
}

function formatLongDate(value) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-TT", {
    weekday: "long", month: "long", day: "numeric",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-TT", {
    hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
}

function SessionMeta({ session }) {
  const items = [];
  if (session.progressSkillCount) {
    items.push(`${session.progressSkillCount} reviewed ${session.progressSkillCount === 1 ? "skill" : "skills"}`);
  }
  if (session.reviewedMomentCount) {
    items.push(`${session.reviewedMomentCount} learning ${session.reviewedMomentCount === 1 ? "moment" : "moments"}`);
  }
  if (session.homeworkCount) {
    items.push(`${session.homeworkCount} homework ${session.homeworkCount === 1 ? "item" : "items"}`);
  }
  if (session.resourceCount) {
    items.push(`${session.resourceCount} ${session.resourceCount === 1 ? "resource" : "resources"}`);
  }
  if (!items.length) return null;
  return (
    <div className="student-sessions-meta">
      {items.map((item) => <span key={item}>{item}</span>)}
    </div>
  );
}

export default function StudentSessionsPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    setError("");
    fetchStudentSessions(user.id).then(setData).catch((e) => setError(e.message));
  }, [user?.id]);

  if (error) return <div className="portal-alert">{error}</div>;
  if (!data) return <div className="portal-loading">Loading your sessions…</div>;

  const nextSession = data.upcoming[0] || null;
  const laterSessions = data.upcoming.slice(1);

  return (
    <div className="student-sessions-page">
      <section className="student-sessions-hero">
        <span className="student-sessions-kicker">My Sessions</span>
        <h2>Your lessons, all in one place.</h2>
        <p>See what&apos;s coming up and return to the learning, homework, and resources from earlier sessions.</p>
      </section>

      <section className="student-sessions-next">
        <div className="student-sessions-section-heading">
          <div>
            <span className="student-sessions-kicker">Coming up</span>
            <h3>Next session</h3>
          </div>
        </div>

        {nextSession ? (
          <article className="student-sessions-next-card">
            <div>
              <span className="student-sessions-date-label">{formatLongDate(nextSession.scheduledStartAt)}</span>
              <h3>{nextSession.offeringName || nextSession.title}</h3>
              <p>{nextSession.title !== nextSession.offeringName ? nextSession.title : "Your next scheduled lesson"}</p>
            </div>
            <div className="student-sessions-next-side">
              <strong>{formatTime(nextSession.scheduledStartAt)}</strong>
              <Link to={`/portal/student/sessions/${nextSession.sessionId}`}>View session →</Link>
            </div>
          </article>
        ) : (
          <div className="student-sessions-empty">
            <strong>Nothing scheduled right now.</strong>
            <p>Your upcoming lessons will appear here.</p>
          </div>
        )}

        {laterSessions.length ? (
          <div className="student-sessions-later">
            <span>Later</span>
            {laterSessions.slice(0, 3).map((session) => (
              <Link key={session.sessionId} to={`/portal/student/sessions/${session.sessionId}`}>
                <strong>{formatDate(session.scheduledStartAt)}</strong>
                <span>{session.offeringName || session.title}</span>
                <b>{formatTime(session.scheduledStartAt)} →</b>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <section className="student-sessions-history">
        <div className="student-sessions-section-heading">
          <div>
            <span className="student-sessions-kicker">Session history</span>
            <h3>Earlier lessons</h3>
          </div>
          <span className="student-sessions-count">{data.past.length} {data.past.length === 1 ? "session" : "sessions"}</span>
        </div>

        {data.past.length ? (
          <div className="student-sessions-history-list">
            {data.past.map((session) => (
              <Link className="student-sessions-history-card" key={session.sessionId} to={`/portal/student/sessions/${session.sessionId}`}>
                <time>
                  <strong>{formatDate(session.sessionDate, { month: "short", day: "numeric" })}</strong>
                  <span>{session.sessionDate ? new Intl.DateTimeFormat("en-TT", { year: "numeric" }).format(new Date(session.sessionDate)) : ""}</span>
                </time>
                <div className="student-sessions-history-main">
                  <span className="student-sessions-offering">{session.offeringName || "Learning session"}</span>
                  <h4>{session.title}</h4>
                  <SessionMeta session={session} />
                </div>
                <span className="student-sessions-arrow">→</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="student-sessions-empty">
            <strong>No earlier sessions yet.</strong>
            <p>Your lesson history will build here over time.</p>
          </div>
        )}
      </section>
    </div>
  );
}



