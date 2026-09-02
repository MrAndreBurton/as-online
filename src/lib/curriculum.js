import { supabase } from "./supabase";

export async function fetchCurriculumBrowserData() {
  const [
    programmesResult,
    subjectsResult,
    levelsResult,
    nodesResult,
    curriculumExpectationsResult,
    learningNodesResult,
    learningNodeLevelsResult,
  ] = await Promise.all([
    supabase
      .from("aeos_programmes")
      .select(`
        programme_id,
        programme_name,
        phase,
        scope,
        status,
        description
      `)
      .eq("status", "Active")
      .order("programme_name"),

    supabase
      .from("aeos_subjects")
      .select(`
        subject_id,
        subject_name,
        display_name,
        status,
        description
      `)
      .eq("status", "Active")
      .order("subject_name"),

    supabase
      .from("aeos_levels")
      .select(`
        level_id,
        level_name,
        programme_id,
        level_number,
        sequence,
        status
      `)
      .eq("status", "Active")
      .order("sequence"),

    supabase
      .from("aeos_curriculum_nodes")
      .select(`
        curriculum_node_id,
        programme_id,
        subject_id,
        framework_id,
        parent_node_id,
        node_type,
        node_name,
        sequence,
        status,
        source_document
      `)
      .eq("status", "Active")
      .order("sequence"),

    supabase
      .from("aeos_curriculum_level_expectations")
      .select(`
        curriculum_level_expectation_id,
        curriculum_node_id,
        level_id,
        status
      `)
      .eq("status", "Active"),

    supabase
      .from("aeos_learning_nodes")
      .select(`
        learning_node_id,
        curriculum_node_id,
        status
      `)
      .eq("status", "Active"),

    supabase
      .from("aeos_learning_node_levels")
      .select(`
        learning_node_level_id,
        learning_node_id,
        level_id,
        relationship_type
      `),
  ]);

  const results = [
    programmesResult,
    subjectsResult,
    levelsResult,
    nodesResult,
    curriculumExpectationsResult,
    learningNodesResult,
    learningNodeLevelsResult,
  ];

  const failedResult = results.find(
    (result) => result.error
  );

  if (failedResult?.error) {
    throw failedResult.error;
  }

  const programmes =
    programmesResult.data ?? [];

  const subjects =
    subjectsResult.data ?? [];

  const levels =
    levelsResult.data ?? [];

  const nodes =
    nodesResult.data ?? [];

  const curriculumExpectations =
    curriculumExpectationsResult.data ?? [];

  const learningNodes =
    learningNodesResult.data ?? [];

  const learningNodeLevels =
    learningNodeLevelsResult.data ?? [];

  /*
   * Build:
   *
   * curriculum node
   *   -> Learning Nodes
   *   -> Learning Node level relationships
   *
   * This lets the browser filter curriculum
   * nodes by level even where the level is
   * represented operationally through the
   * canonical Learning Node layer.
   */

  const learningNodeIdsByCurriculumNode =
    new Map();

  learningNodes.forEach((learningNode) => {
    if (!learningNode.curriculum_node_id) {
      return;
    }

    if (
      !learningNodeIdsByCurriculumNode.has(
        learningNode.curriculum_node_id
      )
    ) {
      learningNodeIdsByCurriculumNode.set(
        learningNode.curriculum_node_id,
        []
      );
    }

    learningNodeIdsByCurriculumNode
      .get(
        learningNode.curriculum_node_id
      )
      .push(
        learningNode.learning_node_id
      );
  });

  const levelIdsByLearningNode =
    new Map();

  learningNodeLevels.forEach(
    (relationship) => {
      if (
        !levelIdsByLearningNode.has(
          relationship.learning_node_id
        )
      ) {
        levelIdsByLearningNode.set(
          relationship.learning_node_id,
          new Set()
        );
      }

      levelIdsByLearningNode
        .get(
          relationship.learning_node_id
        )
        .add(
          relationship.level_id
        );
    }
  );

  /*
   * CLEs are also first-class level scope.
   *
   * For Primary Mathematics in particular,
   * these are important because a curriculum
   * skill may be established at a level by
   * its Curriculum Level Expectation.
   */

  const cleLevelIdsByCurriculumNode =
    new Map();

  curriculumExpectations.forEach(
    (expectation) => {
      if (
        !cleLevelIdsByCurriculumNode.has(
          expectation.curriculum_node_id
        )
      ) {
        cleLevelIdsByCurriculumNode.set(
          expectation.curriculum_node_id,
          new Set()
        );
      }

      cleLevelIdsByCurriculumNode
        .get(
          expectation.curriculum_node_id
        )
        .add(
          expectation.level_id
        );
    }
  );

  const enrichedNodes = nodes.map(
    (node) => {
      const levelIds = new Set();

      const cleLevels =
        cleLevelIdsByCurriculumNode.get(
          node.curriculum_node_id
        );

      cleLevels?.forEach((levelId) => {
        levelIds.add(levelId);
      });

      const linkedLearningNodeIds =
        learningNodeIdsByCurriculumNode.get(
          node.curriculum_node_id
        ) ?? [];

      linkedLearningNodeIds.forEach(
        (learningNodeId) => {
          const learningNodeLevelsForNode =
            levelIdsByLearningNode.get(
              learningNodeId
            );

          learningNodeLevelsForNode?.forEach(
            (levelId) => {
              levelIds.add(levelId);
            }
          );
        }
      );

      return {
        ...node,
        level_ids: Array.from(levelIds),
        learning_node_count:
          linkedLearningNodeIds.length,
      };
    }
  );

  return {
    programmes,
    subjects,
    levels,
    nodes: enrichedNodes,
  };
}

