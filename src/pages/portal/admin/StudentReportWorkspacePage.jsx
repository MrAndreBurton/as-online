import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  downloadStudentReportPdf,
  fetchStudentReport,
  finalizeStudentReport,
  markStudentReportReviewed,
  reopenStudentReport,
  saveStudentReportContent,
} from "../../../lib/reports";

import PenEStudentReportDraftPanel
  from "../../../components/portal/reports/PenEStudentReportDraftPanel";

import "../../../styles/reports.css";


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


function createInitialContent(
  report
) {
  const snapshot =
    report?.data_snapshot ?? {};

  const student =
    snapshot.student ?? {};

  return {
    report_version:
      "student-content-v1",

    overview: {
      headline:
        `${studentName(
          student
        )} Progress Report`,

      summary: "",
    },

    learning_highlights: [],

    areas_for_development: [],

    follow_up_priorities: [],

    curriculum_progress: [],

    closing_comment: "",
  };
}


function arrayToText(value) {
  return Array.isArray(value)
    ? value.join("\n")
    : "";
}


function textToArray(value) {
  return value
    .split("\n")
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean);
}


export default function StudentReportWorkspacePage() {
  const { reportId } =
    useParams();

  const navigate =
    useNavigate();

  const [data, setData] =
    useState(null);

  const [content, setContent] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");


  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const result =
          await fetchStudentReport(
            reportId
          );

        setData(result);

        const report =
          result.report;

        const existing =
          report.report_content;

        const hasContent =
          existing &&
          Object.keys(
            existing
          ).length > 0;

        setContent(
          hasContent
            ? existing
            : createInitialContent(
                report
              )
        );
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setLoading(false);
      }
    }, [reportId]);


  useEffect(() => {
    load();
  }, [load]);


  const report =
    data?.report;

  const snapshot =
    report?.data_snapshot ??
    {};

  const metrics =
    snapshot.session_metrics ??
    {};

  const attendance =
    snapshot.attendance ??
    {};

  const evidence =
    snapshot.learning_evidence ??
    [];

  const actions =
    snapshot.actions ?? [];

  const sessions =
    snapshot.sessions ?? [];

  const curriculum =
    snapshot.curriculum
      ?.reviewed_matches ??
    [];


  const evidenceCounts =
    useMemo(() => {
      const counts = {};

      for (const item of evidence) {
        counts[
          item.evidence_type
        ] =
          (
            counts[
              item.evidence_type
            ] ?? 0
          ) + 1;
      }

      return counts;
    }, [evidence]);


  function updateOverview(
    key,
    value
  ) {
    setContent(
      (current) => ({
        ...current,

        overview: {
          ...(current?.overview ??
            {}),

          [key]:
            value,
        },
      })
    );
  }


  function updateArrayField(
    key,
    value
  ) {
    setContent(
      (current) => ({
        ...current,

        [key]:
          textToArray(
            value
          ),
      })
    );
  }

  async function save() {
    setWorking("save");
    setError("");
    setMessage("");

    try {
      await saveStudentReportContent(
        reportId,
        content
      );

      setMessage(
        "Draft saved."
      );

      await load();
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setWorking("");
    }
  }


  async function review() {
    setWorking("review");
    setError("");
    setMessage("");

    try {
      await saveStudentReportContent(
        reportId,
        content
      );

      await markStudentReportReviewed(
        reportId
      );

      setMessage(
        "Report marked reviewed."
      );

      await load();
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setWorking("");
    }
  }


  async function finalize() {
    setWorking("finalize");
    setError("");
    setMessage("");

    try {
      await finalizeStudentReport(
        reportId
      );

      setMessage(
        "Report finalized."
      );

      await load();
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setWorking("");
    }
  }


  async function reopen() {
    const confirmed =
      window.confirm(
        "Reopen this report for editing? It will return to Draft status."
      );

    if (!confirmed) return;

    setWorking("reopen");
    setError("");
    setMessage("");

    try {
      await reopenStudentReport(
        reportId
      );

      setMessage(
        "Report reopened as draft."
      );

      await load();
    } catch (err) {
      setError(
        err.message
      );
    } finally {
      setWorking("");
    }
  }

