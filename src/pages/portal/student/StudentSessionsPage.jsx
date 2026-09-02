import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentSessions } from "../../../lib/studentSessions";

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-TT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-TT", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function UpcomingSession({ session }) {
  return (
    <article className="student-session-row">
      <div className="student-session-main">
        <p className="portal-eyebrow">
          Upcoming
        </p>

        <strong>{session.title}</strong>

        <span>
          {formatDate(session.scheduledStartAt)}
          {session.scheduledStartAt
            ? ` · ${formatTime(
                session.scheduledStartAt
              )}`
            : ""}
        </span>
      </div>

      <div className="student-session-actions">
        {session.meetingUrl ? (
          <a
            className="student-session-primary-link"
            href={session.meetingUrl}
            target="_blank"
            rel="noreferrer"
          >
            Join session
          </a>
        ) : null}

        <Link
          to={`/portal/student/sessions/${session.sessionId}`}
        >
          View
        </Link>
      </div>
    </article>
  );
}

function PastSession({ session }) {
  return (
    <article className="student-session-row">
      <div className="student-session-main">
        <strong>{session.title}</strong>

        <span>{formatDate(session.sessionDate)}</span>
      </div>

      <div className="student-session-meta">
        {session.progressSkillCount > 0 ? (
          <span>
            {session.progressSkillCount}{" "}
            {session.progressSkillCount === 1
              ? "skill"
              : "skills"}{" "}
            with progress
          </span>
        ) : (
          <span>No progress recorded yet</span>
        )}

        {session.homeworkCount > 0 ? (
          <span>
            {session.homeworkCount}{" "}
            {session.homeworkCount === 1
              ? "homework item"
              : "homework items"}
          </span>
        ) : null}

        {session.resourceCount > 0 ? (
          <span>
            {session.resourceCount}{" "}
            {session.resourceCount === 1
              ? "resource"
              : "resources"}
          </span>
        ) : null}
      </div>

      <Link
        className="student-session-view"
        to={`/portal/student/sessions/${session.sessionId}`}
      >
        View →
      </Link>
    </article>
  );
}

export default function StudentSessionsPage() {
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    fetchStudentSessions(user.id)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load your sessions."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (error) {
    return <div className="portal-alert">{error}</div>;
  }

  if (!data) {
    return (
      <div className="portal-loading">
        Loading your sessions…
      </div>
    );
  }

  return (
    <>
      <section className="portal-welcome">
        <p className="portal-eyebrow">
          My Sessions
        </p>

        <h2>Your learning sessions</h2>

        <p>
          See your upcoming lessons and look back at
          learning recorded from previous sessions.
        </p>
      </section>

      <section className="portal-card student-sessions-section">
        <div className="student-sessions-heading">
          <div>
            <p className="portal-eyebrow">
              Upcoming
            </p>

            <h2>Next sessions</h2>
          </div>
        </div>

        {data.upcoming.length ? (
          <div className="student-session-list">
            {data.upcoming.map((session) => (
              <UpcomingSession
                key={session.sessionId}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="pen-e-empty-state">
            <strong>
              No upcoming sessions scheduled.
            </strong>

            <p>
              Your next scheduled session will appear
              here.
            </p>
          </div>
        )}
      </section>

      <section className="portal-card student-sessions-section">
        <div className="student-sessions-heading">
          <div>
            <p className="portal-eyebrow">
              Past Sessions
            </p>

            <h2>Your session history</h2>
          </div>
        </div>

        {data.past.length ? (
          <div className="student-session-list">
            {data.past.map((session) => (
              <PastSession
                key={session.sessionId}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="pen-e-empty-state">
            <strong>
              No completed sessions yet.
            </strong>

            <p>
              Completed sessions will appear here.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