export async function fetchCurriculumNodeDetail(
  curriculumNodeId
) {
  if (!curriculumNodeId) {
    throw new Error(
      "A curriculum node ID is required."
    );
  }

  const [
    nodeResult,
    expectationsResult,
    learningNodesResult,
  ] = await Promise.all([
    supabase
      .from("aeos_curriculum_nodes")
      .select(`
        curriculum_node_id,
        programme_id,
        subject_id,
        framework_id,
        parent_node_id,
        node_type,
        node_name,
        sequence,
        status,
        source_document
      `)
      .eq(
        "curriculum_node_id",
        curriculumNodeId
      )
      .single(),

    supabase
      .from(
        "aeos_curriculum_level_expectations"
      )
      .select(`
        curriculum_level_expectation_id,
        curriculum_node_id,
        level_id,
        source_status,
        progression_status,
        expectation_text,
        content_constraints,
        source_reference,
        source_document,
        status
      `)
      .eq(
        "curriculum_node_id",
        curriculumNodeId
      )
      .order("level_id"),

    supabase
      .from("aeos_learning_nodes")
      .select(`
        learning_node_id,
        legacy_code,
        code_status,
        subject_id,
        origin_programme_id,
        curriculum_node_id,
        node_type,
        source_label,
        observable_statement,
        is_observable,
        normalisation_status,
        learning_outcome,
        mastery_threshold,
        status,
        source_document,
        notes
      `)
      .eq(
        "curriculum_node_id",
        curriculumNodeId
      )
      .order("learning_node_id"),
  ]);

  if (nodeResult.error) {
    throw nodeResult.error;
  }

  if (expectationsResult.error) {
    throw expectationsResult.error;
  }

  if (learningNodesResult.error) {
    throw learningNodesResult.error;
  }

  const node = nodeResult.data;

  if (!node) {
    throw new Error(
      "Curriculum node not found."
    );
  }

  const [
    programmeResult,
    subjectResult,
    frameworkResult,
    levelsResult,
  ] = await Promise.all([
    node.programme_id
      ? supabase
          .from("aeos_programmes")
          .select(`
            programme_id,
            programme_name
          `)
          .eq(
            "programme_id",
            node.programme_id
          )
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    node.subject_id
      ? supabase
          .from("aeos_subjects")
          .select(`
            subject_id,
            subject_name,
            display_name
          `)
          .eq(
            "subject_id",
            node.subject_id
          )
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    node.framework_id
      ? supabase
          .from("aeos_frameworks")
          .select(`
            framework_id,
            framework_name,
            framework_type
          `)
          .eq(
            "framework_id",
            node.framework_id
          )
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    supabase
      .from("aeos_levels")
      .select(`
        level_id,
        level_name,
        programme_id,
        sequence
      `)
      .order("sequence"),
  ]);

  const metadataResults = [
    programmeResult,
    subjectResult,
    frameworkResult,
    levelsResult,
  ];

  const failedMetadataResult =
    metadataResults.find(
      (result) => result?.error
    );

  if (failedMetadataResult?.error) {
    throw failedMetadataResult.error;
  }

  const levelMap = new Map(
    (levelsResult.data ?? []).map(
      (level) => [
        level.level_id,
        level,
      ]
    )
  );

  const expectations = (
    expectationsResult.data ?? []
  )
    .map((expectation) => ({
      ...expectation,

      level_name:
        levelMap.get(
          expectation.level_id
        )?.level_name ??
        expectation.level_id,
    }))
    .sort((a, b) => {
      const aSequence =
        levelMap.get(a.level_id)
          ?.sequence ?? 999999;

      const bSequence =
        levelMap.get(b.level_id)
          ?.sequence ?? 999999;

      return aSequence - bSequence;
    });

  const rawLearningNodes =
    learningNodesResult.data ?? [];

  let learningNodeLevels = [];
  let learningNodeExpectations = [];

  if (rawLearningNodes.length > 0) {
    const learningNodeIds =
      rawLearningNodes.map(
        (learningNode) =>
          learningNode.learning_node_id
      );

    const [
      levelsForLearningNodesResult,
      expectationsForLearningNodesResult,
    ] = await Promise.all([
      supabase
        .from("aeos_learning_node_levels")
        .select(`
          learning_node_level_id,
          learning_node_id,
          level_id,
          relationship_type,
          source_document
        `)
        .in(
          "learning_node_id",
          learningNodeIds
        ),

      supabase
        .from(
          "aeos_learning_node_level_expectations"
        )
        .select(`
          learning_node_expectation_id,
          learning_node_id,
          source_level_code,
          population_status,
          progression_status,
          mastery_expectation,
          source_components,
          non_mastery_components,
          source_provenance,
          protection_scope_note,
          audit_status,
          status,
          framework_id
        `)
        .in(
          "learning_node_id",
          learningNodeIds
        ),
    ]);

    if (
      levelsForLearningNodesResult.error
    ) {
      throw levelsForLearningNodesResult.error;
    }

    if (
      expectationsForLearningNodesResult.error
    ) {
      throw expectationsForLearningNodesResult.error;
    }

    learningNodeLevels =
      levelsForLearningNodesResult.data ??
      [];

    learningNodeExpectations =
      expectationsForLearningNodesResult.data ??
      [];
  }

  const learningNodes =
    rawLearningNodes.map(
      (learningNode) => {
        const nodeLevels =
          learningNodeLevels
            .filter(
              (relationship) =>
                relationship.learning_node_id ===
                learningNode.learning_node_id
            )
            .map((relationship) => ({
              ...relationship,

              level_name:
                levelMap.get(
                  relationship.level_id
                )?.level_name ??
                relationship.level_id,
            }))
            .sort((a, b) => {
              const aSequence =
                levelMap.get(
                  a.level_id
                )?.sequence ?? 999999;

              const bSequence =
                levelMap.get(
                  b.level_id
                )?.sequence ?? 999999;

              return (
                aSequence -
                bSequence
              );
            });

        const nodeExpectations =
          learningNodeExpectations
            .filter(
              (expectation) =>
                expectation.learning_node_id ===
                learningNode.learning_node_id
            )
            .sort(
              compareLearningNodeExpectations
            );

        return {
          ...learningNode,
          levels: nodeLevels,
          level_expectations:
            nodeExpectations,
        };
      }
    );

  return {
    node: {
      ...node,

      programme_name:
        programmeResult.data
          ?.programme_name ??
        node.programme_id,

      subject_name:
        subjectResult.data
          ?.display_name ||
        subjectResult.data
          ?.subject_name ||
        node.subject_id,

      framework_name:
        frameworkResult.data
          ?.framework_name ??
        node.framework_id,

      framework_type:
        frameworkResult.data
          ?.framework_type ??
        null,
    },

    expectations,

    learningNodes,
  };
}

function compareLearningNodeExpectations(
  a,
  b
) {
  const order = [
    "INF1",
    "INF2",
    "STD1",
    "STD2",
    "STD3",
    "STD4",
    "STD5",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "CSEC",
    "ADULT",
  ];

  const aIndex = order.indexOf(
    a.source_level_code
  );

  const bIndex = order.indexOf(
    b.source_level_code
  );

  const normalizedA =
    aIndex === -1
      ? 999999
      : aIndex;

  const normalizedB =
    bIndex === -1
      ? 999999
      : bIndex;

  if (normalizedA !== normalizedB) {
    return normalizedA - normalizedB;
  }

  return String(
    a.source_level_code ?? ""
  ).localeCompare(
    String(
      b.source_level_code ?? ""
    )
  );
}

