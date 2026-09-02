import { supabase } from "./supabase";

const ACTIVE_ENROLMENT_STATUSES = ["active", "paused"];
const ACTIVE_STATUS = "Active";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function byId(rows, key) {
  return new Map((rows ?? []).map((row) => [row[key], row]));
}

function buildCurriculumPath(curriculumNodeId, curriculumMap) {
  const node = curriculumMap.get(curriculumNodeId);
  if (!node) {
    return {
      strand: null,
      topic: null,
      skill: null,
    };
  }

  const chain = [];
  const visited = new Set();
  let current = node;

  while (current && !visited.has(current.curriculum_node_id)) {
    visited.add(current.curriculum_node_id);
    chain.unshift(current);

    current = current.parent_node_id
      ? curriculumMap.get(current.parent_node_id)
      : null;
  }

  return {
    strand:
      chain.find((item) => item.node_type === "strand") ?? null,

    topic:
      chain.find((item) => item.node_type === "topic") ?? null,

    skill:
      chain.find((item) => item.node_type === "skill") ?? node,
  };
}

function normalizeMastery(row) {
  if (!row) return null;

  return {
    masteryId: row.mastery_id,
    masteryStatus: row.mastery_status,
    masteryScore: row.mastery_score,
    confidenceScore: row.confidence_score,
    approvedEvidenceCount: row.approved_evidence_count ?? 0,
    independentEvidenceCount: row.independent_evidence_count ?? 0,
    firstEvidenceAt: row.first_evidence_at,
    lastEvidenceAt: row.last_evidence_at,
    lastCalculatedAt: row.last_calculated_at,
    updatedAt: row.updated_at,
  };
}

function determineScopeMode({
  programmeId,
  subjectId,
  curriculumFrameworks,
}) {
  if (programmeId === "PRI" && subjectId === "MATH") {
    return "primary_level_cle";
  }

  if (
    subjectId === "MATH" &&
    curriculumFrameworks.some(
      (item) => item.frameworkId === "FW-CSEC"
    )
  ) {
    return "csec_framework";
  }

  if (programmeId === "SEC" && subjectId === "MATH") {
    return "secondary_expected_level";
  }

  return "framework_scope";
}

async function fetchPrimarySkills({
  programmeId,
  subjectId,
  curriculumLevels,
}) {
  const levelIds = unique(
    curriculumLevels.map((item) => item.levelId)
  );

  if (!levelIds.length) return [];

  const { data: expectations, error: expectationError } =
    await supabase
      .from("aeos_curriculum_level_expectations")
      .select(`
        curriculum_level_expectation_id,
        curriculum_node_id,
        level_id,
        source_status,
        progression_status,
        expectation_text,
        content_constraints
      `)
      .in("level_id", levelIds)
      .eq("status", ACTIVE_STATUS);

  if (expectationError) throw expectationError;

  const curriculumNodeIds = unique(
    (expectations ?? []).map(
      (row) => row.curriculum_node_id
    )
  );

  if (!curriculumNodeIds.length) return [];

  const { data: learningNodes, error: learningNodeError } =
    await supabase
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
        is_observable
      `)
      .in("curriculum_node_id", curriculumNodeIds)
      .eq("subject_id", subjectId)
      .eq("origin_programme_id", programmeId)
      .eq("node_type", "skill")
      .eq("is_observable", true)
      .eq("status", ACTIVE_STATUS);

  if (learningNodeError) throw learningNodeError;

  const expectationsByNode = new Map();

  for (const expectation of expectations ?? []) {
    if (!expectationsByNode.has(expectation.curriculum_node_id)) {
      expectationsByNode.set(
        expectation.curriculum_node_id,
        []
      );
    }

    expectationsByNode
      .get(expectation.curriculum_node_id)
      .push(expectation);
  }

  return (learningNodes ?? []).map((node) => ({
    learningNodeId: node.learning_node_id,
    curriculumNodeId: node.curriculum_node_id,
    skillName: node.source_label,
    observableStatement: node.observable_statement,
    learningOutcome: node.learning_outcome,
    levelContexts: (
      expectationsByNode.get(node.curriculum_node_id) ?? []
    ).map((expectation) => ({
      levelId: expectation.level_id,
      sourceStatus: expectation.source_status,
      progressionStatus: expectation.progression_status,
      expectationText: expectation.expectation_text,
      contentConstraints: expectation.content_constraints,
    })),
  }));
}

async function fetchFrameworkMappedLearningNodes(
  frameworkIds,
  subjectId
) {
  if (!frameworkIds.length) return [];

  const { data: mappings, error: mappingError } =
    await supabase
      .from("aeos_framework_mappings")
      .select(`
        framework_mapping_id,
        learning_node_id,
        framework_id,
        mapping_type
      `)
      .in("framework_id", frameworkIds)
      .eq("status", ACTIVE_STATUS);

  if (mappingError) throw mappingError;

  const learningNodeIds = unique(
    (mappings ?? []).map((row) => row.learning_node_id)
  );

  if (!learningNodeIds.length) return [];

  const { data: nodes, error: nodeError } = await supabase
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
      is_observable
    `)
    .in("learning_node_id", learningNodeIds)
    .eq("subject_id", subjectId)
    .eq("node_type", "skill")
    .eq("is_observable", true)
    .eq("status", ACTIVE_STATUS);

  if (nodeError) throw nodeError;

  return nodes ?? [];
}

