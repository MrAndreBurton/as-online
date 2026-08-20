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
  fetchPenEAnalyzeFilters,
  fetchPenEAnalyzeQueue,
} from "../../../lib/penEAnalyzeQueue";

import "../../../styles/penEAnalyze.css";

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

function localDayRange(mode) {
  const now = new Date();

  if (mode === "today") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }

  if (mode === "week") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const day = start.getDay();
    const offset =
      day === 0 ? -6 : 1 - day;

    start.setDate(
      start.getDate() + offset
    );

    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }

  if (mode === "month") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const end = new Date(
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

export default function PenEAnalyzePage() {
  const navigate = useNavigate();

  const [rows, setRows] =
    useState([]);

  const [filters, setFilters] =
    useState({
      students: [],
      offerings: [],
      providers: [],
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

  const [offeringId, setOfferingId] =
    useState("");

  const [
    sourceProvider,
    setSourceProvider,
  ] = useState("");

  const range = useMemo(
    () => localDayRange(dateMode),
    [dateMode]
  );

  useEffect(() => {
    fetchPenEAnalyzeFilters()
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
          await fetchPenEAnalyzeQueue({
            page,
            pageSize,
            search,
            dateFrom: range.from,
            dateTo: range.to,
            studentId:
              studentId || null,
            offeringId:
              offeringId || null,
            sourceProvider:
              sourceProvider || null,
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
      offeringId,
      sourceProvider,
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
    setOfferingId("");
    setSourceProvider("");
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
            Pen-E / Analyze
          </p>

          <h2>
            Analysis Queue
          </h2>

          <p>
            Sessions matched to Learning
            Intake and ready for Pen-E
            analysis.
          </p>
        </div>

        <div className="pen-e-analyze-heading-count">
          <strong>{total}</strong>
          <span>waiting</span>
        </div>
      </section>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      <section className="portal-card pen-e-analyze-browser">
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
          className="pen-e-analyze-search"
          onSubmit={submitSearch}
        >
          <input
            type="search"
            value={searchInput}
            placeholder="Search student, Offering, session or source…"
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

        <div className="pen-e-analyze-filters">
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
            value={sourceProvider}
            onChange={(event) =>
              resetPageAnd(
                setSourceProvider,
                event.target.value
              )
            }
          >
            <option value="">
              All sources
            </option>

            {filters.providers.map(
              (provider) => (
                <option
                  key={provider}
                  value={provider}
                >
                  {provider}
                </option>
              )
            )}
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
                    event.target.value
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
            Loading analysis queue…
          </div>
        ) : rows.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table pen-e-analyze-table">
              <thead>
                <tr>
                  <th>
                    Session
                  </th>
                  <th>
                    Student
                  </th>
                  <th>
                    Offering
                  </th>
                  <th>
                    Source
                  </th>
                  <th>
                    Words
                  </th>
                  <th>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (item) => {
                    const date =
                      item.scheduled_start_at ||
                      item.started_at ||
                      item.ready_for_ai_at;

                    return (
                      <tr
                        key={
                          item.intake_item_id
                        }
                        className="pen-e-analyze-row"
                        tabIndex={0}
                        onClick={() =>
                          navigate(
                            `/portal/admin/pen-e/analyze/${item.intake_item_id}`
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
                              `/portal/admin/pen-e/analyze/${item.intake_item_id}`
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
                            item.student_name
                          }
                        </td>

                        <td>
                          {
                            item.offering_name
                          }
                        </td>

                        <td>
                          <strong>
                            {
                              item.source_provider
                            }
                          </strong>

                          <small>
                            {
                              item.source_name ||
                              item.intake_type
                            }
                          </small>
                        </td>

                        <td>
                          {Number(
                            item.word_count ??
                              0
                          ).toLocaleString()}
                        </td>

                        <td>
                          <span className="status-pill">
                            Ready
                          </span>
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
              Queue clear
            </h3>

            <p>
              No matched Learning Intake
              items are currently waiting
              for Pen-E analysis.
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


