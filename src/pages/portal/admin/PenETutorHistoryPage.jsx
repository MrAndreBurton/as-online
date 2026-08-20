import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  fetchPenETutorHistory,
  fetchPenETutorHistoryFilters,
} from "../../../lib/penETutors";

import "../../../styles/penETutors.css";


function displayName(person) {
  return (
    person?.display_name ||
    [
      person?.first_name,
      person?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Tutor"
  );
}


function formatDate(value) {
  if (!value) return "—";

  return new Date(
    value
  ).toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}


function formatTime(value) {
  if (!value) return "";

  return new Date(
    value
  ).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}


function formatDuration(
  minutes
) {
  if (
    minutes === null ||
    minutes === undefined
  ) {
    return "—";
  }

  const total =
    Number(minutes);

  if (total < 60) {
    return `${total} min`;
  }

  const hours =
    Math.floor(
      total / 60
    );

  const remaining =
    total % 60;

  return remaining
    ? `${hours} hr ${remaining} min`
    : `${hours} hr`;
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
  const now =
    new Date();

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
      from:
        start.toISOString(),

      to:
        end.toISOString(),
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
      start.getDate() +
        offset
    );

    const end =
      new Date(start);

    end.setDate(
      end.getDate() + 7
    );

    return {
      from:
        start.toISOString(),

      to:
        end.toISOString(),
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
      from:
        start.toISOString(),

      to:
        end.toISOString(),
    };
  }


  return {
    from: null,
    to: null,
  };
}


export default function PenETutorHistoryPage() {
  const { tutorUserId } =
    useParams();

  const navigate =
    useNavigate();

  const [tutor, setTutor] =
    useState(null);

  const [metrics, setMetrics] =
    useState(null);

  const [rows, setRows] =
    useState([]);

  const [students, setStudents] =
    useState([]);

  const [
    offerings,
    setOfferings,
  ] = useState([]);

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

  const [
    studentId,
    setStudentId,
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
    fetchPenETutorHistoryFilters(
      tutorUserId
    )
      .then((result) => {
        setStudents(
          result.students
        );

        setOfferings(
          result.offerings
        );
      })
      .catch((err) =>
        setError(
          err.message
        )
      );
  }, [tutorUserId]);


  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await fetchPenETutorHistory({
            tutorUserId,
            page,
            pageSize,
            search,

            dateFrom:
              range.from,

            dateTo:
              range.to,

            studentId:
              studentId ||
              null,

            offeringId:
              offeringId ||
              null,

            penEStatus:
              penEStatus ||
              null,

            reviewStatus:
              reviewStatus ||
              null,
          });

        setTutor(
          result.tutor
        );

        setMetrics(
          result.metrics
        );

        setRows(
          result.rows
        );

        setTotal(
          result.total
        );

        setPageCount(
          result.pageCount
        );
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setLoading(false);
      }
    }, [
      tutorUserId,
      page,
      pageSize,
      search,
      range.from,
      range.to,
      studentId,
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


  function submitSearch(
    event
  ) {
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


  if (
    loading &&
    !tutor
  ) {
    return (
      <div className="portal-loading">
        Loading tutor
        intelligence…
      </div>
    );
  }


  if (
    error &&
    !tutor
  ) {
    return (
      <div className="portal-alert">
        {error}
      </div>
    );
  }


  return (
    <>
      <Link
        className="aeos-back-link"
        to="/portal/admin/pen-e/tutors"
      >
        ← Back to Pen-E
        Tutors
      </Link>


      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Pen-E / Tutor
          </p>

          <h2>
            {displayName(
              tutor
            )}
          </h2>

          <p>
            {tutor?.title ||
              "Tutor"}{" "}
            · Tutoring history and
            Pen-E session
            intelligence.
          </p>
        </div>
      </section>


      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}


      <section className="pen-e-tutor-metric-grid">
        <article className="pen-e-tutor-metric">
          <strong>
            {Number(
              metrics?.sessions ??
                0
            )}
          </strong>

          <span>
            Sessions
          </span>
        </article>

        <article className="pen-e-tutor-metric">
          <strong>
            {Number(
              metrics?.hours_tutored ??
                0
            ).toFixed(1)}
          </strong>

          <span>
            Hours Tutored
          </span>
        </article>

        <article className="pen-e-tutor-metric">
          <strong>
            {Number(
              metrics?.students ??
                0
            )}
          </strong>

          <span>
            Students
          </span>
        </article>

        <article className="pen-e-tutor-metric">
          <strong>
            {Number(
              metrics?.analysed ??
                0
            )}
          </strong>

          <span>
            Analysed
          </span>
        </article>

        <article className="pen-e-tutor-metric">
          <strong>
            {Number(
              metrics?.analysis_coverage_percent ??
                0
            ).toFixed(1)}
            %
          </strong>

          <span>
            Pen-E Coverage
          </span>
        </article>
      </section>


      <section className="portal-card pen-e-tutor-history-browser">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">
              Session History
            </p>

            <h3>
              Tutored Sessions
            </h3>
          </div>

          <span>
            {total} session
            {total === 1
              ? ""
              : "s"}
          </span>
        </div>


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
          className="pen-e-tutor-history-search"
          onSubmit={
            submitSearch
          }
        >
          <input
            type="search"
            value={
              searchInput
            }
            placeholder="Search student, Offering or session…"
            onChange={(
              event
            ) =>
              setSearchInput(
                event.target
                  .value
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


        <div className="pen-e-tutor-history-filters">
          <select
            value={
              studentId
            }
            onChange={(
              event
            ) =>
              resetPageAnd(
                setStudentId,
                event.target
                  .value
              )
            }
          >
            <option value="">
              All students
            </option>

            {students.map(
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
            value={
              offeringId
            }
            onChange={(
              event
            ) =>
              resetPageAnd(
                setOfferingId,
                event.target
                  .value
              )
            }
          >
            <option value="">
              All Offerings
            </option>

            {offerings.map(
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
            value={
              penEStatus
            }
            onChange={(
              event
            ) =>
              resetPageAnd(
                setPenEStatus,
                event.target
                  .value
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
            value={
              reviewStatus
            }
            onChange={(
              event
            ) =>
              resetPageAnd(
                setReviewStatus,
                event.target
                  .value
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
            onClick={
              clearFilters
            }
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
              value={
                pageSize
              }
              onChange={(
                event
              ) => {
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
            Loading tutor
            history…
          </div>
        ) : rows.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table pen-e-tutor-history-table">
              <thead>
                <tr>
                  <th>
                    Date
                  </th>

                  <th>
                    Student
                  </th>

                  <th>
                    Offering
                  </th>

                  <th>
                    Session
                  </th>

                  <th>
                    Duration
                  </th>

                  <th>
                    Pen-E
                  </th>

                  <th>
                    Review
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (session) => {
                    const date =
                      session.started_at ||
                      session.scheduled_start_at;

                    return (
                      <tr
                        key={
                          session.session_id
                        }
                        className="pen-e-tutor-session-row"
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
                          {session.session_title ||
                            "Tutoring Session"}
                        </td>

                        <td>
                          {formatDuration(
                            session.duration_minutes
                          )}
                        </td>

                        <td>
                          <span className="status-pill">
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
                            <span className="status-pill">
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
              Try changing the
              date or filters.
            </p>
          </div>
        )}


        <div className="pen-e-pagination">
          <button
            type="button"
            className="aeos-button-secondary"
            disabled={
              page <= 1 ||
              loading
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
              page >=
                pageCount ||
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

