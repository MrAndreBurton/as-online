import { useMemo, useState } from "react";

import {
  buildPenEStudentReportPackage,
  parsePenEStudentReportDraft,
} from "../../../lib/penEReports";

export default function PenEStudentReportDraftPanel({
  report,
  onImport,
}) {
  const [rawDraft, setRawDraft] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState([]);

  const canUsePenE =
    report?.subject_type === "student" &&
    report?.report_status === "draft";

  const packageText = useMemo(() => {
    if (!canUsePenE) return "";

    try {
      return JSON.stringify(
        buildPenEStudentReportPackage(report),
        null,
        2
      );
    } catch {
      return "";
    }
  }, [report, canUsePenE]);

  async function handleCopyPackage() {
    setMessage("");
    setErrors([]);

    if (!packageText) {
      setErrors([
        "The Pen-E report package could not be generated.",
      ]);
      return;
    }

    try {
      await navigator.clipboard.writeText(packageText);

      setMessage(
        "Pen-E report package copied. Paste it into Pen-E and return the JSON draft here."
      );
    } catch {
      setErrors([
        "The report package could not be copied automatically.",
      ]);
    }
  }

  function handleValidate() {
    setMessage("");
    setErrors([]);

    const result =
      parsePenEStudentReportDraft(rawDraft);

    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setMessage(
      "Valid Pen-E student report draft. It is ready to import."
    );
  }

  function handleImport() {
    setMessage("");
    setErrors([]);

    const result =
      parsePenEStudentReportDraft(rawDraft);

    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    onImport(result.data);

    setMessage(
      "Pen-E draft imported into the editable report. Review it before saving."
    );
  }

  if (!canUsePenE) {
    return (
      <section className="portal-card">
        <h3>Pen-E Report Drafting</h3>

        <p className="portal-muted">
          Pen-E drafting is available only while this
          report is in draft status.
        </p>
      </section>
    );
  }

  return (
    <section className="portal-card pen-e-report-panel">
      <div className="pen-e-report-panel__header">
        <div>
          <p className="portal-eyebrow">
            Pen-E
          </p>

          <h3>Student Report Drafting</h3>

          <p className="portal-muted">
            Generate a controlled Pen-E package from
            this report's frozen evidence snapshot.
          </p>
        </div>

        <button
         type="button"
         className="aeos-button-secondary"
         onClick={handleCopyPackage}
        >  
         Copy Pen-E Report Package
        </button>

      </div>

      <div className="pen-e-report-divider" />

      <label className="pen-e-report-input">
        <span>Paste Pen-E JSON Draft</span>

        <textarea
          value={rawDraft}
          onChange={(event) =>
            setRawDraft(event.target.value)
          }
          rows={16}
          placeholder={`{
  "report_version": "student-content-v1",
  "overview": {
    "headline": "",
    "summary": ""
  },
  "learning_highlights": [],
  "areas_for_development": [],
  "follow_up_priorities": [],
  "curriculum_progress": [],
  "closing_comment": ""
}`}
        />
      </label>

      {errors.length > 0 && (
        <div className="portal-alert">
          <strong>
            Pen-E draft could not be imported.
          </strong>

          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {message && (
        <p className="pen-e-report-message">
          {message}
        </p>
      )}

      <div className="pen-e-report-actions">
        <button
         type="button"
         className="aeos-button-secondary"
         onClick={handleCopyPackage}
        >
         Copy Pen-E Report Package
        </button>

        <button
         type="button"
         className="aeos-button-primary"
         onClick={handleImport}
         disabled={!rawDraft.trim()}
        >
         Import into Report
       </button>

      </div>

      <p className="pen-e-report-warning">
        Importing does not save, review, or finalize the
        report. The imported content remains editable
        until you explicitly save the draft.
      </p>
    </section>
  );
}

