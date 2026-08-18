import { useState } from "react";
import { reconcileRecurringSeries } from "../../lib/recurringCalendar";

export default function SeriesReconcilePanel({ session, onChanged }) {
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  if (!session.series_id) return null;

  async function reconcile() {
    setWorking(true);
    setError("");
    setResult(null);

    try {
      const data = await reconcileRecurringSeries(session.series_id);
      setResult(data.reconciliation);
      await onChanged?.();
    } catch (err) {
      setError(err.message || "Unable to reconcile recurring series.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="portal-card">
      <p className="portal-eyebrow">Recurring Series</p>
      <h3>Google → AEOS Reconciliation</h3>
      <p className="session-help">
        For V1, use this after changing one occurrence directly in Google
        Calendar. AEOS will re-read the series instances and update only the
        matching occurrence.
      </p>

      <button
        type="button"
        className="aeos-button-secondary"
        onClick={reconcile}
        disabled={working}
      >
        {working ? "Reconciling…" : "Reconcile Recurring Series"}
      </button>

      {result ? (
        <div className="series-reconcile-result">
          <span>{result.instanceCount} Google instances read</span>
          <span>{result.inserted} AEOS sessions created</span>
          <span>{result.updated} AEOS sessions refreshed</span>
          <span>{result.exceptions} exceptions detected</span>
          <span>{result.cancelled} cancellations detected</span>
        </div>
      ) : null}

      {error ? <div className="portal-alert">{error}</div> : null}
    </section>
  );
}
