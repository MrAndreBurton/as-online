import { supabase } from "./supabase";

function getSessionDate(session) {
  // Student chronology uses the scheduled lesson occurrence time.
  return session?.scheduled_start_at || null;
}

function groupBySession(rows = []) {
  const map = new Map();
  for (const row of rows) {
    if (!row.session_id) continue;
    if (!map.has(row.session_id)) map.set(row.session_id, []);
    map.get(row.session_id).push(row);
  }
  return map;
}

function getEvidenceType(row) {
  return row?.evidence_detail?.evidence_type || null;
}

function getSourceTimestamp(row) {
  return row?.evidence_detail?.source_timestamp || null;
}

function parseSourceTimestamp(value) {
  if (!value || typeof value !== "string") return null;
  const parts = value.trim().split(":").map(Number);
  if (parts.some(Number.isNaN) || parts.length < 2 || parts.length > 3) return null;
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return h * 3600 + m * 60 + s;
}

function getStudentEvidenceState(row) {
  const type = getEvidenceType(row);
  const independence = row?.independence_level || null;

  const states = {
    independent_success: {
      state: "shown",
      tone: "positive",
      label: independence === "independent"
        ? "You showed this independently"
        : "You showed this",
    },
    demonstrated_understanding: {
      state: "shown",
      tone: "positive",
      label: "You showed understanding",
    },
    procedural_success: {
      state: "shown",
      tone: "positive",
      label: "You successfully practised this",
    },
    partial_understanding: {
      state: "developing",
      tone: "developing",
      label: "You're getting there",
    },
    uncertainty: {
      state: "developing",
      tone: "developing",
      label: "Still developing",
    },
    needs_prompting: {
      state: "practice",
      tone: "practice",
      label: "Keep practising",
    },
    procedural_error: {
      state: "practice",
      tone: "practice",
      label: "Keep working on this",
    },
    misconception: {
      state: "practice",
      tone: "practice",
      label: "Let's revisit this",
    },
  };

  return states[type] || {
    state: "reviewed",
    tone: "neutral",
    label: "Reviewed learning",
  };
}

function sortLearningMoments(events) {
  return [...events].sort((a, b) => {
    const left = parseSourceTimestamp(a.sourceTimestamp);
    const right = parseSourceTimestamp(b.sourceTimestamp);
    if (left == null && right == null) return 0;
    if (left == null) return 1;
    if (right == null) return -1;
    return left - right;
  });
}

function summarizeSkillGroup(events) {
  const sorted = sortLearningMoments(events);
  const allTimestamped = sorted.every(
    (event) => parseSourceTimestamp(event.sourceTimestamp) != null
  );
  const signatures = new Set(sorted.map((event) => `${event.state}:${event.label}`));
  const hasMixedEvidence = signatures.size > 1;

  let representative = sorted[0] || null;

  if (sorted.length > 1) {
    if (allTimestamped) {
      representative = sorted[sorted.length - 1];
    } else if (!hasMixedEvidence) {
      representative = sorted.find((event) => event.sourceTimestamp) || sorted[0];
    } else {
      representative = {
        ...sorted[0],
        state: "mixed",
        tone: "mixed",
        label: "You worked through this",
        summary: "You worked through several learning moments in this session.",
      };
    }
  }

  return {
    learningNodeId: representative?.learningNodeId || null,
    skillName: representative?.skillName || "Learning skill",
    observableStatement: representative?.observableStatement || null,
    state: representative?.state || "reviewed",
    tone: representative?.tone || "neutral",
    label: representative?.label || "Reviewed learning",
    summary: representative?.summary || null,
    evidenceCount: sorted.length,
    hasMultipleEvidence: sorted.length > 1,
    hasMixedEvidence,
    chronologyComplete: allTimestamped,
    hasIndependentEvidence: sorted.some(
      (event) => event.independenceLevel === "independent"
    ),
    events: sorted,
  };
}