async function downloadPdf() {
  setWorking("pdf");
  setError("");
  setMessage("");

  try {
    await downloadStudentReportPdf(
      reportId
    );

    setMessage(
      "PDF generated and downloaded."
    );

    await load();
  } catch (err) {
    setError(
      err.message
    );
  } finally {
    setWorking("");
  }
}


  if (loading && !data) {
    return (
      <div className="portal-loading">
        Loading report…
      </div>
    );
  }


  if (!report) {
    return (
      <div className="portal-alert">
        {error ||
          "Report not found."}
      </div>
    );
  }


  const isDraft =
    report.report_status ===
    "draft";

  const isReviewed =
    report.report_status ===
    "reviewed";

  const isFinalized =
    report.report_status ===
    "finalized";

function handlePenEImport(draft) {
  setContent((current) => ({
    ...draft,

    overview: {
      ...draft.overview,

      headline:
        current?.overview?.headline ||
        draft.overview?.headline ||
        "",
    },
  }));
}

  return (
    <>
      <button
        type="button"
        className="aeos-back-link aeos-back-button"
        onClick={() => {
          if (
            window.history.length >
            1
          ) {
            navigate(-1);
          } else {
            navigate(
              "/portal/admin/reports/students"
            );
          }
        }}
      >
        ← Back
      </button>


      <section className="report-workspace-header">
        <div>
          <p className="portal-eyebrow">
            Student Report
          </p>

          <h2>
            {report.report_title}
          </h2>

          <p>
            {studentName(
              snapshot.student
            )}
            {" · "}
            {formatDate(
              report.period_start
            )}
            {" – "}
            {formatDate(
              report.period_end
            )}
          </p>
        </div>

        <span
          className={`
            report-status-badge
            ${report.report_status}
          `}
        >
          {report.report_status}
        </span>
      </section>


      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="report-success-message">
          {message}
        </div>
      ) : null}


      <section className="reports-metric-grid report-workspace-metrics">
        <article className="reports-metric">
          <strong>
            {metrics.completed_sessions ??
              0}
          </strong>

          <span>
            Sessions
          </span>
        </article>

        <article className="reports-metric">
          <strong>
            {Number(
              metrics.hours_tutored ??
                0
            ).toFixed(1)}
          </strong>

          <span>
            Hours
          </span>
        </article>

        <article className="reports-metric">
          <strong>
            {attendance.present ??
              0}
          </strong>

          <span>
            Present
          </span>
        </article>

        <article className="reports-metric">
          <strong>
            {metrics.analysis_coverage_percent ??
              0}
            %
          </strong>

          <span>
            Pen-E Coverage
          </span>
        </article>
      </section>

      <PenEStudentReportDraftPanel
        report={report}
        onImport={handlePenEImport}
      />

      <div className="report-workspace-grid">
        <main className="report-workspace-main">

          <section className="portal-card">
            <p className="portal-eyebrow">
              Report Content
            </p>

            <h3>
              Overview
            </h3>

            <label className="report-editor-field">
              Headline

              <input
                type="text"
                disabled={!isDraft}
                value={
                  content?.overview
                    ?.headline ?? ""
                }
                onChange={(
                  event
                ) =>
                  updateOverview(
                    "headline",
                    event.target
                      .value
                  )
                }
              />
            </label>

            <label className="report-editor-field">
              Summary

              <textarea
                rows={7}
                disabled={!isDraft}
                value={
                  content?.overview
                    ?.summary ?? ""
                }
                onChange={(
                  event
                ) =>
                  updateOverview(
                    "summary",
                    event.target
                      .value
                  )
                }
              />
            </label>
          </section>


          <section className="portal-card">
            <h3>
              Learning Highlights
            </h3>

            <p className="report-editor-help">
              Enter one point per
              line.
            </p>

            <textarea
              rows={8}
              disabled={!isDraft}
              value={arrayToText(
                content
                  ?.learning_highlights
              )}
              onChange={(
                event
              ) =>
                updateArrayField(
                  "learning_highlights",
                  event.target
                    .value
                )
              }
            />
          </section>


          <section className="portal-card">
            <h3>
              Areas for Development
            </h3>

            <p className="report-editor-help">
              Enter one point per
              line.
            </p>

            <textarea
              rows={8}
              disabled={!isDraft}
              value={arrayToText(
                content
                  ?.areas_for_development
              )}
              onChange={(
                event
              ) =>
                updateArrayField(
                  "areas_for_development",
                  event.target
                    .value
                )
              }
            />
          </section>


          <section className="portal-card">
            <h3>
              Follow-up Priorities
            </h3>

            <textarea
              rows={8}
              disabled={!isDraft}
              value={arrayToText(
                content
                  ?.follow_up_priorities
              )}
              onChange={(
                event
              ) =>
                updateArrayField(
                  "follow_up_priorities",
                  event.target
                    .value
                )
              }
            />
          </section>


          <section className="portal-card">
            <h3>
              Closing Comment
            </h3>

            <textarea
              rows={6}
              disabled={!isDraft}
              value={
                content
                  ?.closing_comment ??
                ""
              }
              onChange={(
                event
              ) =>
                setContent(
                  (current) => ({
                    ...current,

                    closing_comment:
                      event.target
                        .value,
                  })
                )
              }
            />
          </section>
        </main>


        <aside className="report-workspace-side">

          <section className="portal-card">
            <p className="portal-eyebrow">
              Evidence Source
            </p>

            <h3>
              Learning Evidence
            </h3>

            <strong className="report-side-big-number">
              {evidence.length}
            </strong>

            <div className="report-evidence-counts">
              {Object.entries(
                evidenceCounts
              ).map(
                ([
                  type,
                  count,
                ]) => (
                  <div key={type}>
                    <span>
                      {type.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    <strong>
                      {count}
                    </strong>
                  </div>
                )
              )}
            </div>
          </section>


          <section className="portal-card">
            <p className="portal-eyebrow">
              Follow-up
            </p>

            <h3>
              Reviewed Actions
            </h3>

            <strong className="report-side-big-number">
              {actions.length}
            </strong>
          </section>


          <section className="portal-card">
            <p className="portal-eyebrow">
              Curriculum
            </p>

            <h3>
              Reviewed Matches
            </h3>

            <strong className="report-side-big-number">
              {curriculum.length}
            </strong>

            {!curriculum.length ? (
              <p className="report-side-note">
                Curriculum
                intelligence has
                not yet been
                attached to this
                report.
              </p>
            ) : null}
          </section>


          <section className="portal-card">
            <p className="portal-eyebrow">
              Sessions
            </p>

            <h3>
              Reporting Period
            </h3>

            <div className="report-session-mini-list">
              {sessions.map(
                (session) => (
                  <div
                    key={
                      session.session_id
                    }
                  >
                    <strong>
                      {formatDate(
                        session.date
                      )}
                    </strong>

                    <span>
                      {session.offering_name}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        </aside>
      </div>


      <section className="report-workspace-actions">
        {isDraft ? (
          <>
            <button
              type="button"
              className="aeos-button-secondary"
              disabled={
                Boolean(working)
              }
              onClick={save}
            >
              {working === "save"
                ? "Saving…"
                : "Save Draft"}
            </button>

            <button
              type="button"
              className="aeos-button-primary"
              disabled={
                Boolean(working)
              }
              onClick={review}
            >
              {working === "review"
                ? "Reviewing…"
                : "Mark Reviewed"}
            </button>
          </>
        ) : null}


        {isReviewed ? (
          <>
            <button
              type="button"
              className="aeos-button-secondary"
              disabled={
                Boolean(working)
              }
              onClick={reopen}
            >
              Reopen for Editing
            </button>

            <button
              type="button"
              className="aeos-button-primary"
              disabled={
                Boolean(working)
              }
              onClick={finalize}
            >
              {working ===
              "finalize"
                ? "Finalizing…"
                : "Finalize Report"}
            </button>
          </>
        ) : null}


        {isFinalized ? (
          <>
            <button
              type="button"
              className="aeos-button-secondary"
              disabled={
                Boolean(working)
              }
              onClick={reopen}
            >
              Reopen Report
            </button>

            <button
              type="button"
              className="aeos-button-primary"
              disabled={
                Boolean(working)
              }
              onClick={downloadPdf}
              >
                {working === "pdf"
                  ? "Generating PDF…"
                  : "Download PDF"}
                </button>

          </>
        ) : null}
      </section>
    </>
  );
}

