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
  fetchStudentReportsPage,
} from "../../../lib/reports";

import "../../../styles/reports.css";

import PenEStudentReportDraftPanel from "../../../components/portal/reports/PenEStudentReportDraftPanel";

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


export default function StudentReportsPage() {
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


  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await fetchStudentReportsPage({
            page,
            pageSize,
            search,
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
        to="/portal/admin/reports"
      >
        ← Back to Reports
      </Link>


      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Reports / Students
          </p>

          <h2>
            Student Reports
          </h2>

          <p>
            Select a student to
            generate or review
            reports.
          </p>
        </div>
      </section>


      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}


      <section className="portal-card reports-browser">
        <form
          className="reports-search"
          onSubmit={
            submitSearch
          }
        >
          <input
            type="search"
            value={
              searchInput
            }
            placeholder="Search student, school or email…"
            onChange={(
              event
            ) =>
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
            Loading students…
          </div>
        ) : rows.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table reports-table">
              <thead>
                <tr>
                  <th>
                    Student
                  </th>

                  <th>
                    School
                  </th>

                  <th>
                    Reports
                  </th>

                  <th>
                    Finalized
                  </th>

                  <th>
                    Last Report
                  </th>

                  <th>
                    Last Session
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
                      className="reports-row"
                      onClick={() =>
                        navigate(
                          `/portal/admin/reports/students/${student.student_id}`
                        )
                      }
                    >
                      <td>
                        <strong>
                          {studentName(
                            student
                          )}
                        </strong>

                        <small>
                          {student.email ||
                            ""}
                        </small>
                      </td>

                      <td>
                        {student.school ||
                          "—"}
                      </td>

                      <td>
                        {
                          student.report_count
                        }
                      </td>

                      <td>
                        {
                          student.finalized_report_count
                        }
                      </td>

                      <td>
                        {formatDate(
                          student.last_report_at
                        )}
                      </td>

                      <td>
                        {formatDate(
                          student.last_session_at
                        )}
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
              page >= pageCount ||
              pageCount === 0 ||
              loading
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

