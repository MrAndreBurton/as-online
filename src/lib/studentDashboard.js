import { supabase } from "./supabase";

export async function fetchStudentDashboard(studentUserId) {
  const now = new Date().toISOString();

  const [enrolments, sessions, homework, mastery, recommendations] = await Promise.all([
    supabase.from("aeos_student_enrolments")
      .select(`enrolment_id,status,enrolled_at,offering:aeos_offerings(offering_id,offering_name,subject:aeos_subjects(subject_id,subject_name))`)
      .eq("student_user_id", studentUserId).in("status", ["active","paused"]),

    supabase.from("aeos_student_session_portal")
      .select("session_id,offering_name,subject_name,session_title,session_status,scheduled_start_at,meeting_url")
      .eq("student_user_id", studentUserId)
      .gte("scheduled_start_at", now)
      .neq("session_status", "cancelled")
      .order("scheduled_start_at").limit(5),

    supabase.from("aeos_session_homework")
      .select(`homework_id,title,instructions,due_at,homework_status,session:aeos_sessions!inner(session_id,student_user_id,offering_id)`)
      .eq("session.student_user_id", studentUserId)
      .eq("visibility", "student")
      .eq("homework_status", "assigned")
      .order("due_at").limit(6),

    supabase.from("aeos_student_mastery_portal")
      .select("mastery_id,learning_node_id,learning_node_name,subject_id,mastery_status,mastery_score,approved_evidence_count,updated_at")
      .eq("student_user_id", studentUserId)
      .order("updated_at", { ascending: false }).limit(8),

    supabase.from("aeos_recommendations")
      .select("recommendation_id,recommendation_type,title,recommendation_text,priority,recommendation_status,due_at,created_at")
      .eq("student_user_id", studentUserId)
      .eq("recommendation_status", "active")
      .order("priority").order("created_at", { ascending: false }).limit(5),
  ]);

  const results = [enrolments, sessions, homework, mastery, recommendations];
  const err = results.find(r => r.error)?.error;
  if (err) throw err;

  return {
    enrolments: enrolments.data ?? [],
    upcomingSessions: sessions.data ?? [],
    homework: homework.data ?? [],
    mastery: mastery.data ?? [],
    recommendations: recommendations.data ?? [],
  };
}