function groupEvidenceBySkill(events) {
  const map = new Map();
  for (const event of events) {
    if (!event.learningNodeId) continue;
    if (!map.has(event.learningNodeId)) map.set(event.learningNodeId, []);
    map.get(event.learningNodeId).push(event);
  }
  return [...map.values()].map(summarizeSkillGroup);
}

export async function fetchStudentSessions(studentUserId) {
  if (!studentUserId) throw new Error("Student user ID is required.");

  const [sessionsResult, evidenceResult, homeworkResult, resourcesResult, offeringsResult] =
    await Promise.all([
      supabase
        .from("aeos_sessions")
        .select(`
          session_id,offering_id,session_title,session_status,
          scheduled_start_at,scheduled_end_at,started_at,ended_at,
          meeting_url,created_at
        `)
        .eq("student_user_id", studentUserId)
        .order("scheduled_start_at", { ascending: false, nullsFirst: false }),

      supabase
        .from("aeos_learning_evidence")
        .select("evidence_id,session_id,learning_node_id")
        .eq("student_user_id", studentUserId)
        .eq("evidence_status", "approved"),

      supabase
        .from("aeos_session_homework")
        .select("homework_id,session_id")
        .eq("visibility", "student"),

      supabase
        .from("aeos_session_resources")
        .select("resource_id,session_id")
        .eq("visibility", "student"),

      supabase
        .from("aeos_offerings")
        .select("offering_id,offering_name,subject_id"),
    ]);

  const error = [
    sessionsResult, evidenceResult, homeworkResult, resourcesResult, offeringsResult,
  ].find((result) => result.error)?.error;
  if (error) throw error;

  const evidenceBySession = groupBySession(evidenceResult.data);
  const homeworkBySession = groupBySession(homeworkResult.data);
  const resourcesBySession = groupBySession(resourcesResult.data);
  const offeringById = new Map(
    (offeringsResult.data ?? []).map((offering) => [offering.offering_id, offering])
  );

  const sessions = (sessionsResult.data ?? []).map((session) => {
    const evidence = evidenceBySession.get(session.session_id) ?? [];
    const offering = offeringById.get(session.offering_id) ?? null;

    return {
      sessionId: session.session_id,
      offeringId: session.offering_id,
      title: session.session_title || offering?.offering_name || "Learning session",
      offeringName: offering?.offering_name ?? null,
      subjectId: offering?.subject_id ?? null,
      status: session.session_status,
      scheduledStartAt: session.scheduled_start_at,
      scheduledEndAt: session.scheduled_end_at,
      sessionDate: getSessionDate(session),
      meetingUrl: session.meeting_url || null,
      reviewedMomentCount: evidence.length,
      progressSkillCount: new Set(
        evidence.map((row) => row.learning_node_id).filter(Boolean)
      ).size,
      homeworkCount: homeworkBySession.get(session.session_id)?.length ?? 0,
      resourceCount: resourcesBySession.get(session.session_id)?.length ?? 0,
    };
  });

  const now = Date.now();

  const upcoming = sessions
    .filter((session) => {
      if (!session.scheduledStartAt) return false;
      const start = new Date(session.scheduledStartAt).getTime();
      return start > now && !["completed", "cancelled"].includes(session.status);
    })
    .sort(
      (a, b) =>
        new Date(a.scheduledStartAt).getTime() -
        new Date(b.scheduledStartAt).getTime()
    );

  const past = sessions
    .filter((session) => {
      if (session.status === "cancelled") return false;
      if (!session.scheduledStartAt) return session.status === "completed";
      return new Date(session.scheduledStartAt).getTime() <= now;
    })
    .sort((a, b) => {
      const left = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
      const right = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
      return right - left;
    });

  return { upcoming, past };
}

