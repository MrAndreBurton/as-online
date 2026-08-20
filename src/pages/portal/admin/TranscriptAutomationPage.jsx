import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  fetchTranscriptCandidateSessions,
  fetchTranscriptReviewQueue,
  manualMatchTranscript,
} from "../../../lib/transcriptAutomation";

import {
  recoverWorkspaceSubscription,
  renewWorkspaceSubscription,
  checkWorkspaceOperation,
} from "../../../lib/workspaceEventsAdmin";

import TranscriptImportModal from "../../../components/intake/TranscriptImportModal";

import ManualPenEAnalysisModal from "../../../components/pen-e/ManualPenEAnalysisModal";

import {
  fetchRecentLearningIntake,
} from "../../../lib/learningIntake";

import "../../../styles/transcriptAutomation.css";
import "../../../styles/learningIntake.css";
import "../../../styles/historyIntake.css";

import "../../../styles/manualPenEV2.css";

const studentName = (student) =>
  student?.display_name ||
  [
    student?.first_name,
    student?.last_name,
  ]
    .filter(Boolean)
    .join(" ") ||
  "Student";

function intakeStatusLabel(status) {
  switch (status) {
    case "ready_for_ai":
      return "Ready for analysis";

    case "completed":
      return "Analysis complete";

    case "imported":
      return "Imported";

    case "pending":
      return "Pending";

    case "failed":
      return "Failed";

    default:
      return status
        ? status
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) =>
              letter.toUpperCase()
            )
        : "Unknown";
  }
}

