import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentPenE } from "../../../lib/studentPenE";

function formatDate(value, options = {}) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-TT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

function stateClass(tone) {
  return `pen-e-state pen-e-state-${tone || "neutral"}`;
}

function EvidenceSkillCard({ skill }) {
  const summary =
    skill.representativeEvidence?.evidenceSummary ||
    skill.evidence?.find((item) => item.evidenceSummary)
      ?.evidenceSummary ||
    "";

  return (
    <article className="pen-e-learning-card">
      <span className={stateClass(skill.tone)}>
        {skill.label}
      </span>

      <h3>{skill.skillName}</h3>

      {summary ? <p>{summary}</p> : null}

      <div className="pen-e-learning-meta">
        {skill.strand?.name ? (
          <span>{skill.strand.name}</span>
        ) : null}

        {skill.evidenceCount > 1 ? (
          <span>
            {skill.evidenceCount} learning moments
          </span>
        ) : null}
      </div>
    </article>
  );
}

function RecentSession({ session }) {
  return (
    <article className="pen-e-recent-session">
      <header className="pen-e-recent-session-header">
        <div>
          <p className="portal-eyebrow">
            {formatDate(session.sessionDate)}
          </p>
          <h3>{session.title}</h3>
          <span>
            {session.subjectName ||
              session.offeringName ||
              "Learning session"}
          </span>
        </div>

        <Link
          className="pen-e-session-link"
          to={`/portal/student/sessions/${session.sessionId}`}
        >
          View session
        </Link>
      </header>

      <div className="pen-e-learning-card-grid">
        {session.skills.map((skill) => (
          <EvidenceSkillCard
            key={skill.learningNodeId}
            skill={skill}
          />
        ))}
      </div>
    </article>
  );
}

