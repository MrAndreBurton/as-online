import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  approveDiagnosticCapture,
  completeAiDigitalDiagnostic,
  getAiDigitalDiagnosticWorkspace,
  markDiagnosticCaptureNoEvidence,
  rejectDiagnosticCapture,
} from "../../../lib/aiDigitalDiagnostic";

function eligibilityText(capture) {
  if (capture.capture_status !== "demonstrated") {
    return "Not mastery eligible — partial/prompted diagnostic evidence";
  }

  if (
    capture.node_score === 2 &&
    capture.independence_level === "independent" &&
    capture.mastery_eligible_full_score
  ) {
    return "Eligible to contribute to mastery";
  }

  if (capture.independence_level === "independent") {
    return "Independent demonstration captured; mastery eligibility remains governed by the evidence contract";
  }

  return "Demonstration captured, but not independently enough to contribute to mastery";
}

export default function EntryDiagnosticReviewPage() {
  const { studentId, attemptId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState("");
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setWorkspace(await getAiDigitalDiagnosticWorkspace(attemptId));
    } catch (err) {
      setError(err.message);
    }
  }, [attemptId]);

  useEffect(() => { load(); }, [load]);

  const reviewCaptures = useMemo(
    () => (workspace?.tasks || []).flatMap((task) =>
      (task.node_captures || [])
        .filter((capture) => ["partial", "demonstrated"].includes(capture.capture_status))
        .map((capture) => ({ ...capture, taskCode: task.item.code, taskTitle: task.item.title }))
    ),
    [workspace]
  );

  const unresolved = reviewCaptures.filter((capture) => capture.review_decision === "pending");

  async function decide(capture, decision) {
    setBusyId(capture.capture_id);
    setError("");
    try {
      const note = notes[capture.capture_id] || null;
      if (decision === "approve") await approveDiagnosticCapture(capture, note);
      if (decision === "reject") await rejectDiagnosticCapture(capture, note);
      if (decision === "no_evidence") await markDiagnosticCaptureNoEvidence(capture, note);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function complete() {
    setCompleting(true);
    setError("");
    try {
      await completeAiDigitalDiagnostic(attemptId);
      navigate(`/portal/admin/students/${studentId}/diagnostic/${attemptId}/readiness`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  }

  if (!workspace && !error) return <div className="portal-loading">Loading evidence review…</div>;
  if (!workspace) return <div className="portal-alert">{error}</div>;

  return (
    <>
      <Link className="aeos-back-link" to={`/portal/admin/students/${studentId}/diagnostic/${attemptId}`}>← Back to Administration</Link>

      <section className="diagnostic-page-heading">
        <div>
          <p className="portal-eyebrow">Evidence Review</p>
          <h2>{workspace.student?.display_name}</h2>
          <p>Review positive and partial node captures before completing the diagnostic.</p>
        </div>
        <span className="status-pill">{unresolved.length} pending</span>
      </section>

      {error ? <div className="portal-alert">{error}</div> : null}

      <div className="diagnostic-review-list">
        {reviewCaptures.length ? reviewCaptures.map((capture) => (
          <article className="portal-card diagnostic-review-card" key={capture.capture_id}>
            <div className="diagnostic-node-heading">
              <div>
                <p className="portal-eyebrow">{capture.taskCode} · {capture.evidence_role}</p>
                <h3>{capture.node_code} · {capture.node_name}</h3>
                <p>{capture.taskTitle}</p>
              </div>
              <span className={`diagnostic-review-state ${capture.review_decision}`}>{capture.review_decision.replace("_", " ")}</span>
            </div>

            <dl className="diagnostic-review-details">
              <div><dt>Score</dt><dd>{capture.node_score ?? "—"}</dd></div>
              <div><dt>Independence</dt><dd>{capture.independence_level || "—"}</dd></div>
              <div><dt>Observation</dt><dd>{capture.observation_note || "No note recorded"}</dd></div>
              <div><dt>Evidence context</dt><dd>{eligibilityText(capture)}</dd></div>
            </dl>

            {capture.artifact_references?.length ? (
              <div className="diagnostic-artifact-list">
                <strong>Artifact/reference</strong>
                {capture.artifact_references.map((ref, index) => <span key={index}>{typeof ref === "string" ? ref : JSON.stringify(ref)}</span>)}
              </div>
            ) : null}

            {capture.review_decision === "pending" ? (
              <>
                <label className="diagnostic-review-note">
                  Review note
                  <textarea rows={2} value={notes[capture.capture_id] || ""} onChange={(event) => setNotes((current) => ({ ...current, [capture.capture_id]: event.target.value }))} />
                </label>
                <div className="diagnostic-review-actions">
                  <button type="button" className="aeos-button-primary" disabled={busyId === capture.capture_id} onClick={() => decide(capture, "approve")}>Approve Evidence</button>
                  <button type="button" className="aeos-button-secondary" disabled={busyId === capture.capture_id} onClick={() => decide(capture, "reject")}>Reject Evidence</button>
                  <button type="button" className="aeos-button-secondary" disabled={busyId === capture.capture_id} onClick={() => decide(capture, "no_evidence")}>No Evidence</button>
                </div>
              </>
            ) : null}
          </article>
        )) : (
          <section className="portal-card"><h3>No positive or partial captures</h3><p className="diagnostic-muted">There is no diagnostic evidence requiring approval or rejection.</p></section>
        )}
      </div>

      <section className="portal-card diagnostic-complete-card">
        <p className="portal-eyebrow">Complete Diagnostic</p>
        <h3>Freeze the Initial Readiness Profile</h3>
        <p>Completing the diagnostic freezes this attempt's Initial Readiness Profile. Approved evidence may inform the student's evidence history, but completion does not automatically set Secure or Mastered status.</p>
        <button type="button" className="aeos-button-primary" disabled={completing || unresolved.length > 0} onClick={complete}>
          {completing ? "Completing…" : "Complete Diagnostic & Create Initial Readiness Profile"}
        </button>
      </section>
    </>
  );
}
