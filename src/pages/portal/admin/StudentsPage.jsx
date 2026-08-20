import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import InviteStudentModal from "../../../components/admin/InviteStudentModal";
import { fetchAdminStudents } from "../../../lib/adminStudents";
import "../../../styles/adminStudents.css";

import AddStudentModal from "../../../components/admin/AddStudentModal";
import { fetchCanonicalStudents } from "../../../lib/studentOperations";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [addStudentOpen,setAddStudentOpen]=useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const rows = await fetchCanonicalStudents();
    setStudents(rows);
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
      student.display_name,
      student.first_name,
      student.last_name,
      student.email,
      student.school,
      student.student_status,
      student.portal_status,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(q)
      )
  );
}, [students, search]);

return (
  <>
    <section className="aeos-page-heading">
      <div>
        <p className="portal-eyebrow">
          Admin / Tutor
        </p>

        <h2>Students</h2>

        <p>
          Manage student records, Offerings, sessions and optional
          portal access.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          className="aeos-button-secondary"
          onClick={() => setInviteOpen(true)}
        >
          Invite to Portal
        </button>

        <button
          type="button"
          className="aeos-button-primary"
          onClick={() => setAddStudentOpen(true)}
        >
          Add Student
        </button>
      </div>
    </section>

    <section className="portal-card">
      <div className="aeos-student-toolbar">
        <input
          type="search"
          placeholder="Search students, email or school…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <span>
          {filtered.length} student
          {filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="portal-loading">
          Loading students…
        </div>
      ) : filtered.length ? (
        <div className="aeos-student-list">
          {filtered.map((student) => {
            const name =
              student.display_name ||
              [
                student.first_name,
                student.last_name,
              ]
                .filter(Boolean)
                .join(" ") ||
              "Student";

            return (
              <Link
                key={student.student_id}
                className="aeos-student-row"
                to={`/portal/admin/students/${student.student_id}`}
              >
                <div className="aeos-avatar">
                  {(
                    student.first_name?.[0] ||
                    name?.[0] ||
                    "?"
                  ).toUpperCase()}
                </div>

                <div className="aeos-student-primary">
                  <strong>{name}</strong>

                  <span>
                    {student.email || "No email"}
                  </span>
                </div>

                <div className="aeos-student-secondary">
                  <span>
                    {student.school ||
                      "School not recorded"}
                  </span>

                  <span>
                    {student.portal_status ===
                    "active"
                      ? "Portal active"
                      : student.portal_status ===
                        "invited"
                      ? "Portal invitation sent"
                      : student.portal_status ===
                        "disabled"
                      ? "Portal disabled"
                      : "No portal account"}
                  </span>
                </div>

                <span
                  className={`status-pill ${
                    student.student_status !==
                    "active"
                      ? "inactive"
                      : ""
                  }`}
                >
                  {student.student_status}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="aeos-empty-state">
          <h3>No students yet</h3>

          <p>
            Add your first student record. A login
            or schedule is not required.
          </p>

          <button
            type="button"
            className="aeos-button-primary"
            onClick={() =>
              setAddStudentOpen(true)
            }
          >
            Add Student
          </button>
        </div>
      )}
    </section>

    <AddStudentModal
      open={addStudentOpen}
      onClose={() =>
        setAddStudentOpen(false)
      }
      onCreated={load}
    />

    <InviteStudentModal
      open={inviteOpen}
      onClose={() => setInviteOpen(false)}
      onInvited={load}
    />
  </>
);
}

