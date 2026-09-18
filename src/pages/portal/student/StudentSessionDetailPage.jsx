import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentSessionDetail } from "../../../lib/studentSessions";

function formatDate(value) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-TT", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-TT", {
    hour: "numeric", minute: "2-digit",
  }).format(new Date(value));
}

function toneClass(item) {
  if (item?.tone === "positive") return "student-session-evidence-positive";
  if (item?.tone === "developing") return "student-session-evidence-developing";
  if (item?.tone === "practice") return "student-session-evidence-practice";
  if (item?.tone === "mixed") return "student-session-evidence-mixed";
  return "student-session-evidence-neutral";
}

export default function StudentSessionDetailPage() {
  const { user } = useAuth();
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [showMoments, setShowMoments] = useState(false);

  useEffect(() => {
    if (!user?.id || !sessionId) return;
    setError("");
    fetchStudentSessionDetail(user.id, sessionId).then(setData).catch((e) => setError(e.message));
  }, [user?.id, sessionId]);

  if (error) return <div className="portal-alert">{error}</div>;
  if (!data) return <div className="portal-loading">Loading your session…</div>;

  const { session, summary, learning, learningMoments, homework, resources } = data;

  return (
    <div className="student-session-detail-page">
      <Link className="student-session-back" to="/portal/student/sessions">← My Sessions</Link>

      <section className="student-session-detail-hero">
        <span className="student-session-kicker">Session</span>
        <h2>{session.offeringName || session.title}</h2>
        {session.title !== session.offeringName ? <p>{session.title}</p> : null}
        <div className="student-session-detail-date">
          <strong>{formatDate(session.sessionDate)}</strong>
          {formatTime(session.scheduledStartAt) ? <span>{formatTime(session.scheduledStartAt)}</span> : null}
        </div>
      </section>

      <section className="student-session-glance">
        <span className="student-session-kicker">Your session at a glance</span>
        <div className="student-session-glance-grid">
          <div><strong>{summary.skillCount}</strong><span>reviewed skills</span></div>
          <div><strong>{summary.learningMomentCount}</strong><span>learning moments</span></div>
          <div><strong>{summary.homeworkCount}</strong><span>homework items</span></div>
          <div><strong>{summary.resourceCount}</strong><span>resources</span></div>
        </div>
      </section>

      <section className="student-session-section">
        <div className="student-session-section-heading">
          <div><span className="student-session-kicker">What we worked on</span><h3>Learning from this session</h3></div>
        </div>
        {learning.length ? (
          <div className="student-session-skill-chips">
            {learning.map((item) => <span key={item.learningNodeId}>{item.skillName}</span>)}
          </div>
        ) : (
          <div className="student-session-empty">
            <strong>No reviewed learning yet.</strong>
            <p>Approved learning evidence from this lesson will appear here after your tutor reviews it.</p>
          </div>
        )}
      </section>

      {learning.length ? (
        <section className="student-session-section student-session-learning-showed">
          <div className="student-session-section-heading">
            <div><span className="student-session-kicker">What your learning showed</span><h3>Your reviewed learning</h3></div>
            <Link to="/portal/student/pen-e">Open Pen-E &amp; Me →</Link>
          </div>
          <div className="student-session-evidence-grid">
            {learning.map((item) => (
              <article className={`student-session-evidence-card ${toneClass(item)}`} key={item.learningNodeId}>
                <span className="student-session-evidence-bar" aria-hidden="true" />
                <div>
                  <strong>{item.skillName}</strong>
                  <span>{item.label}</span>
                  {item.hasMultipleEvidence ? <small>{item.evidenceCount} learning moments{item.hasMixedEvidence ? " · mixed evidence" : ""}</small> : null}
                  {item.hasIndependentEvidence && item.hasMixedEvidence ? <small>Independent work was shown during this session.</small> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {learningMoments.length ? (
        <section className="student-session-section">
          <div className="student-session-section-heading">
            <div><span className="student-session-kicker">Learning moments</span><h3>The evidence behind this session</h3></div>
            <button className="student-session-moments-toggle" type="button" onClick={() => setShowMoments((v) => !v)} aria-expanded={showMoments}>
              {showMoments ? "Hide moments" : "View all learning moments"}
            </button>
          </div>
          <p className="student-session-section-intro">
            Moments with transcript times are shown in lesson order. If a time was not recorded, the moment stays with this session without an invented position.
          </p>
          {showMoments ? (
            <div className="student-session-moments-list">
              {learningMoments.map((moment) => (
                <article className={`student-session-moment ${toneClass(moment)}`} key={moment.evidenceId}>
                  <time>{moment.sourceTimestamp || "Time not recorded"}</time>
                  <div>
                    <strong>{moment.skillName}</strong>
                    <span>{moment.label}</span>
                    {moment.summary ? <p>{moment.summary}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="student-session-support-grid">
        <article className="student-session-section">
          <div className="student-session-section-heading">
            <div><span className="student-session-kicker">Homework</span><h3>From this session</h3></div>
          </div>
          {homework.length ? (
            <div className="student-session-homework-list">
              {homework.map((item) => (
                <div key={item.homework_id}>
                  <strong>{item.title || "Homework"}</strong>
                  {item.instructions ? <p>{item.instructions}</p> : null}
                  <span>{item.homework_status || "assigned"}{item.due_at ? ` · Due ${new Intl.DateTimeFormat("en-TT", { month: "short", day: "numeric" }).format(new Date(item.due_at))}` : ""}</span>
                </div>
              ))}
            </div>
          ) : <div className="student-session-empty compact"><p>No student homework is attached to this session.</p></div>}
        </article>

        <article className="student-session-section">
          <div className="student-session-section-heading">
            <div><span className="student-session-kicker">Resources</span><h3>From this session</h3></div>
          </div>
          {resources.length ? (
            <div className="student-session-resource-list">
              {resources.map((item) => item.resource_url ? (
                <a key={item.resource_id} href={item.resource_url} target="_blank" rel="noreferrer">
                  <strong>{item.resource_title || "Session resource"}</strong>
                  {item.description ? <span>{item.description}</span> : null}
                  <b>Open →</b>
                </a>
              ) : (
                <div key={item.resource_id}>
                  <strong>{item.resource_title || "Session resource"}</strong>
                  {item.description ? <span>{item.description}</span> : null}
                </div>
              ))}
            </div>
          ) : <div className="student-session-empty compact"><p>No student resources are attached to this session.</p></div>}
        </article>
      </section>

      <footer className="student-session-detail-footer">
        <div>
          <strong>This session is one part of your learning story.</strong>
          <span>Pen-E &amp; Me brings reviewed evidence from your sessions together across time.</span>
        </div>
        <Link to="/portal/student/pen-e">See this in Pen-E &amp; Me →</Link>
      </footer>
    </div>
  );
}



