import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  getAiDigitalDiagnosticLaunch,
  startAiDigitalDiagnostic,
} from "../../lib/aiDigitalDiagnostic";

export default function AiDigitalDiagnosticCard({
  studentId,
  studentUserId,
  studentName,
  eligible,
}) {
  const navigate = useNavigate();

  const [launch, setLaunch] =
    useState(null);

  const [confirmOpen, setConfirmOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(
      Boolean(
        eligible &&
        studentUserId
      )
    );

  const [starting, setStarting] =
    useState(false);

  const [error, setError] =
    useState("");

  const load = useCallback(async () => {
    if (
      !eligible ||
      !studentUserId
    ) {
      setLaunch(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const next =
        await getAiDigitalDiagnosticLaunch(
          studentUserId
        );

      setLaunch(next);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load diagnostic status."
      );
    } finally {
      setLoading(false);
    }
  }, [
    eligible,
    studentUserId,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  if (!eligible) {
    return null;
  }

  async function start() {
    if (!studentUserId) {
      return;
    }

    setStarting(true);
    setError("");

    try {
      const attempt =
        await startAiDigitalDiagnostic(
          studentUserId
        );

      navigate(
        `/portal/admin/students/${studentId}/diagnostic/${attempt.diagnostic_attempt_id}`
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to start diagnostic."
      );
    } finally {
      setStarting(false);
    }
  }

  const openAttempt =
    launch?.open_attempt;

  const completed =
    launch?.latest_completed_attempt;

  const attemptId =
    openAttempt?.diagnostic_attempt_id ||
    openAttempt?.attempt_id;

  const status =
    openAttempt?.attempt_status;

  const taskCount =
    launch?.diagnostic?.task_count ??
    8;

  const estimatedMinutes =
    launch?.diagnostic
      ?.estimated_minutes ?? 46;

  let action = null;

  if (
    attemptId &&
    status === "under_review"
  ) {
    action = (
      <Link
        className="aeos-button-primary diagnostic-link-button"
        to={`/portal/admin/students/${studentId}/diagnostic/${attemptId}/review`}
      >
        Review Evidence
      </Link>
    );
  } else if (attemptId) {
    action = (
      <Link
        className="aeos-button-primary diagnostic-link-button"
        to={`/portal/admin/students/${studentId}/diagnostic/${attemptId}`}
      >
        Resume Diagnostic
      </Link>
    );
  } else if (studentUserId) {
    action = (
      <button
        type="button"
        className="aeos-button-primary"
        onClick={() =>
          setConfirmOpen(true)
        }
        disabled={
          loading ||
          starting
        }
      >
        Start Diagnostic
      </button>
    );
  }

  return (
    <>
      <section className="portal-card diagnostic-launch-card">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">
              Entry Diagnostic
            </p>

            <h3>
              {launch?.diagnostic
                ?.name ||
                "Form 1 AI & Digital Readiness Entry Diagnostic"}
            </h3>
          </div>

          {openAttempt ? (
            <span className="status-pill">
              {status
                ?.replace(
                  /_/g,
                  " "
                )}
            </span>
          ) : null}
        </div>

        <p className="diagnostic-muted">
          {taskCount} tasks ·
          approximately{" "}
          {estimatedMinutes} minutes ·
          establishes an initial
          readiness baseline.
        </p>

        <p className="diagnostic-safeguard">
          This diagnostic does not
          automatically award mastery.
        </p>

        {error ? (
          <div className="portal-alert">
            {error}
          </div>
        ) : null}

        {loading ? (
          <p className="diagnostic-muted">
            Loading diagnostic status…
          </p>
        ) : null}

        {!studentUserId ? (
          <p className="aeos-note">
            A linked student portal
            account is required before
            this diagnostic can be
            administered.
          </p>
        ) : (
          <div className="diagnostic-launch-actions">
            {action}

            {completed?.attempt_id ? (
              <Link
                className="aeos-button-secondary diagnostic-link-button"
                to={`/portal/admin/students/${studentId}/diagnostic/${completed.attempt_id}/readiness`}
              >
                View Initial Readiness
                Profile
              </Link>
            ) : null}
          </div>
        )}
      </section>

      {confirmOpen ? (
        <div className="aeos-modal-backdrop">
          <div
            className="aeos-modal"
            role="dialog"
            aria-modal="true"
          >
            <div className="aeos-modal-header">
              <div>
                <p className="portal-eyebrow">
                  Entry Diagnostic
                </p>

                <h2>
                  Start Diagnostic
                </h2>
              </div>

              <button
                type="button"
                className="aeos-icon-button"
                onClick={() =>
                  setConfirmOpen(false)
                }
                disabled={starting}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="diagnostic-confirm-copy">
              <p>
                <strong>
                  Student:
                </strong>{" "}
                {studentName}
              </p>

              <p>
                <strong>
                  Administration:
                </strong>{" "}
                {taskCount} tasks ·
                approximately{" "}
                {estimatedMinutes} minutes
              </p>

              <p className="diagnostic-safeguard">
                This diagnostic
                establishes an initial
                readiness baseline. It
                does not automatically
                award mastery.
              </p>
            </div>

            <div className="diagnostic-footer-actions">
              <button
                type="button"
                className="aeos-button-secondary"
                disabled={starting}
                onClick={() =>
                  setConfirmOpen(false)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="aeos-button-primary"
                disabled={starting}
                onClick={start}
              >
                {starting
                  ? "Starting…"
                  : "Start Diagnostic"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


