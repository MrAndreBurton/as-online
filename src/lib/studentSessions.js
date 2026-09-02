import { supabase } from "./supabase";

function getSessionDate(session) {
  return (
    session.ended_at ||
    session.started_at ||
    session.scheduled_start_at ||
    session.created_at ||
    null
  );
}

function groupBySession(rows = []) {
  const map = new Map();

  for (const row of rows) {
    if (!row.session_id) continue;

    if (!map.has(row.session_id)) {
      map.set(row.session_id, []);
    }

    map.get(row.session_id).push(row);
  }

  return map;
}

export async function fetchStudentSessions(studentUserId) {
  if (!studentUserId) {
    throw new Error("Student user ID is required.");
  }

  const [
    sessionsResult,
    evidenceResult,
    homeworkResult,
    resourcesResult,
    offeringsResult,
  ] = await Promise.all([
    supabase
      .from("aeos_sessions")
      .select(`
        session_id,
        offering_id,
        session_title,
        session_status,
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        ended_at,
        meeting_url,
        created_at
      `)
      .eq("student_user_id", studentUserId)
      .order("scheduled_start_at", {
        ascending: false,
        nullsFirst: false,
      }),

    supabase
      .from("aeos_learning_evidence")
      .select(`
        evidence_id,
        session_id,
        learning_node_id
      `)
      .eq("student_user_id", studentUserId)
      .eq("evidence_status", "approved"),

    supabase
      .from("aeos_session_homework")
      .select(`
        homework_id,
        session_id
      `)
      .eq("visibility", "student"),

    supabase
      .from("aeos_session_resources")
      .select(`
        resource_id,
        session_id
      `)
      .eq("visibility", "student"),

    supabase
      .from("aeos_offerings")
      .select(`
        offering_id,
        offering_name,
        subject_id
      `),
  ]);

  const firstError = [
    sessionsResult,
    evidenceResult,
    homeworkResult,
    resourcesResult,
    offeringsResult,
  ].find((result) => result.error)?.error;

  if (firstError) {
    throw firstError;
  }

  const evidenceBySession = groupBySession(
    evidenceResult.data
  );

  const homeworkBySession = groupBySession(
    homeworkResult.data
  );

  const resourcesBySession = groupBySession(
    resourcesResult.data
  );

  const offeringById = new Map(
    (offeringsResult.data ?? []).map((offering) => [
      offering.offering_id,
      offering,
    ])
  );

  const sessions = (sessionsResult.data ?? []).map(
    (session) => {
      const evidence =
        evidenceBySession.get(session.session_id) ?? [];

      const skillCount = new Set(
        evidence
          .map((row) => row.learning_node_id)
          .filter(Boolean)
      ).size;

      const offering =
        offeringById.get(session.offering_id) ?? null;

      return {
        sessionId: session.session_id,
        offeringId: session.offering_id,

        title:
          session.session_title ||
          offering?.offering_name ||
          "Learning session",

        offeringName:
          offering?.offering_name ?? null,

        subjectId:
          offering?.subject_id ?? null,

        status: session.session_status,

        scheduledStartAt:
          session.scheduled_start_at,

        scheduledEndAt:
          session.scheduled_end_at,

        sessionDate: getSessionDate(session),

        meetingUrl:
          session.meeting_url || null,

        progressSkillCount: skillCount,

        homeworkCount:
          homeworkBySession.get(session.session_id)
            ?.length ?? 0,

        resourceCount:
          resourcesBySession.get(session.session_id)
            ?.length ?? 0,
      };
    }
  );

  const now = Date.now();

  const upcoming = sessions
    .filter((session) => {
      if (!session.scheduledStartAt) return false;

      const start = new Date(
        session.scheduledStartAt
      ).getTime();

      return (
        start > now &&
        !["completed", "cancelled"].includes(
          session.status
        )
      );
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledStartAt).getTime() -
        new Date(b.scheduledStartAt).getTime()
    );

  const past = sessions
    .filter(
      (session) =>
        session.status === "completed"
    )
    .sort(
      (a, b) =>
        new Date(b.sessionDate || 0).getTime() -
        new Date(a.sessionDate || 0).getTime()
    );

  return {
    upcoming,
    past,
  };
}

export async function fetchStudentSessionDetail(
  studentUserId,
  sessionId
) {
  if (!studentUserId || !sessionId) {
    throw new Error("Session information is required.");
  }

  const sessionResult = await supabase
    .from("aeos_sessions")
    .select(`
      session_id,
      offering_id,
      session_title,
      session_status,
      scheduled_start_at,
      scheduled_end_at,
      started_at,
      ended_at,
      meeting_url,
      created_at
    `)
    .eq("session_id", sessionId)
    .eq("student_user_id", studentUserId)
    .maybeSingle();

  if (sessionResult.error) {
    throw sessionResult.error;
  }

  if (!sessionResult.data) {
    throw new Error("Session not found.");
  }

  const session = sessionResult.data;

  const [
    offeringResult,
    evidenceResult,
    homeworkResult,
    resourcesResult,
  ] = await Promise.all([
    supabase
      .from("aeos_offerings")
      .select(`
        offering_id,
        offering_name,
        subject_id
      `)
      .eq("offering_id", session.offering_id)
      .maybeSingle(),

    supabase
      .from("aeos_learning_evidence")
      .select(`
        evidence_id,
        learning_node_id,
        observed_at
      `)
      .eq("student_user_id", studentUserId)
      .eq("session_id", sessionId)
      .eq("evidence_status", "approved"),

    supabase
      .from("aeos_session_homework")
      .select(`
        homework_id,
        title,
        instructions,
        due_at,
        homework_status,
        completed_at
      `)
      .eq("session_id", sessionId)
      .eq("visibility", "student")
      .order("created_at", {
        ascending: true,
      }),

    supabase
      .from("aeos_session_resources")
      .select(`
        resource_id,
        resource_type,
        resource_title,
        resource_url,
        description,
        sequence
      `)
      .eq("session_id", sessionId)
      .eq("visibility", "student")
      .order("sequence", {
        ascending: true,
      }),
  ]);

  const firstError = [
    offeringResult,
    evidenceResult,
    homeworkResult,
    resourcesResult,
  ].find((result) => result.error)?.error;

  if (firstError) {
    throw firstError;
  }

  const learningNodeIds = [
    ...new Set(
      (evidenceResult.data ?? [])
        .map((row) => row.learning_node_id)
        .filter(Boolean)
    ),
  ];

  let learningNodes = [];

  if (learningNodeIds.length) {
    const learningNodesResult = await supabase
     .from("aeos_learning_nodes")
     .select(`
       learning_node_id,
       source_label,
       observable_statement
     `)
     .in("learning_node_id", learningNodeIds);

    if (learningNodesResult.error) {
      throw learningNodesResult.error;
    }

    learningNodes = learningNodesResult.data ?? [];
  }

  const offering = offeringResult.data;

  return {
    session: {
      sessionId: session.session_id,

      title:
        session.session_title ||
        offering?.offering_name ||
        "Learning session",

      offeringName:
        offering?.offering_name ?? null,

      status: session.session_status,

      scheduledStartAt:
        session.scheduled_start_at,

      scheduledEndAt:
        session.scheduled_end_at,

      sessionDate: getSessionDate(session),

      meetingUrl:
        session.meeting_url || null,
    },

    learning: learningNodes.map((node) => ({
      learningNodeId: node.learning_node_id,

      name:
        node.source_label ||
        "Learning skill",

      observableStatement:
        node.observable_statement || null,
    })),

    homework: homeworkResult.data ?? [],

    resources: resourcesResult.data ?? [],
  };
}

