import { supabase } from "./supabase";

export async function fetchPenEOverviewMetrics() {
  const { data, error } = await supabase.rpc(
    "aeos_pen_e_overview_metrics"
  );

  if (error) throw error;

  return {
    sessions: Number(data?.sessions ?? 0),
    students: Number(data?.students ?? 0),
    hoursTutored: Number(data?.hours_tutored ?? 0),
    analysed: Number(data?.analysed ?? 0),
    awaitingAnalysis: Number(data?.awaiting_analysis ?? 0),
    pendingReview: Number(data?.pending_review ?? 0),
    analysisCoveragePercent: Number(
      data?.analysis_coverage_percent ?? 0
    ),
  };
}

