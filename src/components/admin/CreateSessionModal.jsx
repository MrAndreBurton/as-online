import {
  useMemo,
  useState,
} from "react";

import {
  scheduleAeosSession,
} from "../../lib/calendarSessions";

import {
  createRecurringSeries,
} from "../../lib/recurringCalendar";

function addMinutes(
  localValue,
  minutes
) {
  const date =
    new Date(localValue);

  date.setMinutes(
    date.getMinutes() +
      Number(minutes)
  );

  return date.toISOString();
}

export default function CreateSessionModal({
  open,
  onClose,

  // Canonical identity
  studentId,

  // Optional legacy/Auth identity
  studentUserId = null,

  studentName,
  studentEmail = null,

  enrolments = [],

  onCreated,
}) {
  const activeEnrolments =
    useMemo(
      () =>
        enrolments.filter(
          (item) =>
            item.status ===
            "active"
        ),
      [enrolments]
    );

  const [form, setForm] =
    useState({
      offeringId: "",
      startLocal: "",
      durationMinutes: 60,
      sessionTitle: "",
      recurring: false,
      recurrenceEndDate: "",
    });

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(null);

  if (!open) {
    return null;
  }

  function field(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();

    if (!studentId) {
      setError(
        "Student record is missing."
      );

      return;
    }

    setWorking(true);
    setError("");
    setSuccess(null);

    try {
      const startTime =
        new Date(
          form.startLocal
        ).toISOString();

      const endTime =
        addMinutes(
          form.startLocal,
          form.durationMinutes
        );

      let result;

      if (form.recurring) {
        result =
          await createRecurringSeries({
            studentId,

            // May legitimately be null.
            studentUserId,

            studentEmail,

            offeringId:
              form.offeringId,

            sessionTitle:
              form.sessionTitle,

            startTime,

            durationMinutes:
              Number(
                form.durationMinutes
              ),

            endDate:
              form.recurrenceEndDate,

            timezone:
              "America/Port_of_Spain",
          });
      } else {
        result =
          await scheduleAeosSession({
            studentId,

            // May legitimately be null.
            studentUserId,

            studentEmail,

            offeringId:
              form.offeringId,

            sessionTitle:
              form.sessionTitle,

            startTime,

            endTime,

            timezone:
              "America/Port_of_Spain",
          });
      }

      setSuccess(result);

      await onCreated?.();
    } catch (err) {
      setError(
        err.message ||
          "Unable to schedule session."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="aeos-modal-backdrop">
      <div
        className="aeos-modal"
        role="dialog"
        aria-modal="true"
      >
        <div className="aeos-modal-header">
          <div>
            <p className="portal-eyebrow">
              AEOS Calendar
            </p>

            <h2>
              Schedule Session
            </h2>

            <p>{studentName}</p>

            {!studentUserId ? (
              <small>
                No portal account —
                scheduling is still
                allowed.
              </small>
            ) : null}
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
                  AEOS created the
                  recurring schedule and
                  materialized the
                  individual Session
                  instances.
                </p>

                {success
                  .reconciliation
                  ?.instanceCount !==
                undefined ? (
                  <p>
                    Sessions created:{" "}
                    {
                      success
                        .reconciliation
                        .instanceCount
                    }
                  </p>
                ) : null}

                {success.seriesId ? (
                  <p>
                    Series ID:{" "}
                    <code>
                      {
                        success.seriesId
                      }
                    </code>
                  </p>
                ) : null}
              </>
            ) : (
              <p>
                AEOS created the
                Session.
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
          <form
            className="aeos-form"
            onSubmit={submit}
          >
            <label>
              Offering

              <select
                value={
                  form.offeringId
                }
                onChange={(event) =>
                  field(
                    "offeringId",
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Choose active Offering
                </option>

                {activeEnrolments.map(
                  (item) => (
                    <option
                      key={
                        item.enrolment_id
                      }
                      value={
                        item.offering_id
                      }
                    >
                      {item.offering
                        ?.offering_name ||
                        item.offering_id}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Date & start time

              <input
                type="datetime-local"
                value={
                  form.startLocal
                }
                onChange={(event) =>
                  field(
                    "startLocal",
                    event.target.value
                  )
                }
                required
              />
            </label>

            <label>
              Duration

              <select
                value={
                  form.durationMinutes
                }
                onChange={(event) =>
                  field(
                    "durationMinutes",
                    Number(
                      event.target.value
                    )
                  )
                }
              >
                <option value={30}>
                  30 minutes
                </option>

                <option value={45}>
                  45 minutes
                </option>

                <option value={60}>
                  60 minutes
                </option>

                <option value={75}>
                  75 minutes
                </option>

                <option value={90}>
                  90 minutes
                </option>

                <option value={120}>
                  2 hours
                </option>
              </select>
            </label>

            <label>
              Session title
              (optional)

              <input
                value={
                  form.sessionTitle
                }
                onChange={(event) =>
                  field(
                    "sessionTitle",
                    event.target.value
                  )
                }
              />
            </label>

            <label className="recurring-toggle">
              <input
                type="checkbox"
                checked={
                  form.recurring
                }
                onChange={(event) =>
                  field(
                    "recurring",
                    event.target.checked
                  )
                }
              />

              Repeat weekly
            </label>

            {form.recurring ? (
              <label>
                Repeat until

                <input
                  type="date"
                  value={
                    form.recurrenceEndDate
                  }
                  onChange={(event) =>
                    field(
                      "recurrenceEndDate",
                      event.target.value
                    )
                  }
                  required
                />
              </label>
            ) : null}

            <div className="calendar-auto-note">
              {form.recurring
                ? "AEOS will create a weekly Session Series and track every occurrence individually."
                : "AEOS will create one individual Session."}
            </div>

            {!studentUserId ? (
              <div className="calendar-auto-note">
                This student has no
                portal account. That
                does not prevent
                enrolment or
                scheduling.
              </div>
            ) : null}

            {error ? (
              <div className="portal-alert">
                {error}
              </div>
            ) : null}

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
                  !studentId ||
                  !form.offeringId ||
                  !form.startLocal ||
                  (form.recurring &&
                    !form.recurrenceEndDate)
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

