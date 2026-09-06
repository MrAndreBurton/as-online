import { supabase } from "./supabase";

export async function fetchCanonicalStudents() {
  const { data, error } = await supabase
    .from("aeos_students")
    .select(`
      student_id,portal_user_id,first_name,last_name,display_name,email,phone,
      date_of_birth,school,student_status,portal_status,notes,created_at,updated_at
    `)
    .neq("student_status","archived")
    .order("last_name",{ascending:true})
    .order("first_name",{ascending:true});
  if (error) throw error;
  return data ?? [];
}

export async function createStudentRecord(payload) {
  const { data, error } = await supabase.rpc("aeos_create_student_record", {
    target_first_name: payload.firstName,
    target_last_name: payload.lastName || null,
    target_email: payload.email || null,
    target_phone: payload.phone || null,
    target_date_of_birth: payload.dateOfBirth || null,
    target_school: payload.school || null,
    target_notes: payload.notes || null,
  });
  if (error) throw error;
  return data;
}

export async function createHistoricalSession(payload) {
  const { data, error } = await supabase.rpc("aeos_create_historical_session", {
    target_student_id: payload.studentId,
    target_offering_id: payload.offeringId,
    target_tutor_user_id: payload.tutorUserId,
    target_start_at: payload.startAt,
    target_end_at: payload.endAt,
    target_session_title: payload.sessionTitle || null,
    target_attendance_status: payload.attendanceStatus || "present",
    target_notes: payload.notes || null,
  });
  if (error) throw error;
  return data;
}

export async function fetchCalendarSessions(startIso,endIso) {
  const { data, error } = await supabase
    .from("aeos_sessions")
    .select(`
      session_id,series_id,student_id,offering_id,session_title,session_status,
      session_origin,attendance_status,scheduled_start_at,scheduled_end_at,
      started_at,ended_at,calendar_sync_requirement,google_sync_status,google_meet_url,
      student:aeos_students(student_id,display_name,first_name,last_name),
      offering:aeos_offerings(offering_id,offering_name),
      series:aeos_session_series!aeos_sessions_series_id_fkey(
        series_id,
        starts_at,
        series_status
      )
    `)
    .gte("scheduled_start_at",startIso)
    .lt("scheduled_start_at",endIso)
    .order("scheduled_start_at");
  if (error) throw error;
  return data ?? [];
}
