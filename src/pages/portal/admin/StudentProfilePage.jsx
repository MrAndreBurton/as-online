import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CreateSessionModal from "../../../components/admin/CreateSessionModal";
import EnrolmentControls from "../../../components/admin/EnrolmentControls";
import {
  fetchAdminStudentById,
  setStudentActive,
  updateStudentProfile,
} from "../../../lib/adminStudents";
import "../../../styles/adminStudents.css";

function studentName(student) {
  return (
    student?.display_name ||
    [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
    "Student"
  );
}

export default function StudentProfilePage() {
  const { studentUserId } = useParams();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sessionOpen, setSessionOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const next = await fetchAdminStudentById(studentUserId);
      setData(next);
      setForm({
        first_name: next.student.first_name || "",
        last_name: next.student.last_name || "",
        display_name: next.student.display_name || "",
        phone: next.student.phone || "",
        date_of_birth: next.student.date_of_birth || "",
        school: next.student.school || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentUserId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeEnrolments = useMemo(
    () => data?.enrolments?.filter((e) => e.status === "active") ?? [],
    [data]
  );

  function field(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await updateStudentProfile(studentUserId, form);
      setMessage("Student profile updated.");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive() {
    setSaving(true);
    setError("");
    try {
      await setStudentActive(studentUserId, !data.profile.is_active);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="portal-loading">Loading student…</div>;
  if (error && !data) return <div className="portal-alert">{error}</div>;

  const name = studentName(data.student);

  return (
    <>
      <Link className="aeos-back-link" to="/portal/admin/students">
        ← Back to Students
      </Link>

      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">Student Profile</p>
          <h2>{name}</h2>
          <p>{data.profile.email}</p>
        </div>

        <div className="aeos-heading-actions">
          <button
            type="button"
            className="aeos-button-secondary"
            onClick={toggleActive}
            disabled={saving}
          >
            {data.profile.is_active ? "Deactivate" : "Reactivate"}
          </button>

          <button
            type="button"
            className="aeos-button-primary"
            onClick={() => setSessionOpen(true)}
            disabled={!activeEnrolments.length}
          >
            Create Session
          </button>
        </div>
      </section>

      {error ? <div className="portal-alert">{error}</div> : null}
      {message ? <div className="aeos-success">{message}</div> : null}

      <div className="portal-grid portal-grid-2">
        <section className="portal-card">
          <p className="portal-eyebrow">Client Information</p>
          <h3>Profile</h3>

          <form className="aeos-form" onSubmit={saveProfile}>
            <div className="aeos-form-grid">
              <label>
                First name
                <input
                  value={form.first_name}
                  onChange={(e) => field("first_name", e.target.value)}
                />
              </label>
              <label>
                Last name
                <input
                  value={form.last_name}
                  onChange={(e) => field("last_name", e.target.value)}
                />
              </label>
              <label className="aeos-field-full">
                Display name
                <input
                  value={form.display_name}
                  onChange={(e) => field("display_name", e.target.value)}
                />
              </label>
              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => field("phone", e.target.value)}
                />
              </label>
              <label>
                Date of birth
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => field("date_of_birth", e.target.value)}
                />
              </label>
              <label className="aeos-field-full">
                School
                <input
                  value={form.school}
                  onChange={(e) => field("school", e.target.value)}
                />
              </label>
            </div>

            <button
              type="submit"
              className="aeos-button-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </form>
        </section>

        <section className="portal-card">
          <p className="portal-eyebrow">Account</p>
          <h3>AEOS Access</h3>
          <dl className="aeos-details">
            <div>
              <dt>Email</dt>
              <dd>{data.profile.email}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{data.profile.app_role}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{data.profile.is_active ? "Active" : "Inactive"}</dd>
            </div>
          </dl>
          <p className="aeos-note">
            Email changes are not edited here because email belongs to Supabase
            Auth, not the student profile.
          </p>
        </section>
      </div>

      <EnrolmentControls
        studentUserId={studentUserId}
        enrolments={data.enrolments}
        offerings={data.offerings}
        onChanged={load}
      />

      <section className="portal-card">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">Tutoring</p>
            <h3>Recent Sessions</h3>
          </div>
          <button
            type="button"
            className="aeos-button-primary"
            disabled={!activeEnrolments.length}
            onClick={() => setSessionOpen(true)}
          >
            Create Session
          </button>
        </div>

        {data.sessions.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Offering</th>
                  <th>Session</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session) => (
                  <tr key={session.session_id}>
                    <td>
                      {session.scheduled_start_at
                        ? new Date(session.scheduled_start_at).toLocaleString()
                        : "—"}
                    </td>
                    <td>
                      {session.offering?.offering_name ||
                        session.offering_id}
                    </td>
                    <td>{session.session_title || "Tutoring Session"}</td>
                    <td>
                      <span className="status-pill">
                        {session.session_status}
                      </span>
                    </td>
        
                    <td>
                      <Link
                        to={`/portal/admin/sessions/${session.session_id}`}
                        className="aeos-back-link"
                      >
                        Open Session
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No sessions recorded yet.</p>
        )}
      </section>

      <CreateSessionModal
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        studentUserId={studentUserId}
        studentName={name}
        enrolments={data.enrolments}
        onCreated={load}
      />
    </>
  );
}