function SnapshotList({ items, emptyTitle, emptyText }) {
  if (!items.length) {
    return (
      <div className="pen-e-empty-state">
        <strong>{emptyTitle}</strong>
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="pen-e-snapshot-list">
      {items.map((item) => (
        <article
          className="pen-e-snapshot-row"
          key={item.learningNodeId}
        >
          <div>
            <span className={stateClass(item.tone)}>
              {item.label}
            </span>
            <strong>{item.skillName}</strong>
            <small>
              {item.strand?.name ||
                item.subjectName ||
                "Learning record"}
            </small>
          </div>

          <span className="pen-e-snapshot-date">
            {formatDate(item.sessionDate)}
          </span>
        </article>
      ))}
    </div>
  );
}

function PenENoticed({ noticed }) {
  const facts = [];

  if (noticed.sessionCount) {
    facts.push(
      `Learning from ${noticed.sessionCount} recent ${
        noticed.sessionCount === 1 ? "session" : "sessions"
      } is in your record.`
    );
  }

  if (noticed.distinctSkillCount) {
    facts.push(
      `${noticed.distinctSkillCount} ${
        noticed.distinctSkillCount === 1 ? "skill appears" : "skills appear"
      } in your recent learning.`
    );
  }

  if (noticed.independentCount) {
    facts.push(
      `You showed independent learning in ${noticed.independentCount} recent ${
        noticed.independentCount === 1
          ? "learning moment"
          : "learning moments"
      }.`
    );
  }

  if (noticed.strands.length) {
    facts.push(
      `Recent learning includes ${noticed.strands
        .slice(0, 3)
        .join(", ")}.`
    );
  }

  if (!facts.length) {
    return (
      <div className="pen-e-empty-state">
        <strong>Nothing to notice just yet.</strong>
        <p>
          As approved learning is added from your sessions,
          Pen-E will help organise what it shows.
        </p>
      </div>
    );
  }

  return (
    <div className="pen-e-noticed-grid">
      {facts.slice(0, 4).map((fact) => (
        <div className="pen-e-noticed-fact" key={fact}>
          <span aria-hidden="true">•</span>
          <p>{fact}</p>
        </div>
      ))}
    </div>
  );
}

function LearningMap({ strands }) {
  if (!strands.length) {
    return (
      <div className="pen-e-empty-state">
        <strong>Your learning map is being prepared.</strong>
        <p>
          Your subjects and curriculum areas will appear here
          when they are available.
        </p>
      </div>
    );
  }

  return (
    <div className="pen-e-map-grid">
      {strands.slice(0, 6).map((strand) => (
        <article className="pen-e-map-card" key={strand.key}>
          <div className="pen-e-map-icon" aria-hidden="true">
            {strand.strandName.slice(0, 1).toUpperCase()}
          </div>

          <div>
            <span>{strand.subjectName}</span>
            <h3>{strand.strandName}</h3>
            <p>
              <strong>{strand.recordedSkillCount}</strong>{" "}
              {strand.recordedSkillCount === 1
                ? "skill with recorded learning"
                : "skills with recorded learning"}
            </p>

            {strand.approvedEvidenceCount > 0 ? (
              <small>
                {strand.approvedEvidenceCount} approved{" "}
                {strand.approvedEvidenceCount === 1
                  ? "learning moment"
                  : "learning moments"}
              </small>
            ) : (
              <small>No recorded learning here yet</small>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Journey({ journey }) {
  const [showAll, setShowAll] = useState(false);

  const sessions = showAll
    ? journey.sessions
    : journey.sessions.slice(0, 4);

  if (!journey.sessions.length && !journey.undated.length) {
    return (
      <div className="pen-e-empty-state">
        <strong>Your journey starts with your sessions.</strong>
        <p>
          Approved learning will appear here in the session
          where it happened.
        </p>
      </div>
    );
  }

  return (
    <div className="pen-e-journey">
      {sessions.map((session) => (
        <article
          className="pen-e-journey-session"
          key={session.sessionId}
        >
          <div className="pen-e-journey-date">
            <strong>
              {formatDate(session.sessionDate, {
                month: "short",
                day: "numeric",
              })}
            </strong>
            <span>
              {new Date(session.sessionDate).getFullYear()}
            </span>
          </div>

          <div className="pen-e-journey-content">
            <div className="pen-e-journey-heading">
              <div>
                <h3>{session.title}</h3>
                <span>
                  {session.subjectName ||
                    session.offeringName ||
                    "Learning session"}
                </span>
              </div>

              <Link
                to={`/portal/student/sessions/${session.sessionId}`}
              >
                View session
              </Link>
            </div>

            <div className="pen-e-journey-skills">
              {session.skills.map((skill) => (
                <div
                  className="pen-e-journey-skill"
                  key={skill.learningNodeId}
                >
                  <span className={stateClass(skill.tone)}>
                    {skill.label}
                  </span>
                  <strong>{skill.skillName}</strong>
                  {skill.evidenceCount > 1 ? (
                    <small>
                      {skill.evidenceCount} learning moments
                    </small>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}

      {journey.undated.length ? (
        <article className="pen-e-journey-session is-undated">
          <div className="pen-e-journey-date">
            <strong>Earlier</strong>
            <span>Date unavailable</span>
          </div>

          <div className="pen-e-journey-content">
            <div className="pen-e-journey-heading">
              <div>
                <h3>Earlier learning</h3>
                <span>
                  These learning records are valid, but their
                  session date is unavailable.
                </span>
              </div>
            </div>

            <div className="pen-e-journey-skills">
              {journey.undated.map((skill, index) => (
                <div
                  className="pen-e-journey-skill"
                  key={`${skill.learningNodeId}-${index}`}
                >
                  <span className={stateClass(skill.tone)}>
                    {skill.label}
                  </span>
                  <strong>{skill.skillName}</strong>
                </div>
              ))}
            </div>
          </div>
        </article>
      ) : null}

      {journey.sessions.length > 4 ? (
        <button
          className="pen-e-text-button"
          type="button"
          onClick={() => setShowAll((value) => !value)}
        >
          {showAll
            ? "Show recent journey only"
            : `Show all ${journey.sessions.length} sessions`}
        </button>
      ) : null}
    </div>
  );
}

function NextAction({ next }) {
  if (!next?.type || !next.item) {
    return (
      <div className="pen-e-empty-state">
        <strong>Nothing has been added here yet.</strong>
        <p>
          Recommendations and practice activities from your
          tutor will appear here.
        </p>
      </div>
    );
  }

  if (next.type === "homework") {
    return (
      <article className="pen-e-next-card">
        <p className="portal-eyebrow">Assigned practice</p>
        <h3>{next.item.title}</h3>

        {next.item.instructions ? (
          <p>{next.item.instructions}</p>
        ) : null}

        <div className="pen-e-next-footer">
          {next.item.dueAt ? (
            <span>
              Due {formatDate(next.item.dueAt)}
            </span>
          ) : (
            <span>Homework</span>
          )}

          <Link to="/portal/student/homework">
            View homework
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article className="pen-e-next-card">
      <p className="portal-eyebrow">
        Recommended next step
      </p>
      <h3>{next.item.title}</h3>
      <p>{next.item.text}</p>

      {next.item.dueAt ? (
        <div className="pen-e-next-footer">
          <span>
            Due {formatDate(next.item.dueAt)}
          </span>
        </div>
      ) : null}
    </article>
  );
}

export default function StudentPenEPage() {
  const { user, studentProfile } = useAuth();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;

    setError("");

    fetchStudentPenE(user.id)
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load Pen-E & Me."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const firstName = useMemo(() => {
    const value =
      studentProfile?.first_name ||
      studentProfile?.display_name ||
      data?.student?.displayName ||
      "";

    return value.trim().split(/\s+/)[0] || "";
  }, [data?.student?.displayName, studentProfile]);

  if (error) {
    return <div className="portal-alert">{error}</div>;
  }

  if (!data) {
    return (
      <div className="portal-loading">
        Loading Pen-E & Me…
      </div>
    );
  }

  return (
    <div className="pen-e-page">
      <section className="pen-e-hero">
        <div className="pen-e-hero-copy">
          <p className="portal-eyebrow">Pen-E & Me</p>
          <h2>Your learning, made visible.</h2>
          <p>
            {firstName ? `${firstName}, see` : "See"} what
            you've shown in your sessions, what you're
            developing, and what to keep working on.
          </p>
        </div>

        <div className="pen-e-hero-note">
          <strong>Reviewed learning only</strong>
          <span>
            Pen-E uses learning reviewed and approved by your
            tutor.
          </span>
        </div>
      </section>

      <section className="pen-e-section">
        <div className="pen-e-section-heading">
          <div>
            <p className="portal-eyebrow">Right now</p>
            <h2>Your Recent Learning</h2>
            <p>
              Here's what your recent sessions show.
            </p>
          </div>

          <Link
            className="pen-e-section-link"
            to="/portal/student/sessions"
          >
            View all sessions
          </Link>
        </div>

        {data.recentLearning.length ? (
          <div className="pen-e-recent-session-list">
            {data.recentLearning.map((session) => (
              <RecentSession
                key={session.sessionId}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="pen-e-empty-state">
            <strong>No approved learning yet.</strong>
            <p>
              Learning reviewed from your completed sessions
              will appear here.
            </p>
          </div>
        )}
      </section>

      <section className="pen-e-section pen-e-noticed">
        <div className="pen-e-section-heading">
          <div>
            <p className="portal-eyebrow">Pen-E noticed</p>
            <h2>A quick look at your recent record</h2>
            <p>
              These are facts from your approved recent
              learning—not a score or mastery rating.
            </p>
          </div>
        </div>

        <PenENoticed noticed={data.penENoticed} />
      </section>

      <section className="pen-e-section">
        <div className="pen-e-section-heading">
          <div>
            <p className="portal-eyebrow">My learning</p>
            <h2>Explore My Learning</h2>
            <p>
              See where your recorded learning fits.
            </p>
          </div>

          <Link
            className="pen-e-section-link"
            to="/portal/student/learning"
          >
            Open My Learning
          </Link>
        </div>

        <LearningMap strands={data.learningMap.strands} />
      </section>

      <section className="pen-e-snapshot-grid">
        <article className="pen-e-section pen-e-snapshot-panel">
          <div className="pen-e-section-heading">
            <div>
              <p className="portal-eyebrow">Evidence</p>
              <h2>What I've Shown</h2>
              <p>
                Skills where your latest approved session
                evidence shows successful work.
              </p>
            </div>
          </div>

          <SnapshotList
            items={data.whatIveShown}
            emptyTitle="Nothing is listed here yet."
            emptyText="Approved successful learning will appear here as your record grows."
          />
        </article>

        <article className="pen-e-section pen-e-snapshot-panel">
          <div className="pen-e-section-heading">
            <div>
              <p className="portal-eyebrow">Developing</p>
              <h2>I'm Working On</h2>
              <p>
                Skills where your latest approved session
                evidence still includes development or
                practice.
              </p>
            </div>
          </div>

          <SnapshotList
            items={data.imWorkingOn}
            emptyTitle="Nothing is listed here right now."
            emptyText="When recent evidence shows something to keep developing, it will appear here."
          />
        </article>
      </section>

      <section className="pen-e-section">
        <div className="pen-e-section-heading">
          <div>
            <p className="portal-eyebrow">My journey</p>
            <h2>My Learning Journey</h2>
            <p>
              Your approved learning stays with the session
              where it happened.
            </p>
          </div>
        </div>

        <Journey journey={data.journey} />
      </section>

      <section className="pen-e-section">
        <div className="pen-e-section-heading">
          <div>
            <p className="portal-eyebrow">Next</p>
            <h2>What's Next</h2>
            <p>
              Tutor recommendations and assigned practice
              appear here when available.
            </p>
          </div>
        </div>

        <NextAction next={data.next} />
      </section>

      <footer className="pen-e-trust">
        <div className="pen-e-trust-mark" aria-hidden="true">
          P
        </div>
        <div>
          <strong>About your Pen-E record</strong>
          <p>
            Pen-E helps organise learning evidence from your
            sessions. Only learning reviewed and approved by
            your tutor appears in your student learning
            record.
          </p>
        </div>
      </footer>
    </div>
  );
}



