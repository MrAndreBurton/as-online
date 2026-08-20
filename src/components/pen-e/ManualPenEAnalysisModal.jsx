import { useEffect, useMemo, useState } from "react";
import { importManualPenEAnalysis } from "../../lib/historyIntake";
import { fetchManualPenEContext } from "../../lib/manualPenEContext";
import {
  buildManualPenEPackage,
  MANUAL_PEN_E_PROMPT_VERSION,
} from "../../lib/manualPenEPrompt";

const EMPTY_JSON = `{
  "session_summary": "",
  "overall_confidence": 0,
  "curriculum_matches": [],
  "evidence": [],
  "actions": []
}`;

export default function ManualPenEAnalysisModal({
  open,
  onClose,
  intakeItem,
  onImported,
}) {
  const [context, setContext] = useState(null);
  const [jsonText, setJsonText] = useState(EMPTY_JSON);
  const [loadingContext, setLoadingContext] = useState(false);
  const [working, setWorking] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!open || !intakeItem?.intake_item_id) return;

    let active = true;

    async function loadContext() {
      setLoadingContext(true);
      setError("");
      setCopyMessage("");
      setSuccess(null);

      try {
        const next = await fetchManualPenEContext(intakeItem.intake_item_id);

        if (active) setContext(next);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoadingContext(false);
      }
    }

    loadContext();

    return () => {
      active = false;
    };
  }, [open, intakeItem?.intake_item_id]);

  const manualPackage = useMemo(
    () => (context ? buildManualPenEPackage(context) : ""),
    [context]
  );

  if (!open) return null;

  async function copyPackage() {
    if (!manualPackage) return;

    setCopyMessage("");
    setError("");

    try {
      await navigator.clipboard.writeText(manualPackage);
      setCopyMessage(
        `Copied ${MANUAL_PEN_E_PROMPT_VERSION} package. Paste it into ChatGPT.`
      );
    } catch {
      setError(
        "Unable to copy automatically. Your browser may be blocking clipboard access."
      );
    }
  }

  async function submit(event) {
    event.preventDefault();
    setWorking(true);
    setError("");

    try {
      const analysis = JSON.parse(jsonText);

      if (!analysis.session_summary?.trim()) {
        throw new Error("session_summary is required.");
      }

      const runId = await importManualPenEAnalysis(
        intakeItem.intake_item_id,
        analysis
      );

      setSuccess(runId);
      await onImported?.(runId);
    } catch (err) {
      setError(
        err instanceof SyntaxError
          ? "The pasted analysis is not valid JSON. Paste only the JSON object returned by ChatGPT."
          : err.message
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="aeos-modal-backdrop">
      <div
        className="aeos-modal manual-pen-e-modal manual-pen-e-v2"
        role="dialog"
        aria-modal="true"
      >
        <div className="aeos-modal-header">
          <div>
            <p className="portal-eyebrow">Manual Pen-E</p>
            <h2>Analyze Learning Intake</h2>
            <p>
              Copy the AEOS package into ChatGPT, then paste the returned JSON here.
            </p>
          </div>

          <button type="button" className="aeos-icon-button" onClick={onClose}>
            ×
          </button>
        </div>

        {success ? (
          <div className="aeos-success-panel">
            <h3>Analysis imported</h3>
            <p>The analysis is now available in Pen-E for Tutor Review.</p>

            <button
              type="button"
              className="aeos-button-primary"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form className="aeos-form" onSubmit={submit}>
            <section className="manual-pen-e-step">
              <div className="manual-pen-e-step-heading">
                <div>
                  <p className="portal-eyebrow">Step 1</p>
                  <h3>Prepare analysis in ChatGPT</h3>
                </div>

                <span className="status-pill">
                  {MANUAL_PEN_E_PROMPT_VERSION}
                </span>
              </div>

              {loadingContext ? (
                <div className="portal-loading">
                  Preparing curriculum context…
                </div>
              ) : context ? (
                <>
                  <div className="manual-pen-e-context-summary">
                    <span>
                      <strong>{context.curriculumNodes.length}</strong>
                      <small>curriculum nodes</small>
                    </span>

                    <span>
                      <strong>{context.wordCount.toLocaleString()}</strong>
                      <small>transcript words</small>
                    </span>

                    <span>
                      <strong>{context.durationMinutes ?? "—"}</strong>
                      <small>minutes</small>
                    </span>
                  </div>

                  <button
                    type="button"
                    className="aeos-button-secondary"
                    onClick={copyPackage}
                  >
                    Copy Manual Pen-E Package
                  </button>

                  {copyMessage ? (
                    <div className="aeos-success">{copyMessage}</div>
                  ) : null}
                </>
              ) : null}
            </section>

            <section className="manual-pen-e-step">
              <div>
                <p className="portal-eyebrow">Step 2</p>
                <h3>Paste returned JSON</h3>
              </div>

              <textarea
                className="manual-pen-e-json"
                rows={22}
                value={jsonText}
                onChange={(event) => setJsonText(event.target.value)}
                spellCheck={false}
              />

              <p className="aeos-note">
                Paste only the JSON object. Prompt v2 supplies the real AEOS
                curriculum IDs and exact enum values accepted by the database.
              </p>
            </section>

            {error ? <div className="portal-alert">{error}</div> : null}

            <div className="aeos-modal-actions">
              <button
                type="button"
                className="aeos-button-secondary"
                onClick={onClose}
                disabled={working}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="aeos-button-primary"
                disabled={working || loadingContext || !context}
              >
                {working ? "Importing…" : "Save for Tutor Review"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
