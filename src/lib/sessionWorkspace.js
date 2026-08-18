import { supabase } from "./supabase";
const TRANSCRIPT_BUCKET = "aeos-transcripts";

export async function fetchAdminSessions({ limit = 50 } = {}) {
  const { data, error } = await supabase.from("aeos_sessions").select(`
    session_id,student_user_id,tutor_user_id,offering_id,session_title,session_status,
    scheduled_start_at,scheduled_end_at,started_at,ended_at,meeting_url,created_at,
    student:student_profiles(user_id,first_name,last_name,display_name,school),
    offering:aeos_offerings(offering_id,offering_name,subject:aeos_subjects(subject_id,subject_name))
  `).order("scheduled_start_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function fetchSessionWorkspace(sessionId) {
  const results = await Promise.all([
    supabase
      .from("aeos_sessions")
      .select(`
        session_id,
        student_user_id,
        tutor_user_id,
        offering_id,
        session_title,
        session_status,
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        ended_at,
        meeting_url,

        google_calendar_id,
        google_calendar_event_id,
        google_event_html_link,
        google_meet_url,
        google_conference_status,
        google_sync_status,
        google_synced_at,
        google_sync_error,
        calendar_timezone,

        series_id,
        google_recurring_event_id,
        google_original_start_time,
        is_series_exception,
        series_exception_type,
        original_scheduled_start_at,
        original_scheduled_end_at,
        series_exception_reason,
        series_exception_source,
        calendar_reconciled_at,


        created_at,
        updated_at,

        student:student_profiles(
          user_id,
          first_name,
          last_name,
          display_name,
          phone,
          date_of_birth,
          school
        ),

        offering:aeos_offerings(
          offering_id,
          offering_name,
          programme_id,
          subject_id,
          audience_level_id,
          subject:aeos_subjects(
            subject_id,
            subject_name,
            display_name
          )
        )
      `)
      .eq("session_id", sessionId)
      .single(),

    supabase
      .from("aeos_session_private_notes")
      .select(
        "note_id,note_text,created_by,created_at,updated_at"
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false }),

    supabase
      .from("aeos_session_resources")
      .select(
        "resource_id,resource_type,resource_title,resource_url,storage_path,description,visibility,sequence,created_at"
      )
      .eq("session_id", sessionId)
      .order("sequence")
      .order("created_at"),

    supabase
      .from("aeos_session_homework")
      .select(
        "homework_id,title,instructions,due_at,homework_status,visibility,completed_at,created_at"
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false }),

    supabase
      .from("aeos_transcript_sources")
      .select(
        "transcript_source_id,provider,source_type,external_reference,storage_bucket,storage_path,raw_text,processed_text,processing_status,processing_version,error_message,word_count,character_count,source_metadata,imported_at,processed_at,created_at"
      )
      .eq("session_id", sessionId)
      .order("imported_at", { ascending: false }),
  ]);

  const err = results.find((r) => r.error)?.error;

  if (err) throw err;

  return {
    session: results[0].data,
    notes: results[1].data ?? [],
    resources: results[2].data ?? [],
    homework: results[3].data ?? [],
    transcripts: results[4].data ?? [],
  };
}

export async function updateSessionStatus(sessionId, nextStatus) {
  const allowed = ["scheduled","in_progress","completed","cancelled","no_show"];
  if (!allowed.includes(nextStatus)) throw new Error("Invalid session status.");
  const now = new Date().toISOString();
  const patch = { session_status: nextStatus };
  if (nextStatus === "in_progress") patch.started_at = now;
  if (["completed","no_show"].includes(nextStatus)) patch.ended_at = now;
  const { data, error } = await supabase.from("aeos_sessions").update(patch).eq("session_id", sessionId).select().single();
  if (error) throw error;
  return data;
}

export async function updateSessionDetails(sessionId, values) {
  const { data, error } = await supabase.from("aeos_sessions").update({
    session_title: values.sessionTitle?.trim() || null,
    meeting_url: values.meetingUrl?.trim() || null,
  }).eq("session_id", sessionId).select().single();
  if (error) throw error;
  return data;
}

