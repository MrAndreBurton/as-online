export const MANUAL_PEN_E_PROMPT_VERSION = "pen-e-manual-v2";

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
    return "No curriculum nodes were found for this Offering.";
  }

  return nodes
    .map((node) =>
      [
        `curriculum_node_id: ${node.curriculum_node_id}`,
        `node_type: ${node.node_type}`,
        `node_name: ${node.node_name}`,
        `parent_node_id: ${node.parent_node_id || "null"}`,
        `framework_id: ${node.framework_id || "null"}`,
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
8. Only use curriculum_node_id values supplied in the IN-SCOPE AEOS CURRICULUM section below.
9. Never invent curriculum_node_id values.
10. If no supplied curriculum node clearly matches an observation, use null for evidence curriculum_node_id.
11. Only add a curriculum match when the transcript provides meaningful evidence that the session actually addressed that node.
12. Identify explicit commitments separately from Pen-E recommendations.
13. Do not treat casual conversation as a learning action.
14. Do not infer mastery merely because a topic was covered.
15. Preserve genuine reminder requests as actions.
16. The tutor will review all suggestions before they become permanent AEOS learning evidence.
17. Return strict JSON using standard ASCII double quotes. Do not use smart quotes.
18. Return ONLY JSON. Do not use Markdown fences or explanatory text.

IN-SCOPE AEOS CURRICULUM
Only these IDs are valid for this analysis.

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
Only use supplied curriculum_node_id values.
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
- Only supplied curriculum IDs are used.
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
