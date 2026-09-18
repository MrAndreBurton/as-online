import { supabase } from "./supabase";
import { fetchStudentLearning } from "./studentLearning";
import { fetchStudentHomework } from "./studentHomework";

const RECENT_SESSION_LIMIT = 3;
const SNAPSHOT_LIMIT = 4;

const POSITIVE_EVIDENCE_TYPES = new Set([
  "independent_success",
  "demonstrated_understanding",
  "procedural_success",
]);

const DEVELOPING_EVIDENCE_TYPES = new Set([
  "partial_understanding",
  "needs_prompting",
  "uncertainty",
  "procedural_error",
  "misconception",
]);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function safeTime(value) {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function skillName(skill) {
  return (
    skill?.skillName ||
    skill?.learningNodeName ||
    skill?.learning_node_name ||
    skill?.source_label ||
    skill?.nodeName ||
    skill?.node_name ||
    skill?.name ||
    "Learning skill"
  );
}

function getSessionOccurrenceDate(session) {
  return session?.scheduled_start_at || null;
}

function parseSourceTimestamp(value) {
  if (typeof value !== "string") return null;

  const parts = value.trim().split(":").map(Number);

  if (
    parts.length < 2 ||
    parts.length > 3 ||
    parts.some((part) => !Number.isFinite(part) || part < 0)
  ) {
    return null;
  }

  const [hours, minutes, seconds] =
    parts.length === 3
      ? parts
      : [0, parts[0], parts[1]];

  if (minutes >= 60 || seconds >= 60) return null;

  return hours * 3600 + minutes * 60 + seconds;
}

function getEvidenceType(evidence) {
  const detail =
    evidence?.evidence_detail &&
    typeof evidence.evidence_detail === "object"
      ? evidence.evidence_detail
      : {};

  return detail.evidence_type || null;
}

function getSourceTimestamp(evidence) {
  const detail =
    evidence?.evidence_detail &&
    typeof evidence.evidence_detail === "object"
      ? evidence.evidence_detail
      : {};

  return detail.source_timestamp || null;
}

export function getStudentEvidenceState(evidence) {
  const evidenceType =
    evidence?.evidenceType || getEvidenceType(evidence);

  if (
    evidenceType === "independent_success" &&
    evidence?.independenceLevel === "independent"
  ) {
    return {
      state: "shown",
      label: "You showed this independently",
      tone: "positive",
    };
  }

  switch (evidenceType) {
    case "independent_success":
      return {
        state: "shown",
        label: "You showed this",
        tone: "positive",
      };

    case "demonstrated_understanding":
      return {
        state: "shown",
        label: "You showed understanding",
        tone: "positive",
      };

    case "procedural_success":
      return {
        state: "shown",
        label: "You successfully practised this",
        tone: "positive",
      };

    case "partial_understanding":
      return {
        state: "developing",
        label: "You're getting there",
        tone: "developing",
      };

    case "needs_prompting":
      return {
        state: "practice",
        label: "Keep practising",
        tone: "practice",
      };

    case "uncertainty":
      return {
        state: "practice",
        label: "Still developing",
        tone: "practice",
      };

    case "procedural_error":
      return {
        state: "practice",
        label: "Keep working on this",
        tone: "practice",
      };

    case "misconception":
      return {
        state: "practice",
        label: "Let's revisit this",
        tone: "practice",
      };

    default:
      return {
        state: "recorded",
        label: "Learning recorded",
        tone: "neutral",
      };
  }
}

export function formatStudentEvidenceSummary(summary, displayName) {
  if (!summary || typeof summary !== "string") return "";

  let value = summary.trim();
  const names = unique([
    displayName,
    displayName?.split(/\s+/)[0],
  ]).sort((a, b) => b.length - a.length);

  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    value = value.replace(
      new RegExp(`^${escaped}(?:\\s+\\w+)?\\s+`, "i"),
      "You "
    );
  }

  return value;
}