export default function TranscriptAutomationPage() {
  const [items, setItems] =
    useState([]);

  const [candidates, setCandidates] =
    useState({});

  const [selection, setSelection] =
    useState({});

  const [recentIntake, setRecentIntake] =
    useState([]);

  const [importOpen, setImportOpen] =
    useState(false);

  // Transcript selected for manual
  // Pen-E JSON import.
  const [manualItem, setManualItem] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState("");

  const [
    pendingOperation,
    setPendingOperation,
  ] = useState("");

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        queueRows,
        intakeRows,
      ] = await Promise.all([
        fetchTranscriptReviewQueue(),
        fetchRecentLearningIntake(),
      ]);

      setItems(queueRows);
      setRecentIntake(intakeRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function loadCandidates(item) {
    setWorking(
      item.ingestion_item_id
    );

    setError("");
    setMessage("");

    try {
      const rows =
        await fetchTranscriptCandidateSessions(
          item
        );

      setCandidates((current) => ({
        ...current,

        [item.ingestion_item_id]:
          rows,
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking("");
    }
  }

  async function matchTranscript(item) {
    const sessionId =
      selection[
        item.ingestion_item_id
      ];

    if (!sessionId) {
      return;
    }

    setWorking(
      item.ingestion_item_id
    );

    setError("");
    setMessage("");

    try {
      await manualMatchTranscript(
        item.ingestion_item_id,
        sessionId
      );

      setMessage(
        "Transcript matched and is ready for analysis."
      );

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking("");
    }
  }

  async function recoverSubscription() {
    setWorking("recover");
    setError("");
    setMessage("");

    try {
      const result =
        await recoverWorkspaceSubscription();

      const subscription =
        result.subscription;

      setMessage(
        `Subscription recovered: ${
          subscription?.name ||
          "Unknown subscription"
        } · ${
          subscription?.state ||
          "State unavailable"
        } · Expires ${
          subscription?.expireTime
            ? new Date(
                subscription.expireTime
              ).toLocaleString()
            : "Unknown"
        }`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking("");
    }
  }

  async function renewSubscription() {
    setWorking("renew");
    setError("");
    setMessage("");

    try {
      const result =
        await renewWorkspaceSubscription();

      if (result.operationName) {
        setPendingOperation(
          result.operationName
        );

        setMessage(
          "Renewal started. Google is processing the operation."
        );
      } else {
        setMessage(
          "Renewal request was accepted."
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking("");
    }
  }

  async function checkRenewal() {
    if (!pendingOperation) {
      return;
    }

    setWorking("check");
    setError("");
    setMessage("");

    try {
      const result =
        await checkWorkspaceOperation(
          pendingOperation
        );

      if (result.pending) {
        setMessage(
          "Google is still processing the renewal."
        );

        return;
      }

      const subscription =
        result.subscription;

      setPendingOperation("");

      setMessage(
        `Renewal complete: ${
          subscription?.state ||
          "ACTIVE"
        } · Expires ${
          subscription?.expireTime
            ? new Date(
                subscription.expireTime
              ).toLocaleString()
            : "Unknown"
        }`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking("");
    }
  }

  async function handleManualAnalysisImported(
    runId
  ) {
    setManualItem(null);

    setMessage(
      "Manual Pen-E analysis saved. It is now available in Pen-E for Tutor Review."
    );

    await load();

    return runId;
  }

  return (
    <>
      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Learning Intake Engine
          </p>

          <h2>
            Transcript Intake
          </h2>

          <p>
            Automatic Google Meet
            transcripts and manual
            imports enter AEOS here.
            Raw transcripts remain in
            Learning Intake while
            completed learning analyses
            move into Pen-E.
          </p>
        </div>

        <button
          type="button"
          className="aeos-button-primary"
          onClick={() =>
            setImportOpen(true)
          }
        >
          Import Transcript
        </button>
      </section>

      <section className="portal-card transcript-subscription-card">
        <p className="portal-eyebrow">
          Google Workspace Events
        </p>

        <h3>
          Automatic Google Meet Intake
        </h3>

        <p>
          AEOS listens for Google Meet
          transcript generation events
          and imports transcripts
          automatically.
        </p>

        <div className="transcript-actions">
          <button
            type="button"
            className="aeos-button-primary"
            onClick={
              recoverSubscription
            }
            disabled={
              Boolean(working)
            }
          >
            {working === "recover"
              ? "Recovering…"
              : "Recover Subscription"}
          </button>

          <button
            type="button"
            className="aeos-button-secondary"
            onClick={
              renewSubscription
            }
            disabled={
              Boolean(working)
            }
          >
            {working === "renew"
              ? "Starting Renewal…"
              : "Renew Subscription"}
          </button>

          {pendingOperation ? (
            <button
              type="button"
              className="aeos-button-secondary"
              onClick={
                checkRenewal
              }
              disabled={
                Boolean(working)
              }
            >
              {working === "check"
                ? "Checking…"
                : "Check Renewal"}
            </button>
          ) : null}
        </div>
      </section>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="aeos-success">
          {message}
        </div>
      ) : null}

      <section className="portal-card">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">
              Learning Intake Engine
            </p>

            <h3>
              Recent Intake
            </h3>
          </div>

          <span>
            {recentIntake.length} item
            {recentIntake.length === 1
              ? ""
              : "s"}
          </span>
        </div>

        {loading ? (
          <div className="portal-loading">
            Loading recent intake…
          </div>
        ) : recentIntake.length ? (
          <div className="transcript-review-list">
            {recentIntake.map(
              (item) => {
                const readyForAnalysis =
                  item.processing_status ===
                  "ready_for_ai";

                const analysisComplete =
                  item.processing_status ===
                  "completed";

                return (
                  <article
                    key={
                      item.intake_item_id
                    }
                    className="transcript-review-item"
                  >
                    <div>
                      <strong>
                        {studentName(
                          item.student
                        )}
                      </strong>

                      <p>
                        {item.offering
                          ?.offering_name ||
                          "No Offering"}
                      </p>

                      <p>
                        {item.intake_type} ·{" "}
                        {item.source_name ||
                          item.source_provider}
                      </p>

                      <p>
                        Status:{" "}
                        <strong>
                          {intakeStatusLabel(
                            item.processing_status
                          )}
                        </strong>
                      </p>

                      <p>
                        {item.received_at
                          ? new Date(
                              item.received_at
                            ).toLocaleString()
                          : "Date unavailable"}
                      </p>
                    </div>

                    <div className="transcript-actions">
                      {readyForAnalysis ? (
                        <button
                          type="button"
                          className="aeos-button-primary"
                          onClick={() =>
                            setManualItem(
                              item
                            )
                          }
                        >
                          Enter Analysis Manually
                        </button>
                      ) : null}

                      {analysisComplete ? (
                        <span className="status-pill">
                          Analysis Complete
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          <div className="aeos-empty-state">
            <h3>
              No intake yet
            </h3>

            <p>
              Imported and automatically
              captured learning data will
              appear here.
            </p>
          </div>
        )}
      </section>

      <section className="portal-card">
        <div className="aeos-section-heading">
          <div>
            <p className="portal-eyebrow">
              Admin Fallback
            </p>

            <h3>
              Unmatched / Ambiguous
              Transcripts
            </h3>
          </div>

          <span>
            {items.length} waiting
          </span>
        </div>

        {loading ? (
          <div className="portal-loading">
            Loading transcript queue…
          </div>
        ) : items.length ? (
          <div className="transcript-review-list">
            {items.map((item) => {
              const rows =
                candidates[
                  item.ingestion_item_id
                ] ?? [];

              return (
                <article
                  key={
                    item.ingestion_item_id
                  }
                  className="transcript-review-item"
                >
                  <div>
                    <strong>
                      {item.match_status}
                    </strong>

                    <p>
                      Conference:{" "}
                      {item.conference_start_at
                        ? new Date(
                            item.conference_start_at
                          ).toLocaleString()
                        : "Unknown time"}
                    </p>

                    <p>
                      {item.word_count
                        ?.toLocaleString() ||
                        0}{" "}
                      words
                    </p>

                    <p>
                      {
                        item.google_transcript_name
                      }
                    </p>
                  </div>

                  {!rows.length ? (
                    <button
                      type="button"
                      className="aeos-button-secondary"
                      disabled={
                        working ===
                        item.ingestion_item_id
                      }
                      onClick={() =>
                        loadCandidates(
                          item
                        )
                      }
                    >
                      {working ===
                      item.ingestion_item_id
                        ? "Searching…"
                        : "Find Candidate Sessions"}
                    </button>
                  ) : (
                    <div className="transcript-match-form">
                      <select
                        value={
                          selection[
                            item
                              .ingestion_item_id
                          ] || ""
                        }
                        onChange={(
                          event
                        ) =>
                          setSelection(
                            (
                              current
                            ) => ({
                              ...current,

                              [item.ingestion_item_id]:
                                event
                                  .target
                                  .value,
                            })
                          )
                        }
                      >
                        <option value="">
                          Choose Session
                        </option>

                        {rows.map(
                          (session) => (
                            <option
                              key={
                                session.session_id
                              }
                              value={
                                session.session_id
                              }
                            >
                              {studentName(
                                session.student
                              )}{" "}
                              —{" "}
                              {
                                session
                                  .offering
                                  ?.offering_name
                              }{" "}
                              —{" "}
                              {new Date(
                                session.scheduled_start_at
                              ).toLocaleString()}
                            </option>
                          )
                        )}
                      </select>

                      <button
                        type="button"
                        className="aeos-button-primary"
                        disabled={
                          !selection[
                            item
                              .ingestion_item_id
                          ] ||
                          working ===
                            item
                              .ingestion_item_id
                        }
                        onClick={() =>
                          matchTranscript(
                            item
                          )
                        }
                      >
                        Match Transcript
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="aeos-empty-state">
            <h3>
              Queue clear
            </h3>

            <p>
              No unmatched or ambiguous
              transcripts need review.
            </p>
          </div>
        )}
      </section>

      <TranscriptImportModal
        open={importOpen}
        onClose={() =>
          setImportOpen(false)
        }
        onImported={load}
      />

      <ManualPenEAnalysisModal
        open={Boolean(manualItem)}
        intakeItem={manualItem}
        onClose={() =>
          setManualItem(null)
        }
        onImported={
          handleManualAnalysisImported
        }
      />
    </>
  );
}

