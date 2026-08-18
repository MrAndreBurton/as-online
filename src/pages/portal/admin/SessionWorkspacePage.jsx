import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import SessionStatusControls from "../../../components/session/SessionStatusControls";
import CalendarSyncPanel from "../../../components/session/CalendarSyncPanel";
import PrivateNotesPanel from "../../../components/session/PrivateNotesPanel";
import ResourcesPanel from "../../../components/session/ResourcesPanel";
import HomeworkPanel from "../../../components/session/HomeworkPanel";
import TranscriptIntakePanel from "../../../components/session/TranscriptIntakePanel";

import {
  fetchSessionWorkspace,
  updateSessionDetails,
} from "../../../lib/sessionWorkspace";

import "../../../styles/sessionWorkspace.css";

import SeriesReconcilePanel from "../../../components/session/SeriesReconcilePanel";

const studentName = (student) =>
  student?.display_name ||
  [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
  "Student";

export default function SessionWorkspacePage() {
  const { sessionId } = useParams();

  const [data, setData] = useState(null);

  const [details, setDetails] = useState({
    sessionTitle: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setError("");

    try {
      const next = await fetchSessionWorkspace(sessionId);

      setData(next);

      setDetails({
        sessionTitle: next.session.session_title || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveDetails(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateSessionDetails(sessionId, {
        sessionTitle: details.sessionTitle,
      });

      setMessage("Session details updated.");

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="portal-loading">Loading session…</div>;
  }

  if (!data) {
    return (
      <div className="portal-alert">
        {error || "Session not found."}
      </div>
    );
  }

  const { session } = data;

  const name = studentName(session.student);

  return (
    <>
      <Link
        className="aeos-back-link"
        to="/portal/admin/sessions"
      >
        ← Back to Sessions
      </Link>

      <section className="session-hero">
        <div>
          <p className="portal-eyebrow">
            AEOS Session Workspace
          </p>

          <h2>
            {session.session_title || "Tutoring Session"}
          </h2>

          <p>
            <strong>{name}</strong>
            {" · "}
            {session.offering?.offering_name}
          </p>

          <p className="session-hero-meta">
            {session.scheduled_start_at
              ? new Date(
                  session.scheduled_start_at
                ).toLocaleString()
              : "Not scheduled"}

            {session.offering?.subject?.subject_name
              ? ` · ${session.offering.subject.subject_name}`
              : ""}
          </p>
        </div>

        <span className="status-pill session-status-pill">
          {session.session_status}
        </span>
      </section>

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

      <SessionStatusControls
        sessionId={sessionId}
        currentStatus={session.session_status}
        onChanged={load}
      />

      <CalendarSyncPanel
        session={session}
        onChanged={load}
      />

      <SeriesReconcilePanel
        session={session}
        onChanged={load}
      />

      <div className="portal-grid portal-grid-2">
        <section className="portal-card">
          <p className="portal-eyebrow">
            Context
          </p>

          <h3>
            Student & Offering
          </h3>

          <dl className="session-details">
            <div>
              <dt>
                Student
              </dt>

              <dd>
                {name}
              </dd>
            </div>

            <div>
              <dt>
                School
              </dt>

              <dd>
                {session.student?.school || "Not recorded"}
              </dd>
            </div>

            <div>
              <dt>
                Offering
              </dt>

              <dd>
                {session.offering?.offering_name}
              </dd>
            </div>

            <div>
              <dt>
                Subject
              </dt>

              <dd>
                {session.offering?.subject?.subject_name}
              </dd>
            </div>
          </dl>
        </section>

        <section className="portal-card">
          <p className="portal-eyebrow">
            Session Setup
          </p>

          <h3>
            Details
          </h3>

          <form
            className="session-stack"
            onSubmit={saveDetails}
          >
            <label>
              Session title

              <input
                value={details.sessionTitle}
                onChange={(event) =>
                  setDetails((current) => ({
                    ...current,
                    sessionTitle: event.target.value,
                  }))
                }
                placeholder="Optional session title"
              />
            </label>

            <button
              type="submit"
              className="aeos-button-primary"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : "Save Session Details"}
            </button>
          </form>
        </section>
      </div>

      <div className="portal-grid portal-grid-2">
        <PrivateNotesPanel
          sessionId={sessionId}
          notes={data.notes}
          onChanged={load}
        />

        <ResourcesPanel
          sessionId={sessionId}
          resources={data.resources}
          onChanged={load}
        />
      </div>

      <HomeworkPanel
        sessionId={sessionId}
        homework={data.homework}
        onChanged={load}
      />

      <TranscriptIntakePanel
        sessionId={sessionId}
        transcripts={data.transcripts}
        onChanged={load}
      />
    </>
  );
}