async function fetchEvidenceOnlySkills(learningNodeIds) {
  if (!learningNodeIds.length) return [];

  const { data: nodes, error } = await supabase
    .from("aeos_learning_nodes")
    .select(`
      learning_node_id,
      curriculum_node_id,
      source_label,
      observable_statement,
      learning_outcome,
      subject_id,
      origin_programme_id,
      node_type,
      is_observable,
      status
    `)
    .in("learning_node_id", learningNodeIds)
    .eq("node_type", "skill")
    .eq("is_observable", true)
    .eq("status", "Active");

  if (error) throw error;

  const curriculumById = new Map();
  let pendingIds = unique(
    (nodes ?? []).map((node) => node.curriculum_node_id)
  );

  for (let depth = 0; depth < 8 && pendingIds.length; depth += 1) {
    const unresolved = pendingIds.filter(
      (id) => !curriculumById.has(id)
    );

    if (!unresolved.length) break;

    const { data: curriculumNodes, error: curriculumError } =
      await supabase
        .from("aeos_curriculum_nodes")
        .select(`
          curriculum_node_id,
          node_type,
          node_name,
          parent_node_id,
          sequence
        `)
        .in("curriculum_node_id", unresolved);

    if (curriculumError) throw curriculumError;

    for (const node of curriculumNodes ?? []) {
      curriculumById.set(node.curriculum_node_id, node);
    }

    pendingIds = unique(
      (curriculumNodes ?? []).map((node) => node.parent_node_id)
    );
  }

  function curriculumPath(curriculumNodeId) {
    let current = curriculumById.get(curriculumNodeId) || null;
    let strand = null;
    let topic = null;
    let guard = 0;

    while (current && guard < 12) {
      const type = String(current.node_type || "").toLowerCase();

      if (!topic && type === "topic") topic = current;
      if (!strand && type === "strand") strand = current;

      current = current.parent_node_id
        ? curriculumById.get(current.parent_node_id) || null
        : null;

      guard += 1;
    }

    return { strand, topic };
  }

  return (nodes ?? []).map((node) => {
    const path = curriculumPath(node.curriculum_node_id);

    return {
      learningNodeId: node.learning_node_id,
      curriculumNodeId: node.curriculum_node_id,
      skillName: node.source_label || "Learning skill",
      observableStatement: node.observable_statement || null,
      learningOutcome: node.learning_outcome || null,
      subjectId: node.subject_id || null,
      originProgrammeId: node.origin_programme_id || null,
      evidenceOnly: true,
      strand: path.strand
        ? {
            curriculumNodeId: path.strand.curriculum_node_id,
            name: path.strand.node_name,
            sequence: path.strand.sequence,
          }
        : null,
      topic: path.topic
        ? {
            curriculumNodeId: path.topic.curriculum_node_id,
            name: path.topic.node_name,
            sequence: path.topic.sequence,
          }
        : null,
    };
  });
}

function normalizeStudentEvidence({
  row,
  session,
  skill,
  offering,
  displayName,
}) {
  const evidenceType = getEvidenceType(row);
  const sourceTimestamp = getSourceTimestamp(row);
  const sourceSeconds = parseSourceTimestamp(sourceTimestamp);

  const normalized = {
    evidenceId: row.evidence_id,
    learningNodeId: row.learning_node_id,
    skillName: skillName(skill),
    observableStatement: skill?.observableStatement || null,
    learningOutcome: skill?.learningOutcome || null,

    offeringId: session?.offering_id || skill?.offeringId || null,
    offeringName:
      offering?.offeringName ||
      skill?.offeringName ||
      null,
    subjectName:
      offering?.subjectName ||
      skill?.subjectName ||
      null,

    strand: skill?.strand || null,
    topic: skill?.topic || null,

    evidenceType,
    evidenceSummary: formatStudentEvidenceSummary(
      row.evidence_summary,
      displayName
    ),
    independenceLevel: row.independence_level || null,

    evidenceSourceType: row.evidence_source_type || null,

    sessionId: row.session_id || null,
    sessionTitle:
      session?.session_title ||
      offering?.offeringName ||
      offering?.subjectName ||
      "Learning session",
    sessionDate: getSessionOccurrenceDate(session),

    sourceTimestamp,
    sourceSeconds,
    chronologyState:
      session && getSessionOccurrenceDate(session)
        ? "dated"
        : "undated",

    observedAt: row.observed_at || null,
    approvedAt: row.approved_at || null,
  };

  return {
    ...normalized,
    ...getStudentEvidenceState(normalized),
  };
}