export async function fetchStudentSessionDetail(studentUserId, sessionId) {
  if (!studentUserId || !sessionId) {
    throw new Error("Session information is required.");
  }

  const sessionResult = await supabase
    .from("aeos_sessions")
    .select(`
      session_id,offering_id,session_title,session_status,
      scheduled_start_at,scheduled_end_at,started_at,ended_at,
      meeting_url,created_at
    `)
    .eq("session_id", sessionId)
    .eq("student_user_id", studentUserId)
    .maybeSingle();

  if (sessionResult.error) throw sessionResult.error;
  if (!sessionResult.data) throw new Error("Session not found.");

  const session = sessionResult.data;

  const [offeringResult, evidenceResult, homeworkResult, resourcesResult] =
    await Promise.all([
      supabase
        .from("aeos_offerings")
        .select(`
          offering_id,offering_name,subject_id,
          subject:aeos_subjects(subject_id,subject_name)
        `)
        .eq("offering_id", session.offering_id)
        .maybeSingle(),

      supabase
        .from("aeos_learning_evidence")
        .select(`
          evidence_id,learning_node_id,evidence_source_type,
          evidence_summary,evidence_detail,independence_level,
          observed_at,approved_at
        `)
        .eq("student_user_id", studentUserId)
        .eq("session_id", sessionId)
        .eq("evidence_status", "approved"),

      supabase
        .from("aeos_session_homework")
        .select(`
          homework_id,title,instructions,due_at,
          homework_status,completed_at
        `)
        .eq("session_id", sessionId)
        .eq("visibility", "student")
        .order("created_at", { ascending: true }),

      supabase
        .from("aeos_session_resources")
        .select(`
          resource_id,resource_type,resource_title,
          resource_url,description,sequence
        `)
        .eq("session_id", sessionId)
        .eq("visibility", "student")
        .order("sequence", { ascending: true }),
    ]);

  const error = [
    offeringResult, evidenceResult, homeworkResult, resourcesResult,
  ].find((result) => result.error)?.error;
  if (error) throw error;

  const evidenceRows = evidenceResult.data ?? [];
  const learningNodeIds = [
    ...new Set(evidenceRows.map((row) => row.learning_node_id).filter(Boolean)),
  ];

  let learningNodes = [];
  if (learningNodeIds.length) {
    const learningNodesResult = await supabase
      .from("aeos_learning_nodes")
      .select("learning_node_id,source_label,observable_statement")
      .in("learning_node_id", learningNodeIds);

    if (learningNodesResult.error) throw learningNodesResult.error;
    learningNodes = learningNodesResult.data ?? [];
  }

  const nodeById = new Map(
    learningNodes.map((node) => [node.learning_node_id, node])
  );

  const learningMoments = sortLearningMoments(
    evidenceRows.map((row) => {
      const node = nodeById.get(row.learning_node_id);
      const state = getStudentEvidenceState(row);

      return {
        evidenceId: row.evidence_id,
        learningNodeId: row.learning_node_id,
        skillName: node?.source_label || "Learning skill",
        observableStatement: node?.observable_statement || null,
        evidenceType: getEvidenceType(row),
        evidenceSourceType: row.evidence_source_type || null,
        summary: row.evidence_summary?.trim() || null,
        independenceLevel: row.independence_level || null,
        sourceTimestamp: getSourceTimestamp(row),
        observedAt: row.observed_at || null,
        approvedAt: row.approved_at || null,
        ...state,
      };
    })
  );

  const learning = groupEvidenceBySkill(learningMoments);
  const offering = offeringResult.data;

  return {
    session: {
      sessionId: session.session_id,
      title: session.session_title || offering?.offering_name || "Learning session",
      offeringName: offering?.offering_name ?? null,
      subjectName: offering?.subject?.subject_name ?? null,
      status: session.session_status,
      scheduledStartAt: session.scheduled_start_at,
      scheduledEndAt: session.scheduled_end_at,
      sessionDate: getSessionDate(session),
      meetingUrl: session.meeting_url || null,
    },
    summary: {
      skillCount: learning.length,
      learningMomentCount: learningMoments.length,
      homeworkCount: homeworkResult.data?.length ?? 0,
      resourceCount: resourcesResult.data?.length ?? 0,
    },
    learning,
    learningMoments,
    homework: homeworkResult.data ?? [],
    resources: resourcesResult.data ?? [],
  };
}



