import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentSessionDetail } from "../../../lib/studentSessions";

function formatDateTime(value) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-TT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function LearningSection({ learning }) {
  return (
    <section className="portal-card student-session-detail-section">
      <p className="portal-eyebrow">
        Learning from this session
      </p>

      <h2>Progress recorded</h2>

      {learning.length ? (
        <div className="student-session-learning-list">
          {learning.map((skill) => (
            <article
              className="student-session-learning-item"
              key={skill.learningNodeId}
            >
              <strong>{skill.name}</strong>

              {skill.observableStatement ? (
                <p>
                  {skill.observableStatement}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="pen-e-empty-state">
          <strong>
            No progress recorded yet.
          </strong>

          <p>
            No approved learning progress has been
            recorded from this session yet.
          </p>
        </div>
      )}
    </section>
  );
}

function HomeworkSection({ homework }) {
  return (
    <section className="portal-card student-session-detail-section">
      <p className="portal-eyebrow">
        Homework
      </p>

      <h2>Work from this session</h2>

      {homework.length ? (
        <div className="student-session-detail-list">
          {homework.map((item) => (
            <article key={item.homework_id}>
              <strong>{item.title}</strong>

              {item.instructions ? (
                <p>{item.instructions}</p>
              ) : null}

              {item.due_at ? (
                <span>
                  Due {formatDateTime(item.due_at)}
                </span>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="pen-e-empty-state">
          <strong>No homework added.</strong>

          <p>
            Homework connected to this session will
            appear here.
          </p>
        </div>
      )}
    </section>
  );
}

function ResourcesSection({ resources }) {
  return (
    <section className="portal-card student-session-detail-section">
      <p className="portal-eyebrow">
        Resources
      </p>

      <h2>Learning materials</h2>

      {resources.length ? (
        <div className="student-session-detail-list">
          {resources.map((resource) => (
            <article key={resource.resource_id}>
              <strong>
                {resource.resource_title ||
                  "Learning resource"}
              </strong>

              {resource.description ? (
                <p>{resource.description}</p>
              ) : null}

              {resource.resource_url ? (
                <a
                  href={resource.resource_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open resource →
                </a>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="pen-e-empty-state">
          <strong>No resources added.</strong>

          <p>
            Student resources connected to this session
            will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

export default function StudentSessionDetailPage() {
  const { user } = useAuth();
  const { sessionId } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.id || !sessionId) return;

    let cancelled = false;

    fetchStudentSessionDetail(
      user.id,
      sessionId
    )
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err?.message ||
              "Unable to load this session."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, sessionId]);

  if (error) {
    return <div className="portal-alert">{error}</div>;
  }

  if (!data) {
    return (
      <div className="portal-loading">
        Loading session…
      </div>
    );
  }

  return (
    <>
      <Link
        className="student-learning-back"
        to="/portal/student/sessions"
      >
        ← Back to My Sessions
      </Link>

      <section className="portal-welcome student-session-detail-header">
        <p className="portal-eyebrow">
          My Sessions
        </p>

        <h2>{data.session.title}</h2>

        <p>
          {formatDateTime(
            data.session.scheduledStartAt ||
              data.session.sessionDate
          )}
        </p>
      </section>

      <LearningSection
        learning={data.learning}
      />

      <HomeworkSection
        homework={data.homework}
      />

      <ResourcesSection
        resources={data.resources}
      />
    </>
  );
}

