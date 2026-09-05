import { supabase } from "./supabase";

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke(
    "recurring-session",
    { body }
  );

  if (error) {
    let message =
      error.message ||
      "Recurring Calendar operation failed.";

    try {
      if (error.context instanceof Response) {
        const response = error.context.clone();

        try {
          const payload = await response.json();

          message =
            payload?.error ||
            payload?.message ||
            message;
        } catch {
          const text =
            await error.context
              .clone()
              .text();

          if (text?.trim()) {
            message = text.trim();
          }
        }
      }
    } catch {
      // Fall back to the original Supabase error.
    }

    throw new Error(message);
  }

  if (!data?.ok) {
    throw new Error(
      data?.error ||
        "Recurring Calendar operation failed."
    );
  }

  return data;
}

export function createRecurringSeries({
  studentId,
  studentUserId = null,
  studentEmail = null,
  offeringId,
  sessionTitle,
  startTime,
  durationMinutes,
  endDate,
  timezone = "America/Port_of_Spain",
}) {
  return invoke({
    action: "create_series",

    // Canonical AEOS identity
    studentId,

    // Optional portal/auth identity
    studentUserId,

    // Available even without portal access
    studentEmail,

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

export function syncRecurringSeriesMetadata(
  seriesId
) {
  return invoke({
    action: "sync_series_metadata",
    seriesId,
  });
}


