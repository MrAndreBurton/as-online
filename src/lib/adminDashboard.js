import { supabase } from "./supabase";

export async function fetchAdminDashboard() {
  const start = new Date(); start.setHours(0,0,0,0);
  const end = new Date(); end.setHours(23,59,59,999);

  const [students, enrolments, sessions, evidence, recent] = await Promise.all([
    supabase.from("student_profiles").select("user_id", { count: "exact", head: true }),
    supabase.from("aeos_student_enrolments").select("enrolment_id", { count: "exact", head: true }).eq("status","active"),
    supabase.from("aeos_sessions")
      .select(`session_id,student_user_id,session_title,session_status,scheduled_start_at,offering:aeos_offerings(offering_name),student:student_profiles(display_name,first_name,last_name)`)
      .gte("scheduled_start_at", start.toISOString()).lte("scheduled_start_at", end.toISOString())
      .order("scheduled_start_at"),
    supabase.from("aeos_learning_evidence").select("evidence_id", { count: "exact", head: true }).eq("evidence_status","suggested"),
    supabase.from("student_profiles").select("user_id,display_name,first_name,last_name,school,created_at")
      .order("created_at", { ascending: false }).limit(5),
  ]);

  const results=[students,enrolments,sessions,evidence,recent];
  const err=results.find(r=>r.error)?.error;
  if (err) throw err;

  return {
    studentCount: students.count ?? 0,
    activeEnrolmentCount: enrolments.count ?? 0,
    sessionsToday: sessions.data ?? [],
    evidenceQueueCount: evidence.count ?? 0,
    recentStudents: recent.data ?? [],
  };
}
