import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import CreateSessionModal from "../../../components/admin/CreateSessionModal";
import EnrolmentControls from "../../../components/admin/EnrolmentControls";

import {
  fetchAdminStudentById,
  setStudentActive,
  updateStudentProfile,
  inviteExistingStudentToPortal,
} from "../../../lib/adminStudents";

import ImportStudentHistoryModal from "../../../components/history/ImportStudentHistoryModal";
import "../../../styles/historyIntake.css";

import "../../../styles/adminStudents.css";

function studentName(student) {
  return (
    student?.display_name ||
    [
      student?.first_name,
      student?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Student"
  );
}

export default function StudentProfilePage() {
  const { studentId } = useParams();

  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [sessionOpen, setSessionOpen] =
    useState(false);

const [invitingPortal, setInvitingPortal] = useState(false);
const [resendInviteOpen, setResendInviteOpen] = useState(false);

const [portalMessage, setPortalMessage] = useState("");

const [historyOpen, setHistoryOpen] = useState(false);

const [invitePortalOpen, setInvitePortalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const next =
        await fetchAdminStudentById(
          studentId
        );

      setData(next);

      setForm({
        first_name:
          next.student.first_name || "",

        last_name:
          next.student.last_name || "",

        display_name:
          next.student.display_name || "",

        email:
          next.student.email || "",

        phone:
          next.student.phone || "",

        date_of_birth:
          next.student.date_of_birth || "",

        school:
          next.student.school || "",

        notes:
          next.student.notes || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeEnrolments = useMemo(
    () =>
      data?.enrolments?.filter(
        (enrolment) =>
          enrolment.status === "active"
      ) ?? [],
    [data]
  );

  function field(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function saveProfile(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateStudentProfile(
        studentId,
        form
      );

      setMessage(
        "Student record updated."
      );

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

async function inviteToPortal() {
  if (!student.email) {
    setError("Add an email address before sending a portal invite.");
    return;
  }

  setInvitingPortal(true);
  setError("");
  setPortalMessage("");

  try {
    await inviteExistingStudentToPortal(student.student_id);

    setPortalMessage("Portal invitation sent.");

    setInvitePortalOpen(false);

    await load();
  } catch (err) {
    setError(err.message);
  } finally {
    setInvitingPortal(false);
  }
}

  async function toggleActive() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const nextActive =
        data.student.student_status !==
        "active";

      await setStudentActive(
        studentId,
        nextActive
      );

      setMessage(
        nextActive
          ? "Student reactivated."
          : "Student deactivated."
      );

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="portal-loading">
        Loading student…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="portal-alert">
        {error}
      </div>
    );
  }

  if (!data?.student || !form) {
    return (
      <div className="portal-alert">
        Student not found.
      </div>
    );
  }

  const { student } = data;

  const name = studentName(student);

  const hasPortalAccount =
    Boolean(student.portal_user_id);

  const portalActive =
    student.portal_status === "active";

  return (
    <>
      <Link
        className="aeos-back-link"
        to="/portal/admin/students"
      >
        ← Back to Students
      </Link>

      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Student Profile
          </p>

          <h2>{name}</h2>

          <p>
            {student.email ||
              "No email recorded"}
          </p>
        </div>

        <div className="aeos-heading-actions">
          <button
            type="button"
            className="aeos-button-secondary"
            onClick={toggleActive}
            disabled={saving}
          >
            {student.student_status ===
            "active"
              ? "Deactivate"
              : "Reactivate"}
          </button>

          <button
            type="button"
            className="aeos-button-secondary"
            onClick={() => setHistoryOpen(true)}
           >
             Import History
          </button>

          <button
            type="button"
            className="aeos-button-primary"
            onClick={() =>
              setSessionOpen(true)
            }
            disabled={
              !activeEnrolments.length}
          >
            Create Session
          </button>
        </div>
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

      <div className="portal-grid portal-grid-2">
        <section className="portal-card">
          <p className="portal-eyebrow">
            Student Information
          </p>

          <h3>Profile</h3>

          <form
            className="aeos-form"
            onSubmit={saveProfile}
          >
            <div className="aeos-form-grid">
              <label>
                First name
                <input
                  value={
                    form.first_name
                  }
                  onChange={(event) =>
                    field(
                      "first_name",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Last name
                <input
                  value={
                    form.last_name
                  }
                  onChange={(event) =>
                    field(
                      "last_name",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="aeos-field-full">
                Display name
                <input
                  value={
                    form.display_name
                  }
                  onChange={(event) =>
                    field(
                      "display_name",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="aeos-field-full">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    field(
                      "email",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Phone
                <input
                  value={form.phone}
                  onChange={(event) =>
                    field(
                      "phone",
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Date of birth
                <input
                  type="date"
                  value={
                    form.date_of_birth
                  }
                  onChange={(event) =>
                    field(
                      "date_of_birth",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="aeos-field-full">
                School
                <input
                  value={form.school}
                  onChange={(event) =>
                    field(
                      "school",
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="aeos-field-full">
                Internal notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    field(
                      "notes",
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            <button
              type="submit"
              className="aeos-button-primary"
              disabled={saving}
            >
              {saving
                ? "Saving…"
                : "Save Student"}
            </button>
          </form>
        </section>

        <section className="portal-card">
  <p className="portal-eyebrow">
    Portal Access
  </p>

  <h3>AEOS Account</h3>

  <dl className="aeos-details">
    <div>
      <dt>Student status</dt>
      <dd>{student.student_status}</dd>
    </div>

    <div>
      <dt>Portal status</dt>
      <dd>
        {student.portal_status === "not_invited"
          ? "Not invited"
          : student.portal_status === "invited"
          ? "Invited"
          : student.portal_status === "active"
          ? "Active"
          : student.portal_status === "disabled"
          ? "Disabled"
          : student.portal_status}
      </dd>
    </div>

    <div>
      <dt>Portal account</dt>
      <dd>
        {student.portal_user_id
          ? "Linked"
          : "None"}
      </dd>
    </div>

    <div>
      <dt>Email</dt>
      <dd>
        {student.email ||
          "Not recorded"}
      </dd>
    </div>
  </dl>

  {student.portal_status === "not_invited" ? (
    <>
      <p className="aeos-note">
        This student does not yet have portal access.
      </p>

      <button
        type="button"
        className="aeos-button-primary"
        onClick={() =>
          setInvitePortalOpen(true)
        }
        disabled={!student.email}
      >
        Invite to Portal
      </button>

      {!student.email ? (
        <p className="aeos-note">
          Add an email address before sending an invite.
        </p>
      ) : null}
    </>
  ) : null}

  {student.portal_status === "invited" ? (
    <>
      <p className="aeos-note">
        A portal invitation is pending for this student.
      </p>

      <button
        type="button"
        className="aeos-button-secondary"
        onClick={() =>
          setResendInviteOpen(true)
        }
      >
        Resend Invite
      </button>
    </>
  ) : null}

  {student.portal_status === "active" ? (
    <>
      <div className="aeos-success">
        Portal Active
      </div>

      <p className="aeos-note">
        This student has an active AEOS portal account.
      </p>
    </>
  ) : null}

  {student.portal_status === "disabled" ? (
    <>
      <p className="aeos-note">
        Portal access has been disabled.
      </p>

      <button
        type="button"
        className="aeos-button-primary"
        onClick={reactivatePortal}
        disabled={saving}
      >
        {saving
          ? "Reactivating…"
          : "Reactivate Portal"}
      </button>
    </>
  ) : null}
</section>
      </div>

      <EnrolmentControls
  studentId={student.student_id}
  studentUserId={student.portal_user_id}
  enrolments={data.enrolments}
  offerings={data.offerings}
  onChanged={load}
/>


      <section className="portal-card">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">
              Tutoring
            </p>

            <h3>Recent Sessions</h3>
          </div>

          <button
            type="button"
            className="aeos-button-primary"
            disabled={
              !activeEnrolments.length}
            onClick={() =>
              setSessionOpen(true)
            }
          >
            Create Session
          </button>
        </div>

        {data.sessions?.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Offering</th>
                  <th>Session</th>
                  <th>Origin</th>
                  <th>Attendance</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {data.sessions.map(
                  (session) => (
                    <tr
                      key={
                        session.session_id
                      }
                    >
                      <td>
                        {session.scheduled_start_at
                          ? new Date(
                              session.scheduled_start_at
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        {session.offering
                          ?.offering_name ||
                          session.offering_id}
                      </td>

                      <td>
                        {session.session_title ||
                          "Tutoring Session"}
                      </td>

                      <td>
                        {session.session_origin ||
                          "scheduled"}
                      </td>

                      <td>
                        {session.attendance_status ||
                          "unknown"}
                      </td>

                      <td>
                        <span className="status-pill">
                          {
                            session.session_status
                          }
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
                  )
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="aeos-empty-state">
            <h3>
              No sessions recorded yet
            </h3>

            <p>
              Historical and future
              sessions will appear here.
            </p>
          </div>
        )}
      </section>

     <CreateSessionModal
  open={sessionOpen}
  onClose={() =>
    setSessionOpen(false)
  }
  studentId={
    student.student_id
  }
  studentUserId={
    student.portal_user_id
  }
  studentEmail={
    student.email
  }
  studentName={name}
  enrolments={
    data.enrolments
  }
  onCreated={load}
/>

<ImportStudentHistoryModal
  open={historyOpen}
  onClose={() => setHistoryOpen(false)}
  student={student}
  enrolments={data.enrolments}
  onImported={load}
/>

{invitePortalOpen ? (
  <div className="aeos-modal-backdrop">
    <div
      className="aeos-modal"
      role="dialog"
      aria-modal="true"
    >
      <div className="aeos-modal-header">
        <div>
          <p className="portal-eyebrow">
            Portal Access
          </p>

          <h2>Invite to AEOS Portal</h2>
        </div>

        <button
          type="button"
          className="aeos-icon-button"
          onClick={() =>
            setInvitePortalOpen(false)
          }
        >
          ×
        </button>
      </div>

      <div className="aeos-details">
        <div>
          <dt>Student</dt>
          <dd>{name}</dd>
        </div>

        <div>
          <dt>Email</dt>
          <dd>{student.email}</dd>
        </div>
      </div>

      <p className="aeos-note">
        An invitation email will be sent to this address.
        The student will use the invitation to activate their
        AEOS portal account.
      </p>

      <div className="aeos-modal-actions">
        <button
          type="button"
          className="aeos-button-secondary"
          onClick={() =>
            setInvitePortalOpen(false)
          }
          disabled={invitingPortal}
        >
          Cancel
        </button>

        <button
          type="button"
          className="aeos-button-primary"
          onClick={inviteToPortal}
          disabled={invitingPortal}
        >
          {invitingPortal
            ? "Sending Invite…"
            : "Confirm & Send Invite"}
        </button>
      </div>
    </div>
  </div>
) : null}
    </>
  );
}

