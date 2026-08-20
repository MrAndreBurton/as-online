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
  fetchPenEAnalyzeWorkspace,
} from "../../../lib/penEAnalyzeQueue";

import {
  fetchManualPenEContext,
} from "../../../lib/manualPenEContext";

import {
  buildManualPenEPackage,
  MANUAL_PEN_E_PROMPT_VERSION,
} from "../../../lib/manualPenEPrompt";

import {
  importManualPenEAnalysis,
} from "../../../lib/historyIntake";

import "../../../styles/penEAnalyze.css";

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

  return new Date(value)
    .toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
}

const EMPTY_JSON = `{
  "session_summary": "",
  "overall_confidence": 0,
  "curriculum_matches": [],
  "evidence": [],
  "actions": []
}`;

export default function PenEAnalyzeWorkspacePage() {
  const { intakeItemId } =
    useParams();

  const navigate =
    useNavigate();

  const [workspace, setWorkspace] =
    useState(null);

  const [context, setContext] =
    useState(null);

  const [jsonText, setJsonText] =
    useState(EMPTY_JSON);

  const [loading, setLoading] =
    useState(true);

  const [working, setWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [copyMessage, setCopyMessage] =
    useState("");

  const [validation, setValidation] =
    useState(null);

  const load =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const [
          workspaceResult,
          contextResult,
        ] = await Promise.all([
          fetchPenEAnalyzeWorkspace(
            intakeItemId
          ),

          fetchManualPenEContext(
            intakeItemId
          ),
        ]);

        setWorkspace(
          workspaceResult
        );

        setContext(
          contextResult
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, [intakeItemId]);

  useEffect(() => {
    load();
  }, [load]);

  const manualPackage =
    useMemo(
      () =>
        context
          ? buildManualPenEPackage(
              context
            )
          : "",
      [context]
    );

  async function copyPackage() {
    if (!manualPackage) return;

    setCopyMessage("");
    setError("");

    try {
      await navigator.clipboard.writeText(
        manualPackage
      );

      setCopyMessage(
        `Copied ${MANUAL_PEN_E_PROMPT_VERSION} package. Paste it into ChatGPT.`
      );
    } catch {
      setError(
        "Unable to copy automatically. Your browser may be blocking clipboard access."
      );
    }
  }

  function validateJson() {
    setValidation(null);
    setError("");

    try {
      const parsed =
        JSON.parse(jsonText);

      if (
        !parsed.session_summary?.trim()
      ) {
        throw new Error(
          "session_summary is required."
        );
      }

      const next = {
        valid: true,
        curriculum:
          parsed.curriculum_matches
            ?.length ?? 0,
        evidence:
          parsed.evidence?.length ??
          0,
        actions:
          parsed.actions?.length ??
          0,
      };

      setValidation(next);

      return parsed;
    } catch (err) {
      setValidation(null);

      setError(
        err instanceof SyntaxError
          ? "The pasted analysis is not valid JSON."
          : err.message
      );

      return null;
    }
  }

  async function saveAnalysis() {
    const parsed =
      validateJson();

    if (!parsed) return;

    setWorking(true);
    setError("");

    try {
      await importManualPenEAnalysis(
        intakeItemId,
        parsed
      );

      navigate(
        `/portal/admin/pen-e/sessions/${workspace.session_id}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <div className="portal-loading">
        Loading Pen-E analysis workspace…
      </div>
    );
  }

  if (error && !workspace) {
    return (
      <div className="portal-alert">
        {error}
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="portal-alert">
        Learning Intake item not found.
      </div>
    );
  }

  const session =
    workspace.session;

  const date =
    session?.started_at ||
    session?.scheduled_start_at;

  return (
    <>
      <Link
        className="aeos-back-link"
        to="/portal/admin/pen-e/analyze"
      >
        ← Back to Analyze Queue
      </Link>

      <section className="aeos-page-heading">
        <div>
          <p className="portal-eyebrow">
            Pen-E / Analyze
          </p>

          <h2>
            {displayName(
              session?.student
            )}
          </h2>

          <p>
            {session?.offering
              ?.offering_name ||
              workspace.offering_id}
          </p>
        </div>

        <span className="status-pill">
          Ready for Analysis
        </span>
      </section>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      <section className="portal-card">
        <p className="portal-eyebrow">
          Session Context
        </p>

        <h3>
          Analysis Source
        </h3>

        <dl className="aeos-details">
          <div>
            <dt>Session</dt>
            <dd>
              {formatDateTime(
                date
              )}
            </dd>
          </div>

          <div>
            <dt>Student</dt>
            <dd>
              {displayName(
                session?.student
              )}
            </dd>
          </div>

          <div>
            <dt>Offering</dt>
            <dd>
              {session?.offering
                ?.offering_name ||
                "—"}
            </dd>
          </div>

          <div>
            <dt>Tutor</dt>
            <dd>
              {displayName(
                session?.tutor
              )}
            </dd>
          </div>

          <div>
            <dt>Source</dt>
            <dd>
              {
                workspace.source_provider
              }
            </dd>
          </div>

          <div>
            <dt>File</dt>
            <dd>
              {
                workspace.source_name ||
                "—"
              }
            </dd>
          </div>
        </dl>
      </section>

      <section className="portal-card pen-e-analyze-step">
        <div className="pen-e-analyze-step-heading">
          <div>
            <p className="portal-eyebrow">
              Step 1
            </p>

            <h3>
              Copy Manual Pen-E Package
            </h3>

            <p>
              AEOS prepares the transcript,
              session context, curriculum
              scope and allowed Pen-E output
              schema.
            </p>
          </div>

          <span className="status-pill">
            {
              MANUAL_PEN_E_PROMPT_VERSION
            }
          </span>
        </div>

        {context ? (
          <div className="pen-e-analyze-package-stats">
            <span>
              <strong>
                {
                  context.curriculumNodes
                    .length
                }
              </strong>
              <small>
                curriculum nodes
              </small>
            </span>

            <span>
              <strong>
                {context.wordCount.toLocaleString()}
              </strong>
              <small>
                transcript words
              </small>
            </span>

            <span>
              <strong>
                {context.durationMinutes ??
                  "—"}
              </strong>
              <small>
                minutes
              </small>
            </span>
          </div>
        ) : null}

        <button
          type="button"
          className="aeos-button-primary"
          onClick={copyPackage}
          disabled={!manualPackage}
        >
          Copy Manual Pen-E Package
        </button>

        {copyMessage ? (
          <div className="aeos-success">
            {copyMessage}
          </div>
        ) : null}
      </section>

      <section className="portal-card pen-e-analyze-step">
        <div>
          <p className="portal-eyebrow">
            Step 2
          </p>

          <h3>
            Paste Pen-E JSON
          </h3>

          <p>
            Paste only the valid JSON
            returned by ChatGPT.
          </p>
        </div>

        <textarea
          className="pen-e-analyze-json"
          rows={24}
          value={jsonText}
          onChange={(event) => {
            setJsonText(
              event.target.value
            );

            setValidation(null);
          }}
          spellCheck={false}
        />

        <div className="pen-e-analyze-actions">
          <button
            type="button"
            className="aeos-button-secondary"
            onClick={validateJson}
            disabled={working}
          >
            Validate JSON
          </button>

          <button
            type="button"
            className="aeos-button-primary"
            onClick={saveAnalysis}
            disabled={working}
          >
            {working
              ? "Saving…"
              : "Save for Tutor Review"}
          </button>
        </div>

        {validation?.valid ? (
          <div className="pen-e-validation-panel">
            <strong>
              ✓ Valid Pen-E JSON
            </strong>

            <span>
              {
                validation.curriculum
              }{" "}
              curriculum matches
            </span>

            <span>
              {
                validation.evidence
              }{" "}
              evidence items
            </span>

            <span>
              {
                validation.actions
              }{" "}
              actions
            </span>
          </div>
        ) : null}
      </section>
    </>
  );
}


