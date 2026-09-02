import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchStudentHomework } from "../../../lib/studentHomework";

function formatDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  return new Intl.DateTimeFormat("en-TT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

function HomeworkItem({ item, completed = false }) {
  return (
    <article className="student-homework-item">
      <div className="student-homework-main">
        <div className="student-homework-title-row">
          <strong>{item.title}</strong>

          {!completed && item.isOverdue && (
            <span className="student-homework-status overdue">
              Overdue
            </span>
          )}

          {completed && (
            <span className="student-homework-status completed">
              Completed
            </span>
          )}
        </div>

        {item.instructions && (
          <p className="student-homework-instructions">
            {item.instructions}
          </p>
        )}

        <div className="student-homework-meta">
          {!completed && (
            <span>
              {item.dueAt
                ? `Due ${formatDate(item.dueAt)}`
                : "No due date"}
            </span>
          )}

          {completed && item.completedAt && (
            <span>
              Completed {formatDate(item.completedAt)}
            </span>
          )}

          {item.sessionDate && (
            <span>
              Session {formatDate(item.sessionDate)}
            </span>
          )}
        </div>
      </div>

      <Link
        className="student-homework-session-link"
        to={`/portal/student/sessions/${item.sessionId}`}
      >
        View session →
      </Link>
    </article>
  );
}

export default function StudentHomeworkPage() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [homework, setHomework] = useState({
    todo: [],
    completed: [],
  });

  useEffect(() => {
    let mounted = true;

    async function loadHomework() {
      if (!user?.id) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await fetchStudentHomework(user.id);

        if (mounted) {
          setHomework(result);
        }
      } catch (err) {
        console.error("Failed to load student homework:", err);

        if (mounted) {
          setError(
            err?.message ||
              "We could not load your homework."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadHomework();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="portal-loading">
        Loading homework…
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-alert">
        {error}
      </div>
    );
  }

  return (
    <>
      <section className="portal-welcome">
        <p className="portal-eyebrow">
          Homework
        </p>

        <h2>My Homework</h2>

        <p>
          Keep track of practice assigned from your tutoring
          sessions.
        </p>
      </section>

      <section className="portal-card student-homework-section">
        <div className="student-homework-section-heading">
          <div>
            <p className="portal-eyebrow">
              To Do
            </p>

            <h2>
              Assigned homework
            </h2>
          </div>

          {homework.todo.length > 0 && (
            <span className="student-homework-count">
              {homework.todo.length}
            </span>
          )}
        </div>

        {homework.todo.length === 0 ? (
          <div className="student-homework-empty">
            <strong>No homework to do right now.</strong>

            <p>
              New assignments from your tutoring sessions
              will appear here.
            </p>
          </div>
        ) : (
          <div className="student-homework-list">
            {homework.todo.map((item) => (
              <HomeworkItem
                key={item.homeworkId}
                item={item}
              />
            ))}
          </div>
        )}
      </section>

      <section className="portal-card student-homework-section">
        <div className="student-homework-section-heading">
          <div>
            <p className="portal-eyebrow">
              History
            </p>

            <h2>
              Completed homework
            </h2>
          </div>

          {homework.completed.length > 0 && (
            <span className="student-homework-count">
              {homework.completed.length}
            </span>
          )}
        </div>

        {homework.completed.length === 0 ? (
          <div className="student-homework-empty">
            <strong>No completed homework yet.</strong>

            <p>
              Homework recorded as completed will appear here.
            </p>
          </div>
        ) : (
          <div className="student-homework-list">
            {homework.completed.map((item) => (
              <HomeworkItem
                key={item.homeworkId}
                item={item}
                completed
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

