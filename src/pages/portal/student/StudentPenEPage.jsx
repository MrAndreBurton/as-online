import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentPenE } from "../../../lib/studentPenE";

function formatDate(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-TT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ProgressSkills({ skills }) {
  if (!skills.length) return null;

  return (
    <details className="student-progress-details">
      <summary>
        View {skills.length}{" "}
        {skills.length === 1 ? "skill" : "skills"}
      </summary>

      <ul className="student-progress-skill-list">
        {skills.map((skill) => (
          <li key={skill.learningNodeId}>
            {skill.skillName}
          </li>
        ))}
      </ul>
    </details>
  );
}

function RecentLearningCard({ session }) {
  return (
    <article className="pen-e-recent-row">
      <div className="pen-e-recent-main">
        <strong>{session.title}</strong>

        <span>{formatDate(session.sessionDate)}</span>
      </div>

      <div className="pen-e-recent-progress">
        {session.progressSkillCount > 0 ? (
          <>
            <strong>{session.progressSkillCount}</strong>

            <span>
              {session.progressSkillCount === 1
                ? "skill with progress"
                : "skills with progress"}
            </span>
          </>
        ) : (
          <span>No progress recorded yet</span>
        )}
      </div>
    </article>
  );
}

function RecommendationCard({ recommendation }) {
  return (
    <article className="pen-e-recommendation-card">
      <div>
        <p className="portal-eyebrow">
          Recommended next step
        </p>

        <h3>{recommendation.title}</h3>

        <p>{recommendation.recommendation_text}</p>
      </div>

      {recommendation.due_at ? (
        <span className="pen-e-recommendation-date">
          Due {formatDate(recommendation.due_at)}
        </span>
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

    fetchStudentPenE(user.id)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
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
        Loading Pen-E & Me…
      </div>
    );
  }

  const firstName =
    studentProfile?.first_name ||
    studentProfile?.display_name ||
    data.student?.displayName ||
    "";

  return (
    <>
      <section className="portal-welcome pen-e-welcome">
        <p className="portal-eyebrow">
          Pen-E & Me
        </p>

        <h2>
          {firstName
            ? `Hi, ${firstName}.`
            : "Your learning companion"}
        </h2>

        <p>
          This is your personal learning space. Pen-E uses
          your approved learning record to help you see what
          you are working on, where progress has been
          recorded and what comes next.
        </p>
      </section>

      <section className="portal-grid portal-grid-2 pen-e-summary-grid">
        <article className="portal-card pen-e-summary-card">
          <p className="portal-eyebrow">
            Your Learning
          </p>

          <strong className="pen-e-summary-number">
            {data.totalSkillCount}
          </strong>

          <span>
            {data.totalSkillCount === 1
              ? "skill in your programme"
              : "skills in your programme"}
          </span>

          {data.enrolments.map((enrolment) => (
            <div
              className="pen-e-offering-row"
              key={enrolment.enrolmentId}
            >
              <strong>
                {enrolment.offeringName ||
                  enrolment.subjectName}
              </strong>

              {enrolment.curriculumLevels?.length ? (
                <span>
                  {enrolment.curriculumLevels
                    .map(
                      (level) =>
                        level.levelName ||
                        level.level_name ||
                        level.levelId
                    )
                    .filter(Boolean)
                    .join(", ")}
                </span>
              ) : null}
            </div>
          ))}
        </article>

        <article className="portal-card pen-e-summary-card">
          <p className="portal-eyebrow">
            Your Progress
          </p>

          <strong className="pen-e-summary-number">
            {data.progressSkillCount}
          </strong>

          <span>
            {data.progressSkillCount === 1
              ? "skill with progress recorded"
              : "skills with progress recorded"}
          </span>

          {data.progressSkillCount > 0 ? (
            <ProgressSkills
              skills={data.progressSkills}
            />
          ) : (
            <p className="pen-e-empty-copy">
              No progress recorded yet.
            </p>
          )}
        </article>
      </section>

      <section className="portal-card pen-e-section">
        <div className="pen-e-section-heading">
          <div>
            <p className="portal-eyebrow">
              What should I practise?
            </p>

            <h2>Your next steps</h2>
          </div>
        </div>

        {data.recommendations.length ? (
          <div className="pen-e-recommendation-list">
            {data.recommendations.map(
              (recommendation) => (
                <RecommendationCard
                  key={
                    recommendation.recommendation_id
                  }
                  recommendation={recommendation}
                />
              )
            )}
          </div>
        ) : (
          <div className="pen-e-empty-state">
            <strong>
              No recommendations yet.
            </strong>

            <p>
              When a next step is added to your learning
              record, it will appear here.
            </p>
          </div>
        )}
      </section>

      <section className="portal-card pen-e-section">
        <div className="pen-e-section-heading">
          <div>
            <p className="portal-eyebrow">
              Recent Learning
            </p>

            <h2>What you've been working on</h2>
          </div>

          <Link
            className="pen-e-section-link"
            to="/portal/student/sessions"
          >
            View all sessions
          </Link>
        </div>

        {data.recentLearning.length ? (
          <div className="pen-e-recent-list">
            {data.recentLearning.map((session) => (
              <RecentLearningCard
                key={session.sessionId}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="pen-e-empty-state">
            <strong>No completed sessions yet.</strong>

            <p>
              Your recent learning will appear here after
              completed sessions are recorded.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

