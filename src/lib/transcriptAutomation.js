import { supabase } from "./supabase";

export async function fetchTranscriptReviewQueue() {
  const { data, error } = await supabase
    .from("aeos_transcript_ingestion_items")
    .select(`
      ingestion_item_id,
      google_transcript_name,
      google_conference_record_name,
      google_meet_space_name,
      conference_start_at,
      word_count,
      match_status,
      match_score,
      queue_status,
      error_message,
      received_at
    `)
    .in("match_status", ["unmatched", "ambiguous", "failed"])
    .order("received_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTranscriptCandidateSessions(item) {
  const center = item.conference_start_at
    ? new Date(item.conference_start_at)
    : new Date();

  const min = new Date(center.getTime() - 8 * 86400000).toISOString();
  const max = new Date(center.getTime() + 8 * 86400000).toISOString();

  const { data, error } = await supabase
    .from("aeos_sessions")
    .select(`
      session_id,
      session_title,
      scheduled_start_at,
      student:student_profiles(first_name,last_name,display_name),
      offering:aeos_offerings(offering_name)
    `)
    .gte("scheduled_start_at", min)
    .lte("scheduled_start_at", max)
    .order("scheduled_start_at");

  if (error) throw error;
  return data ?? [];
}

export async function manualMatchTranscript(itemId, sessionId) {
  const { data, error } = await supabase.rpc(
    "aeos_manual_match_transcript",
    {
      target_ingestion_item_id: itemId,
      target_session_id: sessionId,
    }
  );

  if (error) throw error;
  return data;
}

export async function workspaceEventsAction(action) {
  const { data, error } = await supabase.functions.invoke(
    "workspace-events-admin",
    { body: { action } }
  );

  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || "Workspace Events action failed.");
  return data;
}