function groupSessionSkillEvidence(evidence) {
  const groups = new Map();

  for (const item of evidence) {
    const sessionKey = item.sessionId || "undated";
    const key = `${sessionKey}::${item.learningNodeId}`;

    if (!groups.has(key)) {
      groups.set(key, {
        sessionId: item.sessionId,
        sessionDate: item.sessionDate,
        sessionTitle: item.sessionTitle,
        offeringId: item.offeringId,
        offeringName: item.offeringName,
        subjectName: item.subjectName,
        learningNodeId: item.learningNodeId,
        skillName: item.skillName,
        observableStatement: item.observableStatement,
        strand: item.strand,
        topic: item.topic,
        evidence: [],
      });
    }

    groups.get(key).evidence.push(item);
  }

  return [...groups.values()].map((group) => {
    const timestamped = group.evidence
      .filter((item) => item.sourceSeconds != null)
      .sort((a, b) => a.sourceSeconds - b.sourceSeconds);

    const allTimestamped =
      timestamped.length === group.evidence.length;

    const states = unique(
      group.evidence.map((item) => item.state)
    );

    const evidenceTypes = unique(
      group.evidence.map((item) => item.evidenceType)
    );

    const hasMixedEvidence =
      states.length > 1 || evidenceTypes.length > 1;

    const representativeEvidence =
      group.evidence.length === 1
        ? group.evidence[0]
        : allTimestamped
          ? timestamped[timestamped.length - 1]
          : !hasMixedEvidence
            ? group.evidence[0]
            : null;

    let state = representativeEvidence?.state || "mixed";
    let label =
      representativeEvidence?.label ||
      "You worked through this";
    let tone =
      representativeEvidence?.tone ||
      "mixed";

    return {
      ...group,
      evidence: [
        ...timestamped,
        ...group.evidence.filter(
          (item) => item.sourceSeconds == null
        ),
      ],
      evidenceCount: group.evidence.length,
      hasMultipleEvidence: group.evidence.length > 1,
      hasMixedEvidence,
      chronologyComplete: allTimestamped,
      representativeEvidence,
      state,
      label,
      tone,
    };
  });
}

function buildRecentLearning(groups) {
  const sessions = new Map();

  for (const group of groups) {
    if (!group.sessionId || !group.sessionDate) continue;

    if (!sessions.has(group.sessionId)) {
      sessions.set(group.sessionId, {
        sessionId: group.sessionId,
        sessionDate: group.sessionDate,
        title: group.sessionTitle,
        offeringId: group.offeringId,
        offeringName: group.offeringName,
        subjectName: group.subjectName,
        skills: [],
      });
    }

    sessions.get(group.sessionId).skills.push(group);
  }

  return [...sessions.values()]
    .sort(
      (a, b) =>
        (safeTime(b.sessionDate) || 0) -
        (safeTime(a.sessionDate) || 0)
    )
    .slice(0, RECENT_SESSION_LIMIT);
}

function buildLatestSkillSnapshot(groups) {
  const bySkill = new Map();

  const dated = groups
    .filter((group) => group.sessionDate)
    .sort(
      (a, b) =>
        (safeTime(b.sessionDate) || 0) -
        (safeTime(a.sessionDate) || 0)
    );

  for (const group of dated) {
    if (!bySkill.has(group.learningNodeId)) {
      bySkill.set(group.learningNodeId, group);
    }
  }

  return [...bySkill.values()];
}

function buildPenENoticed(recentLearning) {
  const evidence = recentLearning.flatMap((session) =>
    session.skills.flatMap((skill) => skill.evidence)
  );

  return {
    sessionCount: recentLearning.length,
    evidenceCount: evidence.length,
    distinctSkillCount: new Set(
      evidence.map((item) => item.learningNodeId)
    ).size,
    independentCount: evidence.filter(
      (item) => item.independenceLevel === "independent"
    ).length,
    subjects: unique(
      recentLearning.map((session) => session.subjectName)
    ),
    strands: unique(
      evidence.map((item) => item.strand?.name)
    ),
  };
}

