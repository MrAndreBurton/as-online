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
  fetchPenESessionDetail,
} from "../../../lib/penESessionDetail";

import {
  fetchPenEAnalysisRun,
  fetchPenETranscriptScope,
  reanalysePenETranscript,
  reviewPenESuggestion,
} from "../../../lib/penEAnalysis";

import "../../../styles/penESessionDetail.css";
import "../../../styles/penE.css";

function displayName(person) {
  return (
    person?.display_name ||
    [
      person?.first_name,
      person?.last_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Unknown"
  );
}

function formatDateTime(value) {
  if (!value) return "—";

  return new Date(
    value
  ).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value) {
  if (!value) return "—";

  return new Date(
    value
  ).toLocaleDateString([], {
    year: "numeric",
    month: "long",
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
  start,
  end
) {
  if (!start || !end) {
    return "—";
  }

  const minutes = Math.round(
    (
      new Date(end) -
      new Date(start)
    ) /
      60000
  );

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes / 60
    );

  const remaining =
    minutes % 60;

  return remaining
    ? `${hours} hr ${remaining} min`
    : `${hours} hr`;
}

function evidenceGroupLabel(
  type
) {
  switch (type) {
    case "independent_success":
    case "demonstrated_understanding":
    case "procedural_success":
      return "Strengths / Successes";

    case "partial_understanding":
    case "engagement":
      return "Developing";

    case "needs_prompting":
    case "uncertainty":
    case "procedural_error":
      return "Needs Support";

    case "misconception":
      return "Misconceptions";

    default:
      return "Other Evidence";
  }
}

function evidenceGroupOrder(
  label
) {
  const order = {
    "Strengths / Successes": 1,
    Developing: 2,
    "Needs Support": 3,
    Misconceptions: 4,
    "Other Evidence": 5,
  };

  return (
    order[label] ?? 99
  );
}

function runStatusLabel(
  status
) {
  switch (status) {
    case "completed":
      return "Completed";

    case "failed":
      return "Failed";

    case "running":
      return "Running";

    case "queued":
      return "Queued";

    default:
      return status || "Unknown";
  }
}

/*
 * ==================================================
 * Curriculum deep-link
 * ==================================================
 *
 * Pen-E must link into the curriculum using the
 * effective ANALYSIS scope, not merely the student's
 * current offering.
 *
 * Example:
 *
 * /portal/admin/curriculum
 *   ?programme=PRI
 *   &subject=MATH
 *   &level=STD4
 *   &node=CUR-0294
 */

function buildCurriculumLink(
  curriculumNodeId,
  analysisScope
) {
  if (!curriculumNodeId) {
    return "/portal/admin/curriculum";
  }

  const params =
    new URLSearchParams();

  if (
    analysisScope?.programme_id
  ) {
    params.set(
      "programme",
      analysisScope.programme_id
    );
  }

  if (
    analysisScope?.subject_id
  ) {
    params.set(
      "subject",
      analysisScope.subject_id
    );
  }

  if (
    analysisScope?.effective_level_id
  ) {
    params.set(
      "level",
      analysisScope.effective_level_id
    );
  }

  params.set(
    "node",
    curriculumNodeId
  );

  return `/portal/admin/curriculum?${params.toString()}`;
}

function ReviewButtons({
  table,
  id,
  status,
  onChanged,
}) {
  const [working, setWorking] =
    useState("");

  if (
    status !==
    "pending_review"
  ) {
    return (
      <span
        className={`pen-e-review-state ${status}`}
      >
        {status}
      </span>
    );
  }

  async function review(next) {
    setWorking(next);

    try {
      await reviewPenESuggestion(
        table,
        id,
        next
      );

      await onChanged();
    } finally {
      setWorking("");
    }
  }

  return (
    <div className="pen-e-review-actions">
      <button
        type="button"
        className="aeos-button-primary"
        disabled={Boolean(
          working
        )}
        onClick={() =>
          review("accepted")
        }
      >
        {working === "accepted"
          ? "Accepting…"
          : "Accept"}
      </button>

      <button
        type="button"
        className="aeos-button-secondary"
        disabled={Boolean(
          working
        )}
        onClick={() =>
          review("rejected")
        }
      >
        {working === "rejected"
          ? "Rejecting…"
          : "Reject"}
      </button>
    </div>
  );
}

function EvidenceCard({
  item,
  onChanged,
}) {
  return (
    <article className="pen-e-intelligence-item">
      <div className="pen-e-intelligence-copy">
        <strong>
          {
            item.evidence_statement
          }
        </strong>

        <div className="pen-e-intelligence-meta">
          <span>
            {
              item.evidence_type
            }
          </span>

          {item.node?.node_name ? (
            <span>
              {
                item.node
                  .node_name
              }
            </span>
          ) : null}

          <span>
            {item.confidence}%
            confidence
          </span>
        </div>

        {item.source_excerpt ? (
          <details className="pen-e-source-details">
            <summary>
              View transcript evidence
            </summary>

            <blockquote>
              {
                item.source_excerpt
              }
            </blockquote>

            {item.source_timestamp ? (
              <small>
                Transcript time:{" "}
                {
                  item.source_timestamp
                }
              </small>
            ) : null}
          </details>
        ) : null}

        {item.explanation ? (
          <p className="pen-e-intelligence-explanation">
            {
              item.explanation
            }
          </p>
        ) : null}
      </div>

      <ReviewButtons
        table="evidence"
        id={
          item.evidence_suggestion_id
        }
        status={
          item.review_status
        }
        onChanged={
          onChanged
        }
      />
    </article>
  );
}

function ActionCard({
  item,
  onChanged,
}) {
  return (
    <article className="pen-e-intelligence-item">
      <div className="pen-e-intelligence-copy">
        <strong>
          {
            item.action_title
          }
        </strong>

        <div className="pen-e-intelligence-meta">
          <span>
            {
              item.action_type
            }
          </span>

          {item.target_role ? (
            <span>
              For:{" "}
              {
                item.target_role
              }
            </span>
          ) : null}

          {item.suggested_due_text ? (
            <span>
              Due:{" "}
              {
                item.suggested_due_text
              }
            </span>
          ) : null}

          <span>
            {item.confidence}%
            confidence
          </span>
        </div>

        {item.action_description ? (
          <p>
            {
              item.action_description
            }
          </p>
        ) : null}

        {item.source_excerpt ? (
          <details className="pen-e-source-details">
            <summary>
              View transcript evidence
            </summary>

            <blockquote>
              {
                item.source_excerpt
              }
            </blockquote>

            {item.source_timestamp ? (
              <small>
                Transcript time:{" "}
                {
                  item.source_timestamp
                }
              </small>
            ) : null}
          </details>
        ) : null}

        {item.explanation ? (
          <p className="pen-e-intelligence-explanation">
            {
              item.explanation
            }
          </p>
        ) : null}
      </div>

      <ReviewButtons
        table="action"
        id={
          item.action_suggestion_id
        }
        status={
          item.review_status
        }
        onChanged={
          onChanged
        }
      />
    </article>
  );
}

export default function PenESessionDetailPage() {
  const { sessionId } =
    useParams();

  const navigate =
    useNavigate();

  const [detail, setDetail] =
    useState(null);

  const [analysis, setAnalysis] =
    useState(null);

  const [
    analysisScope,
    setAnalysisScope,
  ] = useState(null);

  const [
    selectedRunId,
    setSelectedRunId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [
    loadingAnalysis,
    setLoadingAnalysis,
  ] = useState(false);

  const [
    reanalysing,
    setReanalysing,
  ] = useState(false);

  const [
    reanalysisError,
    setReanalysisError,
  ] = useState("");

  const [
    reanalysisMessage,
    setReanalysisMessage,
  ] = useState("");

  const [error, setError] =
    useState("");

  const loadAnalysis =
    useCallback(
      async (runId) => {
        if (!runId) {
          setAnalysis(null);
          setAnalysisScope(null);
          setSelectedRunId("");
          return;
        }

        setLoadingAnalysis(true);
        setError("");

        try {
          const next =
            await fetchPenEAnalysisRun(
              runId
            );

          setAnalysis(next);

          setSelectedRunId(
            runId
          );

          try {
            const scope =
              await fetchPenETranscriptScope(
                next.run
                  .intake_item_id
              );

            setAnalysisScope(
              scope
            );
          } catch {
            setAnalysisScope(
              null
            );
          }
        } catch (err) {
          setError(
            err.message
          );
        } finally {
          setLoadingAnalysis(
            false
          );
        }
      },
      []
    );

  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const next =
          await fetchPenESessionDetail(
            sessionId
          );

        setDetail(next);

        if (
          next.latestCompletedRun
        ) {
          await loadAnalysis(
            next
              .latestCompletedRun
              .analysis_run_id
          );
        } else {
          setAnalysis(null);
          setAnalysisScope(
            null
          );
          setSelectedRunId("");
        }
      } catch (err) {
        setError(
          err.message
        );
      } finally {
        setLoading(false);
      }
    }, [
      sessionId,
      loadAnalysis,
    ]);

  useEffect(() => {
    load();
  }, [load]);

  async function refreshAnalysis() {
    if (!selectedRunId) {
      return;
    }

    await loadAnalysis(
      selectedRunId
    );
  }

  async function handleReanalyse() {
    const intakeItemId =
      analysis?.run
        ?.intake_item_id ||
      detail
        ?.latestCompletedRun
        ?.intake_item_id ||
      detail?.runs?.find(
        (run) =>
          run.intake_item_id
      )?.intake_item_id;

    if (!intakeItemId) {
      setReanalysisError(
        "No transcript intake item is linked to this session."
      );

      return;
    }

    setReanalysing(true);
    setReanalysisError("");
    setReanalysisMessage("");

    try {
      const result =
        await reanalysePenETranscript(
          intakeItemId
        );

      const next =
        await fetchPenESessionDetail(
          sessionId
        );

      setDetail(next);

      const newRunId =
        result.analysisRunId ||
        next
          .latestCompletedRun
          ?.analysis_run_id;

      if (newRunId) {
        await loadAnalysis(
          newRunId
        );
      }

      setReanalysisMessage(
        "Transcript reanalysis completed. The previous analysis remains in the run history."
      );
    } catch (err) {
      setReanalysisError(
        err.message ||
          "Transcript reanalysis failed."
      );

      try {
        const next =
          await fetchPenESessionDetail(
            sessionId
          );

        setDetail(next);
      } catch {
        // Preserve original
        // reanalysis error.
      }
    } finally {
      setReanalysing(false);
    }
  }

  const reviewStats =
    useMemo(() => {
      if (!analysis) {
        return {
          accepted: 0,
          rejected: 0,
          edited: 0,
          pending: 0,
          total: 0,
        };
      }

      const items = [
        ...(analysis.curriculum ??
          []),
        ...(analysis.evidence ??
          []),
        ...(analysis.actions ??
          []),
      ];

      return {
        total:
          items.length,

        accepted:
          items.filter(
            (item) =>
              item.review_status ===
              "accepted"
          ).length,

        rejected:
          items.filter(
            (item) =>
              item.review_status ===
              "rejected"
          ).length,

        edited:
          items.filter(
            (item) =>
              item.review_status ===
              "edited"
          ).length,

        pending:
          items.filter(
            (item) =>
              item.review_status ===
              "pending_review"
          ).length,
      };
    }, [analysis]);

  const evidenceGroups =
    useMemo(() => {
      const grouped = {};

      for (const item of
        analysis?.evidence ??
        []) {
        const label =
          evidenceGroupLabel(
            item.evidence_type
          );

        if (!grouped[label]) {
          grouped[label] = [];
        }

        grouped[label].push(
          item
        );
      }

      return Object.entries(
        grouped
      ).sort(
        ([a], [b]) =>
          evidenceGroupOrder(a) -
          evidenceGroupOrder(b)
      );
    }, [analysis]);

  const explicitActions =
    useMemo(
      () =>
        (
          analysis?.actions ??
          []
        ).filter(
          (item) =>
            item.action_origin !==
            "pen_e_recommendation"
        ),
      [analysis]
    );

  const recommendedActions =
    useMemo(
      () =>
        (
          analysis?.actions ??
          []
        ).filter(
          (item) =>
            item.action_origin ===
            "pen_e_recommendation"
        ),
      [analysis]
    );

  if (loading) {
    return (
      <div className="portal-loading">
        Loading session
        intelligence…
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div className="portal-alert">
        {error}
      </div>
    );
  }

  if (!detail?.session) {
    return (
      <div className="portal-alert">
        Session not found.
      </div>
    );
  }

  const session =
    detail.session;

  const date =
    session.started_at ||
    session.scheduled_start_at;

  const start =
    session.started_at ||
    session.scheduled_start_at;

  const end =
    session.ended_at ||
    session.scheduled_end_at;

  const duration =
    formatDuration(
      start,
      end
    );

  return (
    <>
      <button
        type="button"
        className="aeos-back-link aeos-back-button"
        onClick={() =>
          navigate(-1)
        }
      >
        ← Back
      </button>

      <section className="aeos-page-heading pen-e-session-heading">
        <div>
          <p className="portal-eyebrow">
            Pen-E / Session
          </p>

          <h2>
            {displayName(
              session.student
            )}
          </h2>

          <p>
            {session.offering
              ?.offering_name ||
              session.offering_id}
          </p>

          <div className="pen-e-session-context-line">
            <span>
              {formatDate(
                date
              )}
            </span>

            <span>
              {formatTime(
                start
              )}
            </span>

            <span>
              {duration}
            </span>

            <span>
              Tutor:{" "}
              {displayName(
                session.tutor
              )}
            </span>
          </div>

          {analysisScope ? (
            <div className="pen-e-analysis-scope">
              <span>
                Analysed level:{" "}
                <strong>
                  {
                    analysisScope.effective_level_id
                  }
                </strong>
              </span>

              {analysisScope
                .resolution_method ===
              "historical_source_level" ? (
                <span className="status-pill">
                  Historical
                  session level
                </span>
              ) : null}

              {analysisScope
                .candidate_count !==
              undefined ? (
                <span>
                  {
                    analysisScope.candidate_count
                  }{" "}
                  curriculum
                  candidates
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="pen-e-session-heading-status">
          <span className="status-pill">
            {
              session.session_status
            }
          </span>

          {analysis ? (
            <span className="status-pill">
              Pen-E Analysed
            </span>
          ) : (
            <span className="status-pill inactive">
              No Analysis
            </span>
          )}

          {analysis ? (
            <span
              className={`status-pill ${
                reviewStats.pending
                  ? "inactive"
                  : ""
              }`}
            >
              {reviewStats.pending
                ? "Review Pending"
                : "Review Complete"}
            </span>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      {reanalysisMessage ? (
        <div className="portal-alert success">
          {
            reanalysisMessage
          }
        </div>
      ) : null}

      {reanalysisError ? (
        <div className="portal-alert">
          <strong>
            Reanalysis failed.
          </strong>

          <p>
            {
              reanalysisError
            }
          </p>

          <small>
            The previous completed
            analysis has not been
            changed.
          </small>
        </div>
      ) : null}

      {loadingAnalysis ? (
        <div className="portal-loading">
          Loading analysis…
        </div>
      ) : null}

      {analysis &&
      !loadingAnalysis ? (
        <>
          <section className="portal-card pen-e-session-insight">
            <div className="pen-e-session-insight-main">
              <p className="portal-eyebrow">
                Session Insight
              </p>

              <h3>
                Pen-E Summary
              </h3>

              <p>
                {
                  analysis.run
                    .session_summary
                }
              </p>
            </div>

            <div className="pen-e-analysis-mini-meta">
              <div>
                <span>
                  Confidence
                </span>

                <strong>
                  {analysis.run
                    .overall_confidence ??
                    "—"}
                  %
                </strong>
              </div>

              <div>
                <span>
                  Analysis
                </span>

                <strong>
                  {analysis.run
                    .model_provider ===
                  "Manual"
                    ? "Manual Pen-E"
                    : analysis.run
                        .model_name ||
                      "Pen-E"}
                </strong>
              </div>

              <div>
                <span>
                  Prompt
                </span>

                <strong>
                  {
                    analysis.run
                      .prompt_version
                  }
                </strong>
              </div>
            </div>

            <div className="pen-e-analysis-controls">
              <button
                type="button"
                className="aeos-button-secondary"
                disabled={
                  reanalysing
                }
                onClick={
                  handleReanalyse
                }
              >
                {reanalysing
                  ? "Reanalysing…"
                  : "Reanalyse Transcript"}
              </button>
            </div>
          </section>

          <section className="portal-card pen-e-review-strip">
            <div>
              <p className="portal-eyebrow">
                Tutor Review
              </p>

              <h3>
                {reviewStats.pending
                  ? "Review In Progress"
                  : "Review Complete"}
              </h3>
            </div>

            <div className="pen-e-review-counts">
              <span>
                <strong>
                  {
                    reviewStats.accepted
                  }
                </strong>

                <small>
                  Accepted
                </small>
              </span>

              <span>
                <strong>
                  {
                    reviewStats.rejected
                  }
                </strong>

                <small>
                  Rejected
                </small>
              </span>

              {reviewStats.edited ? (
                <span>
                  <strong>
                    {
                      reviewStats.edited
                    }
                  </strong>

                  <small>
                    Edited
                  </small>
                </span>
              ) : null}

              <span>
                <strong>
                  {
                    reviewStats.pending
                  }
                </strong>

                <small>
                  Pending
                </small>
              </span>
            </div>
          </section>

          <section className="portal-card">
            <div className="aeos-section-heading">
              <div>
                <p className="portal-eyebrow">
                  Curriculum
                </p>

                <h3>
                  Curriculum
                  Matches
                </h3>
              </div>

              <span>
                {
                  analysis.curriculum
                    .length
                }
              </span>
            </div>

            {analysis.curriculum
              .length ? (
              <div className="pen-e-suggestion-list">
                {analysis.curriculum.map(
                  (item) => {
                    const curriculumUrl =
                      buildCurriculumLink(
                        item.curriculum_node_id,
                        analysisScope
                      );

                    return (
                      <article
                        key={
                          item.curriculum_suggestion_id
                        }
                        className="pen-e-intelligence-item"
                      >
                        <div className="pen-e-intelligence-copy">
                          <div className="pen-e-curriculum-match-heading">
                            <div>
                              <strong>
                                {item.node
                                  ?.node_name ||
                                  item.curriculum_node_id}
                              </strong>

                              <small className="pen-e-curriculum-node-id">
                                {
                                  item.curriculum_node_id
                                }
                              </small>
                            </div>

                            <Link
                              className="pen-e-curriculum-link"
                              to={
                                curriculumUrl
                              }
                            >
                              View in Curriculum
                              <span
                                aria-hidden="true"
                              >
                                →
                              </span>
                            </Link>
                          </div>

                          <div className="pen-e-intelligence-meta">
                            <span>
                              {
                                item.confidence
                              }
                              % confidence
                            </span>

                            {analysisScope
                              ?.effective_level_id ? (
                              <span>
                                Scope:{" "}
                                {
                                  analysisScope.effective_level_id
                                }
                              </span>
                            ) : null}
                          </div>

                          {item.explanation ? (
                            <p>
                              {
                                item.explanation
                              }
                            </p>
                          ) : null}

                          {item.source_excerpt ? (
                            <details className="pen-e-source-details">
                              <summary>
                                View
                                transcript
                                evidence
                              </summary>

                              <blockquote>
                                {
                                  item.source_excerpt
                                }
                              </blockquote>

                              {item.source_timestamp ? (
                                <small>
                                  Transcript
                                  time:{" "}
                                  {
                                    item.source_timestamp
                                  }
                                </small>
                              ) : null}
                            </details>
                          ) : null}
                        </div>

                        <ReviewButtons
                          table="curriculum"
                          id={
                            item.curriculum_suggestion_id
                          }
                          status={
                            item.review_status
                          }
                          onChanged={
                            refreshAnalysis
                          }
                        />
                      </article>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="pen-e-section-empty">
                <p>
                  No curriculum
                  matches recorded.
                </p>

                <small>
                  No canonical
                  curriculum matches
                  were identified for
                  this analysis run.
                </small>
              </div>
            )}
          </section>

          <section className="portal-card">
            <div className="aeos-section-heading">
              <div>
                <p className="portal-eyebrow">
                  Learning
                  Intelligence
                </p>

                <h3>
                  Learning
                  Evidence
                </h3>
              </div>

              <span>
                {
                  analysis.evidence
                    .length
                }
              </span>
            </div>

            {evidenceGroups.length ? (
              <div className="pen-e-evidence-groups">
                {evidenceGroups.map(
                  ([
                    label,
                    items,
                  ]) => (
                    <details
                      key={label}
                      className="pen-e-evidence-group"
                      open
                    >
                      <summary>
                        <span>
                          {label}
                        </span>

                        <strong>
                          {
                            items.length
                          }
                        </strong>
                      </summary>

                      <div className="pen-e-evidence-group-content">
                        {items.map(
                          (item) => (
                            <EvidenceCard
                              key={
                                item.evidence_suggestion_id
                              }
                              item={
                                item
                              }
                              onChanged={
                                refreshAnalysis
                              }
                            />
                          )
                        )}
                      </div>
                    </details>
                  )
                )}
              </div>
            ) : (
              <p>
                No learning
                evidence recorded.
              </p>
            )}
          </section>

          <section className="portal-card">
            <div className="aeos-section-heading">
              <div>
                <p className="portal-eyebrow">
                  Follow-up
                </p>

                <h3>
                  Actions &
                  Commitments
                </h3>
              </div>

              <span>
                {
                  analysis.actions
                    .length
                }
              </span>
            </div>

            {explicitActions.length ? (
              <div className="pen-e-action-section">
                <div className="pen-e-action-section-heading">
                  <h4>
                    Explicit
                    Commitments
                  </h4>

                  <span>
                    {
                      explicitActions.length
                    }
                  </span>
                </div>

                <div className="pen-e-action-list">
                  {explicitActions.map(
                    (item) => (
                      <ActionCard
                        key={
                          item.action_suggestion_id
                        }
                        item={
                          item
                        }
                        onChanged={
                          refreshAnalysis
                        }
                      />
                    )
                  )}
                </div>
              </div>
            ) : null}

            {recommendedActions.length ? (
              <div className="pen-e-action-section">
                <div className="pen-e-action-section-heading">
                  <h4>
                    Pen-E
                    Recommendations
                  </h4>

                  <span>
                    {
                      recommendedActions.length
                    }
                  </span>
                </div>

                <div className="pen-e-action-list">
                  {recommendedActions.map(
                    (item) => (
                      <ActionCard
                        key={
                          item.action_suggestion_id
                        }
                        item={
                          item
                        }
                        onChanged={
                          refreshAnalysis
                        }
                      />
                    )
                  )}
                </div>
              </div>
            ) : null}

            {!analysis.actions.length ? (
              <p>
                No follow-up
                actions recorded.
              </p>
            ) : null}
          </section>
        </>
      ) : null}

      <section className="portal-card">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">
              Pen-E
            </p>

            <h3>
              Analysis History
            </h3>
          </div>

          <span>
            {
              detail.runs.length
            }{" "}
            {detail.runs.length ===
            1
              ? "run"
              : "runs"}
          </span>
        </div>

        {detail.runs.length ? (
          <div className="pen-e-analysis-history-list">
            {detail.runs.map(
              (run, index) => {
                const completed =
                  run.run_status ===
                  "completed";

                const failed =
                  run.run_status ===
                  "failed";

                const current =
                  completed &&
                  run.analysis_run_id ===
                    detail
                      .latestCompletedRun
                      ?.analysis_run_id;

                return (
                  <button
                    key={
                      run.analysis_run_id
                    }
                    type="button"
                    className={[
                      selectedRunId ===
                      run.analysis_run_id
                        ? "active"
                        : "",
                      failed
                        ? "failed"
                        : "",
                    ]
                      .filter(
                        Boolean
                      )
                      .join(" ")}
                    disabled={
                      !completed
                    }
                    onClick={() => {
                      if (
                        completed
                      ) {
                        loadAnalysis(
                          run.analysis_run_id
                        );
                      }
                    }}
                  >
                    <div>
                      <strong>
                        {current
                          ? "Current Analysis"
                          : `Analysis Run ${
                              detail
                                .runs
                                .length -
                              index
                            }`}
                      </strong>

                      <span>
                        {
                          run.model_provider
                        }
                        {" · "}
                        {
                          run.prompt_version
                        }
                      </span>

                      <span
                        className={`pen-e-run-status ${run.run_status}`}
                      >
                        {runStatusLabel(
                          run.run_status
                        )}
                      </span>

                      {failed &&
                      run.error_message ? (
                        <small>
                          {
                            run.error_message
                          }
                        </small>
                      ) : null}
                    </div>

                    <small>
                      {formatDateTime(
                        run.completed_at ||
                          run.created_at
                      )}
                    </small>
                  </button>
                );
              }
            )}
          </div>
        ) : (
          <div className="aeos-empty-state">
            <h3>
              No Pen-E analysis
              yet
            </h3>

            <p>
              This session has not
              yet received a Pen-E
              analysis.
            </p>
          </div>
        )}
      </section>

      {analysis ? (
        <section className="portal-card">
          <div className="aeos-section-heading">
            <div>
              <p className="portal-eyebrow">
                Source & Metadata
              </p>

              <h3>
                Analysis
                Information
              </h3>
            </div>
          </div>

          <dl className="aeos-details">
            <div>
              <dt>
                Provider
              </dt>

              <dd>
                {
                  analysis.run
                    .model_provider
                }
              </dd>
            </div>

            <div>
              <dt>
                Model
              </dt>

              <dd>
                {
                  analysis.run
                    .model_name
                }
              </dd>
            </div>

            <div>
              <dt>
                Prompt
              </dt>

              <dd>
                {
                  analysis.run
                    .prompt_version
                }
              </dd>
            </div>

            <div>
              <dt>
                Status
              </dt>

              <dd>
                {runStatusLabel(
                  analysis.run
                    .run_status
                )}
              </dd>
            </div>

            <div>
              <dt>
                Completed
              </dt>

              <dd>
                {formatDateTime(
                  analysis.run
                    .completed_at
                )}
              </dd>
            </div>

            {analysisScope ? (
              <>
                <div>
                  <dt>
                    Analysis Level
                  </dt>

                  <dd>
                    {
                      analysisScope.effective_level_id
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Scope Method
                  </dt>

                  <dd>
                    {
                      analysisScope.resolution_method
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Candidate Set
                  </dt>

                  <dd>
                    {
                      analysisScope.candidate_count
                    }
                  </dd>
                </div>
              </>
            ) : null}
          </dl>

          <div className="pen-e-source-footer">
            <p>
              The original
              transcript remains in
              Learning Intake.
              Pen-E displays the
              interpreted learning
              intelligence produced
              from that source.
            </p>

            <Link
              className="aeos-button-secondary"
              to="/portal/admin/transcripts"
            >
              View Learning
              Intake
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}


