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
  fetchPenETutors,
} from "../../../lib/penETutors";

import "../../../styles/penETutors.css";


function displayName(tutor) {
  return (
    tutor?.display_name ||
    [
      tutor?.first_name,
      tutor?.last_name,
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


export default function PenETutorsPage() {
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
          await fetchPenETutors({
            page,
            pageSize,
            search,
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
            Pen-E / Tutors
          </p>

          <h2>
            Tutor Intelligence
          </h2>

          <p>
            Browse tutor activity
            and open their Pen-E
            session history.
          </p>
        </div>

        <div className="pen-e-tutors-heading-count">
          <strong>
            {total}
          </strong>

          <span>
            tutors
          </span>
        </div>
      </section>


      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}


      <section className="portal-card pen-e-tutors-browser">
        <form
          className="pen-e-tutors-search"
          onSubmit={
            submitSearch
          }
        >
          <input
            type="search"
            value={
              searchInput
            }
            placeholder="Search tutor or title…"
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


        <div className="pen-e-tutors-filters">
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
            Loading tutors…
          </div>
        ) : rows.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table pen-e-tutors-table">
              <thead>
                <tr>
                  <th>
                    Tutor
                  </th>

                  <th>
                    Sessions
                  </th>

                  <th>
                    Hours
                  </th>

                  <th>
                    Students
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
                  (tutor) => (
                    <tr
                      key={
                        tutor.tutor_user_id
                      }
                      className="pen-e-tutor-row"
                      tabIndex={0}
                      onClick={() =>
                        navigate(
                          `/portal/admin/pen-e/tutors/${tutor.tutor_user_id}`
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
                            `/portal/admin/pen-e/tutors/${tutor.tutor_user_id}`
                          );
                        }
                      }}
                    >
                      <td>
                        <strong>
                          {displayName(
                            tutor
                          )}
                        </strong>

                        <small>
                          {tutor.title ||
                            "Tutor"}
                        </small>
                      </td>

                      <td>
                        {
                          tutor.session_count
                        }
                      </td>

                      <td>
                        {Number(
                          tutor.hours_tutored ??
                            0
                        ).toFixed(1)}
                      </td>

                      <td>
                        {
                          tutor.student_count
                        }
                      </td>

                      <td>
                        {
                          tutor.analysed_count
                        }
                      </td>

                      <td>
                        {Number(
                          tutor.analysis_coverage_percent ??
                            0
                        ).toFixed(1)}
                        %
                      </td>

                      <td>
                        {formatDate(
                          tutor.last_session_at
                        )}
                      </td>

                      <td>
                        <span className="status-pill">
                          {penEStateLabel(
                            tutor.pen_e_state
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
              No tutors found
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


