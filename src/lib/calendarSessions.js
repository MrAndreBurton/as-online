import { supabase } from "./supabase";

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke(
    "schedule-session",
    {
      body,
    }
  );

  if (error) throw error;

  if (!data?.ok) {
    throw new Error(
      data?.error || "Calendar operation failed."
    );
  }

  return data;
}

export function scheduleAeosSession({
  studentId,
  studentUserId = null,
  offeringId,
  sessionTitle,
  startTime,
  endTime,
  timezone = "America/Port_of_Spain",
}) {
  return invoke({
    action: "create",
    studentId,
    studentUserId,
    offeringId,
    sessionTitle,
    startTime,
    endTime,
    timezone,
  });
}

export function syncGoogleSession(sessionId) {
  return invoke({
    action: "sync",
    sessionId,
  });
}

export function updateGoogleSession(payload) {
  return invoke({
    action: "update",
    ...payload,
  });
}

export function cancelGoogleSession(sessionId) {
  return invoke({
    action: "cancel",
    sessionId,
  });
}

