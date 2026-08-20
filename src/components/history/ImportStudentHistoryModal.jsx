import { useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  parsePastedTranscript,
  parseTranscriptFile,
  sha256Text,
} from "../../lib/transcriptParser";
import { importTranscriptToLIE } from "../../lib/learningIntake";
import { createHistoricalSessionForStudent } from "../../lib/historyIntake";

function addMinutes(localValue, minutes) {
  const date = new Date(localValue);
  date.setMinutes(date.getMinutes() + Number(minutes));
  return date.toISOString();
}

export default function ImportStudentHistoryModal({
  open,
  onClose,
  student,
  enrolments = [],
  onImported,
}) {
  const { user } = useAuth();
  const [mode, setMode] = useState("session");
  const [parsed, setParsed] = useState(null);
  const [pasteText, setPasteText] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    offeringId: "",
    startLocal: "",
    durationMinutes: 60,
    sessionTitle: "",
    attendanceStatus: "present",
    notes: "",
  });

  const availableOfferings = useMemo(() => {
    const seen = new Set();
    return enrolments
      .filter((item) => item.offering)
      .filter((item) => {
        if (seen.has(item.offering_id)) return false;
        seen.add(item.offering_id);
        return true;
      });
  }, [enrolments]);

  if (!open) return null;

  function field(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setWorking(true);
    setError("");

    try {
      setParsed(await parseTranscriptFile(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function parsePaste() {
    setWorking(true);
    setError("");

    try {
      setParsed(parsePastedTranscript(pasteText));
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!user?.id) return;

    setWorking(true);
    setError("");
    setSuccess(null);

    try {
      const startAt = new Date(form.startLocal).toISOString();
      const endAt = addMinutes(form.startLocal, form.durationMinutes);

      const sessionId = await createHistoricalSessionForStudent({
        studentId: student.student_id,
        offeringId: form.offeringId,
        tutorUserId: user.id,
        startAt,
        endAt,
        title: form.sessionTitle,
        attendanceStatus: form.attendanceStatus,
        notes: form.notes,
      });

      let intakeItemId = null;

      if (mode === "transcript") {
        if (!parsed) {
          throw new Error("Upload or paste a transcript before importing.");
        }

        const result = await importTranscriptToLIE({
          sessionId,
          sourceProvider: "Historical Manual Import",
          sourceFormat: parsed.sourceFormat,
          sourceName: parsed.sourceName,
          rawText: parsed.rawText,
          normalizedText: parsed.normalizedText,
          contentSha256: await sha256Text(parsed.normalizedText),
          extractedMetadata: {
            ...parsed.metadata,
            historical_import: true,
            canonical_student_id: student.student_id,
          },
        });

        intakeItemId = result.intake_item_id || null;
      }

      setSuccess({
        sessionId,
        intakeItemId,
        transcriptImported: mode === "transcript",
      });

      await onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="aeos-modal-backdrop">
      <div className="aeos-modal history-import-modal" role="dialog" aria-modal="true">
        <div className="aeos-modal-header">
          <div>
            <p className="portal-eyebrow">Student History</p>
            <h2>Import History</h2>
            <p>
              {student.display_name ||
                [student.first_name, student.last_name].filter(Boolean).join(" ")}
            </p>
          </div>

          <button type="button" className="aeos-icon-button" onClick={onClose}>
            ×
          </button>
        </div>

        {success ? (
          <div className="aeos-success-panel">
            <h3>History imported</h3>
            <p>
              Historical Session created
              {success.transcriptImported
                ? " and transcript attached to Learning Intake."
                : "."}
            </p>

            {success.transcriptImported ? (
              <p>
                The transcript is now ready for manual or automatic Pen-E analysis.
              </p>
            ) : null}

            <button type="button" className="aeos-button-primary" onClick={onClose}>
              Done
            </button>
          </div>
        ) : (
          <form className="aeos-form" onSubmit={submit}>
            <div className="history-import-mode">
              <button
                type="button"
                className={mode === "session" ? "active" : ""}
                onClick={() => setMode("session")}
              >
                Historical Session
              </button>

              <button
                type="button"
                className={mode === "transcript" ? "active" : ""}
                onClick={() => setMode("transcript")}
              >
                Session + Transcript
              </button>
            </div>

            {mode === "transcript" ? (
              <section className="history-transcript-source">
                <label>
                  Transcript file
                  <input type="file" accept=".docx,.txt" onChange={handleFile} />
                </label>

                <div className="history-or">or</div>

                <textarea
                  rows={7}
                  placeholder="Paste transcript…"
                  value={pasteText}
                  onChange={(event) => setPasteText(event.target.value)}
                />

                <button
                  type="button"
                  className="aeos-button-secondary"
                  disabled={working || !pasteText.trim()}
                  onClick={parsePaste}
                >
                  Parse Pasted Transcript
                </button>

                {parsed ? (
                  <div className="history-detected">
                    <strong>Transcript detected</strong>
                    <span>Date: {parsed.metadata.detected_date || "Not detected"}</span>
                    <span>
                      Duration: {parsed.metadata.detected_duration || "Not detected"}
                    </span>
                    <span>
                      Speakers:{" "}
                      {parsed.metadata.detected_speakers.join(", ") || "Not detected"}
                    </span>
                  </div>
                ) : null}
              </section>
            ) : null}

            <label>
              Offering
              <select
                value={form.offeringId}
                onChange={(event) => field("offeringId", event.target.value)}
                required
              >
                <option value="">Choose Offering</option>
                {availableOfferings.map((item) => (
                  <option key={item.enrolment_id} value={item.offering_id}>
                    {item.offering?.offering_name || item.offering_id}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Historical date & start time
              <input
                type="datetime-local"
                value={form.startLocal}
                onChange={(event) => field("startLocal", event.target.value)}
                required
              />
            </label>

            <label>
              Duration
              <select
                value={form.durationMinutes}
                onChange={(event) =>
                  field("durationMinutes", Number(event.target.value))
                }
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={75}>75 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>2 hours</option>
              </select>
            </label>

            <label>
              Attendance
              <select
                value={form.attendanceStatus}
                onChange={(event) =>
                  field("attendanceStatus", event.target.value)
                }
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="partial">Partial</option>
                <option value="no_show">No-show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>

            <label>
              Session title
              <input
                value={form.sessionTitle}
                onChange={(event) => field("sessionTitle", event.target.value)}
                placeholder="Optional"
              />
            </label>

            <label>
              Internal history note
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => field("notes", event.target.value)}
              />
            </label>

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
                disabled={
                  working ||
                  !form.offeringId ||
                  !form.startLocal ||
                  (mode === "transcript" && !parsed)
                }
              >
                {working ? "Importing…" : "Import History"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
