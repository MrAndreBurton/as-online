import { useState } from "react";
import {
  cancelGoogleSession,
  syncGoogleSession,
} from "../../lib/calendarSessions";
import {
  syncRecurringSeriesMetadata,
} from "../../lib/recurringCalendar";

export default function CalendarSyncPanel({ session, onChanged }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function refresh() {
    setWorking(true);
    setError("");
    setMessage("");

    try {
      await syncGoogleSession(session.session_id);
      setMessage("Google Calendar sync refreshed.");
      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function updateRecurringMetadata() {
    setWorking(true);
    setError("");
    setMessage("");

    try {
      const result = await syncRecurringSeriesMetadata(
        session.series_id
      );

      setMessage(
        `Google Calendar details updated: ${result.title}`
      );

      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  async function cancel() {
    if (
      !window.confirm(
        "Cancel this session and remove its Google Calendar event?"
      )
    ) {
      return;
    }

    setWorking(true);
    setError("");
    setMessage("");

    try {
      await cancelGoogleSession(session.session_id);
      setMessage("Session cancelled and Calendar updated.");
      await onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="portal-card calendar-sync-card">
      <div className="aeos-section-heading">
        <div>
          <p className="portal-eyebrow">
            Google Calendar
          </p>
          <h3>Calendar Sync</h3>
        </div>

        <span className="status-pill">
          {session.google_sync_status || "not_synced"}
        </span>
      </div>

      <dl className="session-details">
        <div>
          <dt>Calendar</dt>
          <dd>
            {session.google_event_html_link ? (
              <a
                href={session.google_event_html_link}
                target="_blank"
                rel="noreferrer"
              >
                Open event
              </a>
            ) : (
              "Not linked"
            )}
          </dd>
        </div>

        <div>
          <dt>Google Meet</dt>
          <dd>
            {session.google_meet_url ? (
              <a
                href={session.google_meet_url}
                target="_blank"
                rel="noreferrer"
              >
                Join Meet
              </a>
            ) : (
              session.google_conference_status ||
              "Not available"
            )}
          </dd>
        </div>

        <div>
          <dt>Last synced</dt>
          <dd>
            {session.google_synced_at
              ? new Date(
                  session.google_synced_at
                ).toLocaleString()
              : "Not yet"}
          </dd>
        </div>

        <div>
          <dt>Timezone</dt>
          <dd>
            {session.calendar_timezone ||
              "America/Port_of_Spain"}
          </dd>
        </div>
      </dl>

      {session.google_sync_error ? (
        <div className="portal-alert">
          {session.google_sync_error}
        </div>
      ) : null}

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="aeos-success">
          {message}
        </div>
      ) : null}

      <div className="calendar-sync-actions">
        {session.google_calendar_event_id &&
        session.google_sync_status !== "cancelled" ? (
          <button
            className="aeos-button-secondary"
            type="button"
            onClick={refresh}
            disabled={working}
          >
            Refresh Google Sync
          </button>
        ) : null}

        {session.series_id &&
        session.google_recurring_event_id &&
        session.google_sync_status !== "cancelled" ? (
          <button
            className="aeos-button-secondary"
            type="button"
            onClick={updateRecurringMetadata}
            disabled={working}
          >
            Update Google Calendar Details
          </button>
        ) : null}

        {session.session_status !== "cancelled" ? (
          <button
            className="calendar-danger-button"
            type="button"
            onClick={cancel}
            disabled={working}
          >
            Cancel Session
          </button>
        ) : null}
      </div>
    </section>
  );
}


