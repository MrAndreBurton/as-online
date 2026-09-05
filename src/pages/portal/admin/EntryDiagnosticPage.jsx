import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getAiDigitalDiagnosticWorkspace,
  prepareAiDigitalDiagnosticReview,
  saveDiagnosticNodeCapture,
  saveDiagnosticTask,
} from "../../../lib/aiDigitalDiagnostic";

const INDEPENDENCE_OPTIONS = [
  ["supported", "Supported"],
  ["prompted", "Prompted"],
  ["mostly_independent", "Mostly independent"],
  ["independent", "Independent"],
];

function artifactText(value) {
  if (!Array.isArray(value) || !value.length) return "";
  return value.map((item) => (typeof item === "string" ? item : JSON.stringify(item))).join("\n");
}

function parseArtifactText(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function EntryDiagnosticPage() {
  const { studentId, attemptId } = useParams();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState(null);
  const [taskIndex, setTaskIndex] = useState(0);
  const [drafts, setDrafts] = useState({});
  const [taskNote, setTaskNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await getAiDigitalDiagnosticWorkspace(attemptId);
      setWorkspace(next);
      const current = Math.max(0, (next?.attempt?.current_item_sequence || 1) - 1);
      setTaskIndex(Math.min(current, Math.max(0, (next?.tasks?.length || 1) - 1)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    load();
  }, [load]);

  const task = workspace?.tasks?.[taskIndex];

  useEffect(() => {
    if (!task) return;
    setTaskNote(task.tutor_notes || "");
    setDrafts((current) => {
      const next = { ...current };
      for (const capture of task.node_captures || []) {
        if (!next[capture.capture_id]) {
          next[capture.capture_id] = {
            score: capture.node_score ?? "",
            independenceLevel: capture.independence_level || "",
            observationNote: capture.observation_note || "",
            artifactText: artifactText(capture.artifact_references),
            captureStatus: capture.capture_status || "not_assessed",
          };
        }
      }
      return next;
    });
  }, [task]);

  const allTasksResolved = useMemo(
    () => workspace?.tasks?.every((item) => ["captured", "skipped"].includes(item.response_status)),
    [workspace]
  );

  function patchDraft(captureId, patch) {
    setDrafts((current) => ({
      ...current,
      [captureId]: { ...current[captureId], ...patch },
    }));
  }

  async function persistTask(responseStatus = "captured") {
    if (!task) return;
    setSaving(true);
    setError("");

    try {
      if (responseStatus === "captured") {
        for (const capture of task.node_captures || []) {
          const draft = drafts[capture.capture_id] || {};
          const isOptionalUnobserved =
            capture.evidence_role === "optional" && draft.captureStatus === "not_observed";

          if (!isOptionalUnobserved && (draft.score === "" || !draft.independenceLevel)) {
            throw new Error(`Complete score and independence for ${capture.node_code}, or mark an optional behaviour Not observed.`);
          }

          await saveDiagnosticNodeCapture({
            captureId: capture.capture_id,
            score: isOptionalUnobserved ? null : Number(draft.score),
            independenceLevel: isOptionalUnobserved ? null : draft.independenceLevel,
            observationNote: draft.observationNote,
            artifactReferences: parseArtifactText(draft.artifactText || ""),
            captureStatus: isOptionalUnobserved ? "not_observed" : undefined,
          });
        }
      } else {
        for (const capture of task.node_captures || []) {
          await saveDiagnosticNodeCapture({
            captureId: capture.capture_id,
            score: null,
            independenceLevel: null,
            observationNote: drafts[capture.capture_id]?.observationNote || "",
            artifactReferences: [],
            captureStatus: "not_assessed",
          });
        }
      }

      await saveDiagnosticTask({
        responseId: task.response_id,
        responseStatus,
        tutorNotes: taskNote,
      });

      const next = await getAiDigitalDiagnosticWorkspace(attemptId);
      setWorkspace(next);
      return next;
    } finally {
      setSaving(false);
    }
  }

  async function saveAndNext() {
    try {
      await persistTask("captured");
      if (taskIndex < workspace.tasks.length - 1) setTaskIndex((value) => value + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function skipTask() {
    try {
      await persistTask("skipped");
      if (taskIndex < workspace.tasks.length - 1) setTaskIndex((value) => value + 1);
    } catch (err) {
      setError(err.message);
    }
  }

  async function finishAdministration() {
    setSaving(true);
    setError("");
    try {
      if (!["captured", "skipped"].includes(task.response_status)) await persistTask("captured");
      await prepareAiDigitalDiagnosticReview(attemptId);
      navigate(`/portal/admin/students/${studentId}/diagnostic/${attemptId}/review`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="portal-loading">Loading diagnostic…</div>;
  if (error && !workspace) return <div className="portal-alert">{error}</div>;
  if (!workspace || !task) return <div className="portal-alert">Diagnostic workspace unavailable.</div>;

  if (workspace.attempt.status === "under_review") {
    return (
      <section className="portal-card diagnostic-complete-card">
        <p className="portal-eyebrow">Entry Diagnostic</p>
        <h2>Administration complete</h2>
        <p>The student's responses have been captured. Review the resulting node evidence before completing the diagnostic.</p>
        <Link className="aeos-button-primary diagnostic-inline-button" to={`/portal/admin/students/${studentId}/diagnostic/${attemptId}/review`}>
          Review Evidence
        </Link>
      </section>
    );
  }

  return (
    <>
      <Link className="aeos-back-link" to={`/portal/admin/students/${studentId}`}>← Back to Student</Link>

      <section className="diagnostic-page-heading">
        <div>
          <p className="portal-eyebrow">Entry Diagnostic</p>
          <h2>{workspace.student?.display_name}</h2>
          <p>{workspace.diagnostic?.name} · v{workspace.diagnostic?.version}</p>
        </div>
        <div className="diagnostic-progress-copy">Task {taskIndex + 1} of {workspace.tasks.length}</div>
      </section>

      <div className="diagnostic-progress-track" aria-hidden="true">
        <span style={{ width: `${((taskIndex + 1) / workspace.tasks.length) * 100}%` }} />
      </div>

      {error ? <div className="portal-alert">{error}</div> : null}

      <section className="portal-card diagnostic-task-card">
        <div className="diagnostic-task-title-row">
          <div>
            <p className="portal-eyebrow">{task.item.code}</p>
            <h2>{task.item.title}</h2>
          </div>
          <span className="status-pill">~{task.item.estimated_minutes} min</span>
        </div>

        <div className="diagnostic-zone diagnostic-student-task">
          <span className="diagnostic-zone-label">Student Task</span>
          <p>{task.item.student_prompt}</p>
        </div>

        <details className="diagnostic-guidance">
          <summary>Tutor Guidance</summary>
          <p>{task.item.assessor_instructions}</p>
        </details>
      </section>

      <section className="portal-card diagnostic-capture-section">
        <p className="portal-eyebrow">Evidence Capture</p>
        <h3>Record only what was directly observed</h3>

        <div className="diagnostic-node-list">
          {(task.node_captures || []).map((capture) => {
            const draft = drafts[capture.capture_id] || {};
            const optionalUnobserved = capture.evidence_role === "optional" && draft.captureStatus === "not_observed";

            return (
              <article className="diagnostic-node-card" key={capture.capture_id}>
                <div className="diagnostic-node-heading">
                  <div>
                    <strong>{capture.node_code} · {capture.node_name}</strong>
                    <span className={`diagnostic-role ${capture.evidence_role}`}>{capture.evidence_role}</span>
                  </div>
                  {capture.evidence_role === "optional" ? (
                    <button
                      type="button"
                      className="aeos-button-secondary diagnostic-small-button"
                      onClick={() => patchDraft(capture.capture_id, {
                        captureStatus: optionalUnobserved ? "not_assessed" : "not_observed",
                        score: "",
                        independenceLevel: "",
                      })}
                    >
                      {optionalUnobserved ? "Record observation" : "Not observed"}
                    </button>
                  ) : null}
                </div>

                {capture.evidence_role === "optional" ? <p className="diagnostic-optional-note">OPTIONAL — record only if directly observed</p> : null}

                {!optionalUnobserved ? (
                  <div className="diagnostic-capture-grid">
                    <label>
                      Score
                      <select value={draft.score ?? ""} onChange={(event) => patchDraft(capture.capture_id, { score: event.target.value, captureStatus: "assessed" })}>
                        <option value="">Select…</option>
                        <option value="0">0 — Not demonstrated</option>
                        <option value="1">1 — Partial / substantive prompting</option>
                        <option value="2">2 — Independent required behaviour</option>
                      </select>
                    </label>

                    <label>
                      Independence
                      <select value={draft.independenceLevel || ""} onChange={(event) => patchDraft(capture.capture_id, { independenceLevel: event.target.value })}>
                        <option value="">Select…</option>
                        {INDEPENDENCE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                    </label>

                    <label className="diagnostic-field-full">
                      Observation note
                      <textarea rows={3} value={draft.observationNote || ""} onChange={(event) => patchDraft(capture.capture_id, { observationNote: event.target.value })} />
                    </label>

                    <label className="diagnostic-field-full">
                      Artifact reference(s)
                      <textarea rows={2} placeholder="One reference per line. No upload pipeline is created here." value={draft.artifactText || ""} onChange={(event) => patchDraft(capture.capture_id, { artifactText: event.target.value })} />
                    </label>
                  </div>
                ) : (
                  <p className="diagnostic-muted">No evidence will be inferred for this optional node.</p>
                )}
              </article>
            );
          })}
        </div>

        <label className="diagnostic-task-note">
          Task-level tutor note
          <textarea rows={3} value={taskNote} onChange={(event) => setTaskNote(event.target.value)} />
        </label>
      </section>

      <div className="diagnostic-footer-actions">
        <button type="button" className="aeos-button-secondary" disabled={saving || taskIndex === 0} onClick={() => setTaskIndex((value) => value - 1)}>Previous</button>
        <button type="button" className="aeos-button-secondary" disabled={saving} onClick={skipTask}>Skip Task</button>
        <Link className="aeos-button-secondary diagnostic-link-button" to={`/portal/admin/students/${studentId}`}>Save & Exit</Link>
        {taskIndex < workspace.tasks.length - 1 ? (
          <button type="button" className="aeos-button-primary" disabled={saving} onClick={saveAndNext}>{saving ? "Saving…" : "Save & Next"}</button>
        ) : (
          <button type="button" className="aeos-button-primary" disabled={saving || (!allTasksResolved && task.response_status === "skipped")} onClick={finishAdministration}>{saving ? "Finishing…" : "Finish Administration"}</button>
        )}
      </div>
    </>
  );
}
