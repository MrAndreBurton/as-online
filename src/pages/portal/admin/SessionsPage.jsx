import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  fetchAdminSessions,
  fetchSessionOfferingOptions,
  fetchSessionStudentOptions,
} from "../../../lib/sessionWorkspace";

import "../../../styles/sessionWorkspace.css";

const PAGE_SIZE = 25;

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

function formatDateTime(value) {
  if (!value) return "Not scheduled";

  return new Date(value).toLocaleString(
    undefined,
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

function statusLabel(status) {
  switch (status) {
    case "in_progress":
      return "In progress";

    case "no_show":
      return "No-show";

    case "scheduled":
      return "Scheduled";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return status || "Unknown";
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] =
    useState([]);

  const [total, setTotal] =
    useState(0);

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchInput, setSearchInput] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [studentFilter, setStudentFilter] =
    useState("all");

  const [offeringFilter, setOfferingFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("all");

  const [studentOptions, setStudentOptions] =
    useState([]);

  const [offeringOptions, setOfferingOptions] =
    useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result =
          await fetchAdminSessions({
            page,
            pageSize: PAGE_SIZE,
            status: statusFilter,
            studentId: studentFilter,
            offeringId: offeringFilter,
            dateFilter,
            search,
          });

        if (cancelled) return;

        setSessions(
          result.sessions
        );

        setTotal(
          result.total
        );
      } catch (err) {
        if (cancelled) return;

        setError(
          err.message ||
            "Unable to load sessions."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [
    page,
    search,
    statusFilter,
    studentFilter,
    offeringFilter,
    dateFilter,
  ]);

useEffect(() => {
  let cancelled = false;

  async function loadFilterOptions() {
    try {
      const [
        students,
        offerings,
      ] = await Promise.all([
        fetchSessionStudentOptions(),
        fetchSessionOfferingOptions(),
      ]);

      if (cancelled) return;

      setStudentOptions(students);
      setOfferingOptions(offerings);
    } catch (err) {
      if (cancelled) return;

      console.error(
        "Unable to load session filter options:",
        err
      );
    }
  }

  loadFilterOptions();

  return () => {
    cancelled = true;
  };
}, []);

  /*
   * Debounce search so AEOS does not query
   * Supabase for every keystroke.
   */
  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setPage(1);
        setSearch(
          searchInput.trim()
        );
      },
      350
    );

    return () =>
      window.clearTimeout(timer);
  }, [searchInput]);

  const totalPages =
    Math.max(
      1,
      Math.ceil(total / PAGE_SIZE)
    );

  const firstResult =
    total === 0
      ? 0
      : (page - 1) * PAGE_SIZE + 1;

  const lastResult =
    Math.min(
      page * PAGE_SIZE,
      total
    );

  const filtersActive =
    searchInput.trim() ||
    statusFilter !== "all" ||
    studentFilter !== "all" ||
    offeringFilter !== "all" ||
    dateFilter !== "all";

  function resetToFirstPage(setter, value) {
    setPage(1);
    setter(value);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("all");
    setStudentFilter("all");
    setOfferingFilter("all");
    setDateFilter("all");
    setPage(1);
  }

  return (
    <>
      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Admin / Tutor
          </p>

          <h2>Sessions</h2>

          <p>
            Open a tutoring session to
            manage teaching records and
            transcript intake.
          </p>
        </div>
      </section>

      <section className="portal-card">
        <div className="session-table-toolbar">
          <div className="session-search">
            <input
              type="search"
              placeholder="Search student, offering or session…"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
            />
          </div>

          <div className="session-filters">
            <select
              value={statusFilter}
              onChange={(event) =>
                resetToFirstPage(
                  setStatusFilter,
                  event.target.value
                )
              }
            >
              <option value="all">
                All statuses
              </option>

              <option value="scheduled">
                Scheduled
              </option>

              <option value="in_progress">
                In progress
              </option>

              <option value="completed">
                Completed
              </option>

              <option value="no_show">
                No-show
              </option>

              <option value="cancelled">
                Cancelled
              </option>
            </select>

            <select
              value={studentFilter}
              onChange={(event) =>
                resetToFirstPage(
                  setStudentFilter,
                  event.target.value
                )
              }
            >
              <option value="all">
                All students
              </option>

              {studentOptions.map((student) => (
                <option
                  key={student.id}
                  value={student.id}
                >
                  {student.name}
                </option>
              ))}
            </select>

            <select
              value={offeringFilter}
              onChange={(event) =>
                resetToFirstPage(
                  setOfferingFilter,
                  event.target.value
                )
              }
            >
              <option value="all">
                All offerings
              </option>

              {offeringOptions.map((offering) => (
                <option
                  key={offering.id}
                  value={offering.id}
                >
                  {offering.name}
                </option>
              ))}
            </select>

            <select
              value={dateFilter}
              onChange={(event) =>
                resetToFirstPage(
                  setDateFilter,
                  event.target.value
                )
              }
            >
              <option value="all">
                All dates
              </option>

              <option value="today">
                Today
              </option>

              <option value="upcoming">
                Upcoming
              </option>

              <option value="past">
                Past
              </option>
            </select>
          </div>

          <div className="session-toolbar-meta">
            <span>
              {total
                ? `Showing ${firstResult}–${lastResult} of ${total} sessions`
                : "0 sessions"}
            </span>

            {filtersActive ? (
              <button
                type="button"
                className="session-clear-filters"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="portal-alert">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="portal-loading">
            Loading sessions…
          </div>
        ) : sessions.length ? (
          <>
            <div className="session-table-wrap">
              <table className="session-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Student</th>
                    <th>Offering</th>
                    <th>Session</th>
                    <th>Status</th>
                    <th aria-label="Open session" />
                  </tr>
                </thead>

                <tbody>
                  {sessions.map(
                    (session) => (
                      <tr
                        key={
                          session.session_id
                        }
                      >
                        <td className="session-date-cell">
                          {formatDateTime(
                            session.scheduled_start_at
                          )}
                        </td>

                        <td>
                          <strong>
                            {studentName(
                              session.student
                            )}
                          </strong>
                        </td>

                        <td>
                          {session.offering
                            ?.offering_name ||
                            "Offering unavailable"}
                        </td>

                        <td>
                          {session.session_title ||
                            "Tutoring Session"}
                        </td>

                        <td>
                          <span
                            className={`status-pill ${
                              session.session_status ||
                              ""
                            }`}
                          >
                            {statusLabel(
                              session.session_status
                            )}
                          </span>
                        </td>

                        <td className="session-open-cell">
                          <Link
                            to={`/portal/admin/sessions/${session.session_id}`}
                            className="session-open-link"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="session-pagination">
              <button
                type="button"
                className="aeos-button-secondary"
                disabled={
                  page <= 1 ||
                  loading
                }
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                  )
                }
              >
                Previous
              </button>

              <span>
                Page {page} of{" "}
                {totalPages}
              </span>

              <button
                type="button"
                className="aeos-button-secondary"
                disabled={
                  page >= totalPages ||
                  loading
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      totalPages,
                      current + 1
                    )
                  )
                }
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div className="aeos-empty-state">
            <h3>
              No matching sessions
            </h3>

            <p>
              Adjust the filters or
              search criteria to view
              other sessions.
            </p>

            {filtersActive ? (
              <button
                type="button"
                className="aeos-button-secondary"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}


