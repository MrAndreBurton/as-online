import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentDashboard } from "../../../lib/studentDashboard";

function formatDate(value, options = {}) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-TT", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

function formatSessionDate(value) {
  if (!value) return "Date not set";

  return new Intl.DateTimeFormat("en-TT", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

function formatTime(value) {
  if (!value) return null;

  return new Intl.DateTimeFormat("en-TT", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function evidenceToneClass(item) {
  if (item?.tone === "positive" || item?.state === "shown") {
    return "student-dashboard-learning-positive";
  }

  if (item?.tone === "developing" || item?.state === "developing") {
    return "student-dashboard-learning-developing";
  }

  if (item?.tone === "practice" || item?.state === "practice") {
    return "student-dashboard-learning-practice";
  }

  if (item?.tone === "mixed" || item?.state === "mixed") {
    return "student-dashboard-learning-mixed";
  }

  return "student-dashboard-learning-neutral";
}

function EvidencePreview({ item }) {
  return (
    <article
      className={`student-dashboard-learning-item ${evidenceToneClass(item)}`}
    >
      <span
        className="student-dashboard-learning-marker"
        aria-hidden="true"
      />
      <div className="student-dashboard-learning-copy">
        <strong>{item.skillName}</strong>
        <span>{item.label}</span>
        {item.sessionDate ? (
          <small>{formatDate(item.sessionDate)}</small>
        ) : null}
      </div>
    </article>
  );
}

export default function StudentDashboard() {
  const { user, studentProfile } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    setError("");

    fetchStudentDashboard(user.id)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [user?.id]);

  if (error) return <div className="portal-alert">{error}</div>;

  if (!data) {
    return (
      <div className="portal-loading">
        Loading your dashboard…
      </div>
    );
  }

  const name =
    studentProfile?.first_name ||
    studentProfile?.display_name ||
    "there";

  const nextSession = data.nextSession;
  const nextHomework = data.homework[0] || null;

  return (
    <div className="student-dashboard-page">
      <section className="student-dashboard-hero">
        <p className="student-dashboard-eyebrow">
          {greeting()}, {name}
        </p>
        <h2>Here&apos;s what&apos;s happening with your learning.</h2>
        <p>
          See what&apos;s coming up, what your reviewed sessions are
          showing, and where to go next.
        </p>
      </section>

      <section className="student-dashboard-now-grid">
        <article className="student-dashboard-next-session">
          <div className="student-dashboard-card-heading">
            <div>
              <span className="student-dashboard-kicker">
                Next session
              </span>
              <h3>
                {nextSession
                  ? nextSession.offering_name ||
                    nextSession.subject_name ||
                    "Learning session"
                  : "Nothing scheduled right now"}
              </h3>
            </div>

            {nextSession?.subject_name ? (
              <span className="student-dashboard-subject-chip">
                {nextSession.subject_name}
              </span>
            ) : null}
          </div>

          {nextSession ? (
            <>
              <div className="student-dashboard-session-time">
                <strong>
                  {formatSessionDate(
                    nextSession.scheduled_start_at
                  )}
                </strong>
                <span>
                  {formatTime(nextSession.scheduled_start_at)}
                </span>
              </div>

              <p>
                {nextSession.session_title &&
                nextSession.session_title !==
                  nextSession.offering_name
                  ? nextSession.session_title
                  : "Your next scheduled lesson"}
              </p>

              <Link
                className="student-dashboard-text-link"
                to={`/portal/student/sessions/${nextSession.session_id}`}
              >
                View session →
              </Link>
            </>
          ) : (
            <p>
              Your tutor will add upcoming sessions here when
              they&apos;re scheduled.
            </p>
          )}
        </article>

        <aside className="student-dashboard-right-now">
          <span className="student-dashboard-kicker">Right now</span>

          <div className="student-dashboard-right-now-stat">
            <strong>{data.homework.length}</strong>
            <span>
              {data.homework.length === 1
                ? "homework item to complete"
                : "homework items to complete"}
            </span>
          </div>

          <div className="student-dashboard-right-now-stat">
            <strong>{data.enrolments.length}</strong>
            <span>
              {data.enrolments.length === 1
                ? "subject you're learning"
                : "subjects you're learning"}
            </span>
          </div>

          {nextHomework?.due_at ? (
            <div className="student-dashboard-due">
              <span>Next homework due</span>
              <strong>{formatDate(nextHomework.due_at)}</strong>
            </div>
          ) : null}
        </aside>
      </section>

      <section className="student-dashboard-learning">
        <div className="student-dashboard-section-heading">
          <div>
            <span className="student-dashboard-kicker">
              Your learning right now
            </span>
            <h3>Here&apos;s what your reviewed sessions are showing.</h3>
          </div>

          <Link to="/portal/student/pen-e">
            Open Pen-E &amp; Me →
          </Link>
        </div>

        {data.learningSnapshot.length ? (
          <div className="student-dashboard-learning-list">
            {data.learningSnapshot.map((item) => (
              <EvidencePreview
                key={item.learningNodeId}
                item={item}
              />
            ))}
          </div>
        ) : (
          <div className="student-dashboard-empty">
            <strong>Your learning story is getting ready.</strong>
            <p>
              Reviewed learning from your sessions will appear here
              as your tutor approves evidence.
            </p>
            <Link to="/portal/student/pen-e">
              Learn about Pen-E →
            </Link>
          </div>
        )}
      </section>

      <section className="student-dashboard-middle-grid">
        <article className="student-dashboard-panel student-dashboard-next-action">
          <span className="student-dashboard-kicker">
            What&apos;s next
          </span>

          {data.next?.type ? (
            <>
              <h3>{data.next.title}</h3>
              <p>{data.next.text}</p>

              {data.next.dueAt ? (
                <small>
                  Due {formatDate(data.next.dueAt)}
                </small>
              ) : null}

              <Link
                className="student-dashboard-text-link"
                to={
                  data.next.type === "homework"
                    ? "/portal/student/homework"
                    : "/portal/student/pen-e"
                }
              >
                {data.next.type === "homework"
                  ? "View homework →"
                  : "View next step →"}
              </Link>
            </>
          ) : (
            <>
              <h3>You&apos;re up to date.</h3>
              <p>
                There isn&apos;t anything new assigned right now.
              </p>
            </>
          )}
        </article>

        <article className="student-dashboard-panel">
          <div className="student-dashboard-panel-heading">
            <div>
              <span className="student-dashboard-kicker">
                My subjects
              </span>
              <h3>Your current learning</h3>
            </div>
          </div>

          {data.enrolments.length ? (
            <div className="student-dashboard-subject-list">
              {data.enrolments.map((item) => (
                <div
                  className="student-dashboard-subject-row"
                  key={item.enrolment_id}
                >
                  <span>
                    {item.offering?.subject?.subject_name ||
                      "Subject"}
                  </span>
                  <strong>
                    {item.offering?.offering_name ||
                      "Current offering"}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="student-dashboard-muted">
              No active subjects are showing yet.
            </p>
          )}

          <Link
            className="student-dashboard-text-link"
            to="/portal/student/learning"
          >
            Explore My Learning →
          </Link>
        </article>
      </section>

      <section className="student-dashboard-recent">
        <div className="student-dashboard-section-heading">
          <div>
            <span className="student-dashboard-kicker">
              Recent sessions
            </span>
            <h3>Your lesson history</h3>
          </div>

          <Link to="/portal/student/sessions">
            See all sessions →
          </Link>
        </div>

        {data.recentSessions.length ? (
          <div className="student-dashboard-session-list">
            {data.recentSessions.map((session) => (
              <Link
                className="student-dashboard-session-row"
                key={session.session_id}
                to={`/portal/student/sessions/${session.session_id}`}
              >
                <time>
                  <strong>
                    {formatDate(
                      session.scheduled_start_at,
                      { month: "short", day: "numeric" }
                    )}
                  </strong>
                  <span>
                    {formatTime(session.scheduled_start_at)}
                  </span>
                </time>

                <div>
                  <strong>
                    {session.offering_name ||
                      session.subject_name ||
                      "Learning session"}
                  </strong>
                  <span>
                    {session.session_title &&
                    session.session_title !==
                      session.offering_name
                      ? session.session_title
                      : session.subject_name ||
                        "Session"}
                  </span>
                </div>

                <span className="student-dashboard-row-arrow">
                  →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="student-dashboard-empty">
            <strong>No recent sessions yet.</strong>
            <p>
              Your completed lesson history will appear here.
            </p>
          </div>
        )}
      </section>

      <nav
        className="student-dashboard-explore"
        aria-label="Explore your learning"
      >
        <div className="student-dashboard-explore-heading">
          <span className="student-dashboard-kicker">
            Explore your learning
          </span>
          <h3>Go deeper when you&apos;re ready.</h3>
        </div>

        <div className="student-dashboard-explore-grid">
          <Link to="/portal/student/pen-e">
            <strong>Pen-E &amp; Me</strong>
            <span>Learning evidence</span>
            <b aria-hidden="true">→</b>
          </Link>

          <Link to="/portal/student/learning">
            <strong>My Learning</strong>
            <span>Learning landscape</span>
            <b aria-hidden="true">→</b>
          </Link>

          <Link to="/portal/student/sessions">
            <strong>My Sessions</strong>
            <span>Lesson history</span>
            <b aria-hidden="true">→</b>
          </Link>
        </div>
      </nav>
    </div>
  );
}



