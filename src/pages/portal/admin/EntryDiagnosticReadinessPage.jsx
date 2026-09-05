import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAiDigitalDiagnosticReadiness } from "../../../lib/aiDigitalDiagnostic";

const DOMAIN_NODES = {
  "Digital Foundations": [
    "ADR-DF01",
    "ADR-DF02",
    "ADR-DF03",
    "ADR-DF04",
    "ADR-DF05",
    "ADR-DF06",
    "ADR-DF07",
    "ADR-DF08",
    "ADR-DF09",
    "ADR-DF10",
    "ADR-DF11",
    "ADR-DF12",
  ],

  "School Productivity Skills": [
    "ADR-SP01",
    "ADR-SP02",
    "ADR-SP03",
    "ADR-SP04",
    "ADR-SP05",
    "ADR-SP06",
    "ADR-SP07",
    "ADR-SP08",
    "ADR-SP09",
  ],

  "AI for Learning": [
    "ADR-AI01",
    "ADR-AI02",
    "ADR-AI03",
    "ADR-AI04",
    "ADR-AI05",
    "ADR-AI06",
    "ADR-AI07",
    "ADR-AI08",
    "ADR-AI09",
    "ADR-AI10",
  ],
};

const UNSAMPLED = new Set([
  "ADR-DF01",
  "ADR-DF04",
  "ADR-SP05",
  "ADR-SP06",
  "ADR-AI01",
  "ADR-AI09",
]);

function stateFor(node) {
  if (!node || UNSAMPLED.has(node.code)) {
    return "Not Assessed";
  }

  const independence =
    node.independence ??
    node.independence_level;

  if (
    node.capture_status === "demonstrated" &&
    node.node_score === 2 &&
    independence === "independent"
  ) {
    return "Independent Demonstration";
  }

  if (
    node.capture_status === "partial" ||
    node.node_score === 1
  ) {
    return "Partial / Supported Demonstration";
  }

  if (
    node.capture_status === "not_demonstrated" ||
    node.node_score === 0
  ) {
    return "Not Demonstrated Yet";
  }

  return "Not Assessed";
}

export default function EntryDiagnosticReadinessPage() {
  const { studentId, attemptId } = useParams();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getAiDigitalDiagnosticReadiness(attemptId)
      .then((next) => {
        if (active) {
          setData(next);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, [attemptId]);

  const nodeMap = useMemo(
    () =>
      new Map(
        (data?.snapshot?.nodes || []).map((node) => [
          node.code,
          node,
        ])
      ),
    [data]
  );

  if (!data && !error) {
    return (
      <div className="portal-loading">
        Loading readiness profile…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="portal-alert">
        {error}
      </div>
    );
  }

  const counts = data.snapshot?.counts || {};

  const optionalObserved = (
    data.snapshot?.nodes || []
  ).filter(
    (node) =>
      node.role === "optional" &&
      ["partial", "demonstrated"].includes(
        node.capture_status
      )
  ).length;

  return (
    <>
      <Link
        className="aeos-back-link"
        to={`/portal/admin/students/${studentId}`}
      >
        ← Back to Student
      </Link>

      <section className="diagnostic-page-heading">
        <div>
          <p className="portal-eyebrow">
            Initial Readiness Profile
          </p>

          <h2>
            {data.student?.display_name}
          </h2>

          <p>
            Form 1 AI & Digital Readiness · Completed{" "}
            {data.attempt?.completed_at
              ? new Date(
                  data.attempt.completed_at
                ).toLocaleString()
              : "—"}
          </p>
        </div>
      </section>

      <div className="portal-grid diagnostic-summary-grid">
        <section className="portal-card">
          <span className="metric-value">
            {counts.core_demonstrated ?? 0}
          </span>

          <span className="metric-label">
            Core demonstrated
          </span>
        </section>

        <section className="portal-card">
          <span className="metric-value">
            {counts.partial ?? 0}
          </span>

          <span className="metric-label">
            Partial
          </span>
        </section>

        <section className="portal-card">
          <span className="metric-value">
            {counts.not_demonstrated ?? 0}
          </span>

          <span className="metric-label">
            Not demonstrated
          </span>
        </section>

        <section className="portal-card">
          <span className="metric-value">
            {optionalObserved}
          </span>

          <span className="metric-label">
            Optional behaviours observed
          </span>
        </section>

        <section className="portal-card">
          <span className="metric-value">
            {counts.approved_evidence ?? 0}
          </span>

          <span className="metric-label">
            Approved evidence records
          </span>
        </section>
      </div>

      {Object.entries(DOMAIN_NODES).map(
        ([domain, codes]) => (
          <section
            className="portal-card diagnostic-readiness-domain"
            key={domain}
          >
            <p className="portal-eyebrow">
              Domain
            </p>

            <h3>{domain}</h3>

            <div className="diagnostic-readiness-list">
              {codes.map((code) => {
                const node =
                  nodeMap.get(code);

                const state =
                  stateFor(
                    node || { code }
                  );

                const stateClass =
                  state
                    .toLowerCase()
                    .replace(
                      /[^a-z]+/g,
                      "-"
                    )
                    .replace(
                      /^-|-$/g,
                      ""
                    );

                return (
                  <div
                    className="diagnostic-readiness-row"
                    key={code}
                  >
                    <div>
                      <strong>
                        {code}
                      </strong>

                      {node?.role ? (
                        <span>
                          {node.role}
                        </span>
                      ) : null}
                    </div>

                    <span
                      className={`diagnostic-readiness-state state-${stateClass}`}
                    >
                      {state}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )
      )}

      <section className="portal-card diagnostic-context-card">
        <p className="portal-eyebrow">
          Evidence & Mastery Context
        </p>

        <h3>
          Readiness and mastery are different
        </h3>

        <p>
          This profile records what was observed
          during the entry diagnostic. Mastery
          develops from approved evidence over time
          and remains governed separately.
        </p>
      </section>
    </>
  );
}

