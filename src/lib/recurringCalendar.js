import { supabase } from "./supabase";

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke("recurring-session", {
    body,
  });

  if (error) throw error;
  if (!data?.ok) {
    throw new Error(data?.error || "Recurring Calendar operation failed.");
  }

  return data;
}

export function createRecurringSeries({
  studentUserId,
  offeringId,
  sessionTitle,
  startTime,
  durationMinutes,
  endDate,
  timezone = "America/Port_of_Spain",
}) {
  return invoke({
    action: "create_series",
    studentUserId,
    offeringId,
    sessionTitle,
    startTime,
    durationMinutes,
    endDate,
    timezone,
  });
}

export function reconcileRecurringSeries(seriesId) {
  return invoke({
    action: "reconcile_series",
    seriesId,
  });
}
