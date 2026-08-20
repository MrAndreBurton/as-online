import { supabase } from "./supabase";

export async function createHistoricalSessionForStudent({
  studentId,
  offeringId,
  tutorUserId,
  startAt,
  endAt,
  title,
  attendanceStatus = "present",
  notes = "",
}) {
  const { data, error } = await supabase.rpc(
    "aeos_create_historical_session",
    {
      target_student_id: studentId,
      target_offering_id: offeringId,
      target_tutor_user_id: tutorUserId,
      target_start_at: startAt,
      target_end_at: endAt,
      target_session_title: title || null,
      target_attendance_status: attendanceStatus,
      target_notes: notes || null,
    }
  );

  if (error) throw error;
  return data;
}

export async function importManualPenEAnalysis(intakeItemId, analysis) {
  const { data, error } = await supabase.rpc(
    "aeos_import_manual_pen_e_analysis",
    {
      target_intake_item_id: intakeItemId,
      target_analysis: analysis,
    }
  );

  if (error) throw error;
  return data;
}