export async function addPrivateNote({ sessionId, noteText, createdBy }) {
  const { data, error } = await supabase.from("aeos_session_private_notes").insert({ session_id: sessionId, note_text: noteText.trim(), created_by: createdBy }).select().single();
  if (error) throw error; return data;
}
export async function deletePrivateNote(noteId) { const { error } = await supabase.from("aeos_session_private_notes").delete().eq("note_id", noteId); if (error) throw error; }

export async function addSessionResource({ sessionId, resourceType, resourceTitle, resourceUrl, description, visibility="student", createdBy }) {
  const { data, error } = await supabase.from("aeos_session_resources").insert({ session_id: sessionId, resource_type: resourceType, resource_title: resourceTitle.trim(), resource_url: resourceUrl.trim(), description: description?.trim() || null, visibility, created_by: createdBy }).select().single();
  if (error) throw error; return data;
}
export async function deleteSessionResource(resourceId) { const { error } = await supabase.from("aeos_session_resources").delete().eq("resource_id", resourceId); if (error) throw error; }

export async function assignHomework({ sessionId, title, instructions, dueAt, visibility="student", createdBy }) {
  const { data, error } = await supabase.from("aeos_session_homework").insert({ session_id: sessionId, title: title.trim(), instructions: instructions?.trim() || null, due_at: dueAt ? new Date(dueAt).toISOString() : null, homework_status: "assigned", visibility, created_by: createdBy }).select().single();
  if (error) throw error; return data;
}
export async function updateHomeworkStatus(homeworkId, status) {
  const { data, error } = await supabase.from("aeos_session_homework").update({ homework_status: status, completed_at: status === "completed" ? new Date().toISOString() : null }).eq("homework_id", homeworkId).select().single();
  if (error) throw error; return data;
}

export async function createPastedTranscript({ sessionId, rawText, importedBy, provider="Google Meet" }) {
  const cleaned = rawText.trim(); if (!cleaned) throw new Error("Paste transcript text first.");
  const { data, error } = await supabase.from("aeos_transcript_sources").insert({ session_id: sessionId, provider, source_type: "text", raw_text: cleaned, processing_status: "pending", word_count: cleaned.split(/\s+/).filter(Boolean).length, character_count: cleaned.length, source_metadata: { intake_method: "paste" }, imported_by: importedBy }).select().single();
  if (error) throw error; return data;
}

function safeFileName(name) { return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
export async function uploadTranscriptFile({ sessionId, file, importedBy, provider="Google Meet" }) {
  if (!file) throw new Error("Choose a transcript file.");
  if (file.size > 6 * 1024 * 1024) throw new Error("Transcript file must be 6 MB or smaller for V1.");
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (!new Set(["txt","vtt","srt","md"]).has(extension)) throw new Error("For V1, upload .txt, .vtt, .srt or .md. For Google Docs transcripts, paste the transcript text.");
  const text = await file.text();
  const path = `${sessionId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage.from(TRANSCRIPT_BUCKET).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || "text/plain" });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from("aeos_transcript_sources").insert({ session_id: sessionId, provider, source_type: "file", storage_bucket: TRANSCRIPT_BUCKET, storage_path: path, raw_text: text.trim() || null, processing_status: "pending", word_count: text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : null, character_count: text.length || null, source_metadata: { intake_method: "upload", original_file_name: file.name, mime_type: file.type || null, file_size_bytes: file.size }, imported_by: importedBy }).select().single();
  if (error) { await supabase.storage.from(TRANSCRIPT_BUCKET).remove([path]); throw error; }
  return data;
}

export async function deleteTranscriptSource(source) {
  if (source.storage_bucket && source.storage_path) {
    const { error } = await supabase.storage.from(source.storage_bucket).remove([source.storage_path]);
    if (error) throw error;
  }
  const { error } = await supabase.from("aeos_transcript_sources").delete().eq("transcript_source_id", source.transcript_source_id);
  if (error) throw error;
}