function buildLearningMapPreview(enrolments) {
  const strands = new Map();

  for (const enrolment of enrolments) {
    for (const skill of enrolment.skills ?? []) {
      const strandName = skill.strand?.name || "Other learning";
      const strandId =
        skill.strand?.curriculumNodeId ||
        `${enrolment.offeringId}::other`;
      const key = `${enrolment.offeringId}::${strandId}`;

      if (!strands.has(key)) {
        strands.set(key, {
          key,
          strandId,
          strandName,
          offeringId: enrolment.offeringId,
          offeringName: enrolment.offeringName,
          subjectName: enrolment.subjectName,
          totalSkillCount: 0,
          recordedSkillCount: 0,
          approvedEvidenceCount: 0,
        });
      }

      const entry = strands.get(key);
      entry.totalSkillCount += 1;
      entry.approvedEvidenceCount +=
        skill.approvedEvidenceCount ?? 0;

      if (skill.hasRecordedProgress) {
        entry.recordedSkillCount += 1;
      }
    }
  }

  return [...strands.values()].sort((a, b) => {
    if (a.subjectName !== b.subjectName) {
      return String(a.subjectName || "").localeCompare(
        String(b.subjectName || "")
      );
    }

    return a.strandName.localeCompare(b.strandName);
  });
}

function buildLearningJourney(groups) {
  const sessions = new Map();
  const undated = [];

  for (const group of groups) {
    if (!group.sessionId || !group.sessionDate) {
      undated.push(group);
      continue;
    }

    if (!sessions.has(group.sessionId)) {
      sessions.set(group.sessionId, {
        sessionId: group.sessionId,
        sessionDate: group.sessionDate,
        title: group.sessionTitle,
        offeringName: group.offeringName,
        subjectName: group.subjectName,
        skills: [],
      });
    }

    sessions.get(group.sessionId).skills.push(group);
  }

  return {
    sessions: [...sessions.values()].sort(
      (a, b) =>
        (safeTime(b.sessionDate) || 0) -
        (safeTime(a.sessionDate) || 0)
    ),
    undated,
  };
}

function sortRecommendations(recommendations) {
  const now = Date.now();

  return recommendations
    .filter((item) => {
      if (!item.expires_at) return true;
      const expiry = safeTime(item.expires_at);
      return expiry == null || expiry > now;
    })
    .sort((a, b) => {
      const aDue = safeTime(a.due_at);
      const bDue = safeTime(b.due_at);
      const aOverdue = aDue != null && aDue < now;
      const bOverdue = bDue != null && bDue < now;

      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

      const priorityDifference =
        (a.priority ?? 999) - (b.priority ?? 999);

      if (priorityDifference !== 0) return priorityDifference;

      if (aDue != null && bDue != null) return aDue - bDue;
      if (aDue != null) return -1;
      if (bDue != null) return 1;

      return (
        (safeTime(b.created_at) || 0) -
        (safeTime(a.created_at) || 0)
      );
    });
}

function buildNextAction(recommendations, homework) {
  if (recommendations.length) {
    const item = recommendations[0];

    return {
      type: "recommendation",
      item: {
        id: item.recommendation_id,
        title: item.title,
        text: item.recommendation_text,
        dueAt: item.due_at || null,
        recommendationType: item.recommendation_type,
        learningNodeId: item.learning_node_id || null,
      },
    };
  }

  const nextHomework = homework?.todo?.[0] || null;

  if (nextHomework) {
    return {
      type: "homework",
      item: nextHomework,
    };
  }

  return {
    type: null,
    item: null,
  };
}