async function fetchSecondaryExpectedLevelSkills({
  subjectId,
  curriculumFrameworks,
  curriculumLevels,
}) {
  const frameworkIds = curriculumFrameworks.map(
    (item) => item.frameworkId
  );

  const levelIds = unique(
    curriculumLevels.map((item) => item.levelId)
  );

  const nodes = await fetchFrameworkMappedLearningNodes(
    frameworkIds,
    subjectId
  );

  if (!nodes.length || !levelIds.length) return [];

  const learningNodeIds = nodes.map(
    (node) => node.learning_node_id
  );

  const { data: levelLinks, error: levelError } =
    await supabase
      .from("aeos_learning_node_levels")
      .select(`
        learning_node_id,
        level_id,
        relationship_type
      `)
      .in("learning_node_id", learningNodeIds)
      .in("level_id", levelIds)
      .eq("relationship_type", "expected_level");

  if (levelError) throw levelError;

  const eligibleIds = new Set(
    (levelLinks ?? []).map((row) => row.learning_node_id)
  );

  const linksByNode = new Map();

  for (const link of levelLinks ?? []) {
    if (!linksByNode.has(link.learning_node_id)) {
      linksByNode.set(link.learning_node_id, []);
    }

    linksByNode.get(link.learning_node_id).push(link);
  }

  return nodes
    .filter((node) => eligibleIds.has(node.learning_node_id))
    .map((node) => ({
      learningNodeId: node.learning_node_id,
      curriculumNodeId: node.curriculum_node_id,
      skillName: node.source_label,
      observableStatement: node.observable_statement,
      learningOutcome: node.learning_outcome,
      levelContexts: (
        linksByNode.get(node.learning_node_id) ?? []
      ).map((link) => ({
        levelId: link.level_id,
        relationshipType: link.relationship_type,
      })),
    }));
}

async function fetchCsecSkills({
  subjectId,
  curriculumFrameworks,
}) {
  const frameworkIds = curriculumFrameworks.map(
    (item) => item.frameworkId
  );

  const nodes = await fetchFrameworkMappedLearningNodes(
    frameworkIds,
    subjectId
  );

  return nodes.map((node) => ({
    learningNodeId: node.learning_node_id,
    curriculumNodeId: node.curriculum_node_id,
    skillName: node.source_label,
    observableStatement: node.observable_statement,
    learningOutcome: node.learning_outcome,

    // Deliberately not assigning F4/F5 mastery scope.
    // Current canonical CSEC data represents these as
    // programme-span relationships.
    levelContexts: [],
  }));
}

async function fetchGenericFrameworkSkills({
  subjectId,
  curriculumFrameworks,
}) {
  const frameworkIds = curriculumFrameworks.map(
    (item) => item.frameworkId
  );

  const nodes = await fetchFrameworkMappedLearningNodes(
    frameworkIds,
    subjectId
  );

  return nodes.map((node) => ({
    learningNodeId: node.learning_node_id,
    curriculumNodeId: node.curriculum_node_id,
    skillName: node.source_label,
    observableStatement: node.observable_statement,
    learningOutcome: node.learning_outcome,
    levelContexts: [],
  }));
}

async function fetchCurriculumHierarchy(skills) {
  const directIds = unique(
    skills.map((skill) => skill.curriculumNodeId)
  );

  if (!directIds.length) return new Map();

  /*
   * The curriculum table is small enough for the browser to
   * retrieve the active hierarchy visible under RLS. This avoids
   * recursive client round-trips while preserving canonical parents.
   */
  const { data, error } = await supabase
    .from("aeos_curriculum_nodes")
    .select(`
      curriculum_node_id,
      programme_id,
      subject_id,
      framework_id,
      parent_node_id,
      node_type,
      node_name,
      sequence
    `)
    .eq("status", ACTIVE_STATUS);

  if (error) throw error;

  return byId(data ?? [], "curriculum_node_id");
}

