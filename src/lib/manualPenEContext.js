import { supabase } from "./supabase";

function studentName(student) {
  return (
    student?.display_name ||
    [student?.first_name, student?.last_name].filter(Boolean).join(" ") ||
    "Student"
  );
}

function minutesBetween(start, end) {
  if (!start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) {
    return null;
  }
  return Math.round((endMs - startMs) / 60000);
}

export async function fetchManualPenEContext(intakeItemId) {
  const { data: intake, error: intakeError } = await supabase
    .from("aeos_learning_intake_items")
    .select(`
      intake_item_id,
      intake_type,
      source_provider,
      source_format,
      source_name,
      student_user_id,
      session_id,
      offering_id,
      raw_content,
      normalized_content,
      processing_status,
      received_at,
      extracted_metadata,
      offering:aeos_offerings(
        offering_id,
        offering_name,
        programme_id,
        subject_id,
        audience_level_id
      ),
      session:aeos_sessions(
        session_id,
        student_id,
        student_user_id,
        offering_id,
        session_title,
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        ended_at,
        student:aeos_students(
          student_id,
          first_name,
          last_name,
          display_name
        )
      )
    `)
    .eq("intake_item_id", intakeItemId)
    .single();

  if (intakeError) throw intakeError;
  if (!intake) throw new Error("Learning Intake item not found.");

  const offering = intake.offering;

  if (!offering?.programme_id || !offering?.subject_id) {
    throw new Error(
      "The intake item is not linked to an Offering with programme and subject context."
    );
  }

  const { data: analysisScope, error: scopeError } = await supabase.rpc(
    "aeos_transcript_analysis_scope",
    {
      target_intake_item_id: intakeItemId,
    }
  );

  if (scopeError) throw scopeError;

  const curriculumNodes = (analysisScope?.candidates ?? []).map((candidate) => ({
    ...candidate,
    node_type: "skill",
    node_name:
      candidate.source_label ||
      candidate.observable_statement ||
      candidate.learning_node_id,
    parent_node_id: null,
    framework_id: null,
  }));

  const transcript =
    intake.normalized_content?.trim() ||
    intake.raw_content?.trim() ||
    "";

  if (!transcript) {
    throw new Error("This intake item does not contain transcript text.");
  }

  const session = intake.session;
  const student = session?.student ?? null;

  const plannedMinutes = minutesBetween(
    session?.scheduled_start_at,
    session?.scheduled_end_at
  );

  const actualMinutes = minutesBetween(
    session?.started_at,
    session?.ended_at
  );

  return {
    intake,
    offering,
    session,
    student,
    studentDisplayName: studentName(student),
    analysisScope: analysisScope ?? null,
    curriculumNodes,
    transcript,
    wordCount: transcript.split(/\s+/).filter(Boolean).length,
    durationMinutes: actualMinutes ?? plannedMinutes,
  };
}


