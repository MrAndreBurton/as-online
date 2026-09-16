export const MANUAL_PEN_E_PROMPT_VERSION = "pen-e-manual-v3";

const EVIDENCE_TYPES = [
  "demonstrated_understanding",
  "partial_understanding",
  "misconception",
  "procedural_success",
  "procedural_error",
  "needs_prompting",
  "independent_success",
  "uncertainty",
  "engagement",
  "other",
];

const ACTION_ORIGINS = [
  "explicit_tutor_commitment",
  "explicit_student_commitment",
  "explicit_reminder_request",
  "pen_e_recommendation",
];

const ACTION_TYPES = [
  "reminder",
  "homework",
  "follow_up",
  "revisit_topic",
  "bring_resource",
  "upload_resource",
  "schedule_quiz",
  "contact_parent",
  "review_misconception",
  "celebrate_milestone",
  "other",
];

const TARGET_ROLES = ["tutor", "student", "both"];

function formatDate(value) {
  if (!value) return "Unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-TT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function curriculumBlock(nodes) {
  if (!nodes.length) {
    return "No eligible Learning Node skills were found for this Offering.";
  }

  return nodes
    .map((node) =>
      [
        `learning_node_id: ${node.learning_node_id}`,
        `skill_label: ${
          node.source_label ||
          node.observable_statement ||
          node.learning_node_id
        }`,
        `observable_statement: ${node.observable_statement || "null"}`,
        `curriculum_node_id: ${node.curriculum_node_id || "null"}`,
        `curriculum_node_name: ${node.curriculum_node_name || "null"}`,
        `curriculum_node_type: ${node.curriculum_node_type || "null"}`,
        `origin_programme_id: ${node.origin_programme_id || "null"}`,
      ].join("\n")
    )
    .join("\n\n");
}

export function buildManualPenEPackage(context) {
  const {
    intake,
    offering,
    session,
    studentDisplayName,
    curriculumNodes,
    transcript,
    wordCount,
    durationMinutes,
  } = context;

  return `AEOS MANUAL PEN-E PACKAGE
Prompt version: ${MANUAL_PEN_E_PROMPT_VERSION}
Intake item: ${intake.intake_item_id}
Session: ${session?.session_id || "Unavailable"}

STUDENT CONTEXT
Student: ${studentDisplayName}

SESSION CONTEXT
Offering: ${offering?.offering_name || "Unavailable"}
Session title: ${session?.session_title || "Tutoring Session"}
Session date: ${formatDate(session?.scheduled_start_at || session?.started_at)}
Duration: ${durationMinutes != null ? `${durationMinutes} minutes` : "Unavailable"}
Transcript words: ${wordCount}

IMPORTANT ANALYSIS PRINCIPLES
1. Base the analysis ONLY on evidence contained in the transcript.
2. Do not invent things the student said, understood, completed, struggled with, or was assigned.
3. Distinguish what the tutor taught from what the student actually demonstrated.
4. Tutor explanation alone is NOT evidence that the student understands something.
5. Consider whether correct answers were independent, prompted, heavily guided, or corrected after an error.
6. Repeated performance is stronger evidence than a single response.
7. Preserve uncertainty.
8. For learning evidence, learning_node_id is the exact skill identity. Only use learning_node_id values supplied in the IN-SCOPE AEOS LEARNING SKILLS section below.
9. Never invent learning_node_id or curriculum_node_id values.
10. curriculum_node_id is curriculum hierarchy/context, not the exact skill identity. When an evidence item has a learning_node_id, use the curriculum_node_id shown with that same supplied Learning Node.
11. If no supplied Learning Node clearly matches an observation, use null for both evidence learning_node_id and curriculum_node_id.
12. Only add a curriculum match when the transcript provides meaningful evidence that the session actually addressed that curriculum node.
13. Identify explicit commitments separately from Pen-E recommendations.
14. Do not treat casual conversation as a learning action.
15. Do not infer mastery merely because a topic was covered.
16. Preserve genuine reminder requests as actions.
17. The tutor will review all suggestions before they become permanent AEOS learning evidence.
18. Return strict JSON using standard ASCII double quotes. Do not use smart quotes.
19. Return ONLY JSON. Do not use Markdown fences or explanatory text.

IN-SCOPE AEOS LEARNING SKILLS
Only the Learning Nodes listed below are valid exact skills for this analysis.
Each Learning Node includes its curriculum_node_id only as curriculum hierarchy/context.

${curriculumBlock(curriculumNodes)}

ALLOWED ENUM VALUES

evidence_type MUST be one of:
${EVIDENCE_TYPES.map((value) => `- ${value}`).join("\n")}

action_origin MUST be one of:
${ACTION_ORIGINS.map((value) => `- ${value}`).join("\n")}

action_type MUST be one of:
${ACTION_TYPES.map((value) => `- ${value}`).join("\n")}

target_role MUST be one of:
${TARGET_ROLES.map((value) => `- ${value}`).join("\n")}

ANALYSIS REQUIREMENTS

A. SESSION SUMMARY
Write a concise professional summary covering the session focus, major concepts/tasks,
what the student actually demonstrated, significant difficulties, and important next steps.

B. LEARNING EVIDENCE
Identify meaningful STUDENT learning evidence.
For every item provide:
- learning_node_id or null
- curriculum_node_id or null
- evidence_type
- evidence_statement
- source_excerpt
- source_timestamp if available
- confidence from 0 to 100
- explanation

Avoid excessive fragmentation. If several student responses support one educational
conclusion, combine them into one evidence item rather than generating near-duplicates.

C. CURRICULUM MATCHES
Only use curriculum_node_id values shown in the supplied Learning Node skill list.
Do not create a curriculum match simply because the tutor mentioned a topic.

D. ACTIONS AND COMMITMENTS
Create a concise set of useful future actions.
Do not turn every weakness into a separate action.

E. REMINDERS
If the tutor or student explicitly requests a reminder, use:
"action_origin": "explicit_reminder_request"
and
"action_type": "reminder"

F. OVERALL CONFIDENCE
Give a 0-100 score representing how strongly the transcript supports the analysis overall.

OUTPUT SCHEMA

{
  "session_summary": "",
  "overall_confidence": 0,
  "curriculum_matches": [
    {
      "curriculum_node_id": "",
      "confidence": 0,
      "source_excerpt": "",
      "source_timestamp": null,
      "explanation": ""
    }
  ],
  "evidence": [
    {
      "learning_node_id": null,
      "curriculum_node_id": null,
      "evidence_type": "",
      "evidence_statement": "",
      "source_excerpt": "",
      "source_timestamp": null,
      "confidence": 0,
      "explanation": ""
    }
  ],
  "actions": [
    {
      "action_origin": "",
      "action_type": "",
      "action_title": "",
      "action_description": "",
      "source_excerpt": null,
      "source_timestamp": null,
      "target_role": "",
      "suggested_due_text": null,
      "confidence": 0,
      "explanation": ""
    }
  ]
}

FINAL CHECK
- Every evidence claim is supported by student behaviour.
- Tutor explanation is not treated as mastery.
- Every non-null evidence learning_node_id is one of the supplied Learning Nodes.
- Every evidence curriculum_node_id matches the curriculum context supplied with that Learning Node.
- Curriculum matches use only supplied curriculum_node_id values.
- Evidence is not needlessly duplicated.
- Explicit commitments and recommendations are distinguished.
- Genuine reminder requests are preserved.
- All enum values come from the allowed lists.
- JSON is syntactically valid with standard double quotes.

TRANSCRIPT
------------------------------------------------------------
${transcript}
------------------------------------------------------------

Return ONLY the final valid JSON object.`;
}



