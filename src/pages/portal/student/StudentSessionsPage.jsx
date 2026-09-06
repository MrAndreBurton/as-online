import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentSessions } from "../../../lib/studentSessions";


/* ============================================================
   DATE HELPERS
   ============================================================ */

function getDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}


function getDateKey(value) {
  const date = getDate(value);

  if (!date) return "unknown";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDate(value) {
  const date = getDate(value);

  if (!date) return "Date unavailable";

  return new Intl.DateTimeFormat("en-TT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}


function formatDayName(value) {
  const date = getDate(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-TT", {
    weekday: "long",
  }).format(date);
}


function formatDayMonth(value) {
  const date = getDate(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-TT", {
    month: "short",
  })
    .format(date)
    .toUpperCase();
}


function formatDayNumber(value) {
  const date = getDate(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-TT", {
    day: "numeric",
  }).format(date);
}


function formatTime(value) {
  const date = getDate(value);

  if (!date) return "";

  return new Intl.DateTimeFormat("en-TT", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}


function isToday(value) {
  const date = getDate(value);

  if (!date) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}


/* ============================================================
   UPCOMING SESSION
   ============================================================ */

function UpcomingSession({ session }) {
  return (
    <article className="student-upcoming-session">
      <div className="student-upcoming-session-time">
        <strong>
          {formatTime(session.scheduledStartAt) || "Time TBC"}
        </strong>

        <span>Scheduled</span>
      </div>

      <div className="student-upcoming-session-main">
        <strong>{session.title}</strong>

        <span>
          Your upcoming learning session
        </span>
      </div>

      <div className="student-upcoming-session-actions">
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
          className="student-upcoming-session-view"
          to={`/portal/student/sessions/${session.sessionId}`}
        >
          View →
        </Link>
      </div>
    </article>
  );
}


/* ============================================================
   UPCOMING DAY GROUP
   ============================================================ */

function UpcomingDayGroup({
  date,
  sessions,
}) {
  const today = isToday(date);

  return (
    <section
      className={`student-upcoming-day${
        today ? " is-today" : ""
      }`}
    >
      <header className="student-upcoming-day-heading">
        <div className="student-upcoming-day-date">
          <div className="student-upcoming-day-calendar">
            <span>{formatDayMonth(date)}</span>
            <strong>{formatDayNumber(date)}</strong>
          </div>

          <div className="student-upcoming-day-copy">
            <span className="student-upcoming-day-name">
              {formatDayName(date)}
            </span>

            {today ? (
              <span className="student-upcoming-today-badge">
                Today
              </span>
            ) : null}
          </div>
        </div>

        <span className="student-upcoming-day-count">
          {sessions.length}{" "}
          {sessions.length === 1
            ? "session"
            : "sessions"}
        </span>
      </header>

      <div className="student-upcoming-day-sessions">
        {sessions.map((session) => (
          <UpcomingSession
            key={session.sessionId}
            session={session}
          />
        ))}
      </div>
    </section>
  );
}


/* ============================================================
   PAST SESSION
   ============================================================ */

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


/* ============================================================
   PAGE
   ============================================================ */

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


  const upcomingGroups = useMemo(() => {
    if (!data?.upcoming?.length) {
      return [];
    }

    const groups = new Map();

    const sorted = [...data.upcoming].sort(
      (a, b) =>
        new Date(a.scheduledStartAt).getTime() -
        new Date(b.scheduledStartAt).getTime()
    );

    sorted.forEach((session) => {
      const key = getDateKey(
        session.scheduledStartAt
      );

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          date: session.scheduledStartAt,
          sessions: [],
        });
      }

      groups.get(key).sessions.push(session);
    });

    return Array.from(groups.values());
  }, [data?.upcoming]);


  if (error) {
    return (
      <div className="portal-alert">
        {error}
      </div>
    );
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
          See what is coming up next and revisit
          learning recorded from previous sessions.
        </p>
      </section>


      {/* =====================================================
          UPCOMING
          ===================================================== */}

      <section className="portal-card student-sessions-section student-upcoming-section">
        <div className="student-sessions-heading">
          <div>
            <p className="portal-eyebrow">
              Upcoming
            </p>

            <h2>Next sessions</h2>

            <p className="student-sessions-heading-copy">
              Your scheduled learning sessions,
              organised by day.
            </p>
          </div>

          {data.upcoming.length ? (
            <span className="student-upcoming-total">
              {data.upcoming.length} upcoming
            </span>
          ) : null}
        </div>


        {upcomingGroups.length ? (
          <div className="student-upcoming-agenda">
            {upcomingGroups.map((group) => (
              <UpcomingDayGroup
                key={group.key}
                date={group.date}
                sessions={group.sessions}
              />
            ))}
          </div>
        ) : (
          <div className="pen-e-empty-state">
            <strong>
              No upcoming sessions scheduled.
            </strong>

            <p>
              Your next scheduled session will
              appear here.
            </p>
          </div>
        )}
      </section>


      {/* =====================================================
          PAST
          ===================================================== */}

      <section className="portal-card student-sessions-section student-past-sessions-section">
        <div className="student-sessions-heading">
          <div>
            <p className="portal-eyebrow">
              Past Sessions
            </p>

            <h2>Your session history</h2>

            <p className="student-sessions-heading-copy">
              Revisit previous sessions, progress,
              homework and resources.
            </p>
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


