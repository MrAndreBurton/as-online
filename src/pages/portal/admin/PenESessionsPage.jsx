import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  fetchPenESessions,
  fetchPenESessionFilters,
} from "../../../lib/penESessions";

import "../../../styles/penESessions.css";

function displayName(row) {
  return (
    row?.display_name ||
    [
      row?.first_name,
      row?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Unknown"
  );
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(value)
    .toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
}

function formatTime(value) {
  if (!value) return "";

  return new Date(value)
    .toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
}

function formatDuration(minutes) {
  if (
    minutes === null ||
    minutes === undefined
  ) {
    return "—";
  }

  const total = Number(minutes);

  if (total < 60) {
    return `${total} min`;
  }

  const hours = Math.floor(
    total / 60
  );

  const remaining =
    total % 60;

  if (!remaining) {
    return `${hours} hr`;
  }

  return `${hours} hr ${remaining} min`;
}

function penELabel(status) {
  switch (status) {
    case "analysed":
      return "Analysed";

    case "awaiting_analysis":
      return "Awaiting Analysis";

    case "not_ready":
      return "Not Ready";

    default:
      return status || "—";
  }
}

function reviewLabel(status) {
  switch (status) {
    case "pending":
      return "Pending";

    case "reviewed":
      return "Reviewed";

    case "not_applicable":
      return "—";

    default:
      return status || "—";
  }
}

function localDayRange(mode) {
  const now = new Date();

  if (mode === "today") {
    const start =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 1
    );

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }

  if (mode === "week") {
    const start =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const day =
      start.getDay();

    const offset =
      day === 0
        ? -6
        : 1 - day;

    start.setDate(
      start.getDate() + offset
    );

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 7
    );

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }

  if (mode === "month") {
    const start =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const end =
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        1
      );

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }

  return {
    from: null,
    to: null,
  };
}

