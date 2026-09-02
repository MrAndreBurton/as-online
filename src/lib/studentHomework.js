import { supabase } from "./supabase";

function sortAssignedHomework(items) {
  const now = new Date();

  return [...items].sort((a, b) => {
    const aDue = a.dueAt ? new Date(a.dueAt) : null;
    const bDue = b.dueAt ? new Date(b.dueAt) : null;

    const aOverdue = aDue && aDue < now;
    const bOverdue = bDue && bDue < now;

    if (aOverdue !== bOverdue) {
      return aOverdue ? -1 : 1;
    }

    if (aDue && bDue) {
      return aDue - bDue;
    }

    if (aDue && !bDue) {
      return -1;
    }

    if (!aDue && bDue) {
      return 1;
    }

    return 0;
  });
}

export async function fetchStudentHomework(studentUserId) {
  if (!studentUserId) {
    throw new Error("A student user ID is required.");
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from("aeos_sessions")
    .select(`
      session_id,
      session_title,
      offering_id,
      scheduled_start_at,
      started_at,
      ended_at
    `)
    .eq("student_user_id", studentUserId);

  if (sessionsError) {
    throw sessionsError;
  }

  const sessionRows = sessions || [];
  const sessionIds = sessionRows.map((session) => session.session_id);

  if (sessionIds.length === 0) {
    return {
      todo: [],
      completed: [],
    };
  }

  const { data: homework, error: homeworkError } = await supabase
    .from("aeos_session_homework")
    .select(`
      homework_id,
      session_id,
      title,
      instructions,
      due_at,
      homework_status,
      completed_at
    `)
    .in("session_id", sessionIds)
    .eq("visibility", "student")
    .in("homework_status", ["assigned", "completed"]);

  if (homeworkError) {
    throw homeworkError;
  }

  const offeringIds = [
    ...new Set(
      sessionRows
        .map((session) => session.offering_id)
        .filter(Boolean)
    ),
  ];

  let offeringMap = new Map();

  if (offeringIds.length > 0) {
    const { data: offerings, error: offeringsError } = await supabase
      .from("aeos_offerings")
      .select(`
        offering_id,
        offering_name,
        subject_id
      `)
      .in("offering_id", offeringIds);

    if (offeringsError) {
      throw offeringsError;
    }

    offeringMap = new Map(
      (offerings || []).map((offering) => [
        offering.offering_id,
        offering,
      ])
    );
  }

  const sessionMap = new Map(
    sessionRows.map((session) => [
      session.session_id,
      session,
    ])
  );

  const mappedHomework = (homework || []).map((item) => {
    const session = sessionMap.get(item.session_id);
    const offering = session
      ? offeringMap.get(session.offering_id)
      : null;

    const dueDate = item.due_at
      ? new Date(item.due_at)
      : null;

    return {
      homeworkId: item.homework_id,
      sessionId: item.session_id,

      title: item.title,
      instructions: item.instructions || null,

      status: item.homework_status,

      dueAt: item.due_at,
      completedAt: item.completed_at,

      isOverdue:
        item.homework_status === "assigned" &&
        dueDate &&
        dueDate < new Date(),

      sessionTitle:
        session?.session_title ||
        offering?.offering_name ||
        "Tutoring session",

      sessionDate:
        session?.scheduled_start_at ||
        session?.started_at ||
        session?.ended_at ||
        null,

      offeringName:
        offering?.offering_name || null,

      subjectId:
        offering?.subject_id || null,
    };
  });

  const todo = sortAssignedHomework(
    mappedHomework.filter(
      (item) => item.status === "assigned"
    )
  );

  const completed = mappedHomework
    .filter((item) => item.status === "completed")
    .sort((a, b) => {
      const aDate = a.completedAt
        ? new Date(a.completedAt)
        : new Date(0);

      const bDate = b.completedAt
        ? new Date(b.completedAt)
        : new Date(0);

      return bDate - aDate;
    });

  return {
    todo,
    completed,
  };
}

