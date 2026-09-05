import { supabase } from "./supabase";
const TRANSCRIPT_BUCKET = "aeos-transcripts";

export async function fetchAdminSessions({
  page = 1,
  pageSize = 25,
  status = "all",
  studentId = "all",
  offeringId = "all",
  dateFilter = "all",
  search = "",
} = {}) {
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(
    1,
    Math.min(100, Number(pageSize) || 25)
  );

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  /*
   * Search lookup.
   *
   * Session title is directly searchable on aeos_sessions.
   * Student/offering names live in related tables, so resolve
   * their canonical IDs first.
   */
  const queryText = search.trim();

  let matchingStudentIds = [];
  let matchingOfferingIds = [];

  if (queryText) {
    const pattern = `%${queryText}%`;

    const [
      { data: studentMatches, error: studentError },
      { data: offeringMatches, error: offeringError },
    ] = await Promise.all([
      supabase
        .from("aeos_students")
        .select("student_id")
        .or(
          [
            `display_name.ilike.${pattern}`,
            `first_name.ilike.${pattern}`,
            `last_name.ilike.${pattern}`,
            `email.ilike.${pattern}`,
          ].join(",")
        ),

      supabase
        .from("aeos_offerings")
        .select("offering_id")
        .ilike("offering_name", pattern),
    ]);

    if (studentError) throw studentError;
    if (offeringError) throw offeringError;

    matchingStudentIds = (studentMatches ?? [])
      .map((row) => row.student_id)
      .filter(Boolean);

    matchingOfferingIds = (offeringMatches ?? [])
      .map((row) => row.offering_id)
      .filter(Boolean);
  }

  let query = supabase
    .from("aeos_sessions")
    .select(
      `
        session_id,
        student_id,
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
        created_at,

        student:aeos_students(
          student_id,
          portal_user_id,
          first_name,
          last_name,
          display_name,
          school
        ),

        offering:aeos_offerings(
          offering_id,
          offering_name,
          subject:aeos_subjects(
            subject_id,
            subject_name
          )
        )
      `,
      {
        count: "exact",
      }
    );

  /*
   * Status.
   */
  if (status !== "all") {
    query = query.eq(
      "session_status",
      status
    );
  }

  /*
   * Canonical student identity.
   */
  if (studentId !== "all") {
    query = query.eq(
      "student_id",
      studentId
    );
  }

  /*
   * Offering.
   */
  if (offeringId !== "all") {
    query = query.eq(
      "offering_id",
      offeringId
    );
  }

  /*
   * Date filters.
   */
  const now = new Date();

  if (dateFilter === "upcoming") {
    query = query.gte(
      "scheduled_start_at",
      now.toISOString()
    );
  }

  if (dateFilter === "past") {
    query = query.lt(
      "scheduled_start_at",
      now.toISOString()
    );
  }

  if (dateFilter === "today") {
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    query = query
      .gte(
        "scheduled_start_at",
        start.toISOString()
      )
      .lt(
        "scheduled_start_at",
        end.toISOString()
      );
  }

  /*
   * Server-side search across:
   * - session title
   * - canonical student matches
   * - offering matches
   */
  if (queryText) {
    const clauses = [
      `session_title.ilike.%${queryText}%`,
    ];

    if (matchingStudentIds.length) {
      clauses.push(
        `student_id.in.(${matchingStudentIds.join(
          ","
        )})`
      );
    }

    if (matchingOfferingIds.length) {
      clauses.push(
        `offering_id.in.(${matchingOfferingIds.join(
          ","
        )})`
      );
    }

    query = query.or(
      clauses.join(",")
    );
  }

  const {
    data,
    error,
    count,
  } = await query
    .order("scheduled_start_at", {
      ascending: false,
    })
    .range(from, to);

  if (error) throw error;

  return {
    sessions: data ?? [],
    total: count ?? 0,
    page: safePage,
    pageSize: safePageSize,
  };
}

export async function fetchSessionStudentOptions() {
  const { data, error } = await supabase
    .from("aeos_students")
    .select(`
      student_id,
      first_name,
      last_name,
      display_name
    `)
    .order("display_name", {
      ascending: true,
      nullsFirst: false,
    });

  if (error) throw error;

  return (data ?? []).map((student) => ({
    id: student.student_id,
    name:
      student.display_name ||
      [
        student.first_name,
        student.last_name,
      ]
        .filter(Boolean)
        .join(" ") ||
      "Student",
  }));
}

export async function fetchSessionOfferingOptions() {
  const { data, error } = await supabase
    .from("aeos_offerings")
    .select(`
      offering_id,
      offering_name
    `)
    .order("offering_name", {
      ascending: true,
    });

  if (error) throw error;

  return (data ?? []).map((offering) => ({
    id: offering.offering_id,
    name:
      offering.offering_name ||
      offering.offering_id,
  }));
}

export async function fetchSessionEligibleOfferings(studentId) {
  if (!studentId) return [];

  const { data, error } = await supabase
    .from("aeos_student_enrolments")
    .select(`
      offering_id,
      status,

      offering:aeos_offerings(
        offering_id,
        offering_name,
        subject:aeos_subjects(
          subject_id,
          subject_name,
          display_name
        )
      )
    `)
    .eq("student_id", studentId)
    .eq("status", "active");

  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.offering)
    .map((row) => ({
      id: row.offering_id,
      name:
        row.offering?.offering_name ||
        row.offering_id,
      subject:
        row.offering?.subject?.display_name ||
        row.offering?.subject?.subject_name ||
        null,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name)
    );
}

export async function fetchSessionWorkspace(sessionId) {
  const results = await Promise.all([
    supabase
      .from("aeos_sessions")
      .select(`
        session_id,
        student_id,
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

        student:aeos_students(
          student_id,
          portal_user_id,
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

export async function updateSessionDetails(
  sessionId,
  values
) {
  if (values.offeringId) {
    const { data: session, error: sessionError } =
      await supabase
        .from("aeos_sessions")
        .select("student_id")
        .eq("session_id", sessionId)
        .single();

    if (sessionError) throw sessionError;

    const {
      data: enrolment,
      error: enrolmentError,
    } = await supabase
      .from("aeos_student_enrolments")
      .select("enrolment_id")
      .eq("student_id", session.student_id)
      .eq("offering_id", values.offeringId)
      .eq("status", "active")
      .maybeSingle();

    if (enrolmentError) throw enrolmentError;

    if (!enrolment) {
      throw new Error(
        "This student is not actively enrolled in the selected offering."
      );
    }
  }

  const patch = {};

  if ("sessionTitle" in values) {
    patch.session_title =
      values.sessionTitle?.trim() || null;
  }

  if ("meetingUrl" in values) {
    patch.meeting_url =
      values.meetingUrl?.trim() || null;
  }

  if (values.offeringId) {
    patch.offering_id = values.offeringId;
  }

  const { data, error } = await supabase
    .from("aeos_sessions")
    .update(patch)
    .eq("session_id", sessionId)
    .select()
    .single();

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