export async function fetchStudentPenE(studentUserId) {
  if (!studentUserId) {
    throw new Error("Student user ID is required.");
  }

  const [learning, homework] = await Promise.all([
    fetchStudentLearning(studentUserId),
    fetchStudentHomework(studentUserId),
  ]);

  const [
    sessionsResult,
    evidenceResult,
    recommendationsResult,
  ] = await Promise.all([
    supabase
      .from("aeos_sessions")
      .select(`
        session_id,
        offering_id,
        session_title,
        session_status,
        scheduled_start_at
      `)
      .eq("student_user_id", studentUserId)
      .eq("session_status", "completed")
      .order("scheduled_start_at", {
        ascending: false,
        nullsFirst: false,
      }),

    supabase
      .from("aeos_learning_evidence")
      .select(`
        evidence_id,
        student_id,
        student_user_id,
        learning_node_id,
        session_id,
        evidence_source_type,
        evidence_summary,
        evidence_detail,
        performance_score,
        independence_level,
        confidence_score,
        evidence_status,
        observed_at,
        approved_at,
        created_at
      `)
      .eq("student_user_id", studentUserId)
      .eq("evidence_status", "approved"),

    supabase
      .from("aeos_recommendations")
      .select(`
        recommendation_id,
        offering_id,
        learning_node_id,
        recommendation_type,
        title,
        recommendation_text,
        priority,
        recommendation_status,
        due_at,
        expires_at,
        created_at
      `)
      .eq("student_user_id", studentUserId)
      .eq("recommendation_status", "active"),
  ]);

  const firstError = [
    sessionsResult,
    evidenceResult,
    recommendationsResult,
  ].find((result) => result.error)?.error;

  if (firstError) throw firstError;

  const enrolments = learning.enrolments ?? [];

  const allSkills = enrolments.flatMap((enrolment) =>
    (enrolment.skills ?? []).map((skill) => ({
      ...skill,
      offeringId: enrolment.offeringId,
      offeringName: enrolment.offeringName,
      subjectName: enrolment.subjectName,
    }))
  );

  const skillByLearningNode = new Map(
    allSkills.map((skill) => [
      skill.learningNodeId || skill.learning_node_id,
      skill,
    ])
  );

  const evidenceRows = evidenceResult.data ?? [];
  const missingLearningNodeIds = unique(
    evidenceRows
      .map((row) => row.learning_node_id)
      .filter(
        (learningNodeId) =>
          learningNodeId &&
          !skillByLearningNode.has(learningNodeId)
      )
  );

  if (missingLearningNodeIds.length) {
    const evidenceOnlySkills =
      await fetchEvidenceOnlySkills(missingLearningNodeIds);

    for (const skill of evidenceOnlySkills) {
      skillByLearningNode.set(skill.learningNodeId, skill);
    }
  }

  const sessionById = new Map(
    (sessionsResult.data ?? []).map((session) => [
      session.session_id,
      session,
    ])
  );

  const offeringById = new Map(
    enrolments.map((enrolment) => [
      enrolment.offeringId,
      enrolment,
    ])
  );

  const normalizedEvidence = evidenceRows.map((row) => {
    const session = row.session_id
      ? sessionById.get(row.session_id) || null
      : null;

    const skill =
      skillByLearningNode.get(row.learning_node_id) || {
        learningNodeId: row.learning_node_id,
        skillName: "Learning skill",
      };

    const offering = session?.offering_id
      ? offeringById.get(session.offering_id) || null
      : skill?.offeringId
        ? offeringById.get(skill.offeringId) || null
        : null;

    return normalizeStudentEvidence({
      row,
      session,
      skill,
      offering,
      displayName: learning.student?.displayName,
    });
  });

  const sessionSkillGroups =
    groupSessionSkillEvidence(normalizedEvidence);

  const recentLearning =
    buildRecentLearning(sessionSkillGroups);

  const latestSkillSnapshot =
    buildLatestSkillSnapshot(sessionSkillGroups);

  const whatIveShown = latestSkillSnapshot
    .filter((item) => item.state === "shown")
    .sort(
      (a, b) =>
        (safeTime(b.sessionDate) || 0) -
        (safeTime(a.sessionDate) || 0)
    )
    .slice(0, SNAPSHOT_LIMIT);

  const imWorkingOn = latestSkillSnapshot
    .filter((item) =>
      ["developing", "practice", "mixed"].includes(item.state)
    )
    .sort(
      (a, b) =>
        (safeTime(b.sessionDate) || 0) -
        (safeTime(a.sessionDate) || 0)
    )
    .slice(0, SNAPSHOT_LIMIT);

  const recommendations = sortRecommendations(
    recommendationsResult.data ?? []
  );

  return {
    student: learning.student,
    enrolments,

    recentLearning,
    penENoticed: buildPenENoticed(recentLearning),

    learningMap: {
      strands: buildLearningMapPreview(enrolments),
    },

    whatIveShown,
    imWorkingOn,

    journey: buildLearningJourney(sessionSkillGroups),

    next: buildNextAction(recommendations, homework),

    recommendations,
  };
}



