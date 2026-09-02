import { supabase } from "./supabase";
import { fetchStudentLearning } from "./studentLearning";

function skillName(skill) {
  return (
    skill.skillName ||
    skill.learningNodeName ||
    skill.learning_node_name ||
    skill.nodeName ||
    skill.node_name ||
    skill.name ||
    "Learning skill"
  );
}

function sessionDate(session) {
  return (
    session.ended_at ||
    session.started_at ||
    session.scheduled_start_at ||
    session.created_at ||
    null
  );
}

export async function fetchStudentPenE(studentUserId) {
  if (!studentUserId) {
    throw new Error("Student user ID is required.");
  }

  const learning = await fetchStudentLearning(studentUserId);

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
        scheduled_start_at,
        scheduled_end_at,
        started_at,
        ended_at,
        created_at
      `)
      .eq("student_user_id", studentUserId)
      .eq("session_status", "completed")
      .order("scheduled_start_at", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(3),

    supabase
      .from("aeos_learning_evidence")
      .select(`
        evidence_id,
        learning_node_id,
        session_id,
        observed_at,
        evidence_status
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
      .eq("recommendation_status", "active")
      .order("priority", {
        ascending: true,
      })
      .order("created_at", {
        ascending: false,
      }),
  ]);

  const firstError = [
    sessionsResult,
    evidenceResult,
    recommendationsResult,
  ].find((result) => result.error)?.error;

  if (firstError) {
    throw firstError;
  }

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
      skill.learningNodeId ||
        skill.learning_node_id,
      skill,
    ])
  );

  const offeringById = new Map(
    enrolments.map((enrolment) => [
      enrolment.offeringId,
      enrolment,
    ])
  );

  const progressSkills = allSkills.filter(
    (skill) => skill.hasRecordedProgress
  );

  const evidenceBySession = new Map();

  for (const evidence of evidenceResult.data ?? []) {
    if (!evidence.session_id) continue;

    if (!evidenceBySession.has(evidence.session_id)) {
      evidenceBySession.set(evidence.session_id, []);
    }

    evidenceBySession
      .get(evidence.session_id)
      .push(evidence);
  }

  const recentLearning = (sessionsResult.data ?? [])
    .map((session) => {
      const sessionEvidence =
        evidenceBySession.get(session.session_id) ?? [];

      const learningNodeIds = [
        ...new Set(
          sessionEvidence
            .map((row) => row.learning_node_id)
            .filter(Boolean)
        ),
      ];

      const skills = learningNodeIds
        .map((learningNodeId) => {
          const skill =
            skillByLearningNode.get(learningNodeId);

          if (!skill) return null;

          return {
            learningNodeId,
            skillName: skillName(skill),
          };
        })
        .filter(Boolean);

      const offering =
        offeringById.get(session.offering_id) ?? null;

      return {
        sessionId: session.session_id,
        title:
          session.session_title ||
          offering?.offeringName ||
          offering?.subjectName ||
          "Learning session",
        offeringId: session.offering_id,
        offeringName:
          offering?.offeringName ?? null,
        subjectName:
          offering?.subjectName ?? null,
        sessionStatus: session.session_status,
        sessionDate: sessionDate(session),
        progressSkillCount: skills.length,
        skills,
      };
    })
    .sort((a, b) => {
      const aDate = a.sessionDate
        ? new Date(a.sessionDate).getTime()
        : 0;

      const bDate = b.sessionDate
        ? new Date(b.sessionDate).getTime()
        : 0;

      return bDate - aDate;
    });

  const now = Date.now();

  const recommendations = (
    recommendationsResult.data ?? []
  ).filter((recommendation) => {
    if (!recommendation.expires_at) {
      return true;
    }

    const expiry = new Date(
      recommendation.expires_at
    ).getTime();

    return (
      Number.isNaN(expiry) ||
      expiry > now
    );
  });

  return {
    student: learning.student,
    enrolments,
    totalSkillCount: allSkills.length,
    progressSkillCount: progressSkills.length,
    progressSkills: progressSkills.map((skill) => ({
      learningNodeId:
        skill.learningNodeId ||
        skill.learning_node_id,
      skillName: skillName(skill),
      offeringId: skill.offeringId,
      offeringName: skill.offeringName,
      subjectName: skill.subjectName,
    })),
    recommendations,
    recentLearning,
  };
}

