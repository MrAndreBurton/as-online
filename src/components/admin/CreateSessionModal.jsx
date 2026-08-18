import { useMemo, useState } from "react";
import { scheduleAeosSession } from "../../lib/calendarSessions";
import { createRecurringSeries } from "../../lib/recurringCalendar";

function addMinutes(localValue, minutes) {
  const d = new Date(localValue);
  d.setMinutes(d.getMinutes() + Number(minutes));
  return d.toISOString();
}

export default function CreateSessionModal({
  open,
  onClose,
  studentUserId,
  studentName,
  enrolments,
  onCreated,
}) {
  const activeEnrolments = useMemo(
    () => enrolments.filter((item) => item.status === "active"),
    [enrolments]
  );

  const [form, setForm] = useState({
    offeringId: "",
    startLocal: "",
    durationMinutes: 60,
    sessionTitle: "",
    recurring: false,
    recurrenceEndDate: "",
  });

  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);

  if (!open) return null;

  function field(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setWorking(true);
    setError("");
    setSuccess(null);

    try {
      const startTime = new Date(form.startLocal).toISOString();

      let result;

      if (form.recurring) {
        result = await createRecurringSeries({
          studentUserId,
          offeringId: form.offeringId,
          sessionTitle: form.sessionTitle,
          startTime,
          durationMinutes: Number(form.durationMinutes),
          endDate: form.recurrenceEndDate,
          timezone: "America/Port_of_Spain",
        });
      } else {
        result = await scheduleAeosSession({
          studentUserId,
          offeringId: form.offeringId,
          sessionTitle: form.sessionTitle,
          startTime,
          endTime: addMinutes(form.startLocal, form.durationMinutes),
          timezone: "America/Port_of_Spain",
        });
      }

      setSuccess(result);
      await onCreated?.();
    } catch (err) {
      setError(err.message || "Unable to schedule session.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="aeos-modal-backdrop">
      <div className="aeos-modal" role="dialog" aria-modal="true">
        <div className="aeos-modal-header">
          <div>
            <p className="portal-eyebrow">AEOS Calendar</p>
            <h2>Schedule Session</h2>
            <p>{studentName}</p>
          </div>

          <button
            className="aeos-icon-button"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="calendar-success-panel">
            <h3>
              {form.recurring
                ? "Recurring sessions scheduled"
                : "Session scheduled"}
            </h3>

            {form.recurring ? (
              <>
                <p>
                  Google Calendar recurrence created and AEOS materialized{" "}
                  {success.reconciliation?.instanceCount ?? 0} session
                  instances.
                </p>
                <p>
                  Series ID: <code>{success.seriesId}</code>
                </p>
              </>
            ) : (
              <p>
                AEOS created the Session and synced it to Google Calendar.
              </p>
            )}

            <button
              className="aeos-button-primary"
              type="button"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form className="aeos-form" onSubmit={submit}>
            <label>
              Offering
              <select
                value={form.offeringId}
                onChange={(e) => field("offeringId", e.target.value)}
                required
              >
                <option value="">Choose active Offering</option>
                {activeEnrolments.map((item) => (
                  <option
                    key={item.enrolment_id}
                    value={item.offering_id}
                  >
                    {item.offering?.offering_name || item.offering_id}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Date & start time
              <input
                type="datetime-local"
                value={form.startLocal}
                onChange={(e) => field("startLocal", e.target.value)}
                required
              />
            </label>

            <label>
              Duration
              <select
                value={form.durationMinutes}
                onChange={(e) =>
                  field("durationMinutes", Number(e.target.value))
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
              Session title (optional)
              <input
                value={form.sessionTitle}
                onChange={(e) => field("sessionTitle", e.target.value)}
              />
            </label>

            <label className="recurring-toggle">
              <input
                type="checkbox"
                checked={form.recurring}
                onChange={(e) => field("recurring", e.target.checked)}
              />
              Repeat weekly
            </label>

            {form.recurring ? (
              <label>
                Repeat until
                <input
                  type="date"
                  value={form.recurrenceEndDate}
                  onChange={(e) =>
                    field("recurrenceEndDate", e.target.value)
                  }
                  required
                />
              </label>
            ) : null}

            <div className="calendar-auto-note">
              {form.recurring
                ? "AEOS will create one weekly Google Calendar series, invite the student, create Meet access, and track each occurrence separately."
                : "AEOS will create the Google Calendar event, student invitation and Google Meet automatically."}
            </div>

            {error ? <div className="portal-alert">{error}</div> : null}

            <div className="aeos-modal-actions">
              <button
                className="aeos-button-secondary"
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                className="aeos-button-primary"
                type="submit"
                disabled={
                  working ||
                  !form.offeringId ||
                  !form.startLocal ||
                  (form.recurring && !form.recurrenceEndDate)
                }
              >
                {working
                  ? "Scheduling…"
                  : form.recurring
                  ? "Schedule Recurring Sessions"
                  : "Schedule Session"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
