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
  const navigate = useNavigate();

  const [detail, setDetail] =
    useState(null);

  const [analysis, setAnalysis] =
    useState(null);

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

  const [error, setError] =
    useState("");

  const loadAnalysis =
    useCallback(
      async (runId) => {
        if (!runId) {
          setAnalysis(null);
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
        onClick={() => navigate(-1)}
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
              {formatDate(date)}
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
                        .model_name}
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
                  Curriculum Matches
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
                  (item) => (
                    <article
                      key={
                        item.curriculum_suggestion_id
                      }
                      className="pen-e-intelligence-item"
                    >
                      <div className="pen-e-intelligence-copy">
                        <strong>
                          {item.node
                            ?.node_name ||
                            item.curriculum_node_id}
                        </strong>

                        <div className="pen-e-intelligence-meta">
                          <span>
                            {item.confidence}%
                            confidence
                          </span>
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
                              View transcript
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
                  )
                )}
              </div>
            ) : (
              <div className="pen-e-section-empty">
                <p>
                  No curriculum
                  matches recorded.
                </p>

                <small>
                  Curriculum
                  intelligence will
                  become more detailed
                  as AEOS curriculum
                  nodes are expanded.
                </small>
              </div>
            )}
          </section>

          <section className="portal-card">
            <div className="aeos-section-heading">
              <div>
                <p className="portal-eyebrow">
                  Learning Intelligence
                </p>

                <h3>
                  Learning Evidence
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
              detail
                .completedRuns
                .length
            }{" "}
            completed
          </span>
        </div>

        {detail.completedRuns.length ? (
          <div className="pen-e-analysis-history-list">
            {detail.completedRuns.map(
              (run, index) => (
                <button
                  key={
                    run.analysis_run_id
                  }
                  type="button"
                  className={
                    selectedRunId ===
                    run.analysis_run_id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    loadAnalysis(
                      run.analysis_run_id
                    )
                  }
                >
                  <div>
                    <strong>
                      {index === 0
                        ? "Current Analysis"
                        : `Previous Analysis ${index}`}
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
                  </div>

                  <small>
                    {formatDateTime(
                      run.completed_at ||
                        run.created_at
                    )}
                  </small>
                </button>
              )
            )}
          </div>
        ) : (
          <div className="aeos-empty-state">
            <h3>
              No Pen-E analysis yet
            </h3>

            <p>
              This session has not
              yet received a
              completed Pen-E
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
                Analysis Information
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
                Completed
              </dt>

              <dd>
                {formatDateTime(
                  analysis.run
                    .completed_at
                )}
              </dd>
            </div>
          </dl>

          <div className="pen-e-source-footer">
            <p>
              The original transcript
              remains in Learning
              Intake. Pen-E displays the
              interpreted learning
              intelligence produced from
              that source.
            </p>

            <Link
              className="aeos-button-secondary"
              to="/portal/admin/transcripts"
            >
              View Learning Intake
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}