export async function fetchStudentLearning(studentUserId) {
  if (!studentUserId) {
    throw new Error("Student portal user ID is required.");
  }

  /*
   * Resolve authenticated portal identity to the canonical
   * AEOS student record.
   */
  const { data: student, error: studentError } = await supabase
    .from("aeos_students")
    .select(`
      student_id,
      portal_user_id,
      first_name,
      last_name,
      display_name,
      student_status,
      portal_status
    `)
    .eq("portal_user_id", studentUserId)
    .maybeSingle();

  if (studentError) throw studentError;

  if (!student) {
    throw new Error(
      "No AEOS student record is linked to this portal account."
    );
  }

  /*
   * RLS still protects the query by auth.uid().
   * We retain both identities because current AEOS operational
   * tables still use student_user_id while newer student records
   * also use canonical student_id.
   */
  const { data: enrolmentRows, error: enrolmentError } =
    await supabase
      .from("aeos_student_enrolments")
      .select(`
        enrolment_id,
        student_id,
        student_user_id,
        offering_id,
        status,
        enrolled_at,
        offering:aeos_offerings!inner(
          offering_id,
          offering_name,
          programme_id,
          subject_id,
          audience_level_id,
          subject:aeos_subjects(
            subject_id,
            subject_name,
            display_name
          )
        )
      `)
      .eq("student_user_id", studentUserId)
      .in("status", ACTIVE_ENROLMENT_STATUSES);

  if (enrolmentError) throw enrolmentError;

  const enrolments = enrolmentRows ?? [];

  if (!enrolments.length) {
    return {
      student: {
        studentId: student.student_id,
        portalUserId: student.portal_user_id,
        displayName:
          student.display_name ||
          student.first_name ||
          "Student",
      },
      enrolments: [],
    };
  }

  const offeringIds = unique(
    enrolments.map((row) => row.offering_id)
  );

  const [
    curriculumLevelResult,
    frameworkResult,
    masteryResult,
    evidenceResult
  ] = await Promise.all([
    supabase
      .from("aeos_offering_curriculum_levels")
      .select(`
        offering_id,
        curriculum_level_id,
        relationship_type,
        level:aeos_levels(
          level_id,
          level_name,
          sequence
        )
      `)
      .in("offering_id", offeringIds)
      .eq("status", ACTIVE_STATUS),

    supabase
      .from("aeos_offering_frameworks")
      .select(`
        offering_id,
        framework_id,
        relationship_type,
        framework:aeos_frameworks(
          framework_id,
          framework_name,
          framework_type,
          programme_id,
          subject_id
        )
      `)
      .in("offering_id", offeringIds)
      .eq("status", ACTIVE_STATUS),

    supabase
      .from("aeos_student_mastery_portal")
      .select(`
        mastery_id,
        student_user_id,
        learning_node_id,
        mastery_status,
        mastery_score,
        confidence_score,
        approved_evidence_count,
        independent_evidence_count,
        first_evidence_at,
        last_evidence_at,
        last_calculated_at,
        updated_at
      `)
      .eq("student_user_id", studentUserId),

    supabase
      .from("aeos_learning_evidence")
      .select(`
        evidence_id,
        learning_node_id
      `)
      .eq("student_user_id", studentUserId)
      .eq("evidence_status", "approved"),
  ]);

  const preliminaryError = [
    curriculumLevelResult,
    frameworkResult,
    masteryResult,
    evidenceResult,
  ].find((result) => result.error)?.error;

  if (preliminaryError) throw preliminaryError;

  const curriculumLevelsByOffering = new Map();

  for (const row of curriculumLevelResult.data ?? []) {
    if (!curriculumLevelsByOffering.has(row.offering_id)) {
      curriculumLevelsByOffering.set(row.offering_id, []);
    }

    curriculumLevelsByOffering.get(row.offering_id).push({
      levelId: row.curriculum_level_id,
      levelName:
        row.level?.level_name ?? row.curriculum_level_id,
      sequence: row.level?.sequence ?? null,
      relationshipType: row.relationship_type,
    });
  }

  const frameworksByOffering = new Map();

  for (const row of frameworkResult.data ?? []) {
    /*
     * Internal sequencing frameworks are not themselves the
     * canonical curriculum universe for My Learning.
     */
    if (
      ![
        "curriculum",
        "curriculum_and_assessment",
      ].includes(row.relationship_type)
    ) {
      continue;
    }

    if (!frameworksByOffering.has(row.offering_id)) {
      frameworksByOffering.set(row.offering_id, []);
    }

    frameworksByOffering.get(row.offering_id).push({
      frameworkId: row.framework_id,
      frameworkName:
        row.framework?.framework_name ?? row.framework_id,
      frameworkType: row.framework?.framework_type ?? null,
      frameworkProgrammeId:
        row.framework?.programme_id ?? null,
      frameworkSubjectId:
        row.framework?.subject_id ?? null,
      relationshipType: row.relationship_type,
    });
  }

  const masteryByLearningNode = byId(
    masteryResult.data ?? [],
    "learning_node_id"
  );


  const approvedEvidenceCountByLearningNode = new Map();

  for (const row of evidenceResult.data ?? []) {
    approvedEvidenceCountByLearningNode.set(
      row.learning_node_id,
      (approvedEvidenceCountByLearningNode.get(
        row.learning_node_id
      ) ?? 0) + 1
    );
  }


  const normalizedEnrolments = [];

  for (const enrolment of enrolments) {
    const offering = enrolment.offering;

    const curriculumLevels =
      curriculumLevelsByOffering.get(enrolment.offering_id) ?? [];

    const curriculumFrameworks =
      frameworksByOffering.get(enrolment.offering_id) ?? [];

    const scopeMode = determineScopeMode({
      programmeId: offering.programme_id,
      subjectId: offering.subject_id,
      curriculumFrameworks,
    });

    let skills = [];

    if (scopeMode === "primary_level_cle") {
      skills = await fetchPrimarySkills({
        programmeId: offering.programme_id,
        subjectId: offering.subject_id,
        curriculumLevels,
      });
    } else if (scopeMode === "secondary_expected_level") {
      skills = await fetchSecondaryExpectedLevelSkills({
        subjectId: offering.subject_id,
        curriculumFrameworks,
        curriculumLevels,
      });
    } else if (scopeMode === "csec_framework") {
      skills = await fetchCsecSkills({
        subjectId: offering.subject_id,
        curriculumFrameworks,
      });
    } else {
      skills = await fetchGenericFrameworkSkills({
        subjectId: offering.subject_id,
        curriculumFrameworks,
      });
    }

    const curriculumMap =
      await fetchCurriculumHierarchy(skills);

    const normalizedSkills = skills
      .map((skill) => {
        const path = buildCurriculumPath(
          skill.curriculumNodeId,
          curriculumMap
        );

        return {
          ...skill,

          strand: path.strand
            ? {
                curriculumNodeId:
                  path.strand.curriculum_node_id,
                name: path.strand.node_name,
                sequence: path.strand.sequence,
              }
            : null,

          topic: path.topic
            ? {
                curriculumNodeId:
                  path.topic.curriculum_node_id,
                name: path.topic.node_name,
                sequence: path.topic.sequence,
              }
            : null,

          approvedEvidenceCount:
            approvedEvidenceCountByLearningNode.get(
              skill.learningNodeId
            ) ?? 0,

          hasRecordedProgress:
            (
              approvedEvidenceCountByLearningNode.get(
                skill.learningNodeId
              ) ?? 0
            ) > 0,

          mastery: normalizeMastery(
            masteryByLearningNode.get(skill.learningNodeId)
          ),
        };
      })
      .sort((a, b) => {
        const strandCompare =
          (a.strand?.sequence ?? 9999) -
          (b.strand?.sequence ?? 9999);

        if (strandCompare !== 0) return strandCompare;

        const topicCompare =
          (a.topic?.sequence ?? 9999) -
          (b.topic?.sequence ?? 9999);

        if (topicCompare !== 0) return topicCompare;

        return a.skillName.localeCompare(b.skillName);
      });

    normalizedEnrolments.push({
      enrolmentId: enrolment.enrolment_id,
      status: enrolment.status,
      enrolledAt: enrolment.enrolled_at,

      offeringId: offering.offering_id,
      offeringName: offering.offering_name,

      programmeId: offering.programme_id,
      subjectId: offering.subject_id,
      subjectName:
        offering.subject?.display_name ||
        offering.subject?.subject_name ||
        offering.subject_id,

      audienceLevelId: offering.audience_level_id,

      curriculumLevels,
      curriculumFrameworks,
      scopeMode,

      skillCount: normalizedSkills.length,
      skills: normalizedSkills,
    });
  }

  return {
    student: {
      studentId: student.student_id,
      portalUserId: student.portal_user_id,
      displayName:
        student.display_name ||
        student.first_name ||
        "Student",
    },

    enrolments: normalizedEnrolments,
  };
}