export default function PenESessionsPage() {
  const navigate =
    useNavigate();

  const [rows, setRows] =
    useState([]);

  const [filters, setFilters] =
    useState({
      students: [],
      tutors: [],
      offerings: [],
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(30);

  const [total, setTotal] =
    useState(0);

  const [pageCount, setPageCount] =
    useState(0);

  const [search, setSearch] =
    useState("");

  const [
    searchInput,
    setSearchInput,
  ] = useState("");

  const [dateMode, setDateMode] =
    useState("all");

  const [studentId, setStudentId] =
    useState("");

  const [
    tutorUserId,
    setTutorUserId,
  ] = useState("");

  const [
    offeringId,
    setOfferingId,
  ] = useState("");

  const [
    penEStatus,
    setPenEStatus,
  ] = useState("");

  const [
    reviewStatus,
    setReviewStatus,
  ] = useState("");

  const range =
    useMemo(
      () =>
        localDayRange(
          dateMode
        ),
      [dateMode]
    );

  useEffect(() => {
    fetchPenESessionFilters()
      .then(setFilters)
      .catch((err) =>
        setError(err.message)
      );
  }, []);

  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await fetchPenESessions({
            page,
            pageSize,
            search,
            dateFrom:
              range.from,
            dateTo:
              range.to,
            studentId:
              studentId || null,
            tutorUserId:
              tutorUserId ||
              null,
            offeringId:
              offeringId || null,
            sessionStatus:
              "completed",
            penEStatus:
              penEStatus || null,
            reviewStatus:
              reviewStatus ||
              null,
          });

        setRows(result.rows);
        setTotal(result.total);
        setPageCount(
          result.pageCount
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, [
      page,
      pageSize,
      search,
      range.from,
      range.to,
      studentId,
      tutorUserId,
      offeringId,
      penEStatus,
      reviewStatus,
    ]);

  useEffect(() => {
    load();
  }, [load]);

  function resetPageAnd(
    setter,
    value
  ) {
    setPage(1);
    setter(value);
  }

  function submitSearch(event) {
    event.preventDefault();

    setPage(1);

    setSearch(
      searchInput.trim()
    );
  }

  function clearFilters() {
    setPage(1);
    setSearch("");
    setSearchInput("");
    setDateMode("all");
    setStudentId("");
    setTutorUserId("");
    setOfferingId("");
    setPenEStatus("");
    setReviewStatus("");
  }

  const firstRow =
    total === 0
      ? 0
      : (page - 1) *
          pageSize +
        1;

  const lastRow =
    Math.min(
      page * pageSize,
      total
    );

  return (
    <>
      <Link
        className="aeos-back-link"
        to="/portal/admin/pen-e"
      >
        ← Back to Pen-E
      </Link>

      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Pen-E / Sessions
          </p>

          <h2>
            Session Intelligence
          </h2>

          <p>
            Browse completed tutoring
            sessions and their Pen-E
            processing status.
          </p>
        </div>
      </section>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      <section className="portal-card pen-e-session-browser">
        <div className="pen-e-date-tabs">
          {[
            ["all", "All"],
            ["today", "Today"],
            ["week", "Week"],
            ["month", "Month"],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  dateMode === value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  resetPageAnd(
                    setDateMode,
                    value
                  )
                }
              >
                {label}
              </button>
            )
          )}
        </div>

        <form
          className="pen-e-session-search"
          onSubmit={submitSearch}
        >
          <input
            type="search"
            value={searchInput}
            placeholder="Search student, tutor, Offering or session…"
            onChange={(event) =>
              setSearchInput(
                event.target.value
              )
            }
          />

          <button
            type="submit"
            className="aeos-button-primary"
          >
            Search
          </button>
        </form>

        <div className="pen-e-session-filters">
          <select
            value={studentId}
            onChange={(event) =>
              resetPageAnd(
                setStudentId,
                event.target.value
              )
            }
          >
            <option value="">
              All students
            </option>

            {filters.students.map(
              (student) => (
                <option
                  key={
                    student.student_id
                  }
                  value={
                    student.student_id
                  }
                >
                  {displayName(
                    student
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={tutorUserId}
            onChange={(event) =>
              resetPageAnd(
                setTutorUserId,
                event.target.value
              )
            }
          >
            <option value="">
              All tutors
            </option>

            {filters.tutors.map(
              (tutor) => (
                <option
                  key={
                    tutor.user_id
                  }
                  value={
                    tutor.user_id
                  }
                >
                  {displayName(
                    tutor
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={offeringId}
            onChange={(event) =>
              resetPageAnd(
                setOfferingId,
                event.target.value
              )
            }
          >
            <option value="">
              All Offerings
            </option>

            {filters.offerings.map(
              (offering) => (
                <option
                  key={
                    offering.offering_id
                  }
                  value={
                    offering.offering_id
                  }
                >
                  {
                    offering.offering_name
                  }
                </option>
              )
            )}
          </select>

          <select
            value={penEStatus}
            onChange={(event) =>
              resetPageAnd(
                setPenEStatus,
                event.target.value
              )
            }
          >
            <option value="">
              All Pen-E statuses
            </option>

            <option value="analysed">
              Analysed
            </option>

            <option value="awaiting_analysis">
              Awaiting Analysis
            </option>

            <option value="not_ready">
              Not Ready
            </option>
          </select>

          <select
            value={reviewStatus}
            onChange={(event) =>
              resetPageAnd(
                setReviewStatus,
                event.target.value
              )
            }
          >
            <option value="">
              All review statuses
            </option>

            <option value="pending">
              Pending Review
            </option>

            <option value="reviewed">
              Reviewed
            </option>
          </select>

          <button
            type="button"
            className="aeos-button-secondary"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        <div className="pen-e-table-summary">
          <span>
            Showing {firstRow}–
            {lastRow} of {total}
          </span>

          <label>
            Rows
            <select
              value={pageSize}
              onChange={(event) => {
                setPage(1);

                setPageSize(
                  Number(
                    event.target
                      .value
                  )
                );
              }}
            >
              <option value={30}>
                30
              </option>

              <option value={50}>
                50
              </option>

              <option value={100}>
                100
              </option>
            </select>
          </label>
        </div>

        {loading ? (
          <div className="portal-loading">
            Loading sessions…
          </div>
        ) : rows.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table pen-e-sessions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Offering</th>
                  <th>Tutor</th>
                  <th>Duration</th>
                  <th>Pen-E</th>
                  <th>Review</th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (session) => {
                    const date =
                      session.scheduled_start_at ||
                      session.started_at;

                    return (
                      <tr
                        key={
                          session.session_id
                        }
                        className="pen-e-session-row"
                        tabIndex={0}
                        onClick={() =>
                          navigate(
                            `/portal/admin/pen-e/sessions/${session.session_id}`
                          )

                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            navigate(
                              `/portal/admin/pen-e/sessions/${session.session_id}`
                            );
                          }
                        }}
                      >
                        <td>
                          <strong>
                            {formatDate(
                              date
                            )}
                          </strong>

                          <small>
                            {formatTime(
                              date
                            )}
                          </small>
                        </td>

                        <td>
                          {
                            session.student_name
                          }
                        </td>

                        <td>
                          {
                            session.offering_name
                          }
                        </td>

                        <td>
                          {
                            session.tutor_name
                          }
                        </td>

                        <td>
                          {formatDuration(
                            session.duration_minutes
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-pill pen-e-state-${session.pen_e_status}`}
                          >
                            {penELabel(
                              session.pen_e_status
                            )}
                          </span>
                        </td>

                        <td>
                          {session.review_status ===
                          "not_applicable" ? (
                            "—"
                          ) : (
                            <span
                              className={`status-pill pen-e-review-${session.review_status}`}
                            >
                              {reviewLabel(
                                session.review_status
                              )}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="aeos-empty-state">
            <h3>
              No sessions found
            </h3>

            <p>
              Try changing the date,
              search or Pen-E filters.
            </p>
          </div>
        )}

        <div className="pen-e-pagination">
          <button
            type="button"
            className="aeos-button-secondary"
            disabled={
              page <= 1 || loading
            }
            onClick={() =>
              setPage(
                (current) =>
                  current - 1
              )
            }
          >
            ← Previous
          </button>

          <span>
            Page {page} of{" "}
            {pageCount || 1}
          </span>

          <button
            type="button"
            className="aeos-button-secondary"
            disabled={
              page >= pageCount ||
              loading ||
              pageCount === 0
            }
            onClick={() =>
              setPage(
                (current) =>
                  current + 1
              )
            }
          >
            Next →
          </button>
        </div>
      </section>
    </>
  );
}

