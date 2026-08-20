import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  fetchPenEStudents,
} from "../../../lib/penEStudents";

import "../../../styles/penEStudents.css";


function displayName(student) {
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


function offeringNames(
  offerings
) {
  if (!offerings?.length) {
    return "No current Offering";
  }

  return offerings
    .map(
      (item) =>
        item.offering_name
    )
    .filter(Boolean)
    .join(" · ");
}


function penEStateLabel(state) {
  switch (state) {
    case "has_pen_e":
      return "Has Pen-E";

    case "awaiting_analysis":
      return "Awaiting Analysis";

    case "no_analysis":
      return "No Analysis";

    default:
      return state || "—";
  }
}


export default function PenEStudentsPage() {
  const navigate =
    useNavigate();

  const [rows, setRows] =
    useState([]);

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

  const [
    penEFilter,
    setPenEFilter,
  ] = useState("");


  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await fetchPenEStudents({
            page,
            pageSize,
            search,
            studentStatus:
              "active",
            penEFilter:
              penEFilter ||
              null,
          });

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
      page,
      pageSize,
      search,
      penEFilter,
    ]);


  useEffect(() => {
    load();
  }, [load]);


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
    setPenEFilter("");
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
            Pen-E / Students
          </p>

          <h2>
            Student Intelligence
          </h2>

          <p>
            Browse students and
            open their tutoring and
            Pen-E session history.
          </p>
        </div>

        <div className="pen-e-students-heading-count">
          <strong>
            {total}
          </strong>

          <span>
            students
          </span>
        </div>
      </section>


      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}


      <section className="portal-card pen-e-students-browser">
        <form
          className="pen-e-students-search"
          onSubmit={
            submitSearch
          }
        >
          <input
            type="search"
            value={
              searchInput
            }
            placeholder="Search student, school, email or Offering…"
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


        <div className="pen-e-students-filters">
          <select
            value={
              penEFilter
            }
            onChange={(
              event
            ) => {
              setPage(1);

              setPenEFilter(
                event.target
                  .value
              );
            }}
          >
            <option value="">
              All Pen-E states
            </option>

            <option value="has_pen_e">
              Has Pen-E
            </option>

            <option value="awaiting_analysis">
              Awaiting Analysis
            </option>

            <option value="no_analysis">
              No Analysis
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
            Loading students…
          </div>
        ) : rows.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table pen-e-students-table">
              <thead>
                <tr>
                  <th>
                    Student
                  </th>

                  <th>
                    Offering(s)
                  </th>

                  <th>
                    Sessions
                  </th>

                  <th>
                    Hours
                  </th>

                  <th>
                    Analysed
                  </th>

                  <th>
                    Coverage
                  </th>

                  <th>
                    Last Session
                  </th>

                  <th>
                    Pen-E
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map(
                  (student) => (
                    <tr
                      key={
                        student.student_id
                      }
                      className="pen-e-student-row"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/portal/admin/pen-e/students/${student.student_id}`
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
                            `/portal/admin/pen-e/students/${student.student_id}`
                          );
                        }
                      }}
                    >
                      <td>
                        <strong>
                          {displayName(
                            student
                          )}
                        </strong>

                        <small>
                          {student.school ||
                            "School not recorded"}
                        </small>
                      </td>

                      <td>
                        {offeringNames(
                          student.offerings
                        )}
                      </td>

                      <td>
                        {
                          student.session_count
                        }
                      </td>

                      <td>
                        {Number(
                          student.hours_tutored ??
                            0
                        ).toFixed(
                          1
                        )}
                      </td>

                      <td>
                        {
                          student.analysed_count
                        }
                      </td>

                      <td>
                        {Number(
                          student.analysis_coverage_percent ??
                            0
                        ).toFixed(
                          1
                        )}
                        %
                      </td>

                      <td>
                        {formatDate(
                          student.last_session_at
                        )}
                      </td>

                      <td>
                        <span className="status-pill">
                          {penEStateLabel(
                            student.pen_e_state
                          )}
                        </span>
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
              No students found
            </h3>

            <p>
              Try changing the
              search or Pen-E
              filter.
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


