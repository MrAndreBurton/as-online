import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  createStudentReport,
  fetchStudentReportCenter,
} from "../../../lib/reports";

import "../../../styles/reports.css";


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


function defaultTitle(
  name,
  type
) {
  if (type === "term") {
    return `${name} - Term Report`;
  }

  if (type === "annual") {
    return `${name} - Annual Report`;
  }

  return `${name} - Progress Report`;
}


export default function StudentReportCenterPage() {
  const { studentId } =
    useParams();

  const navigate =
    useNavigate();

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    reportType,
    setReportType,
  ] = useState("term");

  const [
    periodStart,
    setPeriodStart,
  ] = useState("");

  const [
    periodEnd,
    setPeriodEnd,
  ] = useState("");

  const [
    reportTitle,
    setReportTitle,
  ] = useState("");


  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await fetchStudentReportCenter(
            studentId
          );

        setData(result);
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setLoading(false);
      }
    }, [studentId]);


  useEffect(() => {
    load();
  }, [load]);


  async function generateReport(
    event
  ) {
    event.preventDefault();

    if (
      !periodStart ||
      !periodEnd
    ) {
      setError(
        "Select both reporting-period dates."
      );
      return;
    }

    setCreating(true);
    setError("");

    try {
      const name =
        displayName(
          data.student
        );

      const reportId =
        await createStudentReport({
          studentId,
          reportType,
          periodStart,
          periodEnd,
          reportTitle:
            reportTitle.trim() ||
            defaultTitle(
              name,
              reportType
            ),
        });

      navigate(
        `/portal/admin/reports/student/${reportId}`
      );
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setCreating(false);
    }
  }


  if (loading) {
    return (
      <div className="portal-loading">
        Loading report centre…
      </div>
    );
  }


  if (!data) {
    return (
      <div className="portal-alert">
        {error ||
          "Student could not be loaded."}
      </div>
    );
  }


  const {
    student,
    metrics,
    reports,
  } = data;


  return (
    <>
      <Link
        className="aeos-back-link"
        to="/portal/admin/reports/students"
      >
        ← Back to Student Reports
      </Link>


      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Student Report Centre
          </p>

          <h2>
            {displayName(
              student
            )}
          </h2>

          <p>
            {student.school ||
              "School not recorded"}
          </p>
        </div>
      </section>


      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}


      <section className="reports-metric-grid">
        <article className="reports-metric">
          <strong>
            {metrics?.completed_sessions ??
              0}
          </strong>

          <span>
            Sessions
          </span>
        </article>

        <article className="reports-metric">
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

        <article className="reports-metric">
          <strong>
            {metrics?.reports ??
              0}
          </strong>

          <span>
            Reports
          </span>
        </article>

        <article className="reports-metric">
          <strong>
            {metrics?.finalized_reports ??
              0}
          </strong>

          <span>
            Finalized
          </span>
        </article>
      </section>


      <section className="portal-card report-generator">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">
              Generate
            </p>

            <h3>
              New Student Report
            </h3>
          </div>
        </div>


        <form
          onSubmit={
            generateReport
          }
        >
          <div className="report-type-selector">
            {[
              [
                "term",
                "Term Report",
              ],
              [
                "annual",
                "Annual Report",
              ],
              [
                "custom",
                "Custom Report",
              ],
            ].map(
              ([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={
                    reportType ===
                    value
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setReportType(
                      value
                    )
                  }
                >
                  {label}
                </button>
              )
            )}
          </div>


          <div className="report-generator-fields">
            <label>
              Period Start

              <input
                type="date"
                value={
                  periodStart
                }
                onChange={(
                  event
                ) =>
                  setPeriodStart(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label>
              Period End

              <input
                type="date"
                value={
                  periodEnd
                }
                onChange={(
                  event
                ) =>
                  setPeriodEnd(
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label className="report-title-field">
              Report Title

              <input
                type="text"
                value={
                  reportTitle
                }
                placeholder={defaultTitle(
                  displayName(
                    student
                  ),
                  reportType
                )}
                onChange={(
                  event
                ) =>
                  setReportTitle(
                    event.target
                      .value
                  )
                }
              />
            </label>
          </div>


          <p className="report-generator-note">
            Term and annual
            reports currently use
            the dates you select.
            AEOS term-calendar
            presets can be added
            later without changing
            the report engine.
          </p>


          <button
            type="submit"
            className="aeos-button-primary"
            disabled={creating}
          >
            {creating
              ? "Generating…"
              : "Generate Report"}
          </button>
        </form>
      </section>


      <section className="portal-card">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">
              History
            </p>

            <h3>
              Report History
            </h3>
          </div>

          <span>
            {reports.length}
          </span>
        </div>


        {reports.length ? (
          <div className="aeos-table-wrap">
            <table className="aeos-table reports-table">
              <thead>
                <tr>
                  <th>
                    Report
                  </th>

                  <th>
                    Period
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>
                </tr>
              </thead>

              <tbody>
                {reports.map(
                  (report) => (
                    <tr
                      key={
                        report.report_id
                      }
                      className="reports-row"
                      onClick={() =>
                        navigate(
                          `/portal/admin/reports/student/${report.report_id}`
                        )
                      }
                    >
                      <td>
                        <strong>
                          {
                            report.report_title
                          }
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          report.period_start
                        )}
                        {" – "}
                        {formatDate(
                          report.period_end
                        )}
                      </td>

                      <td>
                        {
                          report.report_type
                        }
                      </td>

                      <td>
                        <span className="status-pill">
                          {
                            report.report_status
                          }
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          report.created_at
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
              No reports yet
            </h3>

            <p>
              Generate the first
              report using the
              form above.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

