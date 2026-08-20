import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  fetchPenEOverviewMetrics,
} from "../../../lib/penEOverview";

import "../../../styles/penEOverview.css";

const EMPTY_METRICS = {
  sessions: 0,
  students: 0,
  hoursTutored: 0,
  analysed: 0,
  awaitingAnalysis: 0,
  pendingReview: 0,
  analysisCoveragePercent: 0,
};

function MetricCard({
  value,
  label,
  detail,
  icon,
}) {
  return (
    <article className="pen-e-metric-card">
      <div className="pen-e-metric-icon">
        {icon}
      </div>

      <div>
        <strong className="pen-e-metric-value">
          {value}
        </strong>

        <span className="pen-e-metric-label">
          {label}
        </span>

        {detail ? (
          <small>{detail}</small>
        ) : null}
      </div>
    </article>
  );
}

function NavigationCard({
  eyebrow,
  title,
  description,
  value,
  valueLabel,
  to,
  icon,
  disabled = false,
}) {
  const content = (
    <>
      <div className="pen-e-nav-card-top">
        <div className="pen-e-nav-card-icon">
          {icon}
        </div>

        {value !== undefined ? (
          <div className="pen-e-nav-card-count">
            <strong>{value}</strong>
            <span>{valueLabel}</span>
          </div>
        ) : null}
      </div>

      <div className="pen-e-nav-card-copy">
        <p className="portal-eyebrow">
          {eyebrow}
        </p>

        <h3>{title}</h3>

        <p>{description}</p>
      </div>

      <span className="pen-e-nav-card-link">
        {disabled
          ? "Coming soon"
          : "Open →"}
      </span>
    </>
  );

  if (disabled) {
    return (
      <article className="pen-e-nav-card disabled">
        {content}
      </article>
    );
  }

  return (
    <Link
      to={to}
      className="pen-e-nav-card"
    >
      {content}
    </Link>
  );
}

export default function PenEPage() {
  const [metrics, setMetrics] =
    useState(EMPTY_METRICS);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const next =
        await fetchPenEOverviewMetrics();

      setMetrics(next);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load Pen-E overview."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const analysedCoverageText =
    `${metrics.analysed} of ${metrics.sessions} completed sessions analysed`;

  return (
    <>
      <section className="aeos-page-heading pen-e-overview-heading">
        <div>
          <p className="portal-eyebrow">
            Pen-E
          </p>

          <h2>
            Learning Intelligence
          </h2>

          <p>
            A high-level view of tutoring
            activity, Pen-E processing and
            learning intelligence across AEOS.
          </p>
        </div>
      </section>

      {error ? (
        <div className="portal-alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="portal-loading">
          Loading Pen-E overview…
        </div>
      ) : (
        <>
          <section className="pen-e-metric-grid">
            <MetricCard
              icon="◫"
              value={metrics.sessions}
              label="Sessions"
              detail="Completed tutoring sessions"
            />

            <MetricCard
              icon="◎"
              value={metrics.students}
              label="Students"
              detail="Students represented"
            />

            <MetricCard
              icon="◷"
              value={metrics.hoursTutored.toFixed(
                1
              )}
              label="Hours Tutored"
              detail="Completed session time"
            />

            <MetricCard
              icon="✓"
              value={metrics.analysed}
              label="Analysed"
              detail="Sessions with Pen-E analysis"
            />

            <MetricCard
              icon="◇"
              value={
                metrics.awaitingAnalysis
              }
              label="Awaiting Analysis"
              detail="Ready for Pen-E"
            />

            <MetricCard
              icon="!"
              value={
                metrics.pendingReview
              }
              label="Pending Review"
              detail="Sessions requiring tutor review"
            />
          </section>

          <section className="portal-card pen-e-processing-card">
            <div>
              <p className="portal-eyebrow">
                Pen-E Processing
              </p>

              <h3>
                Analysis Coverage
              </h3>

              <p>
                {analysedCoverageText}
              </p>
            </div>

            <div className="pen-e-coverage-display">
              <strong>
                {
                  metrics.analysisCoveragePercent
                }
                %
              </strong>

              <span>
                analysis coverage
              </span>
            </div>

            <div
              className="pen-e-coverage-track"
              aria-hidden="true"
            >
              <span
                style={{
                  width: `${Math.min(
                    metrics.analysisCoveragePercent,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="pen-e-processing-summary">
              <span>
                <strong>
                  {
                    metrics.awaitingAnalysis
                  }
                </strong>
                Awaiting analysis
              </span>

              <span>
                <strong>
                  {
                    metrics.pendingReview
                  }
                </strong>
                Require review
              </span>
            </div>
          </section>

          <section className="pen-e-navigation-section">
            <div className="aeos-section-heading">
              <div>
                <p className="portal-eyebrow">
                  Explore Pen-E
                </p>

                <h3>
                  Learning Intelligence
                </h3>
              </div>
            </div>

            <div className="pen-e-navigation-grid">
              <NavigationCard
                eyebrow="Tutoring"
                title="Sessions"
                description="Browse tutoring sessions and open Pen-E intelligence for individual sessions."
                value={metrics.sessions}
                valueLabel="sessions"
                icon="▤"
                to="/portal/admin/pen-e/sessions"
              />

              <NavigationCard
                eyebrow="Learning"
                title="Students"
                description="Explore students and their tutoring history across AEOS."
                value={metrics.students}
                valueLabel="students"
                icon="◎"
                to="/portal/admin/pen-e/students"
              />

              <NavigationCard
                eyebrow="Teaching"
                title="Tutors"
                description="Browse tutoring activity and Pen-E intelligence by tutor."
                icon="◇"
                to="/portal/admin/pen-e/tutors"
              />

              <NavigationCard
                eyebrow="Processing"
                title="Analyze"
                description="Open learning intake that is ready to be analysed by Pen-E."
                value={
                  metrics.awaitingAnalysis
                }
                valueLabel="waiting"
                icon="✦"
                to="/portal/admin/pen-e/analyze"
              />

              <NavigationCard
                eyebrow="Tutor Decisions"
                title="Review"
                description="Review completed Pen-E analyses that still require tutor decisions."
                value={
                metrics.pendingReview
               }
               valueLabel="pending"
               icon="✓"
               to="/portal/admin/pen-e/review"
             />

            </div>
          </section>
        </>
      )}
    </>
  );
}

