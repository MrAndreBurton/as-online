import { supabase } from "./supabase";
import { fetchStudentPenE } from "./studentPenE";

function sortByDate(items, field, ascending = true) {
  return [...items].sort((a, b) => {
    const left = a?.[field] ? new Date(a[field]).getTime() : null;
    const right = b?.[field] ? new Date(b[field]).getTime() : null;

    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;

    return ascending ? left - right : right - left;
  });
}

function buildLearningSnapshot(penE) {
  const shown = penE?.whatIveShown ?? [];
  const working = penE?.imWorkingOn ?? [];

  const selected = [];
  const used = new Set();

  const add = (item) => {
    if (!item?.learningNodeId || used.has(item.learningNodeId)) return;
    used.add(item.learningNodeId);
    selected.push(item);
  };

  // Prefer a balanced, truthful snapshot when the evidence supports it.
  add(shown[0]);

  const developing = working.find((item) => item.state === "developing");
  add(developing);

  const practice = working.find((item) =>
    ["practice", "mixed"].includes(item.state)
  );
  add(practice);

  // Fill remaining spaces from the latest available current-skill groups.
  [...shown, ...working]
    .sort((a, b) => {
      const left = a?.sessionDate ? new Date(a.sessionDate).getTime() : 0;
      const right = b?.sessionDate ? new Date(b.sessionDate).getTime() : 0;
      return right - left;
    })
    .forEach((item) => {
      if (selected.length < 3) add(item);
    });

  return selected.slice(0, 3);
}

function buildNextAction(recommendations, homework, penE) {
  const recommendation = recommendations[0];

  if (recommendation) {
    return {
      type: "recommendation",
      id: recommendation.recommendation_id,
      title: recommendation.title,
      text: recommendation.recommendation_text,
      dueAt: recommendation.due_at || null,
    };
  }

  const penENext = penE?.next;
  if (penENext?.type === "homework" && penENext?.item) {
    return {
      type: "homework",
      id: penENext.item.homework_id,
      title: penENext.item.title || "Assigned homework",
      text:
        penENext.item.instructions ||
        "You have homework waiting for you.",
      dueAt: penENext.item.due_at || null,
    };
  }

  const assigned = homework[0];

  if (assigned) {
    return {
      type: "homework",
      id: assigned.homework_id,
      title: assigned.title || "Assigned homework",
      text:
        assigned.instructions ||
        "You have homework waiting for you.",
      dueAt: assigned.due_at || null,
    };
  }

  return {
    type: null,
    item: null,
  };
}

export async function fetchStudentDashboard(studentUserId) {
  const now = new Date().toISOString();

  const [
    enrolmentsResult,
    upcomingResult,
    recentResult,
    homeworkResult,
    recommendationsResult,
    penE,
  ] = await Promise.all([
    supabase
      .from("aeos_student_enrolments")
      .select(
        `enrolment_id,status,enrolled_at,offering:aeos_offerings(offering_id,offering_name,subject:aeos_subjects(subject_id,subject_name))`
      )
      .eq("student_user_id", studentUserId)
      .in("status", ["active", "paused"]),

    supabase
      .from("aeos_student_session_portal")
      .select(
        "session_id,offering_name,subject_name,session_title,session_status,scheduled_start_at,meeting_url"
      )
      .eq("student_user_id", studentUserId)
      .gte("scheduled_start_at", now)
      .neq("session_status", "cancelled")
      .order("scheduled_start_at", { ascending: true })
      .limit(5),

    supabase
      .from("aeos_student_session_portal")
      .select(
        "session_id,offering_name,subject_name,session_title,session_status,scheduled_start_at,meeting_url"
      )
      .eq("student_user_id", studentUserId)
      .lt("scheduled_start_at", now)
      .neq("session_status", "cancelled")
      .order("scheduled_start_at", { ascending: false })
      .limit(3),

    supabase
      .from("aeos_session_homework")
      .select(
        `homework_id,title,instructions,due_at,homework_status,session:aeos_sessions!inner(session_id,student_user_id,offering_id)`
      )
      .eq("session.student_user_id", studentUserId)
      .eq("visibility", "student")
      .eq("homework_status", "assigned")
      .order("due_at", { ascending: true })
      .limit(6),

    supabase
      .from("aeos_recommendations")
      .select(
        "recommendation_id,recommendation_type,title,recommendation_text,priority,recommendation_status,due_at,created_at"
      )
      .eq("student_user_id", studentUserId)
      .eq("recommendation_status", "active")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(5),

    fetchStudentPenE(studentUserId),
  ]);

  const results = [
    enrolmentsResult,
    upcomingResult,
    recentResult,
    homeworkResult,
    recommendationsResult,
  ];

  const error = results.find((result) => result.error)?.error;
  if (error) throw error;

  const enrolments = enrolmentsResult.data ?? [];
  const upcomingSessions = sortByDate(
    upcomingResult.data ?? [],
    "scheduled_start_at",
    true
  );
  const recentSessions = sortByDate(
    recentResult.data ?? [],
    "scheduled_start_at",
    false
  );
  const homework = sortByDate(
    homeworkResult.data ?? [],
    "due_at",
    true
  );
  const recommendations = recommendationsResult.data ?? [];

  return {
    enrolments,
    nextSession: upcomingSessions[0] || null,
    upcomingSessions,
    recentSessions,
    homework,
    recommendations,

    learningSnapshot: buildLearningSnapshot(penE),
    penENoticed: penE?.penENoticed ?? null,

    next: buildNextAction(recommendations, homework, penE),
  };
}



