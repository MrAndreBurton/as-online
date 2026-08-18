import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InviteStudentModal from "../../../components/admin/InviteStudentModal";
import { fetchAdminStudents } from "../../../lib/adminStudents";
import "../../../styles/adminStudents.css";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStudents(await fetchAdminStudents());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;

    return students.filter((student) =>
      [
        student.name,
        student.profile?.email,
        student.school,
        ...student.enrolments.map((e) => e.offering?.offering_name),
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [students, search]);

  return (
    <>
      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">Admin / Tutor</p>
          <h2>Students</h2>
          <p>
            Manage client accounts, AEOS Offerings and tutoring sessions.
          </p>
        </div>

        <button
          type="button"
          className="aeos-button-primary"
          onClick={() => setInviteOpen(true)}
        >
          Invite Student
        </button>
      </section>

      <section className="portal-card">
        <div className="aeos-student-toolbar">
          <input
            type="search"
            placeholder="Search students, email, school or Offering…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span>{filtered.length} student{filtered.length === 1 ? "" : "s"}</span>
        </div>

        {error ? <div className="portal-alert">{error}</div> : null}

        {loading ? (
          <div className="portal-loading">Loading students…</div>
        ) : filtered.length ? (
          <div className="aeos-student-list">
            {filtered.map((student) => (
              <Link
                key={student.user_id}
                className="aeos-student-row"
                to={`/portal/admin/students/${student.user_id}`}
              >
                <div className="aeos-avatar">
                  {(student.first_name?.[0] || "?").toUpperCase()}
                </div>

                <div className="aeos-student-primary">
                  <strong>{student.name}</strong>
                  <span>{student.profile?.email || "No email"}</span>
                </div>

                <div className="aeos-student-secondary">
                  <span>{student.school || "School not recorded"}</span>
                  <span>
                    {student.enrolments.length
                      ? student.enrolments
                          .map((item) => item.offering?.offering_name)
                          .filter(Boolean)
                          .join(" · ")
                      : "No active Offering"}
                  </span>
                </div>

                <span
                  className={`status-pill ${
                    student.profile?.is_active ? "" : "inactive"
                  }`}
                >
                  {student.profile?.is_active ? "Active" : "Inactive"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="aeos-empty-state">
            <h3>No students yet</h3>
            <p>Invite your first A's Online student to begin.</p>
          </div>
        )}
      </section>

      <InviteStudentModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={load}
      />
    </>
  );
}
